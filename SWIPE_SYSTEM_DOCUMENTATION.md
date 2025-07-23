# Swipe System Documentation

## Overview
The swipe system is the core feature of DharmaSaathi's matching interface, allowing users to interact with potential matches through intuitive swipe gestures and button controls.

## Last Updated: December 2024

## Architecture

### Component Structure
```
SwipeStack (Parent Component)
├── Header (Swipe Stats Display)
├── Card Stack Container
│   └── SwipeCard Components (3 cards rendered)
│       ├── Profile Image Gallery
│       ├── Profile Information
│       └── Animation Overlays
└── Action Buttons (Pass, Like, Super Like, Undo)
```

### Key Components
1. **SwipeStack** (`components/dashboard/swipe-stack.tsx`): Main container managing state and orchestration
2. **SwipeCard**: Individual card component handling display and animations

## State Management

### Core States
```typescript
const [profiles, setProfiles] = useState(initialProfiles)          // Profile array
const [currentIndex, setCurrentIndex] = useState(0)               // Current profile index
const [swipeStats, setSwipeStats] = useState<any>(null)          // User's swipe limits
const [undoStack, setUndoStack] = useState<any[]>([])            // History for undo
const [currentImageIndex, setCurrentImageIndex] = useState(0)     // Current photo index
const [exitingCard, setExitingCard] = useState<{                 // Animation state
  id: string, 
  direction: "left" | "right" | "superlike" 
} | null>(null)
```

### Animation Flow

#### 1. User Initiates Swipe
- **Trigger**: Button click or gesture (gestures currently disabled)
- **Entry Point**: `handleSwipe(direction, profileId)`

#### 2. Pre-flight Checks
```javascript
// Check if animation is already in progress
if (exitingCard) return

// Check if there are profiles available
if (currentIndex >= profiles.length) return

// Check daily limits
if (!swipeStats?.can_swipe) {
  toast.error("Daily swipe limit reached!")
  return
}

// Check super like availability
if (direction === "superlike" && swipeStats?.super_likes_available <= 0) {
  toast.error("No Super Likes available!")
  return
}
```

#### 3. Animation Sequence
```javascript
// 1. Set exit animation state
setExitingCard({ id: profileId, direction })

// 2. Animation durations
const animationDuration = direction === "superlike" ? 700 : 400

// 3. Schedule state updates after animation
setTimeout(() => {
  // Update card index
  setCurrentIndex(prev => prev + 1)
  
  // Add to undo stack
  setUndoStack(prev => [...prev, { profile, direction, index }])
  
  // Clear animation state
  setExitingCard(null)
  
  // Update stats optimistically
  updateSwipeStats(direction)
}, animationDuration)
```

#### 4. API Call (Parallel)
```javascript
// API call happens in parallel with animation
const response = await fetch("/api/swipe", {
  method: "POST",
  body: JSON.stringify({
    swiped_user_id: profileId,
    action: direction === "left" ? "dislike" : 
             direction === "right" ? "like" : "superlike"
  })
})
```

#### 5. Response Handling
- **Success**: Show match notification if applicable
- **Error**: Rollback UI changes after animation completes
- **Duplicate Swipe**: Ignore (user already swiped this profile)

## Animation Details

### Card Animations
```typescript
// SwipeCard motion properties
animate={{ 
  scale: exitDirection === "superlike" ? 1.1 : 1 - index * 0.05,
  y: exitDirection === "superlike" ? -50 : index * 10,
  rotate: exitDirection === "superlike" ? 360 : 0
}}

exit={{ 
  x: exitDirection === "right" ? 300 : 
     exitDirection === "left" ? -300 : 0,
  y: exitDirection === "superlike" ? -500 : 0,
  opacity: 0,
  scale: exitDirection === "superlike" ? 1.2 : 1
}}

transition={{ 
  type: exitDirection === "superlike" ? "spring" : "tween",
  duration: exitDirection === "superlike" ? 0.7 : 0.4,
  ease: "easeOut"
}}
```

### Visual Feedback
- **Like (Right Swipe)**: Green overlay with heart icon
- **Pass (Left Swipe)**: Red overlay with X icon
- **Super Like**: Blue-purple gradient with star icon and rotation

## Performance Optimizations

### 1. Card Rendering
- Only 3 cards rendered at a time (current + 2 behind)
- Cards are rendered in reverse order for proper stacking

### 2. Profile Loading
- Profiles are fetched when stack is running low (< 3 remaining)
- New profiles are appended to existing array to maintain continuity
- Duplicate profiles are filtered out

### 3. Image Optimization
- Priority loading for top card images
- Lazy loading for background cards
- Proper image URLs with Supabase storage integration

## Error Handling

### Network Errors
```javascript
catch (error) {
  // Rollback after animation completes
  setTimeout(() => {
    setCurrentIndex(prev => prev - 1)
    setUndoStack(prev => prev.slice(0, -1))
    restoreSwipeStats()
  }, animationDuration)
  
  toast.error("Something went wrong. Please try again.")
}
```

### Validation Errors
- Daily limit reached: Clear error message with upgrade prompt
- No super likes: Redirect to store with actionable toast
- Profile verification required: Show verification message

## Undo Functionality

### Implementation
```javascript
const handleUndo = async () => {
  const lastAction = undoStack[undoStack.length - 1]
  
  // Delete swipe from database
  await fetch("/api/swipe", {
    method: "DELETE",
    body: JSON.stringify({ swiped_user_id: lastAction.profile.id })
  })
  
  // Restore UI state
  setUndoStack(prev => prev.slice(0, -1))
  setCurrentIndex(lastAction.index)
}
```

### Limitations
- Only available for the most recent swipe
- Cannot undo after navigating away
- Requires successful API call to delete swipe record

## User Flows

### Normal Swipe Flow
1. User clicks Like/Pass button
2. Animation starts immediately
3. Card exits with appropriate animation
4. Next card becomes active after animation
5. API call processes in background
6. Success/error handling after response

### Super Like Flow
1. User clicks Super Like button
2. Check super like availability
3. Special rotation animation (360°)
4. Card scales up and moves upward
5. Star trail effect during animation
6. Success notification after API response

### Match Flow
1. Swipe processed normally
2. API returns `is_match: true`
3. Match notification displayed
4. Users can now message each other

## Configuration

### Animation Timings
```javascript
// Regular swipe: 400ms
// Super like: 700ms
const animationDuration = direction === "superlike" ? 700 : 400
```

### Swipe Thresholds (Currently Disabled)
```javascript
const threshold = 150  // Minimum drag distance
const velocity = 500   // Minimum swipe velocity
```

### Profile Buffer
```javascript
// Load more when 3 or fewer profiles remain
if (currentIndex + 1 >= profiles.length - 3) {
  fetchProfiles()
}
```

## Known Issues & Solutions

### Issue: Animation Getting Stuck
**Previous Issue**: Complex state management with multiple timeouts causing race conditions
**Solution**: Simplified to single `exitingCard` state with synchronized timing

### Issue: Double Swipes
**Previous Issue**: Multiple animation flags (`isAnimating`, `hasTriggered`) conflicting
**Solution**: Single source of truth (`exitingCard`) prevents concurrent animations

### Issue: Profile Loading
**Previous Issue**: Profiles replaced entirely, causing discontinuity
**Solution**: Append new profiles and filter duplicates

## API Integration

### Swipe Endpoint
```typescript
POST /api/swipe
{
  swiped_user_id: string,
  action: "like" | "dislike" | "superlike"
}
```

### Response Format
```typescript
{
  success: boolean,
  is_match: boolean,
  error?: string
}
```

### Undo Endpoint
```typescript
DELETE /api/swipe
{
  swiped_user_id: string
}
```

## Future Improvements

1. **Gesture Support**: Re-enable drag gestures with proper touch handling
2. **Offline Support**: Queue swipes for later processing
3. **Predictive Loading**: Pre-fetch profiles based on swipe patterns
4. **Animation Customization**: User preferences for animation speed
5. **Batch Operations**: Process multiple swipes in single API call

## Testing Checklist

- [ ] Normal swipe animations complete smoothly
- [ ] Super like animation shows rotation and trail
- [ ] Rapid clicking doesn't cause stuck animations
- [ ] Undo functionality works correctly
- [ ] Profile loading happens seamlessly
- [ ] Error states are handled gracefully
- [ ] Daily limits are enforced properly
- [ ] Match notifications appear correctly

---

## Change Log

### December 2024
- **Refactored Animation System**: Removed complex trigger system, simplified to direct state management
- **Fixed Stuck Animations**: Synchronized animation timing with state updates
- **Improved Error Handling**: Rollback operations now wait for animation completion 