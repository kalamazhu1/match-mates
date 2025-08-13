'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

interface LeaderboardPageProps {
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

interface LeaderboardData {
  event: {
    id: string
    title: string
    date: string
    status: string
  }
  leaderboard: PlayerStats[]
  tournament_complete: boolean
}

export default function LeaderboardPage({ params }: LeaderboardPageProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setEventId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (eventId) {
      fetchLeaderboard()
    }
  }, [eventId])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/events/${eventId}/leaderboard`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard')
      }

      setLeaderboardData(data)
    } catch (err) {
      console.error('Leaderboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const getPositionDisplay = (player: PlayerStats) => {
    if (player.is_champion) return '🏆'
    if (player.is_finalist) return '🥈'
    if (player.is_semifinalist) return '🥉'
    return player.position.toString()
  }

  const getPositionText = (player: PlayerStats) => {
    if (player.is_champion) return 'Champion'
    if (player.is_finalist) return 'Finalist'
    if (player.is_semifinalist) return 'Semifinalist'
    if (player.eliminated_in_round) return `Eliminated Round ${player.eliminated_in_round}`
    return `#${player.position}`
  }

  const getRowClassName = (player: PlayerStats) => {
    if (player.is_champion) return 'bg-yellow-50 border-yellow-200'
    if (player.is_finalist) return 'bg-gray-50 border-gray-200'
    if (player.is_semifinalist) return 'bg-orange-50 border-orange-200'
    return 'bg-white hover:bg-gray-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading leaderboard...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-2">
                <Button onClick={fetchLeaderboard} variant="outline">
                  Try Again
                </Button>
                <Link href={`/events/${eventId}`}>
                  <Button variant="outline">Back to Event</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!leaderboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No Leaderboard Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">No tournament results found for this event.</p>
              <Link href={`/events/${eventId}`}>
                <Button variant="outline">Back to Event</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tournament Leaderboard</h1>
          <h2 className="text-2xl font-semibold text-green-600 mb-4">{leaderboardData.event.title}</h2>
          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="text-gray-600">
              📅 {new Date(leaderboardData.event.date).toLocaleDateString()}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              leaderboardData.tournament_complete 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {leaderboardData.tournament_complete ? '✅ Complete' : '⏳ In Progress'}
            </span>
          </div>
          <div className="flex justify-center gap-2">
            <Link href={`/events/${eventId}`}>
              <Button variant="outline">
                ← Back to Event
              </Button>
            </Link>
            <Link href={`/events/${eventId}/draws`}>
              <Button variant="outline">
                View Bracket
              </Button>
            </Link>
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Final Standings
              {!leaderboardData.tournament_complete && (
                <span className="text-sm font-normal text-gray-500">(Current)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">Player</th>
                    <th className="text-left py-3 px-4 font-semibold">NTRP</th>
                    <th className="text-center py-3 px-4 font-semibold">Record</th>
                    <th className="text-center py-3 px-4 font-semibold">Win %</th>
                    <th className="text-center py-3 px-4 font-semibold">Sets</th>
                    <th className="text-center py-3 px-4 font-semibold">Games</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.leaderboard.map((player, index) => (
                    <tr 
                      key={player.id} 
                      className={`border-b border-gray-100 ${getRowClassName(player)}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">
                            {getPositionDisplay(player)}
                          </span>
                          {!player.is_champion && !player.is_finalist && !player.is_semifinalist && (
                            <span className="text-gray-500">#{player.position}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">{player.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                          {player.ntrp_level}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold">
                          {player.wins}-{player.losses}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.total_matches} matches
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold">
                          {player.win_percentage}%
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm">
                          {player.sets_won}-{player.sets_lost}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm">
                          {player.games_won}-{player.games_lost}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-medium ${
                          player.is_champion ? 'text-yellow-600' :
                          player.is_finalist ? 'text-gray-600' :
                          player.is_semifinalist ? 'text-orange-600' :
                          'text-gray-500'
                        }`}>
                          {getPositionText(player)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            {leaderboardData.tournament_complete && leaderboardData.leaderboard.length > 0 && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Tournament Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {leaderboardData.leaderboard.find(p => p.is_champion)?.name || 'TBD'}
                    </div>
                    <div className="text-sm text-gray-600">Champion</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-xl font-semibold text-gray-600">
                      {leaderboardData.leaderboard.find(p => p.is_finalist)?.name || 'TBD'}
                    </div>
                    <div className="text-sm text-gray-600">Finalist</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-lg font-medium text-orange-600">
                      {leaderboardData.leaderboard.filter(p => p.is_semifinalist).length} players
                    </div>
                    <div className="text-sm text-gray-600">Reached Semifinals</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}