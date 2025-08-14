'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { RegistrationButton } from '@/components/events/RegistrationButton'
import { EventAdminActions } from '@/components/events/EventAdminActions'
import { useAuth } from '@/contexts/AuthContext'
import { Event, Registration } from '@/types'

interface EventPageProps {
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
  user_registration: Registration | null
  can_register: boolean
  registration_eligibility: {
    eligible: boolean
    reason: string
  }
  registrations?: any[]
}

interface LeaderboardData {
  event: {
    id: string
    title: string
    date: string
    status: string
  }
  leaderboard: {
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
  }[]
  tournament_complete: boolean
}

export default function EventPage({ params }: EventPageProps) {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState<string | null>(null)
  const { user } = useAuth()

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

      setEventData(data)
      
      // If it's a completed tournament, fetch leaderboard data
      if (data.event.format === 'single_elimination' && data.event.status === 'completed') {
        await fetchLeaderboardData()
      }
      
      setError('')
    } catch (err) {
      console.error('Error fetching event:', err)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboardData = async () => {
    if (!eventId) return
    
    try {
      const response = await fetch(`/api/events/${eventId}/leaderboard`)
      const data = await response.json()

      if (response.ok && data.tournament_complete) {
        setLeaderboardData(data)
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      // Don't show error for leaderboard fetch, just silently fail
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId]) // Only fetch on initial load or when event ID changes

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatEventType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'full': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-2xl text-red-600">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Event Not Found</h1>
            <p className="text-slate-600 mb-8">{error}</p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              Go Back Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!eventData) {
    return null
  }

  const { event, user_registration, can_register, registration_eligibility } = eventData
  const isOwner = user?.id === event.organizer_id

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                  {formatEventType(event.status)}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                  {formatEventType(event.event_type)}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-slate-800 mb-4">
                {event.title}
              </h1>
              
              <p className="text-slate-600 text-lg leading-relaxed">
                {event.description}
              </p>
            </div>

            <div className="mt-6 lg:mt-0 lg:ml-8 lg:w-80">
              {isOwner ? (
                <EventAdminActions 
                  event={event} 
                  userRegistration={user_registration}
                  canRegister={can_register}
                  registrationEligibility={registration_eligibility}
                  onEventUpdate={fetchEventData}
                />
              ) : (
                <RegistrationButton
                  eventId={event.id}
                  event={event}
                  userRegistration={user_registration}
                  canRegister={can_register}
                  registrationEligibility={registration_eligibility}
                  onRegistrationChange={fetchEventData}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tournament Results - Only show for completed tournaments */}
        {leaderboardData && leaderboardData.tournament_complete && (
          <div className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-xl shadow-sm border border-yellow-200 p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">🏆 Tournament Complete!</h2>
              <p className="text-slate-600">Congratulations to all participants. Here are the final results:</p>
            </div>

            {/* Champion and Finalist Display */}
            <div className="flex justify-center items-end gap-6 mb-8">
              {/* Champion (1st Place) */}
              {leaderboardData.leaderboard.find(p => p.is_champion) && (
                <div className="text-center bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-lg p-6 shadow-lg border-2 border-yellow-300 transform scale-110">
                  <div className="text-6xl mb-3">🏆</div>
                  <div className="font-bold text-xl text-yellow-800">
                    {leaderboardData.leaderboard.find(p => p.is_champion)?.name}
                  </div>
                  <div className="text-sm text-yellow-700 font-medium mt-1">Champion</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {leaderboardData.leaderboard.find(p => p.is_champion)?.ntrp_level} NTRP
                  </div>
                </div>
              )}

              {/* Finalist (2nd Place) */}
              {leaderboardData.leaderboard.find(p => p.is_finalist) && (
                <div className="text-center bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                  <div className="text-5xl mb-3">🥈</div>
                  <div className="font-semibold text-lg text-gray-800">
                    {leaderboardData.leaderboard.find(p => p.is_finalist)?.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Finalist</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {leaderboardData.leaderboard.find(p => p.is_finalist)?.ntrp_level} NTRP
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {leaderboardData.leaderboard.length}
                </div>
                <div className="text-sm text-gray-600">Total Players</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {leaderboardData.leaderboard.reduce((sum, p) => sum + p.total_matches, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Matches</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...leaderboardData.leaderboard.map(p => p.eliminated_in_round || 0))}
                </div>
                <div className="text-sm text-gray-600">Rounds Played</div>
              </div>
            </div>

            {/* View Full Leaderboard Button */}
            <div className="text-center">
              <Link
                href={`/events/${event.id}/leaderboard`}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span className="mr-2">📊</span>
                View Full Leaderboard & Stats
              </Link>
            </div>
          </div>
        )}

        {/* Event Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Event Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Event Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-medium text-slate-800">Start Date</p>
                  <p className="text-slate-600">{formatDate(event.date_start)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-2xl mr-3">📍</span>
                <div>
                  <p className="font-medium text-slate-800">Location</p>
                  <p className="text-slate-600">{event.location}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎾</span>
                <div>
                  <p className="font-medium text-slate-800">Format</p>
                  <p className="text-slate-600">{formatEventType(event.format)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <p className="font-medium text-slate-800">Skill Level</p>
                  <p className="text-slate-600">{event.skill_level_min} - {event.skill_level_max} NTRP</p>
                </div>
              </div>
              
              {event.entry_fee > 0 && (
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💰</span>
                  <div>
                    <p className="font-medium text-slate-800">Entry Fee</p>
                    <p className="text-slate-600">${(event.entry_fee / 100).toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="text-2xl mr-3">⏰</span>
                <div>
                  <p className="font-medium text-slate-800">Registration Deadline</p>
                  <p className="text-slate-600">{formatDate(event.registration_deadline)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Registration Status</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">Max Participants</span>
                <span className="text-slate-900">{event.max_participants}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-700">Registered</span>
                <span className="text-green-900">{event.registration_stats.approved_registrations}</span>
              </div>
              
              {event.registration_stats.pending_registrations > 0 && (
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium text-yellow-700">Waitlist</span>
                  <span className="text-yellow-900">{event.registration_stats.pending_registrations}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-700">Spots Available</span>
                <span className="text-blue-900">{event.registration_stats.spots_available}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Registration Progress</span>
                <span>{event.registration_stats.approved_registrations}/{event.max_participants}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (event.registration_stats.approved_registrations / event.max_participants) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Organizer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Organizer</h2>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-semibold text-lg">
                {event.organizer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-800">{event.organizer.name}</p>
              <p className="text-slate-600">{event.organizer.email}</p>
            </div>
          </div>
        </div>

        {/* Registered Players */}
        {event.registration_stats.approved_registrations > 0 && (
          <RegisteredPlayersList 
            registrations={eventData.registrations || []} 
            isOwner={isOwner}
          />
        )}

        {/* Tournament Links */}
        {event.format === 'single_elimination' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Tournament</h2>
            <p className="text-slate-600 mb-4">
              View the tournament bracket and results for this single elimination event.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/events/${event.id}/draws`}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="mr-2">🏆</span>
                View Tournament Bracket
              </Link>
              
              <Link
                href={`/events/${event.id}/leaderboard`}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">📊</span>
                View Leaderboard
              </Link>
            </div>
          </div>
        )}

        {/* Communication Groups */}
        {(event.whatsapp_group || event.telegram_group) && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Communication</h2>
            <p className="text-slate-600 mb-4">
              Join the group chat to stay updated and connect with other participants.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {event.whatsapp_group && (
                <a
                  href={event.whatsapp_group}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span className="mr-2">📱</span>
                  WhatsApp Group
                </a>
              )}
              
              {event.telegram_group && (
                <a
                  href={event.telegram_group}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span className="mr-2">✈️</span>
                  Telegram Group
                </a>
              )}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-slate-600 hover:text-slate-800 transition-all duration-300 font-medium"
          >
            ← Back to Events
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-sm">🎾</span>
              </div>
              <span className="text-lg font-semibold">Match Mates</span>
            </div>
            <p className="text-slate-400">
              © 2024 Match Mates. Connecting tennis players in San Francisco.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Registered Players List Component
function RegisteredPlayersList({ registrations, isOwner }: { 
  registrations: any[], 
  isOwner: boolean 
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const playersPerPage = 12
  
  // Filter approved registrations and sort by registration date
  const approvedRegistrations = registrations
    .filter(reg => reg.status === 'approved')
    .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime())
  
  // Calculate pagination
  const totalPages = Math.ceil(approvedRegistrations.length / playersPerPage)
  const startIndex = (currentPage - 1) * playersPerPage
  const endIndex = startIndex + playersPerPage
  const currentPlayers = approvedRegistrations.slice(startIndex, endIndex)
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">
          Registered Players ({approvedRegistrations.length})
        </h2>
        {totalPages > 1 && (
          <div className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {currentPlayers.map((registration, index) => (
          <div
            key={registration.id || index}
            className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {/* Player Avatar */}
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {registration.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            
            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-800 truncate">
                {registration.user?.name || 'Unknown Player'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {registration.user?.ntrp_level || 'N/A'} NTRP
                </span>
                <span className="text-xs">
                  #{startIndex + index + 1}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1}-{Math.min(endIndex, approvedRegistrations.length)} of {approvedRegistrations.length} players
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - currentPage) <= 1
              )
              .map((page, index, array) => (
                <div key={page} className="flex items-center">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                </div>
              ))
            }
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {approvedRegistrations.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">👥</div>
          <p>No registered players yet</p>
        </div>
      )}
    </div>
  )
}