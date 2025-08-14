# Expo Push Token - cURL Test

## Test Direct Expo Push API

```bash
# Replace with a real Expo push token (from your device)
expoToken="ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"

curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '[
    { "to": "'"$expoToken"'", "title": "Test Push", "body": "Tap to open the app", "sound": "default" }
  ]'
```

## Test via DharmaSaathi API

First, save a token (from WebView or browser console):
```javascript
// In browser console or WebView
window.postMessage({
  type: "expo_push_token",
  payload: {
    token: "ExponentPushToken[your-token-here]",
    platform: "android"
  }
}, "*");
```

Then send a notification:
```bash
# Replace USER_ID with actual user UUID
curl -X POST https://dharmasaathi.com/api/expo/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "userId": "USER_ID",
    "title": "New Match! 💕",
    "body": "Someone spiritually compatible liked your profile",
    "data": {"route": "/dashboard/matches"}
  }'
```
