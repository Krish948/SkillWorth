import { describe, expect, it } from 'vitest';
import { evaluateCareerQuiz, QuizAnswer } from './quiz-engine';

describe('quiz-engine', () => {
  it('evaluates career quiz and ranks relevant tech careers', () => {
    const answers: QuizAnswer = {
      interests: ['web design', 'ui/ux', 'building apps'],
      strengths: ['creativity', 'problem solving'],
      workingStyle: 'collaborative',
      preferences: ['collaborative'],
      relevantAbilities: ['coding & syntax', 'ui wireframing'],
    };

    const currentSkills = ['HTML', 'CSS', 'JavaScript', 'React'];
    const results = evaluateCareerQuiz(answers, currentSkills);

    expect(results.length).toBeGreaterThan(0);
    const topResult = results[0];
    expect(topResult.role).toBe('Frontend Developer');
    expect(topResult.matchPercentage).toBeGreaterThanOrEqual(50);
    expect(topResult.explanation).toContain('Frontend Developer');
    expect(topResult.recommendedRoadmap.length).toBe(4);
  });
});
