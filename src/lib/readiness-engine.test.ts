import { describe, expect, it } from 'vitest';
import { calculateMultiSignalReadiness } from './readiness-engine';
import { StudentSkill } from '@/contexts/ProfileContext';

describe('readiness-engine', () => {
  it('calculates multi-signal job readiness score', () => {
    const mockSkills: StudentSkill[] = [
      { id: '1', skillId: 's1', name: 'HTML', category: 'frontend', level: 3, levelName: 'Advanced', status: 'VERIFIED', updatedAtIso: '' },
      { id: '2', skillId: 's2', name: 'CSS', category: 'frontend', level: 3, levelName: 'Advanced', status: 'VERIFIED', updatedAtIso: '' },
      { id: '3', skillId: 's3', name: 'JavaScript', category: 'frontend', level: 3, levelName: 'Advanced', status: 'VERIFIED', updatedAtIso: '' },
      { id: '4', skillId: 's4', name: 'React', category: 'frontend', level: 3, levelName: 'Advanced', status: 'RESUME_DETECTED', updatedAtIso: '' },
    ];

    const breakdown = calculateMultiSignalReadiness('Frontend Developer', mockSkills, null, []);

    expect(breakdown.overallReadinessScore).toBeGreaterThan(0);
    expect(breakdown.verifiedSkillsScore).toBeGreaterThan(0);
    expect(breakdown.targetRole).toBe('Frontend Developer');
    expect(breakdown.recommendations.length).toBeGreaterThan(0);
  });
});
