CREATE TABLE IF NOT EXISTS ads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('above_date', 'article_middle', 'article_end', 'after_recent')),
  html_code TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ads" ON ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage ads" ON ads FOR ALL USING (
  public.get_user_role(auth.uid()) = 'admin'
);