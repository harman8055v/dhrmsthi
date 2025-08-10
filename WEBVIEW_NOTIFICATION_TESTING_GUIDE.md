# WebView Notification System Testing Guide

## Overview
The WebView notification system is now fully implemented and ready for testing. This guide provides comprehensive testing procedures for all components.

## Quick Setup

### 1. Database Setup
Run the migration file in your Supabase SQL editor:
```sql
-- Copy and run the contents of database/migrations/notification_analytics.sql
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
pnpm dev
```

## Testing Components

### 1. NotificationTester Component
The `NotificationTester` component is automatically available when `NODE_ENV !== 'production'`.

**Location**: Built into `WebViewNotificationProvider`
**Access**: Appears as a floating test panel in development mode

**Available Tests**:
- **Social Notifications**: Message, Like, Super Like, Match, Profile View
- **Marketing Campaigns**: Seasonal promotions, feature launches
- **Engagement**: Daily reminders, tips, achievements
- **Monetization**: Subscription prompts, premium features
- **System**: General updates, critical alerts

### 2. WebView Bridge Testing

#### Manual Testing in Browser
Open browser developer console and test WebView bridge:

```javascript
// Test notification reception
window.ReactNativeWebView = {
  postMessage: (data) => console.log('Native received:', data)
};

// Simulate incoming notification
window.dispatchEvent(new MessageEvent('message', {
  data: JSON.stringify({
    type: 'notification',
    payload: {
      type: 'message',
      category: 'social',
      title: 'New Message',
      message: 'You have a new message from someone special!',
      data: { senderId: 'user123' }
    }
  })
}));
```

#### Testing with React Native App
1. **Mobile App Setup**: Point your React Native WebView to your local development server
2. **URL**: `http://YOUR_LOCAL_IP:3000` (not localhost)
3. **Message Passing**: Test bidirectional communication

### 3. Analytics Testing

#### Verify Analytics Tracking
Check Supabase `notification_analytics` table:

```sql
-- View recent analytics events
SELECT 
  event_type,
  notification_type,
  notification_category,
  properties,
  timestamp
FROM notification_analytics 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check conversion funnel
SELECT 
  notification_type,
  event_type,
  COUNT(*) as count
FROM notification_analytics 
GROUP BY notification_type, event_type
ORDER BY notification_type, event_type;
```

#### Test Analytics API
```bash
# Test analytics endpoint
curl -X POST http://localhost:3000/api/analytics/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "type": "received",
      "notificationType": "message",
      "category": "social",
      "userId": "test-user"
    }
  }'
```

### 4. Marketing Campaign Testing

#### Test Campaign API
```bash
# Get active campaigns
curl http://localhost:3000/api/marketing/campaigns

# Test promo code validation
curl -X POST http://localhost:3000/api/promo-codes \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DIWALI50",
    "userId": "test-user"
  }'
```

#### Campaign Flow Testing
1. **Trigger Campaign**: Use NotificationTester to trigger seasonal campaign
2. **Verify Display**: Check modal/banner appearance
3. **Test Actions**: Click CTA buttons and verify navigation
4. **Check Analytics**: Verify events are tracked in database

### 5. User Preferences Testing

#### Test Preferences API
```bash
# Get user preferences
curl http://localhost:3000/api/user/notification-preferences?userId=test-user

# Update preferences
curl -X POST http://localhost:3000/api/user/notification-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "preferences": {
      "marketing": {
        "promotions": false,
        "seasonal": true
      }
    }
  }'
```

## Testing Scenarios

### Scenario 1: New User Journey
1. **First Visit**: User opens app, sees welcome campaign
2. **Engagement**: User receives tips and guidance notifications
3. **Conversion**: User sees subscription promotion
4. **Tracking**: Verify all events are tracked in analytics

### Scenario 2: Marketing Campaign
1. **Campaign Trigger**: Seasonal campaign appears (Diwali, Valentine's)
2. **User Interaction**: User clicks CTA button
3. **Promo Code**: User applies promo code
4. **Conversion**: Verify discount application and usage tracking

### Scenario 3: Social Notifications
1. **Match Notification**: User receives match notification
2. **Navigation**: Taps notification, navigates to chat
3. **Analytics**: Verify click-through tracking
4. **Mobile Bridge**: Verify message passing to React Native

### Scenario 4: System Notifications
1. **Critical Alert**: System sends critical notification
2. **Display**: High-priority notification appears
3. **Acknowledgment**: User dismisses notification
4. **Tracking**: Verify interaction tracking

## Performance Testing

### 1. Memory Usage
Monitor for memory leaks in:
- Event listeners
- Campaign timers
- Analytics batching

### 2. Network Requests
Check for:
- Efficient API batching
- Proper error handling
- Retry mechanisms

### 3. Storage Management
Verify:
- localStorage cleanup
- Campaign frequency limits
- Analytics event batching

## Debugging Tools

### 1. Console Logging
Enable detailed logging:
```javascript
// In browser console
localStorage.setItem('webview-debug', 'true');
```

### 2. Network Tab
Monitor API calls:
- Analytics events
- Campaign fetching
- Promo code validation

### 3. Supabase Dashboard
Check real-time data:
- Table data updates
- Function execution logs
- RLS policy behavior

## Common Issues & Solutions

### Issue 1: Notifications Not Appearing
**Causes**:
- User preferences disabled
- Campaign frequency limits reached
- Quiet hours active

**Solutions**:
- Check user preferences
- Reset campaign counters
- Verify time-based rules

### Issue 2: WebView Bridge Not Working
**Causes**:
- Incorrect URL in React Native
- CORS issues
- Network connectivity

**Solutions**:
- Use local IP instead of localhost
- Configure CORS properly
- Check network accessibility

### Issue 3: Analytics Not Tracking
**Causes**:
- Database connection issues
- RLS policy restrictions
- Invalid event data

**Solutions**:
- Verify Supabase connection
- Check RLS policies
- Validate event schema

## Production Deployment

### 1. Environment Setup
- Set production environment variables
- Configure Supabase production database
- Set up proper CORS policies

### 2. Testing Checklist
- [ ] All notification types work
- [ ] WebView bridge communication works
- [ ] Analytics tracking is accurate
- [ ] Campaign system functions properly
- [ ] User preferences are respected
- [ ] Mobile app integration works
- [ ] Performance is acceptable

### 3. Monitoring
Set up monitoring for:
- Error rates
- Analytics event volume
- Campaign performance
- User engagement metrics

## Support

For additional help or bug reports:
1. Check the browser console for errors
2. Verify Supabase table data
3. Test with NotificationTester component
4. Review analytics tracking in database

The notification system is comprehensive and production-ready. Use this testing guide to ensure all components work correctly in your environment.
