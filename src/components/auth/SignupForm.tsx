'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MatchMatesSelect } from '@/components/ui/MatchMatesSelect'
import { FormSection } from '@/components/ui/FormSection'
import { createClient } from '@/lib/supabase/client'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string
  ntrp_level: string
  terms: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
  phone?: string
  ntrp_level?: string
  terms?: string
  submit?: string
}

export function SignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    ntrp_level: '',
    terms: false
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Phone validation (optional)
    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // NTRP level validation
    if (!formData.ntrp_level) {
      newErrors.ntrp_level = 'NTRP level is required'
    }

    // Terms validation
    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const createUserProfile = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: formData.email,
        name: formData.name.trim(),
        ntrp_level: formData.ntrp_level,
        phone: formData.phone.trim() || null
      }])

    if (error) {
      console.error('Error creating user profile:', error)
      throw new Error('Failed to create user profile')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Step 1: Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setErrors({ email: 'An account with this email already exists' })
        } else {
          setErrors({ submit: authError.message })
        }
        return
      }

      // Step 2: Create user profile if auth user was created
      if (authData.user && !authData.user.email_confirmed_at) {
        try {
          await createUserProfile(authData.user.id)
        } catch (profileError) {
          // If profile creation fails, we should clean up the auth user
          // But Supabase doesn't provide a way to delete users from client
          console.error('Profile creation failed:', profileError)
          setErrors({ 
            submit: 'Account created but profile setup failed. Please contact support.' 
          })
          return
        }
      }

      // Step 3: Redirect to success page
      router.push('/auth/signup/success')

    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Account Information" description="Create your login credentials">
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          required
          placeholder="your.email@example.com"
          disabled={loading}
        />
        
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
          required
          placeholder="Create a strong password"
          disabled={loading}
        />
        
        <Input
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          required
          placeholder="Confirm your password"
          disabled={loading}
        />
      </FormSection>

      <FormSection title="Personal Information" description="Tell us about yourself">
        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          required
          placeholder="Your full name"
          disabled={loading}
        />
        
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          error={errors.phone}
          placeholder="(555) 123-4567 (optional)"
          disabled={loading}
        />
      </FormSection>

      <FormSection title="Tennis Information" description="Help us match you with appropriate events">
        <MatchMatesSelect
          type="ntrp"
          label="NTRP Level"
          value={formData.ntrp_level}
          onChange={(e) => handleInputChange('ntrp_level', e.target.value)}
          error={errors.ntrp_level}
          required
          placeholder="Select your NTRP level"
          disabled={loading}
        />
      </FormSection>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="terms"
            checked={formData.terms}
            onChange={(e) => handleInputChange('terms', e.target.checked)}
            className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
            disabled={loading}
          />
          <label htmlFor="terms" className="text-sm text-slate-600 leading-5">
            I accept the{' '}
            <a href="/terms" className="text-orange-600 hover:text-orange-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-orange-600 hover:text-orange-700">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.terms && (
          <p className="text-sm text-red-600">{errors.terms}</p>
        )}
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}