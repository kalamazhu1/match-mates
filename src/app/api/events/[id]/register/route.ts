import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RegisterEventParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  request: NextRequest,
  { params }: RegisterEventParams
) {
  try {
    // Get event ID from params
    const { id: eventId } = await params
    
    // Get authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile to validate skill level
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get event details to validate registration eligibility
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if user is already registered
    const { data: existingRegistration, error: regCheckError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    if (regCheckError && regCheckError.code !== 'PGRST116') {
      console.error('Registration check error:', regCheckError)
      return NextResponse.json(
        { error: 'Failed to check registration status' },
        { status: 500 }
      )
    }

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 409 }
      )
    }

    // Validate event status
    if (event.status !== 'open') {
      return NextResponse.json(
        { error: 'Event is not accepting registrations' },
        { status: 400 }
      )
    }

    // Validate registration deadline
    const now = new Date()
    const deadline = new Date(event.registration_deadline)
    if (now > deadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Validate skill level
    const userLevel = parseFloat(userProfile.ntrp_level)
    const minLevel = parseFloat(event.skill_level_min)
    const maxLevel = parseFloat(event.skill_level_max)

    if (userLevel < minLevel || userLevel > maxLevel) {
      return NextResponse.json(
        { 
          error: `Your skill level (${userProfile.ntrp_level}) is not within the event requirements (${event.skill_level_min} - ${event.skill_level_max})` 
        },
        { status: 400 }
      )
    }

    // Check if event is at capacity
    const { count: registrationCount, error: countError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'cancelled')

    if (countError) {
      console.error('Registration count error:', countError)
      return NextResponse.json(
        { error: 'Failed to check event capacity' },
        { status: 500 }
      )
    }

    // Determine registration status based on capacity
    const isAtCapacity = (registrationCount || 0) >= event.max_participants
    const registrationStatus = isAtCapacity ? 'pending' : 'approved' // pending means waitlist
    
    // Create the registration
    const registrationData = {
      user_id: user.id,
      event_id: eventId,
      status: registrationStatus,
      payment_status: event.entry_fee > 0 ? 'pending' : 'paid',
      registered_at: new Date().toISOString(),
      approved_at: registrationStatus === 'approved' ? new Date().toISOString() : null
    }

    const { data: registration, error: insertError } = await supabase
      .from('registrations')
      .insert([registrationData])
      .select(`
        *,
        event:events(*),
        user:users(*)
      `)
      .single()

    if (insertError) {
      console.error('Registration insertion error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      )
    }

    // Update event status to 'full' if we've reached capacity
    if (isAtCapacity && event.status === 'open') {
      await supabase
        .from('events')
        .update({ status: 'full' })
        .eq('id', eventId)
    }

    // Return success response
    return NextResponse.json({
      message: isAtCapacity 
        ? 'Successfully added to waitlist! You will be notified if a spot becomes available.'
        : 'Successfully registered for event!',
      registration,
      waitlisted: isAtCapacity
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method to check registration status
export async function GET(
  request: NextRequest,
  { params }: RegisterEventParams
) {
  try {
    // Get event ID from params
    const { id: eventId } = await params
    
    // Get authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is registered for this event
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(*),
        user:users(*)
      `)
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    if (regError && regError.code !== 'PGRST116') {
      console.error('Registration check error:', regError)
      return NextResponse.json(
        { error: 'Failed to check registration status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      registered: !!registration,
      registration: registration || null
    })

  } catch (error) {
    console.error('Registration status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE method to cancel registration
export async function DELETE(
  request: NextRequest,
  { params }: RegisterEventParams
) {
  try {
    // Get event ID from params
    const { id: eventId } = await params
    
    // Get authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the registration
    const { data: registration, error: findError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    if (findError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check if cancellation is allowed (before event starts, etc.)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('date_start')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const eventStart = new Date(event.date_start)
    
    // Allow cancellation up to 24 hours before event
    const cancellationDeadline = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000)
    
    if (now > cancellationDeadline) {
      return NextResponse.json(
        { error: 'Cancellation deadline has passed' },
        { status: 400 }
      )
    }

    // Update registration status to cancelled
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', registration.id)

    if (updateError) {
      console.error('Registration cancellation error:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel registration' },
        { status: 500 }
      )
    }

    // Check if we can move someone from waitlist
    const { data: waitlistRegistrations, error: waitlistError } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .order('registered_at', { ascending: true })
      .limit(1)

    if (!waitlistError && waitlistRegistrations && waitlistRegistrations.length > 0) {
      // Move first person from waitlist to approved
      await supabase
        .from('registrations')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', waitlistRegistrations[0].id)
    }

    return NextResponse.json({
      message: 'Registration cancelled successfully'
    })

  } catch (error) {
    console.error('Registration cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}