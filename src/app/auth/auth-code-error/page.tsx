import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Verification Error - Match Mates',
  description: 'There was an issue verifying your email address',
}

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Verification Failed</h1>
          <p className="text-slate-600">There was a problem verifying your email</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-red-700">Email Verification Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-slate-700">
                The verification link you clicked is either expired or invalid.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">What happened?</h3>
                <ul className="text-sm text-red-700 space-y-1 text-left">
                  <li>• The verification link may have expired</li>
                  <li>• The link may have been used already</li>
                  <li>• There was a technical issue processing your request</li>
                </ul>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm text-slate-600">
                  Please try signing up again or contact support if you continue having issues.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Link href="/auth/signup">
                    <Button size="lg" className="w-full">
                      Try Sign Up Again
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
            Still having trouble?{' '}
            <a href="mailto:support@matchmates.tennis" className="text-orange-600 hover:text-orange-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}