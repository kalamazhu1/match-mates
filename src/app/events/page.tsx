'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { QuickRegisterButton } from '@/components/events/QuickRegisterButton'
import { useEffect, useState } from 'react'

interface Event {
  id: string
  title: string
  description: string
  event_type: 'tournament' | 'league' | 'social'
  format: string
  skill_level_min: string
  skill_level_max: string
  location: string
  date_start: string
  date_end: string
  registration_deadline: string
  entry_fee: number
  max_participants: number
  organizer_id: string
  status: string
  created_at: string
  updated_at: string
  // Registration data (populated when fetched)
  user_registration?: any | null
  can_register?: boolean
  registration_eligibility?: {
    eligible: boolean
    reason: string
  }
}

function EventsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'tournament' | 'league' | 'social'>('all')

  useEffect(() => {
    fetchEvents()
  }, []) // Only fetch once on mount

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events')
      
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      
      const data = await response.json()
      const eventsData = data.events || []
      
      // Always fetch registration data for events - the API will handle auth state
      const eventsWithRegistration = await Promise.all(
        eventsData.map(async (event: Event) => {
          try {
            const regResponse = await fetch(`/api/events/${event.id}`)
            if (regResponse.ok) {
              const regData = await regResponse.json()
              return {
                ...event,
                user_registration: regData.user_registration,
                can_register: regData.can_register,
                registration_eligibility: regData.registration_eligibility
              }
            }
          } catch (regError) {
            console.error(`Failed to fetch registration data for event ${event.id}:`, regError)
          }
          return event
        })
      )
      setEvents(eventsWithRegistration)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.event_type === filter
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free'
    return `$${(cents / 100).toFixed(2)}`
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'tournament': return 'bg-red-100 text-red-800'
      case 'league': return 'bg-blue-100 text-blue-800' 
      case 'social': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading events...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Tennis Events</h1>
            <p className="text-slate-600 mt-2">
              Discover and join tennis events in your area
            </p>
          </div>
          <Button 
            onClick={() => router.push('/events/create')}
            className="mt-4 md:mt-0"
          >
            Create Event
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm w-fit">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'tournament', label: 'Tournaments' },
            { key: 'league', label: 'Leagues' }, 
            { key: 'social', label: 'Social' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">🎾</div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">No events found</h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all' 
                ? "There are no events available at the moment."
                : `No ${filter} events available right now.`}
            </p>
            <Button onClick={() => router.push('/events/create')}>
              Be the first to create an event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-2 pr-2">
                      {event.title}
                    </CardTitle>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.event_type)}`}>
                      {event.event_type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-slate-600">
                      <span className="font-medium">📅 </span>
                      <span>{formatDate(event.date_start)}</span>
                    </div>
                    
                    <div className="flex items-center text-slate-600">
                      <span className="font-medium">📍 </span>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center text-slate-600">
                      <span className="font-medium">🎯 </span>
                      <span>{event.skill_level_min} - {event.skill_level_max} NTRP</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        <span className="font-medium">💰 </span>
                        {formatPrice(event.entry_fee)}
                      </span>
                      <span className="text-slate-600">
                        <span className="font-medium">👥 </span>
                        {event.max_participants} max
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <QuickRegisterButton
                      eventId={event.id}
                      eventTitle={event.title}
                      userRegistration={event.user_registration}
                      canRegister={event.can_register || false}
                      registrationEligibility={event.registration_eligibility || { eligible: false, reason: 'Registration status unknown' }}
                      onRegistrationChange={fetchEvents}
                    />
                    <Button 
                      variant="outline"
                      className="w-full" 
                      size="sm"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <ProtectedRoute 
      requireProfile={true}
      redirectTo="/auth/signin"
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <EventsContent />
    </ProtectedRoute>
  )
}