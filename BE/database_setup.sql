-- Create chat_history table for storing conversation data
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_history_language ON chat_history(language);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can customize this based on your security needs)
CREATE POLICY "Allow all operations on chat_history" ON chat_history
    FOR ALL USING (true);

-- Grant permissions (adjust based on your Supabase configuration)
GRANT ALL ON chat_history TO anon, authenticated;
