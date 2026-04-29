-- Esquema alineado con registro (auth.ts), onboarding y coach.
-- id, full_name, name, chronological_age, gender, primary_goal, stress_level, updated_at (+ extras)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  name TEXT,
  chronological_age INTEGER,
  gender TEXT,
  primary_goal TEXT,
  goals TEXT,
  stress_level INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  streak_days INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_scans INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
