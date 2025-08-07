'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface UseRequireAuthOptions {
  redirectTo?: string
  requireProfile?: boolean
  requireAdmin?: boolean
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { 
    redirectTo = '/auth/signin',
    requireProfile = true,
    requireAdmin = false
  } = options
  
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (loading || isRedirecting) return

    if (!user) {
      // User not authenticated, redirect to sign in with return URL
      setIsRedirecting(true)
      const currentUrl = window.location.pathname + window.location.search
      const signInUrl = `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}redirectTo=${encodeURIComponent(currentUrl)}`
      router.push(signInUrl)
      return
    }

    if (requireProfile && !profile) {
      // User authenticated but no profile, redirect to complete signup
      setIsRedirecting(true)
      router.push('/auth/signup?step=profile')
      return
    }

    // TODO: Add admin check when user roles are implemented
    if (requireAdmin && profile) {
      // User roles not yet implemented, temporarily allow all authenticated users
      // if (!profile.is_admin) {
      //   setIsRedirecting(true)
      //   router.push('/dashboard?error=unauthorized')
      //   return
      // }
    }

    // Reset redirecting state if all checks pass
    if (isRedirecting) {
      setIsRedirecting(false)
    }
  }, [user, profile, loading, router, redirectTo, requireProfile, requireAdmin, isRedirecting])

  return {
    user,
    profile,
    loading: loading || isRedirecting,
    isAuthenticated: !!user && (!requireProfile || !!profile),
    isRedirecting
  }
}

// Hook for checking authentication without automatic redirect
export function useAuthCheck() {
  const { user, profile, loading } = useAuth()
  
  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user && !!profile,
    isSignedIn: !!user
  }
}