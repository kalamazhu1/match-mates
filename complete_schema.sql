-- Complete Match Mates Database Schema
-- Copy this entire file and paste it into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ntrp_level TEXT NOT NULL CHECK (ntrp_level IN ('3.0', '3.5', '4.0', '4.5', '5.0', '5.5')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('tournament', 'league', 'social', 'ladder')),
  format TEXT NOT NULL CHECK (format IN ('single_elimination', 'round_robin', 'league_play', 'social_play')),
  skill_level_min TEXT NOT NULL CHECK (skill_level_min IN ('3.0', '3.5', '4.0', '4.5', '5.0', '5.5')),
  skill_level_max TEXT NOT NULL CHECK (skill_level_max IN ('3.0', '3.5', '4.0', '4.5', '5.0', '5.5')),
  location TEXT NOT NULL,
  date_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_end TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL,
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'full', 'in_progress', 'completed', 'cancelled')),
  whatsapp_group TEXT,
  telegram_group TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations table
CREATE TABLE public.registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_intent_id TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, event_id)
);

-- Payments table
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow event organizers to view participant profiles
CREATE POLICY "Event organizers can view participant profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.user_id = users.id
      AND e.organizer_id = auth.uid()
    )
  );

-- Events policies
CREATE POLICY "Anyone can view open events" ON public.events
  FOR SELECT USING (status IN ('open', 'full', 'in_progress', 'completed'));

CREATE POLICY "Organizers can manage their events" ON public.events
  FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Registrations policies
CREATE POLICY "Users can view their own registrations" ON public.registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view registrations for their events" ON public.registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create registrations" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON public.registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can update registrations for their events" ON public.registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view payments for their events" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = payments.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_date_start ON public.events(date_start);
CREATE INDEX idx_registrations_user ON public.registrations(user_id);
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_event ON public.payments(event_id);
CREATE INDEX idx_payments_stripe_id ON public.payments(stripe_payment_intent_id);
