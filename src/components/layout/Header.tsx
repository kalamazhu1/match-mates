'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-slate-800">
              Match Mates
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-8 bg-slate-200 animate-pulse rounded"></div>
              <div className="w-20 h-8 bg-slate-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-slate-800">
            Match Mates
          </Link>
          
          <nav className="flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-800">
                  Dashboard
                </Link>
                <Link href="/events" className="text-slate-600 hover:text-slate-800">
                  Events
                </Link>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">
                    Welcome, {profile?.name || user.email}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/signin"
                  className="text-slate-600 hover:text-slate-800"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl focus:ring-orange-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}