'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

interface QuickRegisterButtonProps {
  eventId: string
  eventTitle: string
  userRegistration: any | null
  canRegister: boolean
  registrationEligibility: {
    eligible: boolean
    reason: string
  }
  onRegistrationChange?: () => void
}

export function QuickRegisterButton({
  eventId,
  eventTitle,
  userRegistration,
  canRegister,
  registrationEligibility,
  onRegistrationChange
}: QuickRegisterButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleRegister = async () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    if (!canRegister) {
      // Show detailed reason in alert for now, could be improved with a modal
      alert(registrationEligibility.reason || 'Registration not available')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Any additional registration data can be added here
        })
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        throw new Error('Server returned invalid response')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      // Silently update - no alert needed
      if (onRegistrationChange) {
        onRegistrationChange()
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert(error instanceof Error ? error.message : 'Failed to register')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnregister = async () => {
    if (!userRegistration) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        console.error('Response status:', response.status)
        console.error('Response text:', await response.text().catch(() => 'Could not read response text'))
        throw new Error('Server returned invalid response')
      }

      console.log('Delete response:', { status: response.status, data })
      console.log('Full response data:', JSON.stringify(data, null, 2))

      if (!response.ok) {
        console.error('Delete failed:', data)
        throw new Error(data.error || `Failed to unregister (${response.status})`)
      }

      // Silently update - no alert needed
      if (onRegistrationChange) {
        onRegistrationChange()
      }
    } catch (error) {
      console.error('Unregistration error:', error)
      // Still show error alerts since users need to know if something went wrong
      alert(error instanceof Error ? error.message : 'Failed to unregister')
    } finally {
      setIsLoading(false)
    }
  }

  // If user is not logged in
  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/auth/signin')}
        className="w-full"
      >
        Sign In to Register
      </Button>
    )
  }

  // If user is already registered
  if (userRegistration) {
    const statusText = userRegistration.status === 'approved' ? 'Registered' : 
                     userRegistration.status === 'pending' ? 'Pending' : 'Registered'
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnregister}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : `${statusText} - Click to Unregister`}
      </Button>
    )
  }

  // If user can register
  if (canRegister) {
    return (
      <Button
        size="sm"
        onClick={handleRegister}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {isLoading ? 'Registering...' : 'Register Now'}
      </Button>
    )
  }

  // If user cannot register (show reason)
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      className="w-full cursor-not-allowed"
      title={registrationEligibility.reason}
    >
      Cannot Register
    </Button>
  )
}