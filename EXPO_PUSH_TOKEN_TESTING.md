# Expo Push Token Integration - Testing Guide

## 🚀 Quick Setup

### 1. Run the SQL Migration
Execute the SQL file to create the push tokens table:
```sql
-- Run this in your Supabase SQL editor
\i database/expo-push-tokens.sql
```

### 2. API Endpoints Available

#### Save Push Token
```bash
POST /api/expo/save-token
```

#### Get User's Tokens
```bash
GET /api/expo/save-token
```

#### Delete Token
```bash
DELETE /api/expo/save-token?token=ExponentPushToken[...]
```

#### Send Notification
```bash
POST /api/expo/send
```

## 📱 Testing from React Native WebView

### 1. Register Push Token (From WebView)
```javascript
// In your React Native WebView app
import * as Notifications from 'expo-notifications';

// Get push token
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id'
});

// Send to WebView
window.postMessage({
  type: 'expo_push_token',
  token: token.data,
  platform: Platform.OS, // 'ios' or 'android'
  deviceName: Device.deviceName,
  appVersion: Application.nativeApplicationVersion
}, '*');
```

### 2. Test with Browser (Development)
```javascript
// Open browser console on dharmasaathi.com and run:
window.postMessage({
  type: 'expo_push_token',
  token: 'ExponentPushToken[test-token-here]',
  platform: 'web',
  deviceName: 'Chrome Browser',
  appVersion: '1.0.0'
}, '*');
```

## 🧪 API Testing with cURL

### 1. Save Token
```bash
curl -X POST https://dharmasaathi.com/api/expo/save-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "ExponentPushToken[YOUR_EXPO_TOKEN]",
    "platform": "ios",
    "deviceName": "iPhone 14 Pro",
    "appVersion": "1.0.0"
  }'
```

### 2. Get User Tokens
```bash
curl -X GET https://dharmasaathi.com/api/expo/save-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Send Notification
```bash
curl -X POST https://dharmasaathi.com/api/expo/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "USER_UUID_HERE",
    "title": "New Match! 💕",
    "body": "Someone spiritually compatible liked your profile",
    "data": {
      "type": "match",
      "matchId": "match-123",
      "route": "/dashboard/matches"
    }
  }'
```

### 4. Quick Test Notification (GET)
```bash
curl "https://dharmasaathi.com/api/expo/send?userId=USER_UUID&title=Test&body=Hello%20World" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 Verification Steps

### 1. Check Database
```sql
-- View all push tokens
SELECT user_id, platform, device_name, created_at, last_used_at 
FROM public.expo_push_tokens 
ORDER BY created_at DESC;

-- Check specific user's tokens
SELECT * FROM public.expo_push_tokens 
WHERE user_id = 'YOUR_USER_ID';
```

### 2. Browser Console Logs
- Open browser dev tools
- Check console for "Native bridge received message" logs
- Look for "Push token registered successfully" messages

### 3. Network Tab
- Monitor `/api/expo/save-token` requests
- Verify 200 responses with success: true

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid Expo push token format"**
   - Ensure token starts with `ExponentPushToken[` or `ExpoPushToken[`
   - Get token from Expo's `getExpoPushTokenAsync()`

2. **"Authorization header required"**
   - Include valid JWT token in Authorization header
   - Get token from Supabase auth session

3. **"No push tokens found for user"**
   - User hasn't registered any tokens yet
   - Check if tokens were saved correctly

4. **"Platform must be one of: ios, android, web"**
   - Use exact platform strings
   - Don't use custom platform names

### Debug Mode
```javascript
// Enable detailed logging (add to native-bridge.tsx)
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  console.log('Received message:', message);
  console.log('User authenticated:', !!user);
  console.log('Auth token available:', !!authToken);
}
```

## 📋 Integration Checklist

- [ ] SQL migration executed
- [ ] `NativeBridge` component added to layout
- [ ] WebView app sends push token messages
- [ ] API endpoints respond correctly
- [ ] Push tokens saved to database
- [ ] Notifications send successfully
- [ ] Deep linking configured (if needed)

## 🎯 Next Steps

1. **Add to Existing Notification System**
   - Integrate with swipe notifications
   - Add to message notifications
   - Include in match notifications

2. **Enhanced Features**
   - Notification preferences per platform
   - Rich notifications with images
   - Action buttons on notifications
   - Scheduled notifications

3. **Analytics**
   - Track notification delivery rates
   - Monitor token expiry/refresh
   - Measure engagement from notifications

## 📞 Support

If you encounter issues:
1. Check browser console logs
2. Verify database permissions
3. Test with simple cURL commands
4. Check Expo Push API documentation

The system is now ready for production use! 🎉
