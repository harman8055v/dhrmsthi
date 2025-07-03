# Dharma Saathi - Schema Refactoring Summary

## Overview
This document summarizes the comprehensive refactoring performed to align the Dharma Saathi project with the updated Supabase database schema. The refactoring focused on transitioning from email-based auth to phone-based auth, updating field names, and implementing proper location foreign keys.

## Key Schema Changes Implemented

### 1. Authentication & User Profile Structure

#### Before:
- Email-based authentication
- `mobile_number` field for phone
- Direct string fields for location (`city`, `state`, `country`)
- `is_active` boolean field

#### After:
- **Phone-based authentication** (primary identifier)
- `phone` field for phone number
- **Location foreign keys**: `city_id`, `state_id`, `country_id`
- Joined location data: `city: { name }`, `state: { name }`, `country: { name }`
- Removed `is_active` field

### 2. Updated UserProfile Interface

```typescript
export interface UserProfile {
  id: string
  phone: string // Primary identifier for auth
  email?: string // Optional, collected during onboarding
  mobile_verified: boolean
  email_verified: boolean
  
  // Location fields using foreign keys
  city_id?: string
  state_id?: string
  country_id?: string
  
  // Partner preferences (new fields)
  preferred_age_min?: number
  preferred_age_max?: number
  preferred_diet?: string[]
  preferred_spiritual_orgs?: string[]
  preferred_practices?: string[]
  ideal_partner_notes?: string
  
  // Profile images
  profile_photo_url?: string
  user_photos?: string[] // JSONB array of signed URLs
  
  // Counters
  super_likes_count: number
  swipe_count: number
  message_highlights_count: number
  
  // ... other fields remain similar
}
```

### 3. Database Table Updates

#### Users Table:
- **Primary auth**: `phone` field
- **Location**: Foreign keys to `cities`, `states`, `countries` tables
- **Partner preferences**: New fields for matching criteria
- **Counters**: Daily limits for swipes, superlikes, message highlights

#### Swipes Table:
- Renamed from `swipe_actions` to `swipes`
- Simplified structure with `swiper_id`, `swiped_id`, `action`, `created_at`
- Removed `is_match` field (matches handled separately)

#### Supporting Tables:
- `cities`, `states`, `countries`: Location reference tables
- `matches`: Mutual swipes create matches
- `messages`: Linked to match_id + sender_id + receiver_id
- `blocked_users`: Contains blocker_id + blocked_id

## Files Updated

### Core Data Layer
1. **`lib/data-service.ts`**
   - Updated `UserProfile` interface
   - Modified all database queries to use new schema
   - Added location joins in profile fetching
   - Implemented signed URL generation for private images
   - Updated swipe operations to use `swipes` table

2. **`lib/types/onboarding.ts`**
   - Updated `OnboardingData` and `OnboardingProfile` interfaces
   - Added partner preference fields
   - Updated phone field to allow null for skip functionality

### Authentication & Hooks
3. **`hooks/use-auth.ts`**
   - Updated verification checks for new schema
   - Maintained compatibility with existing auth flow

4. **`lib/hooks/useLocationData.ts`**
   - Already properly structured for location foreign keys
   - No changes needed

### API Routes
5. **`app/api/profiles/discover/route.ts`**
   - Updated to use location joins
   - Modified preference filtering to use new field names
   - Updated account status values

6. **`app/api/swipe/route.ts`**
   - Updated to use `swipes` table
   - Fixed daily stats increment logic
   - Updated superlike handling

7. **`app/api/admin/dashboard/route.ts`**
   - Added location joins to user queries
   - Updated field selection to match new schema

### Components
8. **`app/onboarding/page.tsx`**
   - Updated profile creation to use new schema
   - Added counter initialization
   - Updated field mapping

9. **`components/onboarding/stages/seed-stage.tsx`**
   - Updated to use `phone` field instead of `mobile_number`
   - Fixed type issues for skip functionality

10. **`app/dashboard/page.tsx`**
    - Updated profile completeness calculation
    - Modified verification checks for new account status values

11. **`components/dashboard/swipe-card.tsx`**
    - Updated location display to use `city.name` and `state.name`
    - Maintained existing UI/UX

12. **`components/dashboard/welcome-section.tsx`**
    - Updated location display to use joined data

13. **`app/dashboard/profile/page.tsx`**
    - Updated location display
    - Fixed type issues in map functions

14. **`app/admin/page.tsx`**
    - Updated `UserType` interface
    - Modified location display throughout admin interface
    - Updated CSV export to handle new structure
    - Removed problematic edit fields

## Key Features Implemented

### 1. Signed URL Support
- All profile images now use Supabase signed URLs
- Private bucket access properly handled
- Automatic URL generation in data service

### 2. Location Data Joins
- Proper foreign key relationships
- Efficient queries with location name resolution
- Consistent location display across all components

### 3. Partner Preferences
- New fields for matching criteria
- Age range preferences
- Diet and spiritual organization preferences
- Notes for ideal partner description

### 4. Daily Limits & Counters
- Swipe count tracking
- Superlike count management
- Message highlight limits
- Proper daily reset functionality

## Migration Notes

### Database Changes Required
1. **Users table**: Add new fields, update location to foreign keys
2. **Rename**: `swipe_actions` → `swipes`
3. **Add**: Location reference tables if not exists
4. **Update**: RLS policies for new structure

### Environment Variables
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for admin operations
- Verify storage bucket permissions for signed URLs

### Testing Checklist
- [ ] Phone-based authentication flow
- [ ] Location selection in onboarding
- [ ] Profile discovery with new filters
- [ ] Swipe functionality with daily limits
- [ ] Admin dashboard with location data
- [ ] Image upload and signed URL generation
- [ ] Partner preference matching

## Breaking Changes

### For Developers:
1. **Auth flow**: Now primarily phone-based, email optional
2. **Location fields**: Use `city_id`, `state_id`, `country_id` instead of strings
3. **Swipe table**: Use `swipes` instead of `swipe_actions`
4. **Image URLs**: Always use signed URLs for private images

### For Users:
1. **Login**: Phone number required, email optional
2. **Location**: Dropdown selection instead of free text
3. **Preferences**: More detailed partner preference options

## Next Steps

1. **Database Migration**: Run the provided SQL scripts to update schema
2. **Testing**: Comprehensive testing of all user flows
3. **Deployment**: Gradual rollout with feature flags if needed
4. **Monitoring**: Track user adoption and any issues

## Files Not Modified
- UI components that don't interact with data
- Styling and CSS files
- Configuration files (except where necessary)
- Test files (if they exist)

This refactoring maintains the existing UI/UX while ensuring the underlying data layer is fully aligned with the new schema requirements. 