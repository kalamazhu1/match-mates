import { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Sign Up - Match Mates',
  description: 'Create your Match Mates account to join tennis events in San Francisco',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Join Match Mates</h1>
          <p className="text-slate-600">Connect with tennis players in San Francisco</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Create Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-orange-600 hover:text-orange-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}