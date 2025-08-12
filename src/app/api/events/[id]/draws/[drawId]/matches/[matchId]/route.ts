import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MatchUpdateParams {
  params: Promise<{
    id: string
    drawId: string
    matchId: string
  }>
}

export async function PUT(
  request: NextRequest,
  { params }: MatchUpdateParams
) {
  try {
    const { id: eventId, drawId, matchId } = await params
    
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
    const { winner, score } = body

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
        { error: 'Only the event organizer can update match results' },
        { status: 403 }
      )
    }

    // Get the current draw
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('bracket_data')
      .eq('id', drawId)
      .eq('event_id', eventId)
      .single()

    if (drawError || !draw) {
      return NextResponse.json(
        { error: 'Draw not found' },
        { status: 404 }
      )
    }

    // Update the bracket data
    const bracketData = draw.bracket_data
    let matchFound = false
    
    // Find and update the match
    for (const round of bracketData.rounds) {
      for (const match of round.matches) {
        if (match.id === matchId) {
          match.winner = winner
          match.score = score
          matchFound = true
          break
        }
      }
      if (matchFound) break
    }

    if (!matchFound) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Advance winner to next round if applicable
    advanceWinner(bracketData, matchId, winner)

    // Update the draw in database
    const { error: updateError } = await supabase
      .from('draws')
      .update({ bracket_data: bracketData })
      .eq('id', drawId)

    if (updateError) {
      console.error('Draw update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update match result' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Match result updated successfully'
    })

  } catch (error) {
    console.error('Match update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to advance winner to next round
function advanceWinner(bracketData: any, matchId: string, winnerId: string) {
  // Find the match and get winner data
  let winnerData = null
  let currentRound = -1
  let currentMatchIndex = -1
  
  for (let roundIndex = 0; roundIndex < bracketData.rounds.length; roundIndex++) {
    const round = bracketData.rounds[roundIndex]
    for (let matchIndex = 0; matchIndex < round.matches.length; matchIndex++) {
      const match = round.matches[matchIndex]
      if (match.id === matchId) {
        currentRound = roundIndex
        currentMatchIndex = matchIndex
        // Get winner data
        if (match.player1?.id === winnerId) {
          winnerData = match.player1
        } else if (match.player2?.id === winnerId) {
          winnerData = match.player2
        }
        break
      }
    }
    if (winnerData) break
  }

  // If we're not in the final round, advance to next round
  if (currentRound < bracketData.rounds.length - 1 && winnerData) {
    const nextRound = bracketData.rounds[currentRound + 1]
    const nextMatchIndex = Math.floor(currentMatchIndex / 2)
    const nextMatch = nextRound.matches[nextMatchIndex]
    
    if (nextMatch) {
      // Determine if winner goes to player1 or player2 slot
      if (currentMatchIndex % 2 === 0) {
        nextMatch.player1 = winnerData
      } else {
        nextMatch.player2 = winnerData
      }
    }
  }
}