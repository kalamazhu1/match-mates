import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEventSchema } from '@/lib/validations/event'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    
    // Validate the input data
    const validatedData = createEventSchema.parse(body)
    
    // Get authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Prepare the event data for database insertion
    const eventData = {
      ...validatedData,
      organizer_id: user.id,
      status: 'draft' as const,
      // Convert empty strings to null for optional URL fields
      whatsapp_group: validatedData.whatsapp_group || null,
      telegram_group: validatedData.telegram_group || null,
    }

    // Insert the event into the database
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (insertError) {
      console.error('Database insertion error:', insertError)
      
      // Handle specific database errors
      if (insertError.code === '23503') {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    // Return the created event
    return NextResponse.json(
      { 
        message: 'Event created successfully',
        event
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Event creation error:', error)
    
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Optional query parameters for filtering
    const status = searchParams.get('status')
    const eventType = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Build the query
    let query = supabase
      .from('events')
      .select('*')
      .eq('status', 'open') // Only show open events by default
      .order('date_start', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters if provided
    if (status && status !== 'open') {
      query = query.eq('status', status)
    }
    
    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({ events })

  } catch (error) {
    console.error('Events fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}