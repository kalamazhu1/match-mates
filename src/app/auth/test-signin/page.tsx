'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'

export default function TestSigninPage() {
  const { user, profile, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      alert('Sign out successful!')
    } catch (error) {
      console.error('Sign out error:', error)
      alert('Sign out failed: ' + (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-8">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">
          Authentication Test Page
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}
              </div>
              <div>
                <strong>Profile:</strong> {profile ? 'Loaded' : 'Not loaded'}
              </div>
              <div>
                <strong>Email:</strong> {user?.email || 'N/A'}
              </div>
            </div>

            {profile && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-2">Profile Details:</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {profile.name}</div>
                  <div><strong>NTRP Level:</strong> {profile.ntrp_level}</div>
                  <div><strong>Phone:</strong> {profile.phone || 'N/A'}</div>
                  <div><strong>Created:</strong> {new Date(profile.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!user ? (
                <>
                  <Link 
                    href="/auth/signin"
                    className="w-full inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl focus:ring-orange-500/20"
                  >
                    Go to Sign In
                  </Link>
                  <Link 
                    href="/auth/signup"
                    className="w-full inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base border-2 border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600 focus:ring-orange-500/20"
                  >
                    Go to Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl focus:ring-orange-500/20"
                  >
                    Go to Dashboard
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    Test Sign Out
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testing Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="signin-form" />
                <label htmlFor="signin-form">Sign in form loads correctly</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="validation" />
                <label htmlFor="validation">Form validation works (empty fields, invalid email)</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="signin-success" />
                <label htmlFor="signin-success">Successful sign in redirects to dashboard</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="error-handling" />
                <label htmlFor="error-handling">Invalid credentials show proper error</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="remember-me" />
                <label htmlFor="remember-me">Remember me checkbox functions</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="redirect-param" />
                <label htmlFor="redirect-param">Redirect parameter works (?redirectTo=/dashboard)</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="auth-state" />
                <label htmlFor="auth-state">Authentication state persists across page refreshes</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="signout" />
                <label htmlFor="signout">Sign out functionality works</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="protected-routes" />
                <label htmlFor="protected-routes">Protected routes redirect unauthenticated users</label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}