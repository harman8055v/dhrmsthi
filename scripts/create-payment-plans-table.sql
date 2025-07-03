-- Create payment_plans table for premium subscriptions
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- price in INR
  duration_days INTEGER NOT NULL,
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_payment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_plans_updated
BEFORE UPDATE ON payment_plans
FOR EACH ROW EXECUTE FUNCTION update_payment_plans_updated_at();
