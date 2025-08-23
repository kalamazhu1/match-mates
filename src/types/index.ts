export interface User {
  id: string;
  email: string;
  name: string;
  ntrp_level: string;
  phone?: string;
  glicko_rating: number;
  glicko_rd: number;
  glicko_volatility: number;
  glicko_last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'tournament' | 'league' | 'social' | 'ladder';
  format: 'single_elimination' | 'round_robin' | 'league_play' | 'social_play';
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

export interface Match {
  id: string;
  event_id: string;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  loser_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  player1_sets_won: number;
  player2_sets_won: number;
  player1_games_won: number;
  player2_games_won: number;
  set_scores: Array<{
    player1_games: number;
    player2_games: number;
  }>;
  match_type: 'ladder_challenge' | 'casual' | 'practice';
  notes?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}