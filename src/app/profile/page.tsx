'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function ProfileContent() {
  const { user, profile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    ntrp_level: '',
    email_notifications: true,
    sms_notifications: false
  })

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            ntrp_level: data.ntrp_level || '',
            email_notifications: data.email_notifications ?? true,
            sms_notifications: data.sms_notifications ?? false
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile')
      }
      
      setSaveMessage('Profile updated successfully!')
      setIsEditing(false)
      
      // Refresh the profile in auth context
      if (refreshProfile) {
        await refreshProfile()
      }
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveMessage('Failed to save profile. Please try again.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        ntrp_level: profile.ntrp_level || '',
        email_notifications: formData.email_notifications,
        sms_notifications: formData.sms_notifications
      })
    }
    setIsEditing(false)
    setSaveMessage('')
  }

  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return ''
    // Remove + and format as (123) 456-7890
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('1')) {
      const number = digits.slice(1)
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
    return phone
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

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
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personal Information
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-slate-500 text-sm">Email cannot be changed</p>
                    <p className="text-slate-900">{user?.email}</p>
                  </div>
                  
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="(123) 456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      NTRP Level
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      value={formData.ntrp_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, ntrp_level: e.target.value }))}
                    >
                      <option value="">Select NTRP Level</option>
                      <option value="1.0">1.0 - New Player</option>
                      <option value="1.5">1.5 - Beginner</option>
                      <option value="2.0">2.0 - Beginner+</option>
                      <option value="2.5">2.5 - Beginner/Intermediate</option>
                      <option value="3.0">3.0 - Intermediate</option>
                      <option value="3.5">3.5 - Intermediate+</option>
                      <option value="4.0">4.0 - Advanced Intermediate</option>
                      <option value="4.5">4.5 - Advanced</option>
                      <option value="5.0">5.0 - Advanced+</option>
                      <option value="5.5">5.5 - Teaching Professional</option>
                      <option value="6.0">6.0 - Professional</option>
                      <option value="6.5">6.5 - World Class</option>
                      <option value="7.0">7.0 - World Elite</option>
                    </select>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={handleSave}
                        disabled={saving || !formData.name.trim()}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <p className="text-slate-900">{formData.name || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-slate-900">{user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <p className="text-slate-900">
                      {formData.phone ? formatPhoneForDisplay(formData.phone) : 'Not provided'}
                    </p>
                    {!formData.phone && (
                      <p className="text-sm text-blue-600 mt-1">
                        💬 Add your phone number to receive WhatsApp notifications
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      NTRP Level
                    </label>
                    <p className="text-slate-900">{formData.ntrp_level || 'Not provided'}</p>
                  </div>
                  
                  {profile && (
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
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Communication Preferences
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                      checked={formData.email_notifications}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        email_notifications: e.target.checked 
                      }))}
                    />
                    <label htmlFor="emailNotifications" className="text-sm text-slate-700">
                      📧 Email notifications for events and updates
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="smsNotifications"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                      checked={formData.sms_notifications}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        sms_notifications: e.target.checked 
                      }))}
                    />
                    <label htmlFor="smsNotifications" className="text-sm text-slate-700">
                      💬 WhatsApp notifications for match updates
                    </label>
                  </div>
                  
                  {!formData.phone && formData.sms_notifications && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        ℹ️ Add your phone number above to receive WhatsApp notifications
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 space-y-3">
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                )}
                
                {saveMessage && (
                  <div className={`text-sm text-center p-3 rounded-lg ${
                    saveMessage.includes('successfully') 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {saveMessage}
                  </div>
                )}
                
                <Button variant="destructive" className="w-full" size="sm">
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