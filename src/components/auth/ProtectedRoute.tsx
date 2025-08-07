'use client'

import { useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useRequireAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireProfile?: boolean
  requireAdmin?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireProfile = true, 
  requireAdmin = false,
  redirectTo = '/auth/signin',
  fallback = <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, isRedirecting } = useRequireAuth({
    requireProfile,
    requireAdmin,
    redirectTo
  })

  // Show fallback while loading or redirecting
  if (loading || isRedirecting) {
    return <>{fallback}</>
  }

  // Only render children if authenticated and not redirecting
  if (isAuthenticated && !isRedirecting) {
    return <>{children}</>
  }

  // Return fallback for any other state
  return <>{fallback}</>
}