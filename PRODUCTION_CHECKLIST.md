# Production Checklist - Razorpay Payment System

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
- [ ] `RAZORPAY_KEY_ID` - Production key ID set
- [ ] `RAZORPAY_KEY_SECRET` - Production key secret set
- [ ] `RAZORPAY_WEBHOOK_SECRET` - Webhook secret set
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public key ID set

### 2. Database Migration
- [ ] Run `scripts/add-razorpay-subscription-id.sql` migration
- [ ] Verify `razorpay_subscription_id` column exists in `users` table
- [ ] Verify `razorpay_subscription_id` column exists in `transactions` table
- [ ] Verify indexes are created for performance

### 3. Razorpay Dashboard Configuration

#### Plans Created
- [ ] `plan_sparsh_monthly` - Sparsh Plan Monthly (₹399)
- [ ] `plan_sparsh_quarterly` - Sparsh Plan Quarterly (₹999)
- [ ] `plan_sangam_monthly` - Sangam Plan Monthly (₹699)
- [ ] `plan_sangam_quarterly` - Sangam Plan Quarterly (₹1,799)
- [ ] `plan_samarpan_monthly` - Samarpan Plan Monthly (₹1,299)
- [ ] `plan_samarpan_quarterly` - Samarpan Plan Quarterly (₹2,999)
- [ ] `plan_elite_monthly` - Elite Membership Monthly (₹49,000)
- [ ] `plan_elite_quarterly` - Elite Membership Quarterly (₹1,29,000)

#### Webhook Configuration
- [ ] Webhook URL: `https://yourdomain.com/api/payments/webhook`
- [ ] Events selected:
  - [ ] `subscription.activated`
  - [ ] `subscription.charged`
  - [ ] `subscription.halted`
  - [ ] `subscription.cancelled`
  - [ ] `subscription.completed`
- [ ] Webhook secret copied and added to environment variables

### 4. Code Verification
- [ ] Payment modal uses production plan IDs
- [ ] Webhook handler properly configured
- [ ] Payment processing handles both subscription and one-time payments
- [ ] Error handling implemented for all payment scenarios

## ✅ Testing Checklist

### 1. Plan Verification
```bash
# Run this command to verify all plans exist
node scripts/verify-production-plans.js
```

### 2. Payment Flow Testing
- [ ] Test subscription payment (monthly plan)
- [ ] Test subscription payment (quarterly plan)
- [ ] Test one-time payment (superlikes)
- [ ] Test one-time payment (highlights)
- [ ] Verify premium status activation
- [ ] Verify credits addition for one-time purchases

### 3. Webhook Testing
- [ ] Test webhook signature verification
- [ ] Test subscription activation webhook
- [ ] Test subscription charged webhook
- [ ] Test subscription cancellation webhook
- [ ] Verify user status updates correctly

### 4. Error Handling Testing
- [ ] Test with invalid plan ID
- [ ] Test with insufficient funds
- [ ] Test payment cancellation
- [ ] Test network failures
- [ ] Verify proper error messages displayed

## ✅ Production Monitoring

### 1. Logs to Monitor
- [ ] Payment API logs (`/api/payments/[action]/route.ts`)
- [ ] Webhook processing logs (`/api/payments/webhook/route.ts`)
- [ ] Payment processing logs (`/api/payments/process/route.ts`)
- [ ] Browser console logs for payment errors

### 2. Database Monitoring
- [ ] Monitor `transactions` table for payment records
- [ ] Monitor `users` table for premium status changes
- [ ] Check for failed webhook processing
- [ ] Monitor subscription ID tracking

### 3. Razorpay Dashboard Monitoring
- [ ] Monitor payment success rates
- [ ] Monitor webhook delivery status
- [ ] Check subscription lifecycle events
- [ ] Monitor refund requests

## ✅ Security Checklist

### 1. Environment Variables
- [ ] Production keys are not committed to version control
- [ ] Webhook secret is properly secured
- [ ] Keys are rotated regularly

### 2. Payment Security
- [ ] Signature verification implemented for all payments
- [ ] Webhook signature verification implemented
- [ ] Amount validation for one-time payments
- [ ] Plan ID validation for subscriptions

### 3. Data Protection
- [ ] Payment data is not logged in plain text
- [ ] Sensitive data is properly encrypted
- [ ] User consent for payment processing

## ✅ Performance Checklist

### 1. Database Performance
- [ ] Indexes created for `razorpay_subscription_id` columns
- [ ] Transaction queries optimized
- [ ] User queries optimized

### 2. API Performance
- [ ] Payment API response times acceptable
- [ ] Webhook processing doesn't block other requests
- [ ] Error handling doesn't cause timeouts

## ✅ Compliance Checklist

### 1. Legal Requirements
- [ ] Terms of service updated for payment processing
- [ ] Privacy policy updated for payment data
- [ ] Refund policy documented
- [ ] Cancellation policy documented

### 2. Financial Compliance
- [ ] GST compliance for Indian payments
- [ ] Proper invoice generation
- [ ] Tax reporting capabilities

## ✅ Documentation

### 1. User Documentation
- [ ] Payment flow documented for users
- [ ] FAQ section for common payment issues
- [ ] Support contact information

### 2. Technical Documentation
- [ ] API documentation updated
- [ ] Webhook documentation updated
- [ ] Troubleshooting guide updated

## 🚨 Emergency Procedures

### 1. Payment System Failure
- [ ] Disable payment functionality
- [ ] Notify users of temporary unavailability
- [ ] Contact Razorpay support if needed
- [ ] Monitor for any unauthorized charges

### 2. Webhook Failure
- [ ] Check webhook delivery status
- [ ] Manually process pending subscriptions
- [ ] Update user premium status manually if needed
- [ ] Investigate and fix webhook issues

### 3. Data Breach
- [ ] Immediately disable payment system
- [ ] Rotate all API keys
- [ ] Notify affected users
- [ ] Contact legal authorities if required

## 📞 Support Contacts

- **Razorpay Support**: [Razorpay Support Portal](https://razorpay.com/support/)
- **Technical Issues**: [Your Technical Support Contact]
- **Legal Issues**: [Your Legal Contact]

## 🔄 Regular Maintenance

### Weekly
- [ ] Review payment success rates
- [ ] Check webhook delivery status
- [ ] Monitor for unusual payment patterns

### Monthly
- [ ] Review and update security measures
- [ ] Check for API updates from Razorpay
- [ ] Review and optimize database queries

### Quarterly
- [ ] Rotate API keys
- [ ] Review and update documentation
- [ ] Conduct security audit

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Next Review**: [Next Review Date] 