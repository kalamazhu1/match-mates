-- Add RLS policy to allow event organizers to view user profiles of their event participants
CREATE POLICY "Event organizers can view participant profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.user_id = users.id
      AND e.organizer_id = auth.uid()
    )
  );