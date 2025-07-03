-- This script documents the Razorpay plan setup process
-- You need to create these plans in your Razorpay dashboard

/*
RAZORPAY PLAN SETUP INSTRUCTIONS:

1. Log into your Razorpay Dashboard
2. Go to Settings > Plans
3. Create the following plans with these exact IDs:

Plan ID: plan_sparsh_monthly
- Name: Sparsh Plan Monthly
- Amount: 39900 (₹399 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 1

Plan ID: plan_sparsh_quarterly
- Name: Sparsh Plan Quarterly  
- Amount: 99900 (₹999 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 3

Plan ID: plan_sangam_monthly
- Name: Sangam Plan Monthly
- Amount: 69900 (₹699 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 1

Plan ID: plan_sangam_quarterly
- Name: Sangam Plan Quarterly
- Amount: 179900 (₹1,799 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 3

Plan ID: plan_samarpan_monthly
- Name: Samarpan Plan Monthly
- Amount: 129900 (₹1,299 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 1

Plan ID: plan_samarpan_quarterly
- Name: Samarpan Plan Quarterly
- Amount: 299900 (₹2,999 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 3

Plan ID: plan_elite_monthly
- Name: Elite Membership Monthly
- Amount: 1990000 (₹19,900 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 1

Plan ID: plan_elite_quarterly
- Name: Elite Membership Quarterly
- Amount: 4490000 (₹44,900 in paise)
- Currency: INR
- Interval: monthly
- Interval Count: 3

WEBHOOK SETUP:
1. Go to Settings > Webhooks
2. Add webhook URL: https://yourdomain.com/api/payments/webhook
3. Select events:
   - subscription.activated
   - subscription.charged
   - subscription.halted
   - subscription.cancelled
   - subscription.completed
4. Copy the webhook secret and add it to your .env.local as RAZORPAY_WEBHOOK_SECRET

ENVIRONMENT VARIABLES:
Add these to your .env.local:
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
*/ 