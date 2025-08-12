'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  name: string
  ntrp_level: string
  phone: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Use a ref to track active fetch promises to prevent duplicates
  const activeFetches = useRef<Map<string, Promise<void>>>(new Map())

  const fetchProfile = useCallback(async (userId: string) => {
    // Check if there's already an active fetch for this user
    const existingFetch = activeFetches.current.get(userId)
    if (existingFetch) {
      console.log('⏳ Profile fetch already in progress, waiting for completion...')
      return existingFetch
    }

    // Create the fetch promise with timeout
    const fetchPromise = (async () => {
      try {
        console.log('Fetching profile for user:', userId)
        console.log('Current auth state:', { 
          hasSession: !!session, 
          sessionUserId: session?.user?.id,
          requestedUserId: userId,
          idsMatch: session?.user?.id === userId 
        })
        
        // Verify we have an active session before querying
        if (!session?.user || session.user.id !== userId) {
          console.log('⚠️ No valid session or user ID mismatch - skipping profile fetch')
          setProfile(null)
          return
        }
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.log('Profile fetch error:', error.message, error.code)
          if (error.code === 'PGRST116') {
            console.log('✅ User profile not found - this is normal for new users')
          } else if (error.code === 'PGRST301') {
            console.log('⚠️ RLS policy blocked access - check authentication')
          } else {
            console.error('Database error fetching profile:', error)
          }
          setProfile(null)
          return
        }

        console.log('✅ Profile fetched successfully:', data?.name || data?.email)
        setProfile(data)
        
      } catch (error) {
        console.error('Profile fetch error:', error)
        setProfile(null)
      } finally {
        // Clean up the active fetch
        activeFetches.current.delete(userId)
      }
    })()

    // Store the promise to prevent duplicates
    activeFetches.current.set(userId, fetchPromise)
    return fetchPromise
  }, [supabase, session])

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Initial session error:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        // Don't show loading spinner for token refreshes and minor events
        if (['TOKEN_REFRESHED'].includes(event)) {
          // Just update the session without loading states
          setSession(session)
          setUser(session?.user ?? null)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        // Only set loading to false for significant events
        if (['SIGNED_IN', 'SIGNED_OUT', 'INITIAL_SESSION'].includes(event)) {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}