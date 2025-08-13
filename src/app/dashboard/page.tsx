'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useState, useEffect } from 'react'

interface Event {
  id: string
  title: string
  event_type: 'tournament' | 'league' | 'social'
  status: string
  date_start: string
  max_participants: number
  registration_stats?: {
    approved_registrations: number
  }
}

function DashboardContent() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!user?.id) return
      
      try {
        setEventsLoading(true)
        const response = await fetch(`/api/events?organizer=${user.id}&limit=5`)
        
        if (response.ok) {
          const data = await response.json()
          setMyEvents(data.events || [])
        }
      } catch (error) {
        console.error('Error fetching my events:', error)
      } finally {
        setEventsLoading(false)
      }
    }

    fetchMyEvents()
  }, [user?.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {profile?.name || user?.email}!
          </h1>
          <p className="text-slate-600 mt-2">
            Your Match Mates Dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              {profile && (
                <>
                  <p><span className="font-medium">Name:</span> {profile.name}</p>
                  <p><span className="font-medium">NTRP Level:</span> {profile.ntrp_level}</p>
                  {profile.phone && (
                    <p><span className="font-medium">Phone:</span> {profile.phone}</p>
                  )}
                  <p><span className="font-medium">Member Since:</span> {new Date(profile.created_at).toLocaleDateString()}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/events/create')}>
                Create Event
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/events')}>
                Browse Events
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/profile')}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                My Events
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/events?filter=my-events')}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                </div>
              ) : myEvents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-600 text-sm mb-3">
                    You haven't created any events yet.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/events/create')}
                  >
                    Create Your First Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-800 text-sm truncate">
                            {event.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>📅 {formatDate(event.date_start)}</span>
                          <span>👥 {event.registration_stats?.approved_registrations || 0}/{event.max_participants}</span>
                          <span className="capitalize">{event.event_type}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/events/${event.id}/manage`)
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
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
      <DashboardContent />
    </ProtectedRoute>
  )
}