import { describe, expect, it } from 'vitest';
import { getInterviewBankForRole, evaluateInterviewResponse } from './interview-engine';

describe('interview-engine', () => {
  it('returns role-specific interview bank', () => {
    const bank = getInterviewBankForRole('Data Analyst');
    expect(bank.role).toBe('Data Analyst');
    expect(bank.questions.length).toBeGreaterThan(0);
    expect(bank.questions[0].category).toBe('SQL');
  });

  it('evaluates mock interview answer accuracy and communication', () => {
    const bank = getInterviewBankForRole('Frontend Developer');
    const question = bank.questions[0];

    const answer = 'Microtasks include Promises and queueMicrotask which run right after the current script executes before rendering. Macrotasks like setTimeout, setInterval, and I/O run on subsequent event loop ticks.';
    const evalResult = evaluateInterviewResponse(question, answer);

    expect(evalResult.overallScore).toBeGreaterThanOrEqual(50);
    expect(evalResult.technicalAccuracyScore).toBeGreaterThan(30);
    expect(evalResult.feedback.length).toBeGreaterThan(0);
  });
});
