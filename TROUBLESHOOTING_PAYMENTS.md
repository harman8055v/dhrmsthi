# Payment Troubleshooting Guide

## Current Status ✅

### 1. DataServiceError Import Error ✅
- **Issue**: `DataServiceError` was not exported from `@/lib/data-service`
- **Fix**: Added `export` keyword to the `DataServiceError` class

### 2. Payment API Validation Error ✅
- **Issue**: Subscription creation was trying to validate amount, but subscriptions don't need amount validation
- **Fix**: Moved amount validation to only apply to one-time payments

### 3. Plan ID Mapping Issue ✅
- **Issue**: Plan IDs were using test IDs
- **Fix**: Updated to use production plan IDs from Razorpay dashboard

## Production Setup

### Step 1: Verify Production Plans in Razorpay

1. **Ensure environment variables** are set in your `.env.local`:
```env
RAZORPAY_KEY_ID=your_production_key_id
RAZORPAY_KEY_SECRET=your_production_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_production_key_id
```

2. **Verify these production plans exist** in your Razorpay dashboard:
   - `plan_sparsh_monthly` - Sparsh Plan Monthly (₹399)
   - `plan_sparsh_quarterly` - Sparsh Plan Quarterly (₹999)
   - `plan_sangam_monthly` - Sangam Plan Monthly (₹699)
   - `plan_sangam_quarterly` - Sangam Plan Quarterly (₹1,799)
   - `plan_samarpan_monthly` - Samarpan Plan Monthly (₹1,299)
   - `plan_samarpan_quarterly` - Samarpan Plan Quarterly (₹2,999)
   - `plan_elite_monthly` - Elite Membership Monthly (₹49,000)
   - `plan_elite_quarterly` - Elite Membership Quarterly (₹1,29,000)

### Step 2: Test the Payment Flow

1. **Test One-time Payments** (Superlikes/Highlights):
   - These should work immediately as they don't require plan setup
   - Check browser console for debugging logs

2. **Test Subscription Payments** (Plans):
   - Try purchasing a plan with real production plans
   - Check browser console and server logs for debugging information

### Step 3: Check Debugging Logs

The following logs will help identify issues:

**Browser Console** (F12 → Console):
```
Getting plan ID for: [plan name]
Mapped to plan ID: [plan id]
Creating subscription with: {planId, planName, billingCycle, userId}
Subscription created: [subscription object]
```

**Server Logs** (Terminal where you run `npm run dev`):
```
Payment order request: {payment_type, amount, currency, receipt, notes}
Creating subscription with plan: [plan id]
Subscription created successfully: [subscription id]
```

## Common Issues and Solutions

### Issue: "Plan ID not found" or "Invalid plan ID"
**Solution**: 
1. Verify the plan exists in your Razorpay dashboard
2. Check that plan IDs match exactly with the mapping in `components/payment/payment-modal.tsx`
3. Ensure you're using production Razorpay keys, not test keys

### Issue: "Invalid amount" for subscriptions
**Solution**: ✅ Fixed - Amount validation now only applies to one-time payments

### Issue: "DataServiceError is not exported"
**Solution**: ✅ Fixed - Added export to DataServiceError class

### Issue: Webhook not working
**Solution**: 
1. Verify webhook URL is correct: `https://yourdomain.com/api/payments/webhook`
2. Check webhook secret in environment variables
3. Ensure webhook events are properly configured in Razorpay dashboard

### Issue: Cookies warning in logs
**Solution**: This is a Next.js 15 warning but doesn't affect functionality

## Production Plan ID Mapping

Current production mapping:
```javascript
const planMapping = {
  "Sparsh Plan (1 month)": "plan_sparsh_monthly",
  "Sparsh Plan (3 months)": "plan_sparsh_quarterly", 
  "Sangam Plan (1 month)": "plan_sangam_monthly",
  "Sangam Plan (3 months)": "plan_sangam_quarterly",
  "Samarpan Plan (1 month)": "plan_samarpan_monthly",
  "Samarpan Plan (3 months)": "plan_samarpan_quarterly",
  "Elite Membership (1 month)": "plan_elite_monthly",
  "Elite Membership (3 months)": "plan_elite_quarterly",
}
```

## Webhook Configuration

Ensure your webhook is configured in Razorpay dashboard with:
- **URL**: `https://yourdomain.com/api/payments/webhook`
- **Events**:
  - `subscription.activated`
  - `subscription.charged`
  - `subscription.halted`
  - `subscription.cancelled`
  - `subscription.completed`

## Next Steps

1. **Verify production plans** exist in Razorpay dashboard
2. **Test both payment types**:
   - One-time payments (superlikes, highlights)
   - Subscription payments (plans)
3. **Monitor webhook events** in production
4. **Test subscription lifecycle** (activation, renewal, cancellation)

## Support

If you encounter issues:
1. Check browser console for error messages
2. Check server logs for API errors
3. Verify Razorpay dashboard configuration
4. Ensure all environment variables are set correctly 