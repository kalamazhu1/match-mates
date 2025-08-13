import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LeaderboardParams {
  params: Promise<{
    id: string
  }>
}

interface PlayerStats {
  id: string
  name: string
  email: string
  ntrp_level: string
  position: number
  wins: number
  losses: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
  total_matches: number
  win_percentage: number
  eliminated_in_round?: number
  is_champion: boolean
  is_finalist: boolean
  is_semifinalist: boolean
}

export async function GET(
  request: NextRequest,
  { params }: LeaderboardParams
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

    // Get the event
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

    // Get draws for this event
    const { data: draws, error: drawsError } = await supabase
      .from('draws')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (drawsError || !draws || draws.length === 0) {
      return NextResponse.json(
        { error: 'No tournament draws found for this event' },
        { status: 404 }
      )
    }

    // Use the most recent draw
    const draw = draws[0]
    const bracketData = draw.bracket_data

    if (!bracketData || !bracketData.rounds) {
      return NextResponse.json(
        { error: 'Invalid bracket data' },
        { status: 400 }
      )
    }

    // Calculate leaderboard from bracket data
    const leaderboard = calculateLeaderboard(bracketData)

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        status: event.status
      },
      leaderboard,
      tournament_complete: isTournamentComplete(bracketData)
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateLeaderboard(bracketData: any): PlayerStats[] {
  const playerStats = new Map<string, PlayerStats>()
  
  // Initialize all participants
  bracketData.participants?.forEach((player: any) => {
    if (player && player.id) {
      playerStats.set(player.id, {
        id: player.id,
        name: player.name,
        email: player.email,
        ntrp_level: player.ntrp_level,
        position: 0,
        wins: 0,
        losses: 0,
        sets_won: 0,
        sets_lost: 0,
        games_won: 0,
        games_lost: 0,
        total_matches: 0,
        win_percentage: 0,
        is_champion: false,
        is_finalist: false,
        is_semifinalist: false
      })
    }
  })

  // Process all completed matches
  bracketData.rounds?.forEach((round: any, roundIndex: number) => {
    round.matches?.forEach((match: any) => {
      if (match.winner && (match.player1 || match.player2)) {
        // Count the match for both players
        if (match.player1?.id) {
          const stats = playerStats.get(match.player1.id)
          if (stats) {
            stats.total_matches++
            if (match.winner === match.player1.id) {
              stats.wins++
            } else {
              stats.losses++
              // Track elimination round
              if (!stats.eliminated_in_round) {
                stats.eliminated_in_round = roundIndex + 1
              }
            }
            
            // Process score for sets and games
            if (match.score && match.score !== 'BYE' && match.score !== 'W/O') {
              const { player1Sets, player2Sets, player1Games, player2Games } = parseScore(match.score)
              stats.sets_won += player1Sets
              stats.sets_lost += player2Sets
              stats.games_won += player1Games
              stats.games_lost += player2Games
            }
          }
        }

        if (match.player2?.id) {
          const stats = playerStats.get(match.player2.id)
          if (stats) {
            stats.total_matches++
            if (match.winner === match.player2.id) {
              stats.wins++
            } else {
              stats.losses++
              // Track elimination round
              if (!stats.eliminated_in_round) {
                stats.eliminated_in_round = roundIndex + 1
              }
            }
            
            // Process score for sets and games
            if (match.score && match.score !== 'BYE' && match.score !== 'W/O') {
              const { player1Sets, player2Sets, player1Games, player2Games } = parseScore(match.score)
              stats.sets_won += player2Sets
              stats.sets_lost += player1Sets
              stats.games_won += player2Games
              stats.games_lost += player1Games
            }
          }
        }
      }
    })
  })

  // Identify special positions
  const finalRound = bracketData.rounds[bracketData.rounds.length - 1]
  const semifinalRound = bracketData.rounds.length > 1 ? bracketData.rounds[bracketData.rounds.length - 2] : null

  // Champion (winner of final)
  if (finalRound?.matches?.[0]?.winner) {
    const champion = playerStats.get(finalRound.matches[0].winner)
    if (champion) {
      champion.is_champion = true
      champion.position = 1
    }
  }

  // Finalist (loser of final)
  if (finalRound?.matches?.[0]) {
    const finalMatch = finalRound.matches[0]
    const finalistId = finalMatch.player1?.id === finalMatch.winner ? finalMatch.player2?.id : finalMatch.player1?.id
    if (finalistId) {
      const finalist = playerStats.get(finalistId)
      if (finalist) {
        finalist.is_finalist = true
        finalist.position = 2
      }
    }
  }

  // Semifinalists (losers of semifinals)
  if (semifinalRound?.matches) {
    let semifinalPosition = 3
    semifinalRound.matches.forEach((match: any) => {
      if (match.winner) {
        const loserId = match.player1?.id === match.winner ? match.player2?.id : match.player1?.id
        if (loserId) {
          const semifinalist = playerStats.get(loserId)
          if (semifinalist) {
            semifinalist.is_semifinalist = true
            semifinalist.position = semifinalPosition++
          }
        }
      }
    })
  }

  // Calculate win percentages and assign remaining positions
  const players = Array.from(playerStats.values())
  players.forEach(player => {
    if (player.total_matches > 0) {
      player.win_percentage = Math.round((player.wins / player.total_matches) * 100)
    }
  })

  // Sort by tournament results, then by stats
  players.sort((a, b) => {
    // Champions first
    if (a.is_champion && !b.is_champion) return -1
    if (!a.is_champion && b.is_champion) return 1
    
    // Finalists second
    if (a.is_finalist && !b.is_finalist) return -1
    if (!a.is_finalist && b.is_finalist) return 1
    
    // Semifinalists third
    if (a.is_semifinalist && !b.is_semifinalist) return -1
    if (!a.is_semifinalist && b.is_semifinalist) return 1
    
    // For players eliminated in same round or no special position, sort by:
    // 1. How far they advanced (later elimination = better)
    // 2. Wins
    // 3. Win percentage
    // 4. Sets won
    
    const aElimRound = a.eliminated_in_round || 999
    const bElimRound = b.eliminated_in_round || 999
    
    if (aElimRound !== bElimRound) {
      return bElimRound - aElimRound // Later elimination is better
    }
    
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.win_percentage !== b.win_percentage) return b.win_percentage - a.win_percentage
    return b.sets_won - a.sets_won
  })

  // Assign positions for players without special positions
  let currentPosition = 1
  players.forEach((player, index) => {
    if (!player.position) {
      // Find next available position after special positions
      while (players.some(p => p.position === currentPosition)) {
        currentPosition++
      }
      player.position = currentPosition++
    }
  })

  return players
}

function parseScore(score: string): { player1Sets: number, player2Sets: number, player1Games: number, player2Games: number } {
  let player1Sets = 0, player2Sets = 0, player1Games = 0, player2Games = 0
  
  if (!score || score === 'BYE' || score === 'W/O') {
    return { player1Sets, player2Sets, player1Games, player2Games }
  }
  
  // Parse score like "6-4, 6-3" or "6-4,6-3"
  const sets = score.split(',').map(s => s.trim())
  
  sets.forEach(set => {
    if (set.includes('-')) {
      const [p1, p2] = set.split('-').map(s => parseInt(s.trim()) || 0)
      player1Games += p1
      player2Games += p2
      
      if (p1 > p2) player1Sets++
      else if (p2 > p1) player2Sets++
    }
  })
  
  return { player1Sets, player2Sets, player1Games, player2Games }
}

function isTournamentComplete(bracketData: any): boolean {
  if (!bracketData.rounds || bracketData.rounds.length === 0) return false
  
  const finalRound = bracketData.rounds[bracketData.rounds.length - 1]
  return finalRound?.matches?.[0]?.winner != null
}