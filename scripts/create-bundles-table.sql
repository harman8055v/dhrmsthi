-- Create bundles table for purchasable items like Super Likes and Highlights
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('super_like', 'highlight')),
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL, -- price in INR
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bundles_updated
BEFORE UPDATE ON bundles
FOR EACH ROW EXECUTE FUNCTION update_bundles_updated_at();
