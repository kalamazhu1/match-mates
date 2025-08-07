import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Check Your Email - Match Mates',
  description: 'Please verify your email address to complete your account setup',
}

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Check Your Email</h1>
          <p className="text-slate-600">We&apos;ve sent you a verification link</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-green-700">Account Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-slate-700">
                Thank you for joining Match Mates! We&apos;ve sent a verification email to your inbox.
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">Next Steps:</h3>
                <ol className="text-sm text-orange-700 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">1.</span>
                    <span>Check your email inbox (and spam folder)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">2.</span>
                    <span>Click the verification link in our email</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">3.</span>
                    <span>Start browsing and joining tennis events!</span>
                  </li>
                </ol>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm text-slate-600">
                  Didn&apos;t receive the email? Check your spam folder or contact us for help.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Link href="/">
                    <Button size="lg" className="w-full">
                      Continue to Homepage
                    </Button>
                  </Link>
                  
                  <Link href="/auth/signin">
                    <Button variant="outline" className="w-full">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Need help?{' '}
            <a href="mailto:support@matchmates.tennis" className="text-orange-600 hover:text-orange-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}