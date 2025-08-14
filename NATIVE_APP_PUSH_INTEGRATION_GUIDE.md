# Push Notification Integration Summary for Native WebView App

*Created for Native App Development Team - August 14, 2025*

## 🎯 **Overview**

The **web app is fully configured** for push notifications. This document outlines what the native WebView app needs to implement to complete the integration.

---

## 📱 **What the Web App Expects from Native App**

### **1. Push Token Registration**
The native app must send push tokens to the web app via WebView message:

```javascript
// Required message format from React Native to WebView
window.postMessage({
  type: 'expo_push_token',
  payload: {
    token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    platform: 'android' // or 'ios'
  }
}, '*');
```

### **2. User Authentication State**
Tokens should be sent **after** user login/authentication in the WebView. The web app will:
- Queue tokens sent before login
- Save them automatically once user authenticates

---

## 🔧 **Web App Infrastructure (✅ UPDATED & COMPLETE)**

### **Database Schema**
```sql
-- expo_push_tokens table (ready in Supabase)
CREATE TABLE expo_push_tokens (
  user_id uuid REFERENCES auth.users(id),
  token text NOT NULL,
  platform text CHECK (platform IN ('ios','android','web')),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  PRIMARY KEY (user_id, token)
);
```

### **API Endpoints**
1. **`/api/expo/save-token`** - Receives tokens from native app
2. **`/api/expo/send`** - Sends notifications via Expo Push API  
3. **`/api/messages`** - Automatically triggers notifications on message send

### **WebView Bridge (✅ UPDATED)**
- **Component**: `app/native-bridge.tsx` (✅ updated for request-response pattern)
- **Listens for**: `expo_push_token` messages from native app
- **Sends**: `request_push_token` messages to native app
- **Handles**: Pre-auth token queuing, retry logic, and bidirectional communication

### **🔄 NEW: Request-Response Pattern**
The web app now implements the improved flow:
1. **User authenticates** → Web app sends `request_push_token` to native app
2. **Native app responds** → Sends `expo_push_token` with actual token
3. **Web app saves** → Token stored in database with user association

---

## 🔄 **Message Notification Flow**

When User A sends a message to User B:

```
1. User A sends message via web interface
   ↓
2. Web app saves message to database
   ↓
3. Web app automatically triggers push notification
   ↓
4. Gets User B's device tokens from expo_push_tokens table
   ↓
5. Sends notification via Expo Push API
   ↓
6. User B receives notification on all their devices
```

### **Notification Format**
```json
{
  "title": "💕 New message from Harman Batish",
  "body": "Hello! How are you today?",
  "sound": "default",
  "data": {
    "type": "message",
    "matchId": "abc123-def456",
    "senderId": "user-123",
    "route": "/dashboard/messages/abc123-def456"
  }
}
```

---

## 🚨 **What Native App Needs to Implement**

### **1. Expo Push Notifications Setup**
```json
// expo.json configuration required
{
  "expo": {
    "name": "DharmaSaathi",
    "projectId": "your-expo-project-id",
    "plugins": [
      ["expo-notifications"]
    ]
  }
}
```

### **2. Dependencies Required**
```json
// package.json
{
  "dependencies": {
    "expo-notifications": "~0.xx.x",
    "expo-device": "~5.x.x",
    "expo-constants": "~14.x.x"
  }
}
```

### **3. Permission Handling**
```javascript
// Request notification permissions
import * as Notifications from 'expo-notifications';

await Notifications.requestPermissionsAsync({
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
});
```

### **4. Token Registration Code**
```javascript
// Get and send token to WebView
import * as Notifications from 'expo-notifications';

const getAndSendPushToken = async () => {
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id'
    });
    
    // Send to WebView
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'expo_push_token',
      payload: {
        token: token,
        platform: Platform.OS
      }
    }));
  } catch (error) {
    console.error('Error getting push token:', error);
  }
};
```

### **5. Notification Handling**
```javascript
// Handle notification taps
Notifications.addNotificationResponseReceivedListener(response => {
  const { data } = response.notification.request.content;
  
  if (data.type === 'message' && data.route) {
    // Navigate to specific conversation
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'navigate',
      route: data.route
    }));
  }
});
```

---

## 🧪 **Testing & Debugging**

### **Check Token Registration**
```sql
-- Query to verify tokens are being saved
SELECT user_id, token, platform, updated_at 
FROM expo_push_tokens 
ORDER BY updated_at DESC;
```

### **Direct Expo API Test**
```bash
# Test with actual token from database
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '[{
    "to": "ExponentPushToken[your-token-here]",
    "title": "Test Notification",
    "body": "Direct from Expo API",
    "sound": "default"
  }]'
```

### **Web App Logs**
Look for these console messages:
```
[API] Push notification triggered for recipient: [user-id]
Push notification failed: [error details]
```

---

## ❌ **Common Issues**

### **1. No Notifications Received**
- Check if token exists in `expo_push_tokens` table
- Verify Expo `projectId` matches in both apps
- Ensure testing on real device (not simulator)
- Confirm notification permissions granted

### **2. Token Not Saved**
- Verify WebView message format is exact
- Check user is authenticated before token send
- Look for authentication errors in web app logs

### **3. Notifications Sent but Not Delivered**
- Check token validity with direct Expo API test
- Verify app is not in Do Not Disturb mode
- Check if token was marked invalid and removed

---

## 🎯 **Success Criteria**

✅ **Token Registration**: Native app sends token, appears in database  
✅ **Message Notifications**: Sending message triggers notification to recipient  
✅ **Deep Linking**: Tapping notification opens correct conversation  
✅ **Multi-Device**: Multiple devices per user receive notifications  
✅ **Error Handling**: Invalid tokens are cleaned up automatically  

---

## 🏆 **Implementation Status**

### **✅ Web App (READY FOR TESTING)**
- [x] Native bridge component updated for request-response pattern
- [x] Database schema deployed  
- [x] API endpoints operational
- [x] Message notification integration complete
- [x] TypeScript compilation verified
- [x] Error handling and retry logic implemented

### **⏳ Native App (NEEDS IMPLEMENTATION)**
- [ ] WebView message listener setup
- [ ] Expo push notification registration  
- [ ] Token transmission to web app
- [ ] Notification permission handling

**🎯 NEXT STEP**: Update React Native app using this guide

---

## 📞 **Support**

If notifications still don't work after implementing above:

1. **Share database query results** for token check
2. **Share console logs** from both native app and web app  
3. **Test direct Expo API** with saved token
4. **Verify Expo project configuration** matches between apps

The web infrastructure is ready - focus on the native app implementation! 🚀
