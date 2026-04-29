CREATE TABLE scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bio_age INTEGER,
  difference INTEGER,
  biomarkers JSONB,
  resumen_alicia TEXT,
  recomendaciones JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scans" ON scans FOR ALL USING (auth.uid() = user_id);
