import { describe, expect, it } from 'vitest';
import { parseResumeText } from './resume-parser';

describe('resume-parser', () => {
  it('extracts skills, education, and evaluates match score against target career', () => {
    const resumeSample = `
      JANE DOE
      B.Tech Computer Science graduate
      Skills: JavaScript, TypeScript, React, HTML, CSS, Git, Node.js, SQL, Next.js, Redux, REST API
      Experience: Frontend Developer Intern at TechCorp. Built responsive dashboards using React and TypeScript.
      Projects: SaaS E-Commerce Web App with Stripe integration.
    `;

    const result = parseResumeText(resumeSample, 'Frontend Developer');

    expect(result.extractedSkills).toContain('React');
    expect(result.extractedSkills).toContain('TypeScript');
    expect(result.extractedSkills).toContain('JavaScript');
    expect(result.skillMatches.length).toBeGreaterThan(0);
    expect(result.matchScore).toBeGreaterThanOrEqual(40);
    expect(result.jobReadinessImpact).toBeGreaterThan(0);
  });
});
