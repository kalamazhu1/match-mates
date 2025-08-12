'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { Event, Registration } from '@/types'

interface DrawPageProps {
  params: Promise<{
    id: string
  }>
}

interface EventData {
  event: Event & {
    organizer: { name: string; email: string }
    registration_stats: {
      total_registrations: number
      approved_registrations: number
      pending_registrations: number
      spots_available: number
      is_full: boolean
      has_waitlist: boolean
    }
  }
  registrations: (Registration & {
    user: { name: string; email: string; ntrp_level: string }
  })[]
}

interface Draw {
  id: string
  event_id: string
  bracket_data: any
  created_at: string
}

export default function DrawCreationPage({ params }: DrawPageProps) {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const fetchEventData = async () => {
    if (!eventId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch event')
      }

      // If registrations are not provided (user might not be organizer in the general API),
      // fetch them separately since this is the draws page which is organizer-only
      if (!data.registrations) {
        console.log('Fetching registrations separately for draws page')
        const regResponse = await fetch(`/api/events/${eventId}/registrations`)
        if (regResponse.ok) {
          const regData = await regResponse.json()
          console.log('Separate registrations fetch result:', regData)
          data.registrations = regData.registrations || []
        } else {
          console.error('Failed to fetch registrations separately:', regResponse.status, regResponse.statusText)
        }
      } else {
        console.log('Registrations were provided in main API call')
      }

      setEventData(data)
      setError('')
    } catch (err) {
      console.error('Error fetching event:', err)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const fetchDraws = async () => {
    if (!eventId) return
    
    try {
      const response = await fetch(`/api/events/${eventId}/draws`)
      if (response.ok) {
        const data = await response.json()
        setDraws(data.draws || [])
      }
    } catch (err) {
      console.error('Error fetching draws:', err)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchEventData()
      fetchDraws()
    }
  }, [eventId])

  // Authorization check
  useEffect(() => {
    if (eventData?.event && user && eventData.event.organizer_id !== user.id) {
      setError('You do not have permission to manage draws for this event.')
    }
  }, [eventData?.event, user])

  const generateDraw = async () => {
    if (!eventId || !eventData) return
    
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/events/${eventId}/draws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: eventData.event.format,
          participants: eventData.registrations?.filter(r => r.status === 'approved').map(reg => ({
            id: reg.user_id,
            name: reg.user?.name || 'Unknown Player',
            ntrp_level: reg.user?.ntrp_level || 'N/A',
            email: reg.user?.email || '',
            registration_id: reg.id
          })) || []
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate draw')
      }

      await fetchDraws() // Refresh draws
      
    } catch (error) {
      console.error('Error generating draw:', error)
      alert(`Failed to generate draw: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteDraw = async (drawId: string) => {
    if (!confirm('Are you sure you want to delete this draw? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/draws/${drawId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete draw')
      }

      await fetchDraws() // Refresh draws
    } catch (error) {
      console.error('Error deleting draw:', error)
      alert('Failed to delete draw')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h1>
            <p className="text-slate-600 mb-8">{error || 'Unable to load event data'}</p>
            <Link href="/events" className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Back to Events
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { event, registrations } = eventData
  

  const approvedRegistrations = (registrations || []).filter(r => r.status === 'approved')
  const canGenerateDraw = event.format === 'single_elimination' && approvedRegistrations.length >= 2

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/events/${eventId}`} className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                ← Back to Event
              </Link>
              <h1 className="text-3xl font-bold text-slate-800 mt-2">Tournament Draw</h1>
              <p className="text-slate-600">{event.title}</p>
            </div>
          </div>
        </div>

        {/* Event Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{approvedRegistrations.length}</div>
              <div className="text-sm text-slate-600">Registered Players</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 capitalize">{event.format.replace('_', ' ')}</div>
              <div className="text-sm text-slate-600">Tournament Format</div>
            </CardContent>
          </Card>
        </div>

        {/* Draw Generation */}
        {event.format === 'single_elimination' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-600">🏆</span>
                Single Elimination Draw
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!canGenerateDraw ? (
                <div className="text-center py-8">
                  <div className="text-slate-400 text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-medium text-slate-800 mb-2">Cannot Generate Draw</h3>
                  <p className="text-slate-600">
                    {approvedRegistrations.length < 2 
                      ? `Need at least 2 approved registrations. Currently have ${approvedRegistrations.length}.`
                      : 'Unknown issue preventing draw generation.'
                    }
                  </p>
                </div>
              ) : draws.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-400 text-6xl mb-4">🎾</div>
                  <h3 className="text-xl font-medium text-slate-800 mb-2">Ready to Generate Draw</h3>
                  <p className="text-slate-600 mb-6">
                    You have {approvedRegistrations.length} approved players ready for the tournament draw.
                  </p>
                  <Button
                    onClick={generateDraw}
                    disabled={isGenerating}
                    className="min-w-[160px]"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Draw'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">Tournament Bracket</h4>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateDraw}
                        disabled={isGenerating}
                      >
                        {isGenerating ? 'Regenerating...' : 'Regenerate Draw'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDraw(draws[0].id)}
                      >
                        Delete Draw
                      </Button>
                    </div>
                  </div>
                  
                  {/* Draw Visualization */}
                  <div className="p-6 bg-slate-50 rounded-lg">
                    <TournamentBracket 
                      bracketData={draws[0]?.bracket_data} 
                      onMatchUpdate={async (matchId, winnerId, score) => {
                        try {
                          // Update the draw with match result
                          const response = await fetch(`/api/events/${eventId}/draws/${draws[0].id}/matches/${matchId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              winner: winnerId,
                              score: score
                            })
                          })
                          
                          if (response.ok) {
                            // Refresh the draws to show updated bracket
                            await fetchDraws()
                          } else {
                            alert('Failed to update match result')
                          }
                        } catch (error) {
                          console.error('Error updating match:', error)
                          alert('Failed to update match result')
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Other Tournament Formats */}
        {event.format !== 'single_elimination' && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">Draw System Coming Soon</h3>
              <p className="text-slate-600">
                Draw generation for {event.format.replace('_', ' ')} tournaments will be available in a future update.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Registered Players */}
        {registrations && registrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Registered Players ({registrations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrations
                  .filter(registration => registration.user) // Filter out null users
                  .map((registration, index) => (
                  <div key={registration.id} className="flex items-center p-3 bg-slate-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      registration.status === 'approved' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : registration.status === 'pending'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}>
                      <span className="text-white font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{registration.user?.name || 'Unknown Player'}</div>
                      <div className="text-sm text-slate-600">NTRP: {registration.user?.ntrp_level || 'N/A'}</div>
                      <div className={`text-xs font-medium capitalize ${
                        registration.status === 'approved' 
                          ? 'text-green-600' 
                          : registration.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {registration.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

// Score Entry Modal Component
function ScoreModal({ isOpen, player1, player2, onSubmit, onClose, existingScore, isEditing }: {
  isOpen: boolean
  player1: any
  player2: any
  onSubmit: (winnerId: string, score: string) => void
  onClose: () => void
  existingScore?: string
  isEditing?: boolean
}) {
  const [scoreGrid, setScoreGrid] = useState({
    player1: ['', '', ''],
    player2: ['', '', '']
  })
  const [isWalkover, setIsWalkover] = useState(false)
  const [walkoverWinner, setWalkoverWinner] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      if (existingScore && isEditing) {
        // Parse existing score
        if (existingScore === 'W/O') {
          setIsWalkover(true)
          setScoreGrid({ player1: ['', '', ''], player2: ['', '', ''] })
          setWalkoverWinner('')
        } else {
          setIsWalkover(false)
          // Parse score like "6-4, 6-3" into grid
          const sets = existingScore.split(', ')
          const newGrid = { player1: ['', '', ''], player2: ['', '', ''] }
          
          sets.forEach((set, index) => {
            if (index < 3 && set.includes('-')) {
              const [player1Score, player2Score] = set.split('-')
              newGrid.player1[index] = player1Score.trim()
              newGrid.player2[index] = player2Score.trim()
            }
          })
          
          setScoreGrid(newGrid)
        }
      } else {
        setScoreGrid({
          player1: ['', '', ''],
          player2: ['', '', '']
        })
        setIsWalkover(false)
        setWalkoverWinner('')
      }
    }
  }, [isOpen, existingScore, isEditing])

  const updateScore = (playerType: 'player1' | 'player2', setIndex: number, value: string) => {
    setScoreGrid(prev => ({
      ...prev,
      [playerType]: prev[playerType].map((score, index) => 
        index === setIndex ? value : score
      )
    }))
  }

  // Determine winner based on score
  const determineWinner = (p1Scores: string[], p2Scores: string[]): string | null => {
    let p1Sets = 0
    let p2Sets = 0
    
    for (let i = 0; i < 3; i++) {
      const p1Score = parseInt(p1Scores[i]) || 0
      const p2Score = parseInt(p2Scores[i]) || 0
      
      if (p1Score > 0 || p2Score > 0) { // Only count sets where scores were entered
        if (p1Score > p2Score) p1Sets++
        else if (p2Score > p1Score) p2Sets++
      }
    }
    
    // Need to win majority of sets
    if (p1Sets > p2Sets) return player1?.id
    if (p2Sets > p1Sets) return player2?.id
    return null // Tie or no clear winner
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isWalkover) {
      if (!walkoverWinner) {
        alert('Please select who wins the walkover')
        return
      }
      onSubmit(walkoverWinner, 'W/O')
      onClose()
      return
    }
    
    // Build score string from grid
    const sets = []
    for (let i = 0; i < 3; i++) {
      const player1Score = scoreGrid.player1[i]
      const player2Score = scoreGrid.player2[i]
      
      // Only include sets where at least one player has a score
      if (player1Score.trim() || player2Score.trim()) {
        sets.push(`${player1Score || '0'}-${player2Score || '0'}`)
      }
    }
    
    if (sets.length > 0) {
      const winnerId = determineWinner(scoreGrid.player1, scoreGrid.player2)
      if (!winnerId) {
        alert('Could not determine winner from scores. Please check the scores.')
        return
      }
      onSubmit(winnerId, sets.join(', '))
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? 'Edit Match Result' : 'Enter Match Result'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">

            {/* Walkover Option */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isWalkover}
                  onChange={(e) => setIsWalkover(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Walkover - One player did not show up or withdrew
                </span>
              </label>
            </div>

            {!isWalkover && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter Set Scores
                </label>
                
                {/* Score Grid */}
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <div className="text-xs font-medium text-gray-600">Player</div>
                    <div className="text-xs font-medium text-gray-500 text-center">Set 1</div>
                    <div className="text-xs font-medium text-gray-500 text-center">Set 2</div>
                    <div className="text-xs font-medium text-gray-500 text-center">Set 3</div>
                  </div>
                  
                  {/* Player 1 Row */}
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {player1?.name}
                    </div>
                    {[0, 1, 2].map(setIndex => (
                      <input
                        key={`player1-${setIndex}`}
                        type="text"
                        value={scoreGrid.player1[setIndex]}
                        onChange={(e) => updateScore('player1', setIndex, e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="6"
                        maxLength={2}
                      />
                    ))}
                  </div>
                  
                  {/* Player 2 Row */}
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {player2?.name}
                    </div>
                    {[0, 1, 2].map(setIndex => (
                      <input
                        key={`player2-${setIndex}`}
                        type="text"
                        value={scoreGrid.player2[setIndex]}
                        onChange={(e) => updateScore('player2', setIndex, e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="4"
                        maxLength={2}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Enter scores for each set. Leave empty sets blank.
                </div>
              </>
            )}

            {isWalkover && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who wins the walkover?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkoverWinner(player1?.id)}
                    className={`px-3 py-2 text-sm rounded border ${
                      walkoverWinner === player1?.id 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {player1?.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkoverWinner(player2?.id)}
                    className={`px-3 py-2 text-sm rounded border ${
                      walkoverWinner === player2?.id 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {player2?.name}
                  </button>
                </div>
                {walkoverWinner && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <strong>{walkoverWinner === player1?.id ? player1?.name : player2?.name}</strong> wins by walkover.
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Confirm Win
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Professional Tournament Bracket inspired by Wimbledon design
function TournamentBracket({ bracketData, onMatchUpdate }: { 
  bracketData: any
  onMatchUpdate: (matchId: string, winnerId: string, score: string) => void 
}) {
  const [scoreModal, setScoreModal] = useState<{
    isOpen: boolean
    matchId: string
    player1: any
    player2: any
    isEditing?: boolean
    existingScore?: string
  }>({
    isOpen: false,
    matchId: '',
    player1: null,
    player2: null,
    isEditing: false,
    existingScore: undefined
  })

  const handleScoreSubmit = (winnerId: string, score: string) => {
    onMatchUpdate(scoreModal.matchId, winnerId, score)
  }

  if (!bracketData || !bracketData.rounds) {
    return (
      <div className="text-center py-8 text-slate-600">
        No bracket data available
      </div>
    )
  }

  const getRoundName = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds - 1) return 'Final'
    if (roundIndex === totalRounds - 2) return 'Semifinal'
    if (roundIndex === totalRounds - 3) return 'Quarterfinal'
    return `Round ${roundIndex + 1}`
  }

  // Calculate the minimum height needed for the bracket
  const firstRoundMatches = bracketData.rounds[0]?.matches.length || 0
  const baseMatchHeight = 140
  const minContainerHeight = firstRoundMatches * baseMatchHeight + 200 // Extra space for headers and margins
  
  return (
    <>
      <div className="bg-gray-50 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div 
            className="grid gap-8" 
            style={{ 
              gridTemplateColumns: `repeat(${bracketData.rounds.length}, 1fr)`,
              minHeight: `${minContainerHeight}px`
            }}
          >
            {bracketData.rounds.map((round: any, roundIndex: number) => (
              <div key={roundIndex} className="relative">
                {/* Round Header */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getRoundName(roundIndex, bracketData.rounds.length)}
                  </h3>
                </div>
                
                {/* Matches */}
                <div className="relative">
                  {round.matches.map((match: any, matchIndex: number) => {
                    // Calculate vertical positioning based on round and match index
                    const baseMatchHeight = 140 // Increased height for each match card + spacing
                    const roundMultiplier = Math.pow(2, roundIndex)
                    const verticalOffset = matchIndex * baseMatchHeight * roundMultiplier + (roundMultiplier - 1) * baseMatchHeight / 2
                    
                    return (
                      <div 
                        key={matchIndex}
                        className="absolute w-full"
                        style={{ top: `${verticalOffset}px` }}
                      >
                        <MatchCard 
                          match={match}
                          onMatchClick={(isEditing = false) => {
                            setScoreModal({
                              isOpen: true,
                              matchId: match.id,
                              player1: match.player1,
                              player2: match.player2,
                              isEditing: isEditing,
                              existingScore: isEditing ? match.score : undefined
                            })
                          }}
                          roundIndex={roundIndex}
                          matchIndex={matchIndex}
                          totalRounds={bracketData.rounds.length}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ScoreModal
        isOpen={scoreModal.isOpen}
        player1={scoreModal.player1}
        player2={scoreModal.player2}
        onSubmit={handleScoreSubmit}
        onClose={() => setScoreModal({ isOpen: false, matchId: '', player1: null, player2: null, isEditing: false, existingScore: undefined })}
        existingScore={scoreModal.existingScore}
        isEditing={scoreModal.isEditing}
      />
    </>
  )
}

// Individual Match Card Component
function MatchCard({ match, onMatchClick, roundIndex, matchIndex, totalRounds }: {
  match: any
  onMatchClick: (isEditing?: boolean) => void
  roundIndex: number
  matchIndex: number
  totalRounds: number
}) {
  const isWinner = (playerId: string) => match.winner === playerId
  const isFinal = roundIndex === totalRounds - 1
  
  const handleClick = () => {
    // Allow clicking if both players exist
    if (!match.player1 || !match.player2) {
      return
    }
    
    // Determine if this is editing an existing match
    const isEditing = !!match.winner
    onMatchClick(isEditing)
  }

  return (
    <div className="relative">
      <div 
        className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
          match.player1 && match.player2 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
        }`}
        onClick={handleClick}
        title={match.player1 && match.player2 ? (match.winner ? 'Click to edit match result' : 'Click to enter match result') : undefined}
      >
        {/* Match Header */}
        {isFinal && (
          <div className="bg-green-600 text-white px-4 py-2 text-center font-semibold">
            Championship Final
          </div>
        )}
        
        {/* Players */}
        <div className="divide-y divide-gray-100">
          {/* Player 1 */}
          <div 
            className={`px-3 py-2 flex items-center justify-between ${
              isWinner(match.player1?.id) 
                ? 'bg-green-50 border-l-4 border-green-500' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {match.player1 ? (
                <>
                  <div className="w-6 h-4 bg-gray-300 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      {match.player1.ntrp_level}
                    </span>
                  </div>
                  <span className={`font-medium ${isWinner(match.player1.id) ? 'text-green-800' : 'text-gray-800'}`}>
                    {match.player1.name}
                  </span>
                </>
              ) : (
                <span className="font-medium text-gray-400 italic">
                  {roundIndex === 0 ? 'BYE' : 'TBD'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {match.score === 'BYE' && isWinner(match.player1?.id) && (
                <div className="text-sm text-blue-600 font-medium">BYE</div>
              )}
              {isWinner(match.player1?.id) && match.winner && match.score && match.score !== 'BYE' && (
                <div className="text-sm text-gray-600 font-medium">
                  {match.score}
                </div>
              )}
              {isWinner(match.player1?.id) && (
                <div className="w-0 h-0 border-l-8 border-l-green-600 border-t-4 border-b-4 border-t-transparent border-b-transparent"></div>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div 
            className={`px-3 py-2 flex items-center justify-between ${
              isWinner(match.player2?.id) 
                ? 'bg-green-50 border-l-4 border-green-500' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {match.player2 ? (
                <>
                  <div className="w-6 h-4 bg-gray-300 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      {match.player2.ntrp_level}
                    </span>
                  </div>
                  <span className={`font-medium ${isWinner(match.player2.id) ? 'text-green-800' : 'text-gray-800'}`}>
                    {match.player2.name}
                  </span>
                </>
              ) : (
                <span className="font-medium text-gray-400 italic">
                  {roundIndex === 0 ? 'BYE' : 'TBD'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {match.score === 'BYE' && isWinner(match.player2?.id) && (
                <div className="text-sm text-blue-600 font-medium">BYE</div>
              )}
              {isWinner(match.player2?.id) && match.winner && match.score && match.score !== 'BYE' && (
                <div className="text-sm text-gray-600 font-medium">
                  {match.score}
                </div>
              )}
              {isWinner(match.player2?.id) && (
                <div className="w-0 h-0 border-l-8 border-l-green-600 border-t-4 border-b-4 border-t-transparent border-b-transparent"></div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bracket Line */}
      {roundIndex < totalRounds - 1 && (
        <BracketLine 
          roundIndex={roundIndex}
          matchIndex={matchIndex}
        />
      )}
    </div>
  )
}

// Professional tournament bracket connecting lines (Wimbledon style)
function BracketLine({ roundIndex, matchIndex }: {
  roundIndex: number
  matchIndex: number
}) {
  const isTopMatch = matchIndex % 2 === 0
  const baseMatchHeight = 140
  const pairSpacing = baseMatchHeight * Math.pow(2, roundIndex)
  
  // For the top match of each pair, draw down to connect
  // For the bottom match of each pair, draw up to connect
  const verticalDistance = pairSpacing / 2
  
  return (
    <div className="absolute top-1/2 -right-8 pointer-events-none z-10">
      <svg width="32" height={Math.abs(verticalDistance) * 2 + 20} className="overflow-visible">
        {/* Horizontal line from match */}
        <line
          x1="0"
          y1="0"
          x2="16"
          y2="0"
          stroke="#9ca3af"
          strokeWidth="1"
        />
        
        {/* Vertical line to meet pair */}
        <line
          x1="16"
          y1="0"
          x2="16"
          y2={isTopMatch ? verticalDistance : -verticalDistance}
          stroke="#9ca3af"
          strokeWidth="1"
        />
        
        {/* Horizontal line to next round (only for top match) */}
        {isTopMatch && (
          <line
            x1="16"
            y1={verticalDistance}
            x2="32"
            y2={verticalDistance}
            stroke="#9ca3af"
            strokeWidth="1"
          />
        )}
      </svg>
    </div>
  )
}