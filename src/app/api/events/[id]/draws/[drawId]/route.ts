import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DrawParams {
  params: Promise<{
    id: string
    drawId: string
  }>
}

export async function DELETE(
  request: NextRequest,
  { params }: DrawParams
) {
  try {
    const { id: eventId, drawId } = await params
    
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
        { error: 'Only the event organizer can delete draws' },
        { status: 403 }
      )
    }

    // Delete the draw
    const { error: deleteError } = await supabase
      .from('draws')
      .delete()
      .eq('id', drawId)
      .eq('event_id', eventId)

    if (deleteError) {
      console.error('Draw deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete draw' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Draw deleted successfully'
    })

  } catch (error) {
    console.error('Draw deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: DrawParams
) {
  try {
    const { id: eventId, drawId } = await params
    
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
    const { bracket_data } = body

    // Verify user is the event organizer
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
        { error: 'Only the event organizer can update draws' },
        { status: 403 }
      )
    }

    // Update the draw
    const { data: draw, error: updateError } = await supabase
      .from('draws')
      .update({ bracket_data })
      .eq('id', drawId)
      .eq('event_id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('Draw update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update draw' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Draw updated successfully',
      draw
    })

  } catch (error) {
    console.error('Draw update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}