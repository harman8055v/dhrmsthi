# Supabase Notification System Setup Guide

This guide will help you set up a comprehensive notification system using Supabase that automatically creates notifications for messages, likes, matches, and more.

## 🚀 **Quick Overview**

The Supabase notification system provides:
- ✅ **Automatic Notifications**: Database triggers create notifications for messages, likes, matches
- ✅ **Real-time Updates**: Instant notification delivery via Supabase Realtime
- ✅ **User Preferences**: Granular control over notification types and timing
- ✅ **Template System**: Consistent messaging with customizable templates
- ✅ **WebView Integration**: Seamless integration with your React Native app
- ✅ **Analytics Tracking**: Built-in notification performance tracking

## 📋 **Setup Steps**

### **1. Database Setup**

Run the migration in your Supabase SQL editor:

```sql
-- Copy and paste the entire contents of:
-- database/migrations/supabase_notifications.sql
```

This creates:
- `notifications` table with real-time capabilities
- `notification_settings` table for user preferences  
- `notification_templates` table with pre-built templates
- Database functions for creating and managing notifications
- Triggers for automatic notification creation
- Row Level Security (RLS) policies

### **2. Environment Variables**

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **3. Enable Realtime**

In your Supabase dashboard:
1. Go to **Database > Replication**
2. Enable replication for the `notifications` table
3. The migration already adds the table to the realtime publication

### **4. Table Integration**

Update your existing table triggers (adjust table names to match your schema):

```sql
-- For messages table
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- For likes table  
CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_like();

-- For matches table
CREATE TRIGGER trigger_notify_new_match
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_match();
```

## 🔧 **Integration with Your APIs**

### **Method 1: Database Triggers (Recommended)**

Notifications are **automatically created** when:
- New message is inserted → `notify_new_message()` creates notification
- New like is inserted → `notify_new_like()` creates notification  
- New match is inserted → `notify_new_match()` creates notification

**Pros**: Zero code changes, automatic, consistent
**Cons**: Less flexibility for custom logic

### **Method 2: API Integration**

Add notification creation to your existing API routes:

```typescript
// In your messages API
import { createNotification } from '../../../lib/notification-integrations'

export async function POST(request: NextRequest) {
  // Your existing message creation...
  const message = await createMessage(data)
  
  // Create notification
  await createNotification('message', recipientId, {
    sender_name: senderName,
    message_preview: messagePreview,
    match_id: matchId
  }, senderId)
}
```

**Pros**: More control, custom logic, error handling
**Cons**: Requires code changes in multiple places

## 📱 **React Integration**

### **1. Initialize in Your App**

```typescript
// In your main app component or layout
import { useSupabaseNotifications } from '../hooks/use-supabase-notifications'
import { supabaseNotificationService } from '../lib/supabase-notifications'

function App() {
  const { 
    notifications, 
    counts, 
    initialize,
    markAsRead,
    onNewNotification 
  } = useSupabaseNotifications({
    userId: currentUser?.id,
    autoInitialize: true
  })

  // Handle new notifications
  useEffect(() => {
    const unsubscribe = onNewNotification((notification) => {
      // Show toast, update UI, etc.
      console.log('New notification:', notification)
    })

    return unsubscribe
  }, [onNewNotification])

  return (
    // Your app content...
    <NotificationProvider value={{ notifications, counts, markAsRead }}>
      {children}
    </NotificationProvider>
  )
}
```

### **2. Notification Components**

```typescript
// Notification badge
function NotificationBadge() {
  const { counts } = useSupabaseNotifications()
  
  return (
    <div className="relative">
      <BellIcon />
      {counts?.unread_count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
          {counts.unread_count}
        </span>
      )}
    </div>
  )
}

// Notification list
function NotificationList() {
  const { notifications, loadMore, markAsRead } = useSupabaseNotifications()
  
  return (
    <div className="notification-list">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id}
          notification={notification}
          onRead={() => markAsRead([notification.id])}
        />
      ))}
    </div>
  )
}
```

## 🔔 **Notification Types & Templates**

### **Pre-built Templates**

The system includes templates for:

**Social Notifications:**
- `message` - New message from someone
- `like` - Someone liked your profile  
- `superlike` - Someone super liked you
- `match` - New match created
- `profile_view` - Someone viewed your profile

**Marketing Notifications:**
- `seasonal_promo` - Seasonal campaigns (Diwali, Valentine's)
- `feature_launch` - New feature announcements
- `subscription_promo` - Premium subscription offers

**Engagement Notifications:**
- `daily_reminder` - Daily check-in reminders
- `weekly_digest` - Weekly activity summary
- `profile_tip` - Profile optimization tips
- `achievement` - Achievement unlocked

**System Notifications:**
- `account_verification` - Account verification required
- `security_alert` - Security-related alerts
- `maintenance` - Maintenance notifications

### **Creating Custom Templates**

```sql
INSERT INTO notification_templates (
  type, 
  category, 
  priority, 
  title_template, 
  message_template, 
  action_url_template
) VALUES (
  'custom_event',
  'engagement', 
  'normal',
  'Custom Event: {{event_name}}',
  'Join our {{event_name}} happening on {{event_date}}!',
  '/events/{{event_id}}'
);
```

## 🎯 **Usage Examples**

### **1. Manual Notification Creation**

```typescript
import { supabaseNotificationService } from '../lib/supabase-notifications'

// Create a marketing notification
await supabaseNotificationService.createNotification(
  'user123',
  'seasonal_promo',
  {
    campaign_title: 'Diwali Special',
    campaign_message: 'Get 50% off premium features!',
    campaign_url: '/premium?promo=DIWALI50'
  }
)
```

### **2. Bulk Notifications**

```typescript
import { sendBatchNotifications } from '../lib/notification-integrations'

// Send to multiple users
await sendBatchNotifications([
  {
    recipientId: 'user1',
    templateType: 'seasonal_promo',
    templateData: { campaign_title: 'Special Offer' }
  },
  {
    recipientId: 'user2', 
    templateType: 'daily_reminder'
  }
])
```

### **3. User Preferences**

```typescript
// Update user notification preferences
await supabaseNotificationService.updateNotificationSettings({
  social_notifications: {
    messages: true,
    likes: false,
    superlikes: true,
    matches: true
  },
  marketing_notifications: {
    enabled: false
  },
  quiet_hours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  }
})
```

## 📊 **Analytics & Monitoring**

### **Notification Performance**

```typescript
// Get notification counts
const counts = await supabaseNotificationService.getNotificationCounts()
console.log(`Unread: ${counts.unread_count}, Total: ${counts.total_count}`)

// Track notification interactions
await fetch('/api/analytics/notifications', {
  method: 'POST',
  body: JSON.stringify({
    event: {
      type: 'clicked',
      notificationType: 'message',
      category: 'social'
    }
  })
})
```

### **Database Queries for Analytics**

```sql
-- Notification delivery rates by type
SELECT 
  type,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE is_read) as total_read,
  ROUND(COUNT(*) FILTER (WHERE is_read) * 100.0 / COUNT(*), 2) as read_rate
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY type;

-- User engagement by category
SELECT 
  category,
  COUNT(DISTINCT recipient_id) as unique_recipients,
  AVG(CASE WHEN is_read THEN 1 ELSE 0 END) as avg_read_rate
FROM notifications 
GROUP BY category;
```

## 🔧 **API Endpoints**

### **Main Notification API**

```bash
# Get user notifications
GET /api/supabase-notifications?userId=123&page=0&limit=20

# Create notification
POST /api/supabase-notifications
{
  "action": "create",
  "recipientId": "user123",
  "templateType": "message",
  "templateData": {"sender_name": "John"}
}

# Mark as read
POST /api/supabase-notifications  
{
  "action": "markAsRead",
  "userId": "user123",
  "notificationIds": ["notif1", "notif2"]
}

# Get counts
POST /api/supabase-notifications
{
  "action": "getCounts", 
  "userId": "user123"
}
```

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Notifications not appearing**
   - Check user preferences in `notification_settings`
   - Verify real-time subscription is active
   - Check quiet hours settings

2. **Triggers not firing**
   - Ensure triggers are created on correct table names
   - Check if functions exist and have proper permissions
   - Verify RLS policies allow insertion

3. **Real-time not working**
   - Enable replication for `notifications` table
   - Check Supabase project status
   - Verify WebSocket connection

### **Debug Queries**

```sql
-- Check recent notifications
SELECT * FROM notifications 
WHERE recipient_id = 'user123' 
ORDER BY created_at DESC LIMIT 10;

-- Check user settings
SELECT * FROM notification_settings 
WHERE user_id = 'user123';

-- Check template exists
SELECT * FROM notification_templates 
WHERE type = 'message' AND is_active = true;
```

## 🚀 **Production Deployment**

### **Performance Optimizations**

1. **Database Indexes**: Already included in migration
2. **Connection Pooling**: Use Supabase connection pooling
3. **Batch Operations**: Use bulk create for multiple notifications
4. **Cleanup**: Run `cleanup_expired_notifications()` regularly

### **Monitoring Setup**

```typescript
// Scheduled cleanup (run daily)
await fetch('/api/supabase-notifications', {
  method: 'POST',
  body: JSON.stringify({ action: 'cleanup' })
})

// Monitor notification volume
const counts = await supabaseNotificationService.getNotificationCounts()
```

## ✅ **Testing**

### **1. Test Notification Creation**

```typescript
// Test in browser console
await supabaseNotificationService.createNotification(
  'your-user-id',
  'message', 
  { sender_name: 'Test User', message_preview: 'Hello!' },
  'sender-id'
)
```

### **2. Test Real-time Updates**

1. Open two browser tabs with the same user
2. Create notification in one tab
3. Verify it appears in real-time in the other tab

### **3. Test User Preferences**

```typescript
// Disable messages
await supabaseNotificationService.updateNotificationSettings({
  social_notifications: { messages: false }
})

// Try creating message notification - should be blocked
```

## 🎉 **You're Ready!**

Your Supabase notification system is now fully configured and will automatically:

- ✅ Create notifications for messages, likes, matches
- ✅ Respect user preferences and quiet hours
- ✅ Send real-time updates to your React Native app
- ✅ Provide comprehensive analytics and monitoring
- ✅ Scale efficiently with Supabase infrastructure

The system is production-ready and will handle all notification needs for your DharmaSaathi matrimony platform!
