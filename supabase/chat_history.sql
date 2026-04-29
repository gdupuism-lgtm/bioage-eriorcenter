CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat" ON chat_history FOR ALL USING (auth.uid() = user_id);
