'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { EventEditForm } from '@/components/events/EventEditForm'
import { useAuth } from '@/contexts/AuthContext'
import { Event } from '@/types'

interface EditEventPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const fetchEvent = async () => {
    if (!eventId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch event')
      }

      setEvent(data.event)
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
      fetchEvent()
    }
  }, [eventId]) // Only fetch on initial load or when event ID changes

  // Separate authorization check
  useEffect(() => {
    if (event && user && event.organizer_id !== user.id) {
      setError('You do not have permission to edit this event.')
    }
  }, [event, user])

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
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Error Loading Event</h1>
            <p className="text-slate-600 mb-8">{error}</p>
            <Link href="/events" className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Back to Events
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!event) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href={`/events/${eventId}`} 
              className="text-slate-500 hover:text-slate-700 transition-colors mr-2"
            >
              ← Back to Event
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Edit Event</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Update your event details. Changes will be visible to all participants.
          </p>
        </div>

        {/* Event Edit Form */}
        <EventEditForm event={event} eventId={eventId!} />
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