import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RegistrationsParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RegistrationsParams
) {
  try {
    const { id: eventId } = await params
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is the event organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id, title')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the event organizer can view registrations' },
        { status: 403 }
      )
    }

    // Get all registrations for this event with user details
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        user:users!user_id(name, email, ntrp_level)
      `)
      .eq('event_id', eventId)
      .neq('status', 'cancelled')
      .order('registered_at', { ascending: true })

    if (regError) {
      console.error('Registrations fetch error:', regError)
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      registrations: registrations || []
    })

  } catch (error) {
    console.error('Registrations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RegistrationsParams
) {
  try {
    const { id: eventId } = await params
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get event details for validation
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

    // Check if user already registered
    const { data: existingReg, error: existingError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .neq('status', 'cancelled')
      .single()

    if (existingReg) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    // Get user profile for validation
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

    // Validate eligibility
    const now = new Date()
    const deadline = new Date(event.registration_deadline)
    const userLevel = parseFloat(userProfile.ntrp_level)
    const minLevel = parseFloat(event.skill_level_min)
    const maxLevel = parseFloat(event.skill_level_max)

    if (event.status !== 'open') {
      return NextResponse.json(
        { error: 'Event is not accepting registrations' },
        { status: 400 }
      )
    }

    if (now > deadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    if (userLevel < minLevel || userLevel > maxLevel) {
      return NextResponse.json(
        { error: `Your skill level (${userProfile.ntrp_level}) is not within the event requirements (${event.skill_level_min} - ${event.skill_level_max})` },
        { status: 400 }
      )
    }

    // Check if event is full
    const { count: approvedCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'approved')

    if ((approvedCount || 0) >= event.max_participants) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert({
        user_id: user.id,
        event_id: eventId,
        status: 'approved', // Auto-approve for now
        registered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (regError) {
      console.error('Registration creation error:', regError)
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Registration successful',
      registration
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RegistrationsParams
) {
  try {
    const { id: eventId } = await params
    console.log('DELETE /registrations - Event ID:', eventId)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('DELETE /registrations - Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('DELETE /registrations - User ID:', user.id)

    // Find user's registration
    const { data: registration, error: findError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .neq('status', 'cancelled')
      .single()

    console.log('DELETE /registrations - Find result:', { registration, findError })

    if (findError || !registration) {
      console.log('DELETE /registrations - Registration not found')
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    console.log('DELETE /registrations - About to delete registration:', registration.id)

    // Use admin client to bypass RLS policies for deletion
    const adminSupabase = createAdminClient()
    const { error: deleteError } = await adminSupabase
      .from('registrations')
      .delete()
      .eq('id', registration.id)

    if (deleteError) {
      console.error('Registration cancellation error:', deleteError)
      console.error('Delete error details:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      })
      return NextResponse.json(
        { error: `Failed to cancel registration: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('DELETE /registrations - Delete successful')

    // Verify the deletion worked by checking if the registration still exists
    const { data: verifyData, error: verifyError } = await adminSupabase
      .from('registrations')
      .select('*')
      .eq('id', registration.id)
      .single()

    console.log('DELETE /registrations - Verification check:', { verifyData, verifyError })

    return NextResponse.json({
      message: 'Registration cancelled successfully',
      deleted_registration_id: registration.id,
      verification: verifyError ? 'Registration deleted' : 'Registration still exists'
    })

  } catch (error) {
    console.error('Registration cancellation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}