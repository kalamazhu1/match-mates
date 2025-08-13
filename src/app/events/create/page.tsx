import type { Metadata } from 'next'
import Link from 'next/link'
import EventCreationForm from '@/components/events/EventCreationForm'
import { requireAuthWithProfile } from '@/lib/auth/server'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Create Tennis Event | Match Mates',
  description: 'Create a new tennis tournament, league, or social event in San Francisco. Organize matches for your skill level and connect with local players.',
}

export default async function CreateEventPage() {
  // This will redirect to sign in if not authenticated
  const { profile } = await requireAuthWithProfile('/auth/signin', '/events/create')
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href="/dashboard" 
              className="text-slate-500 hover:text-slate-700 transition-colors mr-2"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Create Tennis Event</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Hello {profile.name}! Organize a tournament, league, or social tennis event for the San Francisco community. 
            Fill out the details below to get started.
          </p>
        </div>

        {/* Event Creation Form */}
        <EventCreationForm />

        {/* Feature Preview Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Tournament Setup</h3>
            <p className="text-sm text-slate-600">
              Configure brackets, formats, and skill level requirements for competitive play.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Schedule Management</h3>
            <p className="text-sm text-slate-600">
              Set dates, times, and registration deadlines for your events.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Player Communication</h3>
            <p className="text-sm text-slate-600">
              Automatic WhatsApp or Telegram group creation for participants.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-sm">🎾</span>
              </div>
              <span className="text-lg font-semibold">Match Mates</span>
            </div>
            <p className="text-slate-400">
              © 2024 Match Mates. Connecting tennis players in San Francisco.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}