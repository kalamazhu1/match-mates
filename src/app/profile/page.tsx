'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function ProfileContent() {
  const { user, profile } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
          <p className="text-slate-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <p className="text-slate-900">{profile.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-slate-900">{user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      NTRP Level
                    </label>
                    <p className="text-slate-900">{profile.ntrp_level}</p>
                  </div>
                  
                  {profile.phone && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <p className="text-slate-900">{profile.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-slate-900">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </>
              )}
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notification Preferences
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="emailNotifications" className="text-sm text-slate-600">
                      Email notifications for events
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="smsNotifications"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                    />
                    <label htmlFor="smsNotifications" className="text-sm text-slate-600">
                      SMS notifications for match updates
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Privacy Settings
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="publicProfile"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="publicProfile" className="text-sm text-slate-600">
                      Make profile visible to other players
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="contactable"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="contactable" className="text-sm text-slate-600">
                      Allow other players to contact me
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full">
                  Save Preferences
                </Button>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
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
      <ProfileContent />
    </ProtectedRoute>
  )
}