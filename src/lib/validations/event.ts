import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  event_type: z.enum(['tournament', 'league', 'social']),
  format: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'league_play', 'social_play']),
  skill_level_min: z.enum(['3.0', '3.5', '4.0', '4.5', '5.0', '5.5']),
  skill_level_max: z.enum(['3.0', '3.5', '4.0', '4.5', '5.0', '5.5']),
  location: z.string().min(1, 'Location is required').max(200, 'Location must be less than 200 characters'),
  date_start: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed > new Date()
  }, 'Start date must be a valid future date'),
  date_end: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, 'End date must be a valid date'),
  registration_deadline: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed > new Date()
  }, 'Registration deadline must be a valid future date'),
  entry_fee: z.number().min(0, 'Entry fee cannot be negative').max(1000000, 'Entry fee is too high'), // in cents
  max_participants: z.number().min(2, 'Must allow at least 2 participants').max(128, 'Too many participants'),
  whatsapp_group: z.string().url('WhatsApp group must be a valid URL').optional().or(z.literal('')),
  telegram_group: z.string().url('Telegram group must be a valid URL').optional().or(z.literal(''))
}).refine((data) => {
  const startDate = new Date(data.date_start)
  const endDate = new Date(data.date_end)
  const regDeadline = new Date(data.registration_deadline)
  
  return endDate >= startDate
}, {
  message: 'End date must be after start date',
  path: ['date_end']
}).refine((data) => {
  const startDate = new Date(data.date_start)
  const regDeadline = new Date(data.registration_deadline)
  
  return regDeadline <= startDate
}, {
  message: 'Registration deadline must be before start date',
  path: ['registration_deadline']
}).refine((data) => {
  const minLevel = parseFloat(data.skill_level_min)
  const maxLevel = parseFloat(data.skill_level_max)
  
  return maxLevel >= minLevel
}, {
  message: 'Maximum skill level must be greater than or equal to minimum skill level',
  path: ['skill_level_max']
})

export type CreateEventInput = z.infer<typeof createEventSchema>