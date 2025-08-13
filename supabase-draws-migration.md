# Draws Table Migration Instructions

## To fix the draw generation error, you need to create the draws table in your Supabase database.

### Steps:
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL and execute it:

```sql
-- Draws table for tournament brackets
CREATE TABLE public.draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  bracket_data JSONB NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for draws
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- Event organizers can view draws for their events
CREATE POLICY "Event organizers can view draws for their events" ON public.draws
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = draws.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event organizers can create draws for their events
CREATE POLICY "Event organizers can create draws for their events" ON public.draws
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = draws.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event organizers can update draws for their events
CREATE POLICY "Event organizers can update draws for their events" ON public.draws
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = draws.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event organizers can delete draws for their events
CREATE POLICY "Event organizers can delete draws for their events" ON public.draws
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = draws.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON public.draws
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX idx_draws_event ON public.draws(event_id);
CREATE INDEX idx_draws_created_by ON public.draws(created_by);
```

After executing this SQL, the draw generation should work properly.