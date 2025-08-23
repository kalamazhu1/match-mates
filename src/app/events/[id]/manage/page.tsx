'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { Event, Registration } from '@/types'

interface ManageEventPageProps {
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

export default function ManageEventPage({ params }: ManageEventPageProps) {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
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


      setEventData(data)
      setError('')
    } catch (err) {
      console.error('Error fetching event:', err)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId]) // Only fetch on initial load or when event ID changes

  // Separate authorization check
  useEffect(() => {
    if (eventData?.event && user && eventData.event.organizer_id !== user.id) {
      router.push(`/events/${eventId}?error=unauthorized`)
    }
  }, [eventData?.event, user, eventId, router])

  const handleRegistrationAction = async (registrationId: string, action: 'approve' | 'reject') => {
    setUpdating(registrationId)
    
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: action === 'approve' ? 'approved' : 'rejected' 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update registration')
      }

      await fetchEventData() // Refresh data
    } catch (error) {
      console.error('Error updating registration:', error)
      alert(`Failed to ${action} registration`)
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <p className="text-slate-600 mb-8">{error || 'You do not have permission to manage this event.'}</p>
            <Link href="/events" className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Back to Events
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { event, registrations } = eventData
  const pendingRegistrations = (registrations || []).filter(r => r.status === 'pending')
  const approvedRegistrations = (registrations || []).filter(r => r.status === 'approved')
  const rejectedRegistrations = (registrations || []).filter(r => r.status === 'rejected')

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
              <h1 className="text-3xl font-bold text-slate-800 mt-2">Manage Registrations</h1>
              <p className="text-slate-600">{event.title}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{registrations.length}</div>
              <div className="text-sm text-slate-600">Total</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{approvedRegistrations.length}</div>
              <div className="text-sm text-slate-600">Approved</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingRegistrations.length}</div>
              <div className="text-sm text-slate-600">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedRegistrations.length}</div>
              <div className="text-sm text-slate-600">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Registrations */}
        {pendingRegistrations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-yellow-600">⏳</span>
                Pending Registrations ({pendingRegistrations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRegistrations.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {registration.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{registration.user.name}</div>
                        <div className="text-sm text-slate-600">{registration.user.email}</div>
                        <div className="text-sm text-slate-600">NTRP: {registration.user.ntrp_level}</div>
                      </div>
                      <div className="text-sm text-slate-500">
                        Applied {formatDate(registration.registered_at)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRegistrationAction(registration.id, 'approve')}
                        disabled={updating === registration.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updating === registration.id ? 'Updating...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRegistrationAction(registration.id, 'reject')}
                        disabled={updating === registration.id}
                      >
                        {updating === registration.id ? 'Updating...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Registrations */}
        {approvedRegistrations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                Approved Registrations ({approvedRegistrations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedRegistrations.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {registration.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{registration.user.name}</div>
                        <div className="text-sm text-slate-600">{registration.user.email}</div>
                        <div className="text-sm text-slate-600">NTRP: {registration.user.ntrp_level}</div>
                      </div>
                      <div className="text-sm text-slate-500">
                        Approved {formatDate(registration.approved_at || registration.registered_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Registrations */}
        {registrations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">No Registrations Yet</h3>
              <p className="text-slate-600">
                Once people start registering for your event, you'll be able to manage their applications here.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}