'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Button, 
  Input, 
  Textarea, 
  DateTimeInput,
  MatchMatesSelect,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormSection
} from '@/components/ui'
import { CreateEventInput } from '@/lib/validations/event'
import { Event } from '@/types'

interface FormErrors {
  [key: string]: string
}

interface FormState {
  title: string
  description: string
  event_type: 'tournament' | 'league' | 'social' | 'ladder' | ''
  format: 'single_elimination' | 'round_robin' | 'league_play' | 'social_play' | ''
  skill_level_min: '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | '5.5' | ''
  skill_level_max: '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | '5.5' | ''
  location: string
  date_start: string
  date_end: string
  registration_deadline: string
  entry_fee: string
  max_participants: string
  whatsapp_group: string
  telegram_group: string
}

interface EventEditFormProps {
  event: Event
  eventId: string
}

export function EventEditForm({ event, eventId }: EventEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    event_type: '',
    format: '',
    skill_level_min: '',
    skill_level_max: '',
    location: '',
    date_start: '',
    date_end: '',
    registration_deadline: '',
    entry_fee: '',
    max_participants: '',
    whatsapp_group: '',
    telegram_group: ''
  })

  // Initialize form with event data
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || '',
        format: event.format || '',
        skill_level_min: (event.skill_level_min || '') as any,
        skill_level_max: (event.skill_level_max || '') as any,
        location: event.location || '',
        date_start: event.date_start ? new Date(event.date_start).toISOString().slice(0, 16) : '',
        date_end: event.date_end ? new Date(event.date_end).toISOString().slice(0, 16) : '',
        registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : '',
        entry_fee: event.entry_fee ? (event.entry_fee / 100).toString() : '0',
        max_participants: event.max_participants ? event.max_participants.toString() : '',
        whatsapp_group: event.whatsapp_group || '',
        telegram_group: event.telegram_group || ''
      })
    }
  }, [event])

  const handleInputChange = (field: keyof FormState, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    }
    
    // Auto-set format based on event type
    if (field === 'event_type') {
      if (value === 'tournament') {
        // For tournaments, keep current format if valid, otherwise clear it
        if (!['single_elimination', 'round_robin'].includes(formData.format)) {
          newFormData.format = ''
        }
      } else if (value === 'league') {
        newFormData.format = 'league_play'
      } else if (value === 'social' || value === 'ladder') {
        newFormData.format = 'social_play'
      }
    }
    
    setFormData(newFormData)
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Event title is required'
    if (!formData.description.trim()) newErrors.description = 'Event description is required'
    if (!formData.event_type) newErrors.event_type = 'Event type is required'
    if (formData.event_type === 'tournament' && !formData.format) newErrors.format = 'Tournament format is required'
    if (!formData.skill_level_min) newErrors.skill_level_min = 'Minimum skill level is required'
    if (!formData.skill_level_max) newErrors.skill_level_max = 'Maximum skill level is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.date_start) newErrors.date_start = 'Start date is required'
    if (!formData.date_end) newErrors.date_end = 'End date is required'
    if (!formData.registration_deadline) newErrors.registration_deadline = 'Registration deadline is required'
    if (!formData.max_participants) newErrors.max_participants = 'Maximum participants is required'

    // Validate skill level range
    if (formData.skill_level_min && formData.skill_level_max) {
      if (parseFloat(formData.skill_level_min) > parseFloat(formData.skill_level_max)) {
        newErrors.skill_level_max = 'Maximum skill level must be greater than or equal to minimum'
      }
    }

    // Validate dates
    if (formData.date_start && formData.date_end) {
      if (new Date(formData.date_start) > new Date(formData.date_end)) {
        newErrors.date_end = 'End date must be after start date'
      }
    }

    if (formData.registration_deadline && formData.date_start) {
      if (new Date(formData.registration_deadline) > new Date(formData.date_start)) {
        newErrors.registration_deadline = 'Registration deadline must be before event start'
      }
    }

    // Validate entry fee
    if (formData.entry_fee && isNaN(parseFloat(formData.entry_fee))) {
      newErrors.entry_fee = 'Entry fee must be a valid number'
    }

    // Validate max participants
    if (formData.max_participants && (isNaN(parseInt(formData.max_participants)) || parseInt(formData.max_participants) < 2)) {
      newErrors.max_participants = 'Must have at least 2 participants'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare the data for submission
      const submitData: Partial<CreateEventInput> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_type: formData.event_type as CreateEventInput['event_type'],
        format: formData.format as CreateEventInput['format'],
        skill_level_min: formData.skill_level_min as CreateEventInput['skill_level_min'],
        skill_level_max: formData.skill_level_max as CreateEventInput['skill_level_max'],
        location: formData.location.trim(),
        date_start: new Date(formData.date_start).toISOString(),
        date_end: new Date(formData.date_end).toISOString(),
        registration_deadline: new Date(formData.registration_deadline).toISOString(),
        entry_fee: Math.round(parseFloat(formData.entry_fee || '0') * 100), // Convert to cents
        max_participants: parseInt(formData.max_participants),
        whatsapp_group: formData.whatsapp_group.trim() || undefined,
        telegram_group: formData.telegram_group.trim() || undefined,
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          // Handle validation errors from Zod
          const validationErrors: FormErrors = {}
          result.details.forEach((error: any) => {
            if (error.path && error.path.length > 0) {
              validationErrors[error.path[0]] = error.message
            }
          })
          setErrors(validationErrors)
        } else {
          setErrors({ submit: result.error || 'Failed to update event' })
        }
        return
      }

      // Success! Redirect to the event page
      router.push(`/events/${eventId}?updated=true`)

    } catch (error) {
      console.error('Event update error:', error)
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const eventTypeOptions = [
    { value: 'tournament', label: 'Tournament' },
    { value: 'league', label: 'League' },
    { value: 'social', label: 'Social Play' }
  ]

  const tournamentFormatOptions = [
    { value: 'single_elimination', label: 'Single Elimination' },
    { value: 'round_robin', label: 'Round Robin' }
  ]

  const skillLevelOptions = [
    { value: '3.0', label: '3.0 NTRP' },
    { value: '3.5', label: '3.5 NTRP' },
    { value: '4.0', label: '4.0 NTRP' },
    { value: '4.5', label: '4.5 NTRP' },
    { value: '5.0', label: '5.0 NTRP' },
    { value: '5.5', label: '5.5 NTRP' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection title="" className="space-y-6">
            <Input
              label="Event Title"
              placeholder="e.g., SF Summer Tennis Tournament"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
              required
            />

            <Textarea
              label="Description"
              placeholder="Describe your event, including rules, prizes, and what players can expect..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={errors.description}
              rows={4}
              required
            />

            <div className="grid md:grid-cols-2 gap-6">
              <MatchMatesSelect
                label="Event Type"
                type="eventType"
                value={formData.event_type}
                onChange={(e) => handleInputChange('event_type', e.target.value)}
                error={errors.event_type}
                required
              />

              {formData.event_type === 'tournament' && (
                <MatchMatesSelect
                  label="Tournament Format"
                  type="tournamentFormat"
                  value={formData.format}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                  error={errors.format}
                  required
                />
              )}
            </div>
          </FormSection>
        </CardContent>
      </Card>

      {/* Skill Level & Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Level & Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection title="" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <MatchMatesSelect
                label="Minimum Skill Level"
                type="ntrp"
                value={formData.skill_level_min}
                onChange={(e) => handleInputChange('skill_level_min', e.target.value)}
                error={errors.skill_level_min}
                required
              />

              <MatchMatesSelect
                label="Maximum Skill Level"
                type="ntrp"
                value={formData.skill_level_max}
                onChange={(e) => handleInputChange('skill_level_max', e.target.value)}
                error={errors.skill_level_max}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Maximum Participants"
                type="number"
                min="2"
                max="128"
                placeholder="e.g., 16"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', e.target.value)}
                error={errors.max_participants}
                required
              />

              <Input
                label="Entry Fee (USD)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.entry_fee}
                onChange={(e) => handleInputChange('entry_fee', e.target.value)}
                error={errors.entry_fee}
              />
            </div>
          </FormSection>
        </CardContent>
      </Card>

      {/* Location & Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection title="" className="space-y-6">
            <Input
              label="Location"
              placeholder="e.g., Golden Gate Park Tennis Center, San Francisco"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              error={errors.location}
              required
            />

            <div className="grid md:grid-cols-2 gap-6">
              <DateTimeInput
                type="datetime-local"
                label="Event Start Date & Time"
                value={formData.date_start}
                onChange={(e) => handleInputChange('date_start', e.target.value)}
                error={errors.date_start}
                required
              />

              <DateTimeInput
                type="datetime-local"
                label="Event End Date & Time"
                value={formData.date_end}
                onChange={(e) => handleInputChange('date_end', e.target.value)}
                error={errors.date_end}
                required
              />
            </div>

            <DateTimeInput
              type="datetime-local"
              label="Registration Deadline"
              value={formData.registration_deadline}
              onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
              error={errors.registration_deadline}
              required
            />
          </FormSection>
        </CardContent>
      </Card>

      {/* Communication (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Groups (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection title="" className="space-y-6">
            <Input
              label="WhatsApp Group Invite Link"
              placeholder="https://chat.whatsapp.com/..."
              value={formData.whatsapp_group}
              onChange={(e) => handleInputChange('whatsapp_group', e.target.value)}
              error={errors.whatsapp_group}
            />

            <Input
              label="Telegram Group Invite Link"
              placeholder="https://t.me/..."
              value={formData.telegram_group}
              onChange={(e) => handleInputChange('telegram_group', e.target.value)}
              error={errors.telegram_group}
            />
          </FormSection>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Updating...' : 'Update Event'}
        </Button>
      </div>

      {/* Error Display */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}
    </form>
  )
}