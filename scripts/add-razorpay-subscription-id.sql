-- Add razorpay_subscription_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_razorpay_subscription_id 
ON users(razorpay_subscription_id);

-- Add razorpay_subscription_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_subscription_id 
ON transactions(razorpay_subscription_id); 