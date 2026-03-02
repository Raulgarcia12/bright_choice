-- ═══════════════════════════════════════════════════════════════
-- Migration: Add contact_requests table for demo / contact form
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert a contact request
CREATE POLICY "Anyone can insert contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can read contact requests
CREATE POLICY "Admins can read contact requests"
  ON contact_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update contact requests (e.g. change status)
CREATE POLICY "Admins can update contact requests"
  ON contact_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
