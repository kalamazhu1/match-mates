import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DrawParams {
  params: Promise<{
    id: string
  }>
}

// Generate single elimination bracket
function generateSingleEliminationBracket(participants: any[]) {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants for a tournament')
  }

  // Shuffle participants for random seeding
  const shuffled = [...participants].sort(() => Math.random() - 0.5)
  
  // Find next power of 2 to determine bracket size
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(shuffled.length)))
  const totalRounds = Math.log2(nextPowerOf2)
  const numberOfByes = nextPowerOf2 - shuffled.length
  
  // Create seeded bracket with strategic bye placement
  const allSlots = new Array(nextPowerOf2).fill(null)
  
  // Strategic bye distribution: spread byes evenly across the bracket
  // to ensure they never face each other in the first round
  if (numberOfByes > 0) {
    // Calculate spacing between byes
    const spacing = Math.floor(nextPowerOf2 / numberOfByes)
    const remainder = nextPowerOf2 % numberOfByes
    
    let byePositions = []
    let currentPos = 0
    
    // Distribute byes with even spacing
    for (let i = 0; i < numberOfByes; i++) {
      // Add extra spacing for first few byes if there's a remainder
      const extraSpace = i < remainder ? 1 : 0
      currentPos += spacing + extraSpace
      
      // Ensure we don't exceed array bounds
      if (currentPos - 1 < nextPowerOf2) {
        byePositions.push(currentPos - 1)
      }
    }
    
    // If we have too many byes clustered, redistribute them more evenly
    if (byePositions.length < numberOfByes) {
      byePositions = []
      for (let i = 0; i < numberOfByes; i++) {
        // Simple even distribution
        const pos = Math.floor((i * nextPowerOf2) / numberOfByes)
        byePositions.push(pos)
      }
    }
    
    // Fill player positions (avoiding bye positions)
    let playerIndex = 0
    for (let i = 0; i < nextPowerOf2; i++) {
      if (!byePositions.includes(i) && playerIndex < shuffled.length) {
        allSlots[i] = shuffled[playerIndex]
        playerIndex++
      }
    }
  } else {
    // No byes needed, fill all slots
    for (let i = 0; i < shuffled.length; i++) {
      allSlots[i] = shuffled[i]
    }
  }
  
  const rounds = []
  
  // Create first round with all possible matches
  const firstRoundMatches = nextPowerOf2 / 2
  const matches = []
  
  for (let i = 0; i < firstRoundMatches; i++) {
    const player1 = allSlots[i * 2]
    const player2 = allSlots[i * 2 + 1]
    
    // If one player is null (bye), the other automatically advances
    let winner = null
    if (!player1 && player2) winner = player2.id
    if (!player2 && player1) winner = player1.id
    
    matches.push({
      id: `match-1-${i + 1}`,
      round: 1,
      player1,
      player2,
      winner,
      score: winner ? 'BYE' : null
    })
  }
  
  rounds.push({
    round: 1,
    matches: matches
  })
  
  // Create subsequent rounds (empty, to be filled as matches complete)
  // These rounds will be populated dynamically as winners advance from previous rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round)
    const roundMatches = []
    
    for (let match = 1; match <= matchesInRound; match++) {
      roundMatches.push({
        id: `match-${round}-${match}`,
        round,
        player1: null, // Will be filled when previous round completes
        player2: null, // Will be filled when previous round completes
        winner: null,
        score: null
      })
    }
    
    rounds.push({
      round,
      matches: roundMatches
    })
  }

  // Automatically advance BYE winners through all rounds
  const bracketData = {
    format: 'single_elimination',
    participants: shuffled,
    rounds,
    totalRounds,
    bracketSize: nextPowerOf2,
    numberOfByes
  }
  
  // Process BYE winners and advance them through subsequent rounds
  advanceByeWinners(bracketData)
  
  return bracketData
}

// Generate round robin tournament
function generateRoundRobinTournament(participants: any[]) {
  if (participants.length < 3) {
    throw new Error('Need at least 3 participants for a round robin tournament')
  }

  // Shuffle participants for random order
  const shuffled = [...participants].sort(() => Math.random() - 0.5)
  
  // Generate all possible matches (every player plays every other player once)
  const matches = []
  let matchCounter = 1
  
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      matches.push({
        id: `rr-match-${matchCounter}`,
        player1: shuffled[i],
        player2: shuffled[j],
        winner: null,
        score: null,
        loser: null
      })
      matchCounter++
    }
  }
  
  // Calculate initial standings (all players start with 0 wins/losses)
  const standings = shuffled.map(player => ({
    id: player.id,
    name: player.name,
    ntrp_level: player.ntrp_level,
    wins: 0,
    losses: 0,
    matches_played: 0,
    sets_won: 0,
    sets_lost: 0,
    games_won: 0,
    games_lost: 0
  }))

  return {
    format: 'round_robin',
    participants: shuffled,
    matches,
    standings,
    players: shuffled,
    total_matches: matches.length,
    completed_matches: 0
  }
}

// Helper function to advance BYE winners through subsequent rounds
function advanceByeWinners(bracketData: any) {
  // Only process the first round initially - higher rounds should only be filled
  // when actual match results determine the winners
  const firstRound = bracketData.rounds[0]
  
  if (!firstRound || bracketData.rounds.length < 2) {
    return
  }
  
  const secondRound = bracketData.rounds[1]
  
  // Process first round BYE winners and advance them to second round
  for (let matchIndex = 0; matchIndex < firstRound.matches.length; matchIndex++) {
    const match = firstRound.matches[matchIndex]
    
    // Only advance if this is a TRUE BYE (player vs null, already marked as BYE winner)
    if (match.winner && match.score === 'BYE') {
      const nextMatchIndex = Math.floor(matchIndex / 2)
      
      // Ensure we don't go out of bounds
      if (nextMatchIndex < secondRound.matches.length) {
        const nextMatch = secondRound.matches[nextMatchIndex]
        
        // Get the winner data
        let winnerData = null
        if (match.player1?.id === match.winner) {
          winnerData = match.player1
        } else if (match.player2?.id === match.winner) {
          winnerData = match.player2
        }
        
        if (winnerData) {
          // Determine if winner goes to player1 or player2 slot in next match
          if (matchIndex % 2 === 0) {
            // Even match index → goes to player1 slot
            if (!nextMatch.player1) {
              nextMatch.player1 = winnerData
            }
          } else {
            // Odd match index → goes to player2 slot
            if (!nextMatch.player2) {
              nextMatch.player2 = winnerData
            }
          }
          
          // IMPORTANT: Do NOT automatically advance in second round
          // Even if there's only one player, wait for the other match to complete
          // Only set BYE winner if BOTH players are known and one is null
          // This prevents premature advancement when opponent is just "TBD"
        }
      }
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: DrawParams
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

    // Get draws for this event
    const { data: draws, error } = await supabase
      .from('draws')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Draws fetch error:', error)
      // If table doesn't exist, return empty array
      if (error.message?.includes('relation "draws" does not exist')) {
        return NextResponse.json({ draws: [] })
      }
      return NextResponse.json(
        { error: 'Failed to fetch draws' },
        { status: 500 }
      )
    }

    return NextResponse.json({ draws })

  } catch (error) {
    console.error('Draws API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: DrawParams
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

    // Parse request body
    const body = await request.json()
    const { format, participants } = body

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
        { error: 'Only the event organizer can create draws' },
        { status: 403 }
      )
    }

    // Generate bracket based on format
    let bracketData
    
    switch (format) {
      case 'single_elimination':
        bracketData = generateSingleEliminationBracket(participants)
        break
      case 'round_robin':
        bracketData = generateRoundRobinTournament(participants)
        break
      default:
        return NextResponse.json(
          { error: `Draw generation not supported for format: ${format}` },
          { status: 400 }
        )
    }

    // Delete any existing draws for this event
    await supabase
      .from('draws')
      .delete()
      .eq('event_id', eventId)

    // Create new draw
    const { data: draw, error: insertError } = await supabase
      .from('draws')
      .insert({
        event_id: eventId,
        bracket_data: bracketData,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Draw creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create draw' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Draw created successfully',
      draw
    })

  } catch (error) {
    console.error('Draw creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}