'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FormSection } from '@/components/ui/FormSection'
import { createClient } from '@/lib/supabase/client'

interface SigninFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  submit?: string
}

export function SigninForm() {
  const [formData, setFormData] = useState<SigninFormData>({
    email: '',
    password: '',
    rememberMe: false
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SigninFormData, value: string | boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
        options: {
          // Remember me functionality - extend session if checked
          ...(formData.rememberMe && {
            // Set longer session duration for remember me
            // Supabase handles this automatically with persistSession: true (default)
          })
        }
      })

      if (authError) {
        // Handle different types of authentication errors
        if (authError.message.includes('Invalid login credentials')) {
          setErrors({ submit: 'Invalid email or password. Please try again.' })
        } else if (authError.message.includes('Email not confirmed')) {
          setErrors({ submit: 'Please check your email and click the confirmation link before signing in.' })
        } else if (authError.message.includes('Too many requests')) {
          setErrors({ submit: 'Too many login attempts. Please wait a moment before trying again.' })
        } else {
          setErrors({ submit: authError.message })
        }
        return
      }

      // Check if user profile exists
      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // Error other than "not found"
          console.error('Profile check error:', profileError)
          setErrors({ submit: 'Account verification failed. Please contact support.' })
          return
        }

        if (!profile) {
          // User exists in auth but not in users table - redirect to signup completion
          router.push('/auth/signup?step=profile')
          return
        }
      }

      // Successful login - redirect to intended page or dashboard
      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      router.push(redirectTo)
      router.refresh() // Refresh to update auth state

    } catch (error) {
      console.error('Signin error:', error)
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Sign In" description="Welcome back to Match Mates">
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          required
          placeholder="your.email@example.com"
          disabled={loading}
          autoComplete="email"
        />
        
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
          required
          placeholder="Enter your password"
          disabled={loading}
          autoComplete="current-password"
        />
      </FormSection>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="rememberMe"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
            disabled={loading}
          />
          <label htmlFor="rememberMe" className="text-sm text-slate-600">
            Remember me
          </label>
        </div>
        
        <div>
          <a 
            href="/auth/forgot-password" 
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Forgot your password?
          </a>
        </div>
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
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  )
}