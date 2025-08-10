# DharmaSaathi WebView Notification System - Mobile App Integration Summary

## 📱 **Project Overview**
**Project**: DharmaSaathi Spiritual Matrimony Platform  
**Type**: React Next.js Web App with React Native WebView Integration  
**Purpose**: Comprehensive notification system for seamless web-to-native communication  
**Implementation Date**: August 2025  
**Status**: Production Ready ✅

---

## 🏗️ **System Architecture**

### **Core Components Stack**
```
React Native Mobile App (WebView)
    ↕️ (Message Bridge)
React Web App (Next.js 13+ App Router)
    ↕️ (API Layer)
Supabase Database (PostgreSQL)
    ↕️ (Analytics & Campaigns)
Real-time Notification System
```

### **Communication Flow**
```
Mobile App → WebView → Web App → Analytics/Campaign Engine → UI Response → WebView → Mobile App
```

---

## 🔧 **Technical Implementation Details**

### **1. WebView Bridge System**
**File**: `lib/webview-bridge.ts`

**Core Interface**:
```typescript
interface NotificationData {
  type: 'message' | 'like' | 'superlike' | 'match' | 'promotion' | 'reminder' | 'subscription' | 'system'
  category: 'social' | 'marketing' | 'engagement' | 'monetization' | 'system'
  priority: 'low' | 'normal' | 'high' | 'critical'
  title: string
  message: string
  imageUrl?: string
  actionUrl?: string
  campaignId?: string
  data?: Record<string, any>
}
```

**Key Features**:
- ✅ Bidirectional communication (Web ↔ Native)
- ✅ Message queuing and retry logic
- ✅ Event-driven architecture
- ✅ Type-safe message passing
- ✅ Automatic navigation handling

### **2. Notification Categories**

#### **Social Notifications**
- **Messages**: New chat messages, conversation updates
- **Likes**: Profile likes, mutual likes
- **Super Likes**: Premium likes with enhanced visibility
- **Matches**: New matches, match confirmations
- **Profile Views**: Who viewed your profile

#### **Marketing Campaigns**
- **Seasonal**: Diwali, Valentine's, Karva Chauth promotions
- **Feature Launches**: New app features, updates
- **Promotions**: Discount codes, special offers
- **Referral**: Friend referral bonuses

#### **Engagement Notifications**
- **Daily Reminders**: "Check new profiles today"
- **Weekly Digest**: Activity summaries
- **Tips**: Profile optimization suggestions
- **Achievements**: Milestone celebrations
- **Community**: Forum updates, events

#### **Monetization**
- **Subscription**: Premium plan promotions
- **Premium Features**: Feature unlock prompts
- **Billing**: Payment reminders, receipts

#### **System Notifications**
- **General**: App updates, maintenance
- **Critical**: Security alerts, urgent updates

### **3. Analytics Tracking System**
**File**: `lib/enhanced-analytics.ts`

**Event Types**:
```typescript
type AnalyticsEventType = 
  | 'received'    // Notification delivered
  | 'opened'      // User opened notification
  | 'clicked'     // User clicked CTA
  | 'dismissed'   // User dismissed notification
  | 'converted'   // User completed desired action
```

**Conversion Funnel Tracking**:
1. **Impression** → 2. **Click** → 3. **Engagement** → 4. **Conversion**

**Storage**: Supabase `notification_analytics` table with real-time insights

### **4. Marketing Campaign Engine**
**File**: `lib/marketing-campaign-handler.ts`

**Campaign Types**:
- **Seasonal Campaigns**: Auto-triggered based on dates
- **User Behavior**: Triggered by user actions
- **A/B Testing**: Multiple campaign variations
- **Frequency Capping**: Prevent notification spam

**Pre-configured Campaigns**:
```typescript
// Diwali Special 2024
{
  name: 'Diwali Special 2024',
  promoCode: 'DIWALI50',
  discount: 50%, // percentage off
  validFrom: '2024-10-01',
  validUntil: '2024-11-15',
  targetAudience: ['free', 'basic'],
  maxShows: 3,
  cooldownHours: 48
}

// Valentine Special 2025
{
  name: 'Valentine Special 2025',
  promoCode: 'LOVE2025',
  discount: 40%, // percentage off
  validFrom: '2025-02-07',
  validUntil: '2025-02-21',
  targetAudience: ['free', 'basic'],
  maxShows: 3,
  cooldownHours: 48
}
```

---

## 📊 **Database Schema**

### **Required Tables** (Run SQL migration first)

#### **1. marketing_campaigns**
```sql
- id (UUID, Primary Key)
- name (VARCHAR) - Campaign identifier
- type (VARCHAR) - seasonal, feature_launch, etc.
- title (VARCHAR) - Display title
- description (TEXT) - Campaign description
- promo_code (VARCHAR) - Discount code
- discount (JSONB) - {percentage: 50, amount: 100}
- valid_from/valid_until (TIMESTAMPTZ) - Date range
- target_audience (JSONB) - User targeting
- priority (VARCHAR) - low, normal, high, critical
- max_shows (INTEGER) - Display frequency limit
- is_active (BOOLEAN) - Enable/disable
```

#### **2. notification_analytics**
```sql
- id (UUID, Primary Key)
- event_type (VARCHAR) - received, opened, clicked, etc.
- notification_type (VARCHAR) - message, like, promotion
- notification_category (VARCHAR) - social, marketing, etc.
- campaign_id (UUID) - Reference to campaign
- user_id (UUID) - User reference
- properties (JSONB) - Event metadata
- timestamp (TIMESTAMPTZ) - Event time
```

#### **3. user_notification_preferences**
```sql
- user_id (UUID, Primary Key)
- social_preferences (JSONB) - Social notification settings
- marketing_preferences (JSONB) - Marketing opt-in/out
- engagement_preferences (JSONB) - Engagement settings
- quiet_hours (JSONB) - Do not disturb times
- push_token (TEXT) - Device push token
```

#### **4. promo_code_usage**
```sql
- id (UUID, Primary Key)
- campaign_id (UUID) - Campaign reference
- user_id (UUID) - User reference
- promo_code (VARCHAR) - Used code
- redeemed_at (TIMESTAMPTZ) - Usage time
- discount_applied (JSONB) - Applied discount
```

---

## 🔌 **API Endpoints**

### **1. Analytics Tracking**
```
POST /api/analytics/notifications
Body: {
  event: {
    type: 'received' | 'opened' | 'clicked' | 'dismissed' | 'converted',
    notificationType: string,
    category: string,
    userId?: string,
    campaignId?: string,
    properties?: object
  }
}
```

### **2. Promo Code Validation**
```
POST /api/promo-codes
Body: {
  code: string,
  userId: string
}
Response: {
  valid: boolean,
  discount?: object,
  campaign?: object
}
```

### **3. Marketing Campaigns**
```
GET /api/marketing/campaigns
Response: Campaign[] - Active campaigns for user

GET /api/marketing/campaigns/seasonal
Response: Campaign[] - Current seasonal campaigns
```

### **4. User Preferences**
```
GET /api/user/notification-preferences?userId=string
Response: UserNotificationPreferences

POST /api/user/notification-preferences
Body: {
  userId: string,
  preferences: object
}
```

---

## 📱 **React Native Integration Guide**

### **1. WebView Setup**
```javascript
import { WebView } from 'react-native-webview';

const DharmaSaathiWebView = () => {
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'notification':
          handleNotification(data.payload);
          break;
        case 'analytics':
          trackAnalytics(data.payload);
          break;
        case 'navigation':
          handleNavigation(data.payload);
          break;
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  const handleNotification = (notification) => {
    // Show native notification
    // Navigate to relevant screen
    // Update badge counts
    // Trigger haptic feedback
  };

  return (
    <WebView
      source={{ uri: 'https://your-domain.com' }}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    />
  );
};
```

### **2. Message Sending (Native → Web)**
```javascript
// Send message to web app
const sendToWebApp = (data) => {
  const message = JSON.stringify(data);
  webViewRef.current?.postMessage(message);
};

// Examples:
sendToWebApp({
  type: 'user_location',
  payload: { lat: 28.6139, lng: 77.2090 }
});

sendToWebApp({
  type: 'push_token',
  payload: { token: 'fcm_device_token_here' }
});
```

### **3. Navigation Handling**
```javascript
const handleNavigation = (navigationData) => {
  const { route, params } = navigationData;
  
  switch (route) {
    case 'chat':
      navigation.navigate('ChatScreen', { userId: params.userId });
      break;
    case 'profile':
      navigation.navigate('ProfileScreen', { profileId: params.profileId });
      break;
    case 'subscription':
      navigation.navigate('SubscriptionScreen', { plan: params.plan });
      break;
    case 'external':
      Linking.openURL(params.url);
      break;
  }
};
```

---

## 🎨 **UI Components**

### **Available Notification UI Types**
1. **Modal Notifications**: Full-screen overlays for important updates
2. **Banner Notifications**: Top/bottom banners for promotions
3. **Toast Notifications**: Quick feedback messages
4. **In-app Overlays**: Contextual tips and guides

### **Styling Integration**
- **Consistent Design**: Matches DharmaSaathi brand colors
- **Responsive**: Works on all screen sizes
- **Accessibility**: WCAG compliant
- **Dark Mode**: Automatic theme detection

---

## 🧪 **Testing & Debugging**

### **1. Development Testing**
```javascript
// Enable debug mode in browser console
localStorage.setItem('webview-debug', 'true');

// Test notification manually
window.dispatchEvent(new MessageEvent('message', {
  data: JSON.stringify({
    type: 'notification',
    payload: {
      type: 'message',
      category: 'social',
      title: 'New Message',
      message: 'Test notification'
    }
  })
}));
```

### **2. Built-in Testing Component**
**NotificationTester** (Auto-appears in development mode):
- Test all notification types
- Verify WebView bridge communication
- Check analytics tracking
- Test campaign flows

### **3. Analytics Verification**
```sql
-- Check recent events
SELECT * FROM notification_analytics 
ORDER BY timestamp DESC LIMIT 10;

-- Conversion funnel analysis
SELECT 
  notification_type,
  event_type,
  COUNT(*) as count
FROM notification_analytics 
GROUP BY notification_type, event_type;
```

---

## 🚀 **Deployment Checklist**

### **Web App Deployment**
- [ ] Set production environment variables
- [ ] Configure Supabase production database
- [ ] Run database migrations
- [ ] Test API endpoints
- [ ] Verify CORS configuration
- [ ] Enable analytics tracking

### **Mobile App Integration**
- [ ] Update WebView URL to production
- [ ] Test message passing
- [ ] Verify navigation handling
- [ ] Check push notification integration
- [ ] Test on both iOS and Android
- [ ] Performance testing

### **Database Setup**
- [ ] Run migration: `database/migrations/notification_analytics.sql`
- [ ] Configure Row Level Security (RLS)
- [ ] Set up backup policies
- [ ] Create database indexes
- [ ] Test data insertion/retrieval

---

## 📈 **Performance Metrics**

### **Key Performance Indicators (KPIs)**
- **Notification Delivery Rate**: % of notifications successfully delivered
- **Open Rate**: % of notifications opened by users
- **Click-Through Rate (CTR)**: % of notifications clicked
- **Conversion Rate**: % of notifications leading to desired action
- **User Engagement**: Time spent in app after notification

### **Campaign Performance**
- **Promo Code Usage**: Track discount code redemptions
- **Seasonal Campaign ROI**: Revenue from seasonal promotions
- **User Retention**: Impact of notifications on user retention
- **Feature Adoption**: Notifications driving feature usage

---

## 🔒 **Security & Privacy**

### **Data Protection**
- **User Consent**: Explicit opt-in for marketing notifications
- **Data Encryption**: All data encrypted in transit and at rest
- **GDPR Compliance**: Right to be forgotten, data portability
- **Minimal Data Collection**: Only collect necessary analytics

### **Security Measures**
- **Input Validation**: All API inputs validated
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Secure user identification
- **Content Security Policy (CSP)**: XSS protection

---

## 🛠️ **Maintenance & Monitoring**

### **Regular Tasks**
- **Analytics Review**: Weekly performance analysis
- **Campaign Updates**: Seasonal campaign refreshes
- **User Feedback**: Monitor user preferences changes
- **Performance Optimization**: Regular performance audits

### **Monitoring Setup**
```javascript
// Error tracking
Sentry.captureException(error);

// Performance monitoring
analytics.track('notification_performance', {
  loadTime: Date.now() - startTime,
  notificationType: 'message',
  success: true
});
```

---

## 📞 **Support & Documentation**

### **For Mobile App Developers**
1. **Integration Issues**: Check WebView bridge communication
2. **Message Format**: Verify JSON message structure
3. **Navigation**: Ensure proper route handling
4. **Testing**: Use NotificationTester component

### **For Web Developers**
1. **API Integration**: Follow API endpoint documentation
2. **Database Schema**: Use provided migration files
3. **Analytics**: Implement event tracking properly
4. **UI Components**: Customize notification components

### **Emergency Contacts**
- **Technical Issues**: Check browser console for errors
- **Database Problems**: Verify Supabase connection
- **Campaign Issues**: Check campaign configuration
- **Performance**: Monitor analytics dashboard

---

## 🎯 **Next Steps for Mobile App**

### **Immediate Actions**
1. **Update WebView URL**: Point to production web app
2. **Implement Message Handlers**: Add notification handling logic
3. **Test Communication**: Verify bidirectional messaging
4. **Add Navigation Routes**: Map web routes to native screens

### **Advanced Features**
1. **Push Notifications**: Integrate with FCM/APNS
2. **Deep Linking**: Handle notification deep links
3. **Offline Support**: Cache notifications for offline viewing
4. **Background Sync**: Sync notifications in background

### **Production Optimizations**
1. **Performance**: Optimize WebView loading
2. **Memory Management**: Prevent memory leaks
3. **Battery Usage**: Optimize background processing
4. **Network Usage**: Minimize data usage

---

**📝 Last Updated**: August 10, 2025  
**🔄 Version**: 1.0.0 (Production Ready)  
**👨‍💻 Implementation**: Complete with full testing suite  
**📱 Mobile Integration**: Ready for React Native WebView  

This comprehensive system provides a robust foundation for web-to-native notification communication with advanced analytics, marketing campaigns, and user preference management.
