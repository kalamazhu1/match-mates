import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Privacy Policy - Match Mates',
  description: 'Privacy policy and data handling practices for Match Mates tennis community',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Privacy Policy</h1>
          <p className="text-slate-600">Last updated: January 1, 2024</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 mb-6">
                Match Mates is committed to protecting your privacy and personal information.
              </p>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Information We Collect</h2>
              <p className="mb-4">We collect information you provide when you:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Create an account (name, email, phone, NTRP level)</li>
                <li>Register for events</li>
                <li>Make payments through our platform</li>
                <li>Contact our support team</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">Your information is used to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Create and manage your account</li>
                <li>Process event registrations and payments</li>
                <li>Match you with appropriate skill-level events</li>
                <li>Send important notifications about events</li>
                <li>Improve our platform and services</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Information Sharing</h2>
              <p className="mb-4">
                We do not sell your personal information. We may share limited information with:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Event organizers (name and contact info for registered events)</li>
                <li>Other participants in events you join (name and NTRP level)</li>
                <li>Payment processors (Stripe) for transaction processing</li>
                <li>Service providers who help operate our platform</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Data Security</h2>
              <p className="mb-4">
                We use industry-standard security measures to protect your information, including encryption for sensitive data and secure authentication through Supabase.
              </p>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request a copy of your data</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Contact Us</h2>
              <p className="mb-4">
                For privacy-related questions or requests, contact us at{' '}
                <a href="mailto:privacy@matchmates.tennis" className="text-orange-600 hover:text-orange-700">
                  privacy@matchmates.tennis
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