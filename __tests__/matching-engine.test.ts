import { AdvancedMatchingEngine } from '@/lib/matching-engine';
import { UserProfile } from '@/lib/data-service';

function createBaseProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const base: UserProfile = {
    id: (Math.random() * 100000).toString(),
    phone: '9999999999',
    mobile_verified: true,
    email_verified: true,
    is_onboarded: true,
    super_likes_count: 0,
    swipe_count: 0,
    message_highlights_count: 0,
    created_at: new Date('2020-01-01').toISOString(),
    updated_at: new Date('2020-01-01').toISOString(),
  } as any; // Cast to any first, then merge to satisfy partial
  return { ...base, ...overrides } as UserProfile;
}

describe('AdvancedMatchingEngine', () => {
  const engine = new AdvancedMatchingEngine();

  it('returns a high spiritual compatibility when profiles share key spiritual factors', () => {
    const user = createBaseProfile({
      daily_practices: ['Meditation', 'Japa'],
      spiritual_org: ['ISKCON'],
      temple_visit_freq: 'Weekly',
      diet: 'Vegetarian',
      artha_vs_moksha: 'Moksha-focused',
    });

    const target = createBaseProfile({
      daily_practices: ['Meditation', 'Japa'],
      spiritual_org: ['ISKCON'],
      temple_visit_freq: 'Weekly',
      diet: 'Vegetarian',
      artha_vs_moksha: 'Moksha-focused',
    });

    const result = engine.calculateCompatibility(user, target);

    expect(result.breakdown.spiritual).toBeGreaterThanOrEqual(80);
    expect(result.total).toBeGreaterThan(70);
  });

  it('returns a lower spiritual compatibility when profiles differ significantly', () => {
    const user = createBaseProfile({
      daily_practices: ['Meditation', 'Yoga'],
      spiritual_org: ['ISKCON'],
      temple_visit_freq: 'Daily',
      diet: 'Vegan',
      artha_vs_moksha: 'Moksha-focused',
    });

    const target = createBaseProfile({
      daily_practices: ['None'],
      spiritual_org: ['None'],
      temple_visit_freq: 'Never',
      diet: 'Non-Vegetarian',
      artha_vs_moksha: 'Artha-focused',
    });

    const result = engine.calculateCompatibility(user, target);

    expect(result.breakdown.spiritual).toBeLessThanOrEqual(30);
    expect(result.total).toBeLessThan(result.breakdown.lifestyle + result.breakdown.psychological + 1); // total shouldn't be dominated by spiritual here
  });
}); 