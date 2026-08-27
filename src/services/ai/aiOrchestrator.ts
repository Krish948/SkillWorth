import { SkillAssessmentService, QuizQuestionPrompt, QuizQuestion } from './skillAssessmentService';
import { MockInterviewService, InterviewConfig, EvaluatedTurn, InterviewReport } from './mockInterviewService';
import { ResumeAnalysisService, DetailedResumeAnalysis } from './resumeAnalysisService';
import { CareerService, SkillGapAnalysisResult } from './careerService';
import { GeneratedQuestion, NvidiaResumeExtractResult } from './nvidiaService';

export class AiOrchestrator {
  /**
   * 1. Skill Assessments & Topic-Relevant Randomized Quizzes
   */
  static async getAssessmentQuestions(skillName: string, claimedLevel: string, topic?: string): Promise<GeneratedQuestion[]> {
    const quizQuestions = await SkillAssessmentService.generateQuizQuestions({
      skillName,
      topic: topic || 'Core Fundamentals',
      difficulty: claimedLevel,
      count: 4,
    });

    return quizQuestions.map(q => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      tier: q.tier === 4 ? 3 : q.tier,
      concept: q.concept,
    }));
  }

  /**
   * 2. Resume Document Intelligence & Transparent ATS Score Engine
   */
  static async analyzeResume(resumeText: string, targetRole: string, jobDescription?: string): Promise<DetailedResumeAnalysis> {
    return await ResumeAnalysisService.analyzeResume({
      resumeText,
      targetRole,
      jobDescription,
    });
  }

  /**
   * 3. Mock Interview Question Generation & Follow-ups
   */
  static async getInterviewOpeningQuestion(config: InterviewConfig): Promise<string> {
    return await MockInterviewService.generateInitialQuestion(config);
  }

  static async getInterviewFollowUp(
    role: string,
    mode: string,
    prevQuestion: string,
    answerText: string
  ): Promise<string | null> {
    return await MockInterviewService.generateFollowUpQuestion(
      {
        role,
        interviewType: mode as any,
        experienceLevel: 'Mid',
        difficulty: 'Medium',
      },
      prevQuestion,
      answerText,
      1
    );
  }

  static async evaluateInterviewTurn(
    config: InterviewConfig,
    turnIndex: number,
    question: string,
    candidateAnswer: string
  ): Promise<EvaluatedTurn> {
    return await MockInterviewService.evaluateSingleTurn(config, turnIndex, question, candidateAnswer);
  }

  static compileInterviewReport(config: InterviewConfig, turns: EvaluatedTurn[]): InterviewReport {
    return MockInterviewService.compileFinalReport(config, turns);
  }

  /**
   * 4. Career Match Rationale & Skill Gap Analysis
   */
  static async getCareerGuidance(targetRole: string, interests: string[], skills: string[]): Promise<string | null> {
    return await CareerService.getCareerGuidance(targetRole, interests, skills);
  }

  static analyzeSkillGap(
    targetRole: string,
    userSkills: Array<{ name: string; status: string; level: number }>
  ): SkillGapAnalysisResult {
    return CareerService.analyzeSkillGap(targetRole, userSkills);
  }
}
