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

export default function EventPage({ params }: EventPageProps) {
  const [eventData, setEventData] = useState<EventData | null>(null)
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