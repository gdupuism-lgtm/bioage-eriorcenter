CREATE TABLE notification_prefs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  onesignal_player_id TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  quiet_hours_start INTEGER DEFAULT 22,
  quiet_hours_end INTEGER DEFAULT 8,
  timezone TEXT DEFAULT 'America/Mexico_City',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notification prefs" ON notification_prefs FOR ALL USING (auth.uid() = user_id);
