-- Create transactions table to log payments
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES payment_plans(id),
  bundle_id UUID REFERENCES bundles(id),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'created',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS so users can only see their own transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_updated
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_transactions_updated_at();
