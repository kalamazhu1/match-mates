'use client';

import { useState } from 'react'
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
import { CreateEventInput, createEventSchema } from '@/lib/validations/event'
import { ZodError } from 'zod'

interface FormErrors {
  [key: string]: string
}

interface FormState {
  title: string
  description: string
  event_type: 'tournament' | 'league' | 'social' | ''
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'league_play' | 'social_play' | ''
  skill_level_min: '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | '5.5' | ''
  skill_level_max: '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | '5.5' | ''
  location: string
  date_start: string
  date_end: string
  registration_deadline: string
  entry_fee: string // Keep as string for input handling
  max_participants: string // Keep as string for input handling
  whatsapp_group: string
  telegram_group: string
}

const initialFormState: FormState = {
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
  entry_fee: '0',
  max_participants: '16',
  whatsapp_group: '',
  telegram_group: ''
}

export default function EventCreationForm() {
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    try {
      // Convert form data to match validation schema
      const validationData: CreateEventInput = {
        ...formData,
        entry_fee: parseInt(formData.entry_fee) * 100, // Convert to cents
        max_participants: parseInt(formData.max_participants),
        event_type: formData.event_type as CreateEventInput['event_type'],
        format: formData.format as CreateEventInput['format'],
        skill_level_min: formData.skill_level_min as CreateEventInput['skill_level_min'],
        skill_level_max: formData.skill_level_max as CreateEventInput['skill_level_max']
      }

      createEventSchema.parse(validationData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const formErrors: FormErrors = {}
        error.issues.forEach(issue => {
          const field = issue.path[0] as string
          formErrors[field] = issue.message
        })
        setErrors(formErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Convert form data for API submission
      const submitData: CreateEventInput = {
        ...formData,
        entry_fee: parseInt(formData.entry_fee) * 100, // Convert to cents
        max_participants: parseInt(formData.max_participants),
        event_type: formData.event_type as CreateEventInput['event_type'],
        format: formData.format as CreateEventInput['format'],
        skill_level_min: formData.skill_level_min as CreateEventInput['skill_level_min'],
        skill_level_max: formData.skill_level_max as CreateEventInput['skill_level_max']
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          // Handle validation errors from API
          const apiErrors: FormErrors = {}
          data.details.forEach((issue: { path: string[]; message: string }) => {
            const field = issue.path[0] as string
            apiErrors[field] = issue.message
          })
          setErrors(apiErrors)
        } else {
          setErrors({ general: data.error || 'Failed to create event' })
        }
        return
      }

      // Success - redirect to event page or dashboard
      router.push(`/events/${data.event.id}`)
    } catch {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection title="Event Details" description="Tell players what your event is about">
            <Input
              label="Event Title"
              required
              placeholder="e.g., Golden Gate Park Singles Tournament"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
            />
            
            <Textarea
              label="Description"
              placeholder="Describe your event, rules, and what players can expect..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={errors.description}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <MatchMatesSelect
                type="eventType"
                label="Event Type"
                required
                placeholder="Select event type"
                value={formData.event_type}
                onChange={(e) => handleInputChange('event_type', e.target.value)}
                error={errors.event_type}
              />

              <MatchMatesSelect
                type="format"
                label="Tournament Format"
                required
                placeholder="Select format"
                value={formData.format}
                onChange={(e) => handleInputChange('format', e.target.value)}
                error={errors.format}
              />
            </div>
          </FormSection>
        </CardContent>
      </Card>

      {/* Skill Level & Participation */}
      <Card>
        <CardHeader>
          <CardTitle>Player Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection title="Skill Level" description="Set NTRP requirements for your event">
            <div className="grid md:grid-cols-2 gap-4">
              <MatchMatesSelect
                type="ntrp"
                label="Minimum Skill Level"
                required
                placeholder="Select minimum NTRP"
                value={formData.skill_level_min}
                onChange={(e) => handleInputChange('skill_level_min', e.target.value)}
                error={errors.skill_level_min}
              />

              <MatchMatesSelect
                type="ntrp"
                label="Maximum Skill Level"
                required
                placeholder="Select maximum NTRP"
                value={formData.skill_level_max}
                onChange={(e) => handleInputChange('skill_level_max', e.target.value)}
                error={errors.skill_level_max}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Entry Fee ($)"
                type="number"
                min="0"
                max="1000"
                step="1"
                placeholder="0"
                value={formData.entry_fee}
                onChange={(e) => handleInputChange('entry_fee', e.target.value)}
                error={errors.entry_fee}
              />

              <Input
                label="Maximum Participants"
                type="number"
                min="2"
                max="128"
                required
                placeholder="16"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', e.target.value)}
                error={errors.max_participants}
              />
            </div>
          </FormSection>
        </CardContent>
      </Card>

      {/* Schedule & Location */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule & Location</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection title="When & Where" description="Set your event schedule and location">
            <MatchMatesSelect
              type="location"
              label="Location"
              required
              placeholder="Select tennis court location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              error={errors.location}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <DateTimeInput
                type="datetime-local"
                label="Event Start"
                required
                value={formData.date_start}
                onChange={(e) => handleInputChange('date_start', e.target.value)}
                error={errors.date_start}
              />

              <DateTimeInput
                type="datetime-local"
                label="Event End"
                required
                value={formData.date_end}
                onChange={(e) => handleInputChange('date_end', e.target.value)}
                error={errors.date_end}
              />
            </div>

            <DateTimeInput
              type="datetime-local"
              label="Registration Deadline"
              required
              value={formData.registration_deadline}
              onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
              error={errors.registration_deadline}
            />
          </FormSection>
        </CardContent>
      </Card>

      {/* Communication (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Player Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSection 
            title="Group Chat (Optional)" 
            description="Add WhatsApp or Telegram groups for participants"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="WhatsApp Group Link"
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={formData.whatsapp_group}
                onChange={(e) => handleInputChange('whatsapp_group', e.target.value)}
                error={errors.whatsapp_group}
              />

              <Input
                label="Telegram Group Link"
                type="url"
                placeholder="https://t.me/..."
                value={formData.telegram_group}
                onChange={(e) => handleInputChange('telegram_group', e.target.value)}
                error={errors.telegram_group}
              />
            </div>
          </FormSection>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}