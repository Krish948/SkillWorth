import { describe, expect, it } from 'vitest';
import { evaluateSkillAssessment, AssessmentQuestion } from './verification-engine';

function createMockQuestions(count: number): AssessmentQuestion[] {
  const questions: AssessmentQuestion[] = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      id: `q-${i}`,
      skillName: 'JavaScript',
      tier: 2,
      concept: `Concept ${i}`,
      question: `Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'Explanation',
    });
  }
  return questions;
}

describe('Skill Validation Engine - Exact > 75% Verification Rule', () => {
  it('marks 100% score as VERIFIED', () => {
    const questions = createMockQuestions(4);
    const userAnswers = questions.map(q => ({ question: q, selectedIndex: 0 })); // 4/4 correct = 100%

    const result = evaluateSkillAssessment('JavaScript', userAnswers);
    expect(result.verificationScore).toBe(100);
    expect(result.status).toBe('VERIFIED');
  });

  it('marks 80% score (e.g. 4/5) as VERIFIED', () => {
    const questions = createMockQuestions(5);
    const userAnswers = [
      { question: questions[0], selectedIndex: 0 },
      { question: questions[1], selectedIndex: 0 },
      { question: questions[2], selectedIndex: 0 },
      { question: questions[3], selectedIndex: 0 },
      { question: questions[4], selectedIndex: 1 }, // incorrect
    ]; // 4/5 = 80%

    const result = evaluateSkillAssessment('JavaScript', userAnswers);
    expect(result.verificationScore).toBe(80);
    expect(result.status).toBe('VERIFIED');
  });

  it('marks 76% score as VERIFIED', () => {
    // 19 / 25 = 76%
    const questions = createMockQuestions(25);
    const userAnswers = questions.map((q, idx) => ({
      question: q,
      selectedIndex: idx < 19 ? 0 : 1,
    }));

    const result = evaluateSkillAssessment('JavaScript', userAnswers);
    expect(result.verificationScore).toBe(76);
    expect(result.status).toBe('VERIFIED');
  });

  it('marks 75% score (3/4 correct) as VERIFIED', () => {
    const questions = createMockQuestions(4);
    const userAnswers = [
      { question: questions[0], selectedIndex: 0 },
      { question: questions[1], selectedIndex: 0 },
      { question: questions[2], selectedIndex: 0 },
      { question: questions[3], selectedIndex: 1 }, // incorrect
    ]; // 3/4 = 75%

    const result = evaluateSkillAssessment('JavaScript', userAnswers);
    expect(result.verificationScore).toBe(75);
    expect(result.status).toBe('VERIFIED');
  });

  it('marks 74% score as SELF_DECLARED (NOT VERIFIED)', () => {
    // 37 / 50 = 74%
    const questions = createMockQuestions(50);
    const userAnswers = questions.map((q, idx) => ({
      question: q,
      selectedIndex: idx < 37 ? 0 : 1,
    }));

    const result = evaluateSkillAssessment('JavaScript', userAnswers);
    expect(result.verificationScore).toBe(74);
    expect(result.status).toBe('SELF_DECLARED'); // Must NOT be verified
  });

  it('marks 50% score (2/4 correct) as SELF_DECLARED (NOT VERIFIED)', () => {
    const questions = createMockQuestions(4);
    const userAnswers = [
      { question: questions[0], selectedIndex: 0 },
      { question: questions[1], selectedIndex: 0 },
      { question: questions[2], selectedIndex: 1 }, // incorrect
      { question: questions[3], selectedIndex: 1 }, // incorrect
    ]; // 2/4 = 50%

    const result = evaluateSkillAssessment('JavaScript', userAnswers);
    expect(result.verificationScore).toBe(50);
    expect(result.status).toBe('SELF_DECLARED');
  });
});
