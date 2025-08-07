import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Terms of Service - Match Mates',
  description: 'Terms and conditions for using Match Mates tennis community platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Terms of Service</h1>
          <p className="text-slate-600">Last updated: January 1, 2024</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 mb-6">
                Welcome to Match Mates! These terms govern your use of our tennis community platform.
              </p>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By creating an account or using Match Mates, you agree to be bound by these Terms of Service and our Privacy Policy.
              </p>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide accurate information during registration</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Behave respectfully toward other community members</li>
                <li>Follow all tennis facility rules and regulations</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Event Participation</h2>
              <p className="mb-4">
                When you register for events through Match Mates, you agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Show up on time and prepared to play</li>
                <li>Pay any required fees as specified</li>
                <li>Follow event-specific rules and guidelines</li>
                <li>Treat all participants with respect</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Payments and Refunds</h2>
              <p className="mb-4">
                Payment processing is handled securely through Stripe. Refund policies may vary by event and will be clearly stated during registration.
              </p>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Limitation of Liability</h2>
              <p className="mb-4">
                Match Mates is a platform that connects tennis players. We are not responsible for injuries, damages, or disputes that may occur during tennis activities.
              </p>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Contact Information</h2>
              <p className="mb-4">
                If you have questions about these terms, please contact us at{' '}
                <a href="mailto:legal@matchmates.tennis" className="text-orange-600 hover:text-orange-700">
                  legal@matchmates.tennis
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link href="/">
            <Button>
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}