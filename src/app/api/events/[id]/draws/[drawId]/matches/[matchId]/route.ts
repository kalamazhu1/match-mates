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
    
    if (bracketData.format === 'round_robin') {
      // Handle round robin match update
      for (const match of bracketData.matches) {
        if (match.id === matchId) {
          const oldWinner = match.winner
          match.winner = winner
          match.score = score
          
          // Set loser
          if (match.player1.id === winner) {
            match.loser = match.player2.id
          } else {
            match.loser = match.player1.id
          }
          
          matchFound = true
          
          // Update standings
          updateRoundRobinStandings(bracketData, match, oldWinner)
          break
        }
      }
    } else {
      // Handle single elimination match update
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
      
      if (matchFound) {
        // Advance winner to next round if applicable
        advanceWinner(bracketData, matchId, winner)
      }
    }

    if (!matchFound) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }
    
    // DO NOT automatically process BYEs after match completion
    // Only the initial bracket generation should create BYEs
    // Players must wait for their opponents to be determined naturally

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

// Helper function to update round robin standings
function updateRoundRobinStandings(bracketData: any, match: any, oldWinner: string | null) {
  // If this is updating an existing result, first revert the old standings
  if (oldWinner) {
    revertMatchFromStandings(bracketData, match, oldWinner)
  }
  
  // Apply the new match result to standings
  applyMatchToStandings(bracketData, match)
  
  // Sort standings by wins (descending), then by win percentage, then by sets won
  bracketData.standings.sort((a: any, b: any) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    
    const aWinPct = a.matches_played > 0 ? a.wins / a.matches_played : 0
    const bWinPct = b.matches_played > 0 ? b.wins / b.matches_played : 0
    if (bWinPct !== aWinPct) return bWinPct - aWinPct
    
    return b.sets_won - a.sets_won
  })
  
  // Update completed matches count
  bracketData.completed_matches = bracketData.matches.filter((m: any) => m.winner).length
}

function revertMatchFromStandings(bracketData: any, match: any, oldWinner: string) {
  const oldLoser = match.player1.id === oldWinner ? match.player2.id : match.player1.id
  
  // Find players in standings and revert their stats
  const winnerStanding = bracketData.standings.find((s: any) => s.id === oldWinner)
  const loserStanding = bracketData.standings.find((s: any) => s.id === oldLoser)
  
  if (winnerStanding) {
    winnerStanding.wins = Math.max(0, winnerStanding.wins - 1)
    winnerStanding.matches_played = Math.max(0, winnerStanding.matches_played - 1)
  }
  
  if (loserStanding) {
    loserStanding.losses = Math.max(0, loserStanding.losses - 1)
    loserStanding.matches_played = Math.max(0, loserStanding.matches_played - 1)
  }
  
  // TODO: Revert set and game statistics if available in score
}

function applyMatchToStandings(bracketData: any, match: any) {
  const winnerId = match.winner
  const loserId = match.loser
  
  // Find players in standings
  const winnerStanding = bracketData.standings.find((s: any) => s.id === winnerId)
  const loserStanding = bracketData.standings.find((s: any) => s.id === loserId)
  
  if (winnerStanding) {
    winnerStanding.wins++
    winnerStanding.matches_played++
  }
  
  if (loserStanding) {
    loserStanding.losses++
    loserStanding.matches_played++
  }
  
  // Parse score to update set statistics if available
  if (match.score && match.score !== 'W/O') {
    parseScoreAndUpdateStats(match.score, winnerStanding, loserStanding)
  }
}

function parseScoreAndUpdateStats(score: string, winnerStanding: any, loserStanding: any) {
  // Parse score like "6-4, 6-3" or "6-4, 4-6, 6-2"
  try {
    const sets = score.split(', ')
    let winnerSets = 0
    let loserSets = 0
    let winnerGames = 0
    let loserGames = 0
    
    sets.forEach(set => {
      if (set.includes('-')) {
        const [player1Games, player2Games] = set.split('-').map(g => parseInt(g.trim()) || 0)
        
        // Determine which player won this set
        if (player1Games > player2Games) {
          winnerSets++
          winnerGames += player1Games
          loserGames += player2Games
        } else {
          loserSets++
          winnerGames += player2Games
          loserGames += player1Games
        }
      }
    })
    
    if (winnerStanding) {
      winnerStanding.sets_won += winnerSets
      winnerStanding.sets_lost += loserSets
      winnerStanding.games_won += winnerGames
      winnerStanding.games_lost += loserGames
    }
    
    if (loserStanding) {
      loserStanding.sets_won += loserSets
      loserStanding.sets_lost += winnerSets
      loserStanding.games_won += loserGames
      loserStanding.games_lost += winnerGames
    }
  } catch (error) {
    console.error('Error parsing score:', error)
    // If score parsing fails, just continue without updating set/game stats
  }
}

