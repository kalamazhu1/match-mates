import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EventParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: EventParams
) {
  try {
    // Get event ID from params
    const { id: eventId } = await params
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get the event details
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

    // Get organizer details
    let organizer = { name: 'Unknown', email: 'Unknown' }
    if (event.organizer_id) {
      try {
        const { data: organizerData, error: organizerError } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', event.organizer_id)
          .single()

        if (!organizerError && organizerData) {
          organizer = organizerData
        } else {
          console.error('Organizer fetch error:', organizerError)
        }
      } catch (error) {
        console.error('Error fetching organizer:', error)
      }
    }

    // Get registration count and registration details
    let registrations = []
    try {
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select(`
          *,
          user:users!user_id(name, email, ntrp_level)
        `)
        .eq('event_id', eventId)
        .neq('status', 'cancelled')

      if (regError) {
        console.error('Registrations fetch error:', regError)
      } else {
        registrations = regData || []
      }
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }

    // Calculate registration statistics
    const totalRegistrations = registrations?.length || 0
    const approvedRegistrations = registrations?.filter(r => r.status === 'approved').length || 0
    const pendingRegistrations = registrations?.filter(r => r.status === 'pending').length || 0
    const spotsAvailable = Math.max(0, event.max_participants - approvedRegistrations)
    
    // Check if user is authenticated and get their registration status
    let userRegistration = null
    let canRegister = false
    let registrationEligibility = {
      eligible: false,
      reason: ''
    }
    let currentUser = null

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      currentUser = user
      
      if (user && !authError) {
        // Get user's registration for this event
        const { data: userReg, error: userRegError } = await supabase
          .from('registrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .single()

        if (userRegError && userRegError.code !== 'PGRST116') {
          console.error('User registration check error:', userRegError)
        } else if (userReg) {
          userRegistration = userReg
        }

        // Get user profile to check eligibility
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!profileError && userProfile && !userRegistration) {
          // Check eligibility
          const now = new Date()
          const deadline = new Date(event.registration_deadline)
          const userLevel = parseFloat(userProfile.ntrp_level)
          const minLevel = parseFloat(event.skill_level_min)
          const maxLevel = parseFloat(event.skill_level_max)

          if (event.status !== 'open') {
            registrationEligibility = {
              eligible: false,
              reason: 'Event is not accepting registrations'
            }
          } else if (now > deadline) {
            registrationEligibility = {
              eligible: false,
              reason: 'Registration deadline has passed'
            }
          } else if (userLevel < minLevel || userLevel > maxLevel) {
            registrationEligibility = {
              eligible: false,
              reason: `Your skill level (${userProfile.ntrp_level}) is not within the event requirements (${event.skill_level_min} - ${event.skill_level_max})`
            }
          } else {
            registrationEligibility = {
              eligible: true,
              reason: ''
            }
            canRegister = true
          }
        }
      }
    } catch (error) {
      // User not authenticated - that's okay for viewing events
      console.log('User not authenticated')
    }

    // Prepare response data with safe organizer handling
    const responseData = {
      event: {
        ...event,
        organizer: organizer, // Use the separately fetched organizer data
        registration_stats: {
          total_registrations: totalRegistrations,
          approved_registrations: approvedRegistrations,
          pending_registrations: pendingRegistrations,
          spots_available: spotsAvailable,
          is_full: spotsAvailable === 0,
          has_waitlist: pendingRegistrations > 0
        }
      },
      user_registration: userRegistration,
      can_register: canRegister,
      registration_eligibility: registrationEligibility,
      registrations: registrations // Show registrations to everyone (public participant list)
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Event fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: EventParams
) {
  // Use the same logic as PUT for partial updates
  return PUT(request, { params })
}

export async function PUT(
  request: NextRequest,
  { params }: EventParams
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

    // Parse request body
    const body = await request.json()
    
    // Verify user is the organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
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
        { error: 'Only the event organizer can update this event' },
        { status: 403 }
      )
    }

    // Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(body)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('Event update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Event updated successfully',
      event: updatedEvent
    })

  } catch (error) {
    console.error('Event update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: EventParams
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

    // Verify user is the organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id, status')
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
        { error: 'Only the event organizer can delete this event' },
        { status: 403 }
      )
    }

    // Check if event can be deleted (no approved registrations)
    const { count: approvedCount, error: countError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'approved')

    if (countError) {
      console.error('Registration count error:', countError)
      return NextResponse.json(
        { error: 'Failed to check registrations' },
        { status: 500 }
      )
    }

    if ((approvedCount || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with approved registrations' },
        { status: 400 }
      )
    }

    // Delete the event (cascade will handle registrations)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      console.error('Event deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('Event deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}