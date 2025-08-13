import { z } from 'zod'

export const registrationValidationSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  userId: z.string().uuid('Invalid user ID')
})

export function validateSkillLevel(
  userLevel: string,
  minLevel: string,
  maxLevel: string
): { isValid: boolean; message?: string } {
  const user = parseFloat(userLevel)
  const min = parseFloat(minLevel)
  const max = parseFloat(maxLevel)

  if (isNaN(user) || isNaN(min) || isNaN(max)) {
    return {
      isValid: false,
      message: 'Invalid skill level format'
    }
  }

  if (user < min || user > max) {
    return {
      isValid: false,
      message: `Your skill level (${userLevel}) is not within the event requirements (${minLevel} - ${maxLevel})`
    }
  }

  return { isValid: true }
}

export function isRegistrationDeadlinePassed(deadline: string): boolean {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  return now > deadlineDate
}

export function canCancelRegistration(eventStartDate: string, eventStatus?: string): { canCancel: boolean; reason?: string } {
  // Check if tournament has started
  if (eventStatus === 'in_progress' || eventStatus === 'completed') {
    return {
      canCancel: false,
      reason: 'Cannot cancel registration after tournament has started'
    }
  }

  const now = new Date()
  const eventStart = new Date(eventStartDate)
  const cancellationDeadline = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000)
  
  if (now > cancellationDeadline) {
    return {
      canCancel: false,
      reason: 'Cancellation deadline has passed (24 hours before event)'
    }
  }

  return { canCancel: true }
}

export function getRegistrationStatusMessage(
  registration: any,
  event: any
): { message: string; type: 'success' | 'warning' | 'info' | 'error' } {
  switch (registration?.status) {
    case 'approved':
      if (event.entry_fee > 0 && registration.payment_status === 'pending') {
        return {
          message: `Registration confirmed! Payment required: $${(event.entry_fee / 100).toFixed(2)}`,
          type: 'warning'
        }
      }
      return {
        message: 'Registration confirmed! You are registered for this event.',
        type: 'success'
      }
    
    case 'pending':
      return {
        message: 'You are on the waitlist. You will be notified if a spot becomes available.',
        type: 'info'
      }
    
    case 'rejected':
      return {
        message: 'Your registration was not approved.',
        type: 'error'
      }
    
    case 'cancelled':
      return {
        message: 'You have cancelled your registration for this event.',
        type: 'info'
      }
    
    default:
      return {
        message: 'Unknown registration status.',
        type: 'info'
      }
  }
}