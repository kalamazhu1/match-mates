import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth(redirectTo: string = '/auth/signin', returnUrl?: string) {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    const url = new URL(redirectTo, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
    if (returnUrl) {
      url.searchParams.set('redirectTo', returnUrl)
    }
    redirect(url.toString())
  }
  
  return user
}

export async function getUserProfile(userId?: string) {
  const supabase = await createClient()
  const targetUserId = userId || (await getAuthenticatedUser())?.id
  
  if (!targetUserId) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', targetUserId)
    .single()

  if (error || !profile) {
    return null
  }

  return profile
}

export async function requireAuthWithProfile(redirectTo: string = '/auth/signin', returnUrl?: string) {
  const user = await requireAuth(redirectTo, returnUrl)
  const profile = await getUserProfile(user.id)
  
  if (!profile) {
    // User exists but no profile, redirect to complete signup
    redirect('/auth/signup?step=profile')
  }
  
  return { user, profile }
}

// Check if user can manage a specific event
export async function canManageEvent(eventId: string, userId?: string) {
  if (!userId) {
    const user = await getAuthenticatedUser()
    if (!user) return false
    userId = user.id
  }

  const supabase = await createClient()
  
  // Check if user is the event organizer
  const { data: event, error } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (error || !event) {
    return false
  }

  return event.organizer_id === userId
}