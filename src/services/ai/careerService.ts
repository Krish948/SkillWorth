import { callAiApi, cleanJsonString } from './nvidiaService';
import { RICH_CAREERS } from '@/data/careerDetails';

export interface SkillGapAnalysisResult {
  targetRole: string;
  verifiedSkills: string[];
  selfDeclaredSkills: string[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  alreadyStrongSkills: string[];
  partiallyDevelopedSkills: string[];
  prioritySkills: string[];
  recommendedLearningOrder: string[];
  readinessPercentage: number;
}

export class CareerService {
  /**
   * Compare ONLY verified skills (>75% pass score) against target role requirements
   */
  static analyzeSkillGap(
    targetRole: string,
    allUserSkills: Array<{ name: string; status: string; level: number }>
  ): SkillGapAnalysisResult {
    const roleDetail = RICH_CAREERS[targetRole] || RICH_CAREERS['Frontend Developer'];

    // ONLY count skills with status === 'VERIFIED' as verified
    const verifiedSkills = allUserSkills
      .filter(s => s.status === 'VERIFIED')
      .map(s => s.name);

    const selfDeclaredSkills = allUserSkills
      .filter(s => s.status !== 'VERIFIED')
      .map(s => s.name);

    const requiredSkills = [
      ...roleDetail.skillTiers.beginner,
      ...roleDetail.skillTiers.intermediate,
    ];

    const advancedSkills = roleDetail.skillTiers.advanced;

    const alreadyStrongSkills = verifiedSkills.filter(v =>
      requiredSkills.some(req => req.toLowerCase() === v.toLowerCase())
    );

    const partiallyDevelopedSkills = selfDeclaredSkills.filter(s =>
      requiredSkills.some(req => req.toLowerCase() === s.toLowerCase())
    );

    const missingRequiredSkills = requiredSkills.filter(req =>
      !verifiedSkills.some(v => v.toLowerCase() === req.toLowerCase())
    );

    const missingPreferredSkills = advancedSkills.filter(adv =>
      !verifiedSkills.some(v => v.toLowerCase() === adv.toLowerCase())
    );

    const prioritySkills = [
      ...missingRequiredSkills.slice(0, 3),
      ...partiallyDevelopedSkills.slice(0, 2),
    ];

    const recommendedLearningOrder = Array.from(
      new Set([...missingRequiredSkills, ...partiallyDevelopedSkills, ...missingPreferredSkills])
    );

    const readinessPercentage = requiredSkills.length > 0
      ? Math.round((alreadyStrongSkills.length / requiredSkills.length) * 100)
      : 0;

    return {
      targetRole,
      verifiedSkills,
      selfDeclaredSkills,
      missingRequiredSkills,
      missingPreferredSkills,
      alreadyStrongSkills,
      partiallyDevelopedSkills,
      prioritySkills,
      recommendedLearningOrder,
      readinessPercentage,
    };
  }

  /**
   * Get AI-generated personalized career match guidance
   */
  static async getCareerGuidance(targetRole: string, interests: string[], skills: string[]): Promise<string | null> {
    const messages = [
      {
        role: 'system',
        content: 'You are an executive career advisor powered by AI. Provide a concise 2-sentence match rationale and strategic growth advice.',
      },
      {
        role: 'user',
        content: `Target Role: "${targetRole}"
Candidate Interests: ${interests.join(', ')}
Candidate Verified Skills: ${skills.join(', ')}
Provide strategic career advice:`,
      },
    ];

    return await callAiApi(messages, 0.4, 256);
  }
}
