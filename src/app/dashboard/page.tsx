'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function DashboardContent() {
  const { user, profile } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {profile?.name || user?.email}!
          </h1>
          <p className="text-slate-600 mt-2">
            Your Match Mates Dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              {profile && (
                <>
                  <p><span className="font-medium">Name:</span> {profile.name}</p>
                  <p><span className="font-medium">NTRP Level:</span> {profile.ntrp_level}</p>
                  {profile.phone && (
                    <p><span className="font-medium">Phone:</span> {profile.phone}</p>
                  )}
                  <p><span className="font-medium">Member Since:</span> {new Date(profile.created_at).toLocaleDateString()}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/events/create')}>
                Create Event
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/events')}>
                Browse Events
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/profile')}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                No recent activity to show.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute 
      requireProfile={true}
      redirectTo="/auth/signin"
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </ProtectedRoute>
  )
}