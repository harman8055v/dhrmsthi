# Profile Scoring System Documentation

## Overview
The Profile Scoring System allows administrators to manually rate user profile quality from 1-10 during the verification process. This scoring significantly impacts user matching priority and overall app experience.

## Database Schema

### New Columns Added to `users` table:
- `profile_score` (INTEGER): Score from 1-10 (default: 5)
- `profile_scored_at` (TIMESTAMP): When the profile was scored
- `profile_scored_by` (UUID): Admin who assigned the score

### Constraints:
- `profile_score` must be between 1 and 10
- Automatic trigger updates `profile_scored_at` when score changes
- Foreign key reference to admin user who scored

## Scoring Guidelines

### 10 - Exceptional (Premium Quality)
- Perfect, high-resolution photos (3+ professional quality)
- Complete profile with compelling spiritual content
- Detailed descriptions showing spiritual depth
- Well-written spiritual quotes with personal meaning
- Professional background clearly presented

### 9 - Excellent (High Quality)
- High-quality photos (2-3 clear images)
- Detailed profile with good spiritual content
- Clear about me section with personality
- Meaningful spiritual practices listed
- Complete partner preferences

### 8 - Very Good (Above Standard)
- Good photos (2+ clear images)
- Mostly complete profile
- Some spiritual depth shown
- Basic but adequate descriptions
- Partner preferences defined

### 7 - Good (Standard Plus)
- Decent photos (1-2 clear images)
- Adequate profile completion
- Basic spiritual information
- Short but meaningful descriptions
- Some partner preferences set

### 6 - Above Average (Slightly Better)
- Basic photos present
- Reasonable profile completion
- Minimal spiritual content
- Brief descriptions
- Limited partner preferences

### 5 - Average (Default Score)
- Standard profile (assigned to all new users by default)
- Basic information provided
- Photos present but may be limited
- Standard completion level

### 4 - Below Average (Needs Improvement)
- Limited photos or poor quality
- Incomplete profile sections
- Minimal spiritual content
- Very brief descriptions
- Missing key information

### 3 - Poor (Significant Issues)
- Few or poor quality photos
- Many incomplete sections
- Little to no spiritual content
- Inadequate descriptions
- Major profile gaps

### 2 - Very Poor (Major Problems)
- Poor quality or inappropriate photos
- Most sections incomplete
- No spiritual depth shown
- Minimal effort in descriptions
- Lacks essential information

### 1 - Unacceptable (Requires Immediate Attention)
- Inappropriate content
- Fake or suspicious profile
- Major policy violations
- Extremely incomplete
- Quality concerns

## Impact on Matching Algorithm

### Score Boost/Penalty System:
- **High Quality (6-10)**: Boost of up to +7 compatibility points
- **Average (5)**: No change (neutral)
- **Low Quality (1-4)**: Penalty of up to -8 compatibility points

### Calculation Formula:
```
Quality Boost = (profile_score - 5) * 1.5 (capped at +7)
Quality Penalty = (5 - profile_score) * 2 (capped at -8)
Final Score = Compatibility Score + Quality Adjustment + Account Status Boost
```

### Ranking Priority:
1. **Primary**: Final compatibility score (includes quality adjustment)
2. **Secondary**: Profile quality score
3. **Tertiary**: Spiritual compatibility breakdown
4. **Quaternary**: Number of unique match strengths

## Admin Interface Features

### Profile Scoring Modal
- **Interactive Slider**: 1-10 scale with visual feedback
- **Real-time Preview**: Shows profile summary while scoring
- **Scoring Guidelines**: Built-in reference for consistency
- **Action Integration**: Score assignment during approve/reject process
- **Audit Trail**: Tracks who scored when

### Visual Indicators
- **Admin Dashboard**: Color-coded badges showing profile scores
- **User Cards**: Quality indicators for non-default scores
- **Swipe Interface**: Quality badges visible to users

### Bulk Operations Support
- Score profiles during verification process
- Update scores for existing verified profiles
- Export scoring analytics and statistics

## User Experience Impact

### For High-Quality Profiles (8-10):
- **Priority Matching**: Appear first in discovery
- **Increased Visibility**: Boosted in recommendation algorithm
- **Premium Treatment**: Enhanced matching opportunities
- **Quality Recognition**: Visible quality badges

### For Average Profiles (5-7):
- **Standard Experience**: Normal matching behavior
- **Neutral Impact**: No significant boost or penalty
- **Improvement Opportunity**: Can be rescored if profile improves

### For Low-Quality Profiles (1-4):
- **Reduced Priority**: Lower in discovery ranking
- **Improvement Incentive**: Encouragement to enhance profile
- **Support Guidance**: Notification system for profile tips
- **Fair Treatment**: Still shown but with appropriate priority

## Analytics and Monitoring

### Profile Scoring Analytics View
```sql
SELECT * FROM profile_scoring_analytics;
```
Shows:
- Distribution of scores across user base
- Percentage breakdown by score
- Verified vs pending profile counts per score
- Trends and patterns

### Key Metrics to Track:
- Average profile score by admin
- Score distribution over time
- Correlation between scores and user engagement
- Profile improvement rates after scoring feedback

## Implementation Details

### Database Migration
```sql
-- Run the migration script
\i scripts/add-profile-scoring.sql
```

### Default Scoring
- **New Users**: Automatically assigned score of 5
- **Existing Users**: Migrated to default score of 5
- **Admin Verification**: Scores assigned during approval process

### API Integration
- Enhanced `/api/profiles/discover` with quality scoring
- Updated matching engine with profile score weighting
- Admin endpoints for score management

## Best Practices for Admins

### Consistency Guidelines:
1. **Review Photos First**: Quality and appropriateness
2. **Check Profile Completeness**: All major sections filled
3. **Assess Spiritual Depth**: Quality of spiritual content
4. **Evaluate Authenticity**: Genuine vs generic responses
5. **Consider Overall Effort**: Time and care invested

### Scoring Tips:
- **Be Consistent**: Use guidelines as reference
- **Document Reasoning**: Consider adding notes system
- **Regular Calibration**: Periodic team alignment on scoring
- **User Communication**: Send feedback for low scores

### Quality Assurance:
- **Review Score Distribution**: Ensure normal curve
- **Monitor User Feedback**: Track complaints or concerns
- **Regular Audits**: Check scoring consistency across admins
- **Update Guidelines**: Evolve based on platform needs

## Future Enhancements

### Potential Additions:
1. **AI-Assisted Scoring**: Machine learning predictions
2. **User Self-Assessment**: Profile improvement tools
3. **Dynamic Scoring**: Automatic updates based on activity
4. **Category Scoring**: Separate scores for photos, content, etc.
5. **Peer Review**: Multiple admin scoring for high-stakes profiles

### Technical Improvements:
1. **Advanced Analytics**: Deeper insights and trends
2. **Mobile Admin App**: Score profiles on mobile devices
3. **Bulk Operations**: Batch scoring tools
4. **Integration APIs**: Connect with external quality tools
5. **Machine Learning**: Predictive quality assessment

## Migration Steps

### To Enable Profile Scoring:
1. **Run Database Migration**: Execute `add-profile-scoring.sql`
2. **Deploy Code Changes**: Update admin interface and matching engine
3. **Train Admin Team**: Provide scoring guidelines and training
4. **Monitor Initial Rollout**: Track impact and adjust as needed
5. **Gather Feedback**: Iterate based on admin and user response

### Success Metrics:
- Improved match quality satisfaction scores
- Reduced fake/low-quality profiles in matching
- Increased user engagement with high-quality matches
- Better conversion rates from matches to messages
- Enhanced overall platform quality perception

---

**Note**: This system prioritizes quality profiles while maintaining fairness and encouraging profile improvement across all users. 