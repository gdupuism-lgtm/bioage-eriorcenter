-- Columnas que usa el registro (src/app/actions/auth.ts):
-- id (PK), full_name, name, chronological_age, gender, primary_goal, stress_level, updated_at
-- Ejecuta este script en Supabase → SQL Editor si falla el upsert del perfil.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chronological_age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stress_level INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
