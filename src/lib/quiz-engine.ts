import { RICH_CAREERS, CareerDetail } from '@/data/careerDetails';

export interface QuizAnswer {
  interests: string[];
  strengths: string[];
  workingStyle: string;
  preferences: string[];
  relevantAbilities: string[];
}

export interface CareerMatchResult {
  role: string;
  matchPercentage: number;
  explanation: string;
  requiredSkills: string[];
  skillReadiness: number;
  missingSkills: string[];
  recommendedRoadmap: string[];
  careerDetail: CareerDetail;
}

export function evaluateCareerQuiz(
  answers: QuizAnswer,
  currentSkillNames: string[],
): CareerMatchResult[] {
  const userSkillSet = new Set(currentSkillNames.map(s => s.toLowerCase()));
  const interestsSet = new Set(answers.interests.map(i => i.toLowerCase()));
  const strengthsSet = new Set(answers.strengths.map(s => s.toLowerCase()));
  const abilitiesSet = new Set(answers.relevantAbilities.map(a => a.toLowerCase()));

  const results: CareerMatchResult[] = Object.values(RICH_CAREERS).map(career => {
    const allRequired = [
      ...career.skillTiers.beginner,
      ...career.skillTiers.intermediate,
      ...career.skillTiers.advanced,
    ];
    const uniqueRequired = Array.from(new Set(allRequired));

    const matchedUserSkills = uniqueRequired.filter(s => userSkillSet.has(s.toLowerCase()));
    const missingSkills = uniqueRequired.filter(s => !userSkillSet.has(s.toLowerCase()));

    const skillReadiness = Math.round((matchedUserSkills.length / Math.max(1, uniqueRequired.length)) * 100);

    // Interest & preference alignment
    let interestBoost = 0;
    if (career.category === 'frontend' && (interestsSet.has('web design') || interestsSet.has('ui/ux') || interestsSet.has('building apps'))) {
      interestBoost += 25;
    }
    if (career.category === 'backend' && (interestsSet.has('databases') || interestsSet.has('system architecture') || interestsSet.has('apis'))) {
      interestBoost += 25;
    }
    if (career.category === 'full-stack' && (interestsSet.has('end-to-end products') || interestsSet.has('building apps'))) {
      interestBoost += 30;
    }
    if (career.category === 'data' && (interestsSet.has('ai/ml') || interestsSet.has('analytics') || interestsSet.has('statistics'))) {
      interestBoost += 30;
    }
    if (career.category === 'devops' && (interestsSet.has('automation') || interestsSet.has('cloud infrastructure') || interestsSet.has('linux'))) {
      interestBoost += 30;
    }

    // Strengths alignment
    if (strengthsSet.has('problem solving') || strengthsSet.has('logic')) {
      interestBoost += 10;
    }
    if (strengthsSet.has('creativity') && (career.category === 'frontend' || career.category === 'design')) {
      interestBoost += 15;
    }
    if (strengthsSet.has('math & statistics') && career.category === 'data') {
      interestBoost += 20;
    }

    // Working style
    if (answers.workingStyle === 'independent' && (career.category === 'backend' || career.category === 'data')) {
      interestBoost += 10;
    }
    if (answers.workingStyle === 'collaborative' && (career.category === 'frontend' || career.category === 'full-stack')) {
      interestBoost += 10;
    }

    const totalRawMatch = Math.round(skillReadiness * 0.5 + Math.min(50, interestBoost));
    const matchPercentage = Math.min(98, Math.max(35, totalRawMatch));

    // Construct personalized rationale explanation
    const explanation = `Recommended with a ${matchPercentage}% match because your interest in ${answers.interests.slice(0, 2).join(' & ')} aligns with ${career.role}'s core domain. You currently possess ${matchedUserSkills.length} out of ${uniqueRequired.length} key required skills (${matchedUserSkills.join(', ') || 'foundation skills needed'}).`;

    const recommendedRoadmap = [
      `Phase 1: Master Beginner Tier (${career.skillTiers.beginner.join(', ')})`,
      `Phase 2: Build ${career.recommendedProjects[0]?.title || 'Core Project'}`,
      `Phase 3: Upgrade to Intermediate Tier (${career.skillTiers.intermediate.slice(0, 3).join(', ')})`,
      `Phase 4: Complete ${career.requiredCertifications[0] || 'Professional Cert'} & Apply for Internships`,
    ];

    return {
      role: career.role,
      matchPercentage,
      explanation,
      requiredSkills: uniqueRequired,
      skillReadiness,
      missingSkills,
      recommendedRoadmap,
      careerDetail: career,
    };
  });

  return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
