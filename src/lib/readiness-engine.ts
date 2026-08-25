import { StudentSkill, ResumeData, InterviewSession } from '@/contexts/ProfileContext';
import { RICH_CAREERS } from '@/data/careerDetails';

export interface ReadinessSignalBreakdown {
  verifiedSkillsScore: number; // 0-100 (Weight: 40%)
  technicalLevelScore: number; // 0-100 (Weight: 20%)
  projectsScore: number; // 0-100 (Weight: 15%)
  interviewScore: number; // 0-100 (Weight: 15%)
  resumeScore: number; // 0-100 (Weight: 10%)
  overallReadinessScore: number; // 0-100
  targetRole: string;
  matchedVerifiedCount: number;
  totalRequiredCount: number;
  explanation: string;
  recommendations: string[];
}

export function calculateMultiSignalReadiness(
  targetRole: string,
  skills: StudentSkill[],
  resumeData: ResumeData | null,
  interviewSessions: InterviewSession[],
): ReadinessSignalBreakdown {
  const career = RICH_CAREERS[targetRole] || RICH_CAREERS['Frontend Developer'];
  const allRequired = [
    ...career.skillTiers.beginner,
    ...career.skillTiers.intermediate,
    ...career.skillTiers.advanced,
  ];
  const uniqueRequired = Array.from(new Set(allRequired));

  // 1. Verified Skills Score (40%)
  const verifiedSkills = skills.filter(s => s.status === 'VERIFIED');
  const matchedVerified = uniqueRequired.filter(req =>
    verifiedSkills.some(v => v.name.toLowerCase() === req.toLowerCase()),
  );
  const verifiedSkillsScore = Math.min(100, Math.round((matchedVerified.length / Math.max(1, uniqueRequired.length)) * 100));

  // 2. Technical Level / Proficiency Score (20%)
  const matchedAllSkills = uniqueRequired.map(req => {
    const userSkill = skills.find(s => s.name.toLowerCase() === req.toLowerCase());
    return userSkill ? userSkill.level : 0;
  });
  const avgLevel = matchedAllSkills.length > 0 ? matchedAllSkills.reduce((a, b) => a + b, 0) / matchedAllSkills.length : 0;
  const technicalLevelScore = Math.min(100, Math.round((avgLevel / 4) * 100));

  // 3. Projects Score (15%)
  const projectCount = resumeData?.projects ? resumeData.projects.length : 1;
  const projectsScore = Math.min(100, Math.round(projectCount * 33));

  // 4. Interview Performance Score (15%)
  const relevantInterviews = interviewSessions.filter(s => s.role === targetRole);
  const latestInterview = relevantInterviews[0] || interviewSessions[0];
  const interviewScore = latestInterview ? latestInterview.overallScore : 50; // default 50 baseline if not taken yet

  // 5. Resume Quality Score (10%)
  const resumeScore = resumeData ? resumeData.matchScore : 50; // default 50 baseline

  // Weighted Total
  const overallReadinessScore = Math.round(
    verifiedSkillsScore * 0.40 +
    technicalLevelScore * 0.20 +
    projectsScore * 0.15 +
    interviewScore * 0.15 +
    resumeScore * 0.10,
  );

  const recommendations: string[] = [];
  if (verifiedSkillsScore < 60) {
    recommendations.push(`Take skill validation assessments for missing required skills: ${uniqueRequired.filter(r => !matchedVerified.includes(r)).slice(0, 3).join(', ')}.`);
  }
  if (interviewScore < 70) {
    recommendations.push('Run another session in the Interview Simulator to increase your technical & communication interview signals.');
  }
  if (!resumeData) {
    recommendations.push('Upload your latest resume in Resume Analyzer to verify experience and project alignment.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Your readiness profile is highly competitive! You are ready to apply for job opportunities.');
  }

  const explanation = `Your Job Readiness for ${targetRole} is ${overallReadinessScore}%, calculated from 5 weighted signals: Verified Skills (40%), Technical Level (20%), Projects (15%), Interview Performance (15%), and Resume Quality (10%).`;

  return {
    verifiedSkillsScore,
    technicalLevelScore,
    projectsScore,
    interviewScore,
    resumeScore,
    overallReadinessScore,
    targetRole,
    matchedVerifiedCount: matchedVerified.length,
    totalRequiredCount: uniqueRequired.length,
    explanation,
    recommendations,
  };
}
