import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names without duplicates', () => {
    const result = cn('bg-red-500', 'text-white', 'bg-red-500');
    expect(new Set(result.split(' ').filter(Boolean))).toEqual(new Set(['bg-red-500', 'text-white']));
  });

  it('handles conditional classes', () => {
    const condition = true;
    const result = cn('base', condition && 'active');
    expect(result).toContain('base');
    expect(result).toContain('active');
  });
}); 