'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Event } from '@/types'

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
  onEventUpdate: () => void
}

export function EventAdminActions({ event, onEventUpdate }: EventAdminActionsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
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
    
    if (event.status === 'open') {
      actions.push({ label: 'Close Registration', status: 'full', variant: 'outline' as const })
      actions.push({ label: 'Start Event', status: 'in_progress', variant: 'outline' as const })
    }
    
    if (event.status === 'full') {
      actions.push({ label: 'Reopen Registration', status: 'open', variant: 'outline' as const })
      actions.push({ label: 'Start Event', status: 'in_progress', variant: 'outline' as const })
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-orange-600">⚙️</span>
            Event Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">Current Status</div>
            <div className="font-medium text-slate-800 capitalize">
              {event.status.replace('_', ' ')}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-800">
                {event.registration_stats.approved_registrations}
              </div>
              <div className="text-xs text-green-600">Registered</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-lg font-bold text-yellow-800">
                {event.registration_stats.pending_registrations}
              </div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
          </div>

          {/* Status Change Dropdown */}
          <div className="space-y-2">
            <div className="text-sm text-slate-600 font-medium">Change Status</div>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              value={event.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
            >
              <option value="open">Open - Accepting Registrations</option>
              <option value="full">Full - Preparing Tournament Draws</option>
              <option value="in_progress">In Progress - Event Started</option>
              <option value="completed">Completed - Event Finished</option>
              <option value="cancelled">Cancelled - Event Cancelled</option>
            </select>
          </div>

          {/* Quick Status Actions */}
          {statusActions.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-slate-600 font-medium">Quick Actions</div>
              {statusActions.map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant}
                  size="sm"
                  className="w-full"
                  onClick={() => handleStatusChange(action.status)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Management Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push(`/events/${event.id}/manage`)}
            >
              📋 Manage Registrations
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
              ✏️ Edit Event Details
            </Button>
            
            {/* Delete Button */}
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ Delete Event
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-red-600 text-center">
                  Are you sure? This cannot be undone.
                </div>
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
        </CardContent>
      </Card>
    </div>
  )
}