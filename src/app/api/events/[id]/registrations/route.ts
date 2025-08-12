import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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