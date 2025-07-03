export const DAILY_PRACTICES = [
  'Meditation',
  'Yoga',
  'Chanting',
  'Prayer',
  'Scriptural Study',
  'Seva/Service',
  'Fasting',
  'Other'
] as const
export type DailyPractice = (typeof DAILY_PRACTICES)[number]
