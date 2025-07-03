-- Create contact_messages table for support/contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unread',
    replied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all contact messages
CREATE POLICY "Admins can view all contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create policy for admins to update contact messages (mark as read/replied)
CREATE POLICY "Admins can update contact messages" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create policy to allow anyone to insert contact messages (for public form)
CREATE POLICY "Anyone can submit contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_messages_updated_at
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at(); 