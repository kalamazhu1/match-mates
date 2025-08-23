'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { RegistrationButton } from '@/components/events/RegistrationButton'
import { Event, Registration } from '@/types'

interface EventAdminActionsProps {
  event: Event & {
    registration_stats: {
      total_registrations: number
      approved_registrations: number
      pending_registrations: number
      spots_available: number
      is_full: boolean
      has_waitlist: boolean
    }
  }
  userRegistration?: Registration | null
  canRegister?: boolean
  registrationEligibility?: {
    eligible: boolean
    reason: string
  }
  onEventUpdate: () => void
}

export function EventAdminActions({ 
  event, 
  userRegistration, 
  canRegister, 
  registrationEligibility,
  onEventUpdate 
}: EventAdminActionsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasDraws, setHasDraws] = useState(false)
  const [checkingDraws, setCheckingDraws] = useState(true)

  // Check if draws exist for single elimination tournaments
  useEffect(() => {
    if (event.format === 'single_elimination') {
      checkForDraws()
    } else {
      setCheckingDraws(false)
    }
  }, [event.id, event.format])

  const checkForDraws = async () => {
    try {
      setCheckingDraws(true)
      const response = await fetch(`/api/events/${event.id}/draws`)
      if (response.ok) {
        const data = await response.json()
        setHasDraws(data.draws && data.draws.length > 0)
      }
    } catch (error) {
      console.error('Error checking draws:', error)
      setHasDraws(false)
    } finally {
      setCheckingDraws(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    // Prevent starting single elimination tournament without draws
    if (newStatus === 'in_progress' && event.format === 'single_elimination' && !hasDraws) {
      alert('Cannot start tournament! Please create tournament draws first.')
      return
    }
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update event status')
      }

      onEventUpdate()
    } catch (error) {
      console.error('Error updating event status:', error)
      alert('Failed to update event status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteEvent = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      router.push('/events?deleted=true')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    } finally {
      setIsUpdating(false)
      setShowDeleteConfirm(false)
    }
  }

  const getStatusActions = () => {
    const actions = []
    const canStartTournament = event.format !== 'single_elimination' || hasDraws
    
    if (event.status === 'open') {
      actions.push({ label: 'Close Registration', status: 'full', variant: 'outline' as const })
      actions.push({ 
        label: canStartTournament ? 'Start Event' : 'Start Event (Need Draws)', 
        status: 'in_progress', 
        variant: 'outline' as const,
        disabled: !canStartTournament
      })
    }
    
    if (event.status === 'full') {
      actions.push({ label: 'Reopen Registration', status: 'open', variant: 'outline' as const })
      actions.push({ 
        label: canStartTournament ? 'Start Event' : 'Start Event (Need Draws)', 
        status: 'in_progress', 
        variant: 'outline' as const,
        disabled: !canStartTournament
      })
    }
    
    if (event.status === 'in_progress') {
      actions.push({ label: 'Complete Event', status: 'completed', variant: 'outline' as const })
    }
    
    if (['open', 'full'].includes(event.status)) {
      actions.push({ label: 'Cancel Event', status: 'cancelled', variant: 'destructive' as const })
    }
    
    return actions
  }

  const statusActions = getStatusActions()

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-800">Event Management</div>
        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
          event.status === 'open' ? 'bg-green-100 text-green-800' :
          event.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          event.status === 'completed' ? 'bg-purple-100 text-purple-800' :
          'bg-slate-100 text-slate-800'
        }`}>
          {event.status.replace('_', ' ')}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-2 text-xs">
        <div className="flex-1 text-center p-2 bg-green-50 rounded">
          <div className="font-bold text-green-800">{event.registration_stats.approved_registrations}</div>
          <div className="text-green-600">Registered</div>
        </div>
        {event.registration_stats.pending_registrations > 0 && (
          <div className="flex-1 text-center p-2 bg-yellow-50 rounded">
            <div className="font-bold text-yellow-800">{event.registration_stats.pending_registrations}</div>
            <div className="text-yellow-600">Pending</div>
          </div>
        )}
      </div>

      {/* Tournament Draws Warning */}
      {event.format === 'single_elimination' && !hasDraws && !checkingDraws && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-1">⚠️</span>
            <span className="text-yellow-800">Tournament draws required before starting</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Primary Action Button */}
        {statusActions.length > 0 && (
          <Button
            variant={statusActions[0].variant}
            size="sm"
            className="w-full"
            onClick={() => handleStatusChange(statusActions[0].status)}
            disabled={isUpdating || statusActions[0].disabled}
          >
            {isUpdating ? 'Updating...' : statusActions[0].label}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/events/${event.id}/manage`)}
        >
          📋 Manage Registrations
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/events/${event.id}/email`)}
        >
          📧 Email Participants
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/events/${event.id}/whatsapp`)}
        >
          💬 WhatsApp Participants
        </Button>
        
        {event.format === 'single_elimination' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push(`/events/${event.id}/draws`)}
          >
            🏆 Tournament Draw
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/events/${event.id}/edit`)}
        >
          ✏️ Edit Event
        </Button>

        {/* Status Change Dropdown */}
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          value={event.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
        >
          <option value="open">Open</option>
          <option value="full">Full</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Delete Event
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-red-600 text-center">Delete permanently?</div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleDeleteEvent}
                disabled={isUpdating}
              >
                {isUpdating ? 'Deleting...' : 'Yes, Delete'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Registration Section */}
      <div className="pt-2 border-t border-slate-200">
        <RegistrationButton
          eventId={event.id}
          event={event}
          userRegistration={userRegistration || null}
          canRegister={canRegister || false}
          registrationEligibility={registrationEligibility || { eligible: false, reason: 'Unable to check eligibility' }}
          onRegistrationChange={onEventUpdate}
        />
      </div>
    </div>
  )
}