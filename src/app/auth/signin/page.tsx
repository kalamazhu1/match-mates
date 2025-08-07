import { Metadata } from 'next'
import { Suspense } from 'react'
import { SigninForm } from '@/components/auth/SigninForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Sign In - Match Mates',
  description: 'Sign in to your Match Mates account to join tennis events in San Francisco',
}

function SigninFormWrapper() {
  return <SigninForm />
}

export default function SigninPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your Match Mates account</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            }>
              <SigninFormWrapper />
            </Suspense>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account yet?{' '}
            <a href="/auth/signup" className="text-orange-600 hover:text-orange-700 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}