export interface User {
  id: string;
  email: string;
  name: string;
  ntrp_level: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'tournament' | 'league' | 'social';
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'league_play' | 'social_play';
  skill_level_min: string;
  skill_level_max: string;
  location: string;
  date_start: string;
  date_end: string;
  registration_deadline: string;
  entry_fee: number;
  max_participants: number;
  organizer_id: string;
  status: 'draft' | 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  whatsapp_group?: string;
  telegram_group?: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_intent_id?: string;
  registered_at: string;
  approved_at?: string;
  paid_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  event_id: string;
  registration_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
}