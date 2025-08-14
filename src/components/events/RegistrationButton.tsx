'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { getRegistrationStatusMessage, canCancelRegistration } from '@/lib/validations/registration'
import Link from 'next/link'

interface RegistrationButtonProps {
  eventId: string
  event: any
  userRegistration: any
  canRegister: boolean
  registrationEligibility: {
    eligible: boolean
    reason: string
  }
  onRegistrationChange?: () => void
}

export function RegistrationButton({
  eventId,
  event,
  userRegistration,
  canRegister,
  registrationEligibility,
  onRegistrationChange
}: RegistrationButtonProps) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  const handleRegistration = async () => {
    if (!user) {
      setMessage('Please sign in to register for events')
      setMessageType('error')
      return
    }

    if (!canRegister) {
      setMessage(registrationEligibility.reason || 'Cannot register for this event')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      setMessage(data.message)
      setMessageType('success')
      
      if (onRegistrationChange) {
        onRegistrationChange()
      }

    } catch (error) {
      console.error('Registration error:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to register for event')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async () => {
    // Check if cancellation is allowed
    const { canCancel, reason } = canCancelRegistration(event.date_start, event.status)
    
    if (!canCancel) {
      setMessage(reason || 'Cannot cancel registration at this time')
      setMessageType('error')
      return
    }


    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel registration')
      }

      setMessage(data.message)
      setMessageType('success')
      
      if (onRegistrationChange) {
        onRegistrationChange()
      }

    } catch (error) {
      console.error('Cancellation error:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to cancel registration')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Not signed in
  if (!user) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/signin"
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-medium text-center"
          >
            Sign In to Register
          </Link>
          <Link
            href="/auth/signup"
            className="flex-1 border-2 border-orange-500 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 transition-all duration-300 font-medium text-center"
          >
            Create Account
          </Link>
        </div>
      </div>
    )
  }

  // User is already registered
  if (userRegistration) {
    const getStatusDisplay = () => {
      switch (userRegistration.status) {
        case 'approved':
          return (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Registration Confirmed
                    </h3>
                    <div className="mt-1 text-sm text-green-700">
                      <p>You are registered for this event!</p>
                      {event.entry_fee > 0 && userRegistration.payment_status === 'pending' && (
                        <p className="mt-1">Payment required: ${(event.entry_fee / 100).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {(() => {
                const { canCancel, reason } = canCancelRegistration(event.date_start, event.status)
                return (
                  <Button
                    variant="outline"
                    onClick={handleCancelRegistration}
                    disabled={loading || !canCancel}
                    className={`w-full ${
                      canCancel 
                        ? 'border-red-300 text-red-600 hover:bg-red-50' 
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    title={canCancel ? undefined : reason}
                  >
                    {loading ? 'Canceling...' : canCancel ? 'Cancel Registration' : 'Cannot Cancel'}
                  </Button>
                )
              })()}
            </div>
          )
        case 'pending':
          return (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      On Waitlist
                    </h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>You are on the waitlist for this event. You'll be notified if a spot opens up.</p>
                    </div>
                  </div>
                </div>
              </div>
              {(() => {
                const { canCancel, reason } = canCancelRegistration(event.date_start, event.status)
                return (
                  <Button
                    variant="outline"
                    onClick={handleCancelRegistration}
                    disabled={loading || !canCancel}
                    className={`w-full ${
                      canCancel 
                        ? 'border-red-300 text-red-600 hover:bg-red-50' 
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    title={canCancel ? undefined : reason}
                  >
                    {loading ? 'Removing...' : canCancel ? 'Leave Waitlist' : 'Cannot Leave'}
                  </Button>
                )
              })()}
            </div>
          )
        case 'cancelled':
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">❌</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Registration Cancelled
                  </h3>
                  <div className="mt-1 text-sm text-gray-700">
                    <p>You have cancelled your registration for this event.</p>
                  </div>
                </div>
              </div>
            </div>
          )
        default:
          return null
      }
    }

    return getStatusDisplay()
  }

  // User can register
  if (canRegister) {
    const spotsAvailable = event.registration_stats?.spots_available || 0
    const isWaitlistOnly = spotsAvailable === 0

    return (
      <div className="space-y-4">
        <Button
          onClick={handleRegistration}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg"
        >
          {loading 
            ? 'Registering...' 
            : isWaitlistOnly 
              ? 'Join Waitlist' 
              : 'Register Now'
          }
        </Button>
        
        {message && (
          <div className={`border rounded-lg p-3 ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : messageType === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        {isWaitlistOnly && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              This event is full. You can join the waitlist and will be notified if a spot becomes available.
            </p>
          </div>
        )}

        {event.entry_fee > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              Entry fee: ${(event.entry_fee / 100).toFixed(2)}
            </p>
          </div>
        )}
      </div>
    )
  }

  // User cannot register
  return (
    <div className="space-y-4">
      <Button
        disabled
        className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
      >
        Registration Not Available
      </Button>
      
      {message && (
        <div className={`border rounded-lg p-3 ${
          messageType === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : messageType === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}
      
      {registrationEligibility.reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">
            {registrationEligibility.reason}
          </p>
        </div>
      )}
    </div>
  )
}