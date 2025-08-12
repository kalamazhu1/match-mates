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
  
  return {
    format: 'single_elimination',
    participants: shuffled,
    rounds,
    totalRounds,
    bracketSize: nextPowerOf2,
    numberOfByes
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