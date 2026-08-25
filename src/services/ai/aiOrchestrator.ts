import {
  generateNvidiaAssessmentQuestions,
  analyzeResumeWithNvidia,
  generateNvidiaInterviewFollowUp,
  GeneratedQuestion,
  NvidiaResumeExtractResult,
} from './nvidiaService';

export class AiOrchestrator {
  /**
   * 1. Skill Assessments & Adaptive Quizzes -> Dedicated NVIDIA AI Service
   */
  static async getAssessmentQuestions(skillName: string, claimedLevel: string): Promise<GeneratedQuestion[]> {
    return await generateNvidiaAssessmentQuestions({ skillName, claimedLevel, count: 4 });
  }

  /**
   * 2. Resume Document Intelligence & Skill Extraction -> Dedicated NVIDIA AI Service
   */
  static async analyzeResume(resumeText: string, targetRole: string): Promise<NvidiaResumeExtractResult | null> {
    return await analyzeResumeWithNvidia(resumeText, targetRole);
  }

  /**
   * 3. Mock Interview Conversational Follow-ups -> Dedicated NVIDIA AI Service
   */
  static async getInterviewFollowUp(role: string, mode: string, prevQuestion: string, answerText: string): Promise<string | null> {
    return await generateNvidiaInterviewFollowUp({
      role,
      mode,
      previousQuestion: prevQuestion,
      candidateAnswer: answerText,
    });
  }
}
