import { supabase } from '@/integrations/supabase/client';
import { getStorageJson, setStorageJson } from '@/lib/local-storage';

export interface AssessmentAttemptRecord {
  id?: string;
  userId?: string;
  skillName: string;
  topic: string;
  difficulty: string;
  questionsAttempted: number;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  percentage: number;
  verificationStatus: 'VERIFIED' | 'NOT_VERIFIED';
  strongConcepts: string[];
  weakConcepts: string[];
  studyRecommendations: string[];
  createdAtIso: string;
}

export interface InterviewSessionRecord {
  id?: string;
  userId?: string;
  role: string;
  mode: string;
  experienceLevel: string;
  difficulty: string;
  technicalAccuracyScore: number;
  communicationScore: number;
  confidenceScore: number;
  problemSolvingScore: number;
  overallScore: number;
  readinessLevel: string;
  strongAnswers: string[];
  weakAnswers: string[];
  detailedFeedback: any[];
  recommendedTopics: string[];
  createdAtIso: string;
}

export interface ResumeAnalysisRecord {
  id?: string;
  userId?: string;
  targetRole: string;
  atsScore: number;
  formattingScore: number;
  keywordScore: number;
  skillsScore: number;
  experienceScore: number;
  projectScore: number;
  contentScore: number;
  extractedSkills: string[];
  missingSkills: string[];
  formattingIssues: string[];
  recommendations: string[];
  createdAtIso: string;
}

export interface CareerPreferencesRecord {
  targetRole: string;
  targetIndustry: string;
  experienceLevel: string;
  preferredTech: string[];
  preferredWorkType: string;
}

export class DatabaseService {
  /**
   * 1. Save Skill Assessment Attempt
   */
  static async saveAssessmentAttempt(userId: string, record: AssessmentAttemptRecord): Promise<void> {
    // Local storage persistence
    const key = `skillworth:assessments:${userId}`;
    const existing = getStorageJson<AssessmentAttemptRecord[]>(key, []);
    setStorageJson(key, [record, ...existing]);

    // Supabase persistence
    if (userId) {
      try {
        await supabase.from('assessment_attempts' as any).insert({
          user_id: userId,
          skill_name: record.skillName,
          topic: record.topic,
          difficulty: record.difficulty,
          questions_attempted: record.questionsAttempted,
          correct_answers: record.correctAnswers,
          total_questions: record.totalQuestions,
          score: record.score,
          percentage: record.percentage,
          verification_status: record.verificationStatus,
          strong_concepts: record.strongConcepts,
          weak_concepts: record.weakConcepts,
          study_recommendations: record.studyRecommendations,
          created_at: record.createdAtIso,
        });
      } catch (err) {
        console.warn('Supabase saveAssessmentAttempt warning:', err);
      }
    }
  }

  /**
   * 2. Get Assessment Attempts for User
   */
  static async getAssessmentAttempts(userId: string): Promise<AssessmentAttemptRecord[]> {
    const key = `skillworth:assessments:${userId}`;
    const localRecords = getStorageJson<AssessmentAttemptRecord[]>(key, []);

    if (!userId) return localRecords;

    try {
      const { data, error } = await supabase
        .from('assessment_attempts' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        return data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          skillName: item.skill_name,
          topic: item.topic,
          difficulty: item.difficulty,
          questionsAttempted: item.questions_attempted,
          correctAnswers: item.correct_answers,
          totalQuestions: item.total_questions,
          score: item.score,
          percentage: Number(item.percentage),
          verificationStatus: item.verification_status,
          strongConcepts: item.strong_concepts || [],
          weakConcepts: item.weak_concepts || [],
          studyRecommendations: item.study_recommendations || [],
          createdAtIso: item.created_at,
        }));
      }
    } catch {
      // Fallback to local
    }

    return localRecords;
  }

  /**
   * 3. Save Interview Session
   */
  static async saveInterviewSession(userId: string, session: InterviewSessionRecord): Promise<void> {
    const key = `skillworth:interviews:${userId}`;
    const existing = getStorageJson<InterviewSessionRecord[]>(key, []);
    setStorageJson(key, [session, ...existing]);

    if (userId) {
      try {
        await supabase.from('interview_sessions' as any).insert({
          user_id: userId,
          role: session.role,
          mode: session.mode,
          experience_level: session.experienceLevel,
          difficulty: session.difficulty,
          technical_accuracy_score: session.technicalAccuracyScore,
          communication_score: session.communicationScore,
          confidence_score: session.confidenceScore,
          problem_solving_score: session.problemSolvingScore,
          overall_score: session.overallScore,
          readiness_level: session.readinessLevel,
          strong_answers: session.strongAnswers,
          weak_answers: session.weakAnswers,
          detailed_feedback: session.detailedFeedback,
          recommended_topics: session.recommendedTopics,
          created_at: session.createdAtIso,
        });
      } catch (err) {
        console.warn('Supabase saveInterviewSession warning:', err);
      }
    }
  }

  /**
   * 4. Get Interview Sessions
   */
  static async getInterviewSessions(userId: string): Promise<InterviewSessionRecord[]> {
    const key = `skillworth:interviews:${userId}`;
    const localRecords = getStorageJson<InterviewSessionRecord[]>(key, []);

    if (!userId) return localRecords;

    try {
      const { data, error } = await supabase
        .from('interview_sessions' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        return data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          role: item.role,
          mode: item.mode,
          experienceLevel: item.experience_level,
          difficulty: item.difficulty,
          technicalAccuracyScore: item.technical_accuracy_score,
          communicationScore: item.communication_score,
          confidenceScore: item.confidence_score,
          problemSolvingScore: item.problem_solving_score,
          overallScore: item.overall_score,
          readinessLevel: item.readiness_level,
          strongAnswers: item.strong_answers || [],
          weakAnswers: item.weak_answers || [],
          detailedFeedback: item.detailed_feedback || [],
          recommendedTopics: item.recommended_topics || [],
          createdAtIso: item.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    return localRecords;
  }

  /**
   * 5. Save Resume Analysis
   */
  static async saveResumeAnalysis(userId: string, record: ResumeAnalysisRecord): Promise<void> {
    const key = `skillworth:resumes:${userId}`;
    setStorageJson(key, record);

    if (userId) {
      try {
        await supabase.from('resume_analyses' as any).insert({
          user_id: userId,
          target_role: record.targetRole,
          ats_score: record.atsScore,
          formatting_score: record.formattingScore,
          keyword_score: record.keywordScore,
          skills_score: record.skillsScore,
          experience_score: record.experienceScore,
          project_score: record.projectScore,
          content_score: record.contentScore,
          extracted_skills: record.extractedSkills,
          missing_skills: record.missingSkills,
          formatting_issues: record.formattingIssues,
          recommendations: record.recommendations,
          created_at: record.createdAtIso,
        });
      } catch (err) {
        console.warn('Supabase saveResumeAnalysis warning:', err);
      }
    }
  }

  /**
   * 6. Save Career Preferences
   */
  static async saveCareerPreferences(userId: string, prefs: CareerPreferencesRecord): Promise<void> {
    const key = `skillworth:career-prefs:${userId}`;
    setStorageJson(key, prefs);

    if (userId) {
      try {
        await supabase.from('user_career_preferences' as any).upsert({
          user_id: userId,
          target_role: prefs.targetRole,
          target_industry: prefs.targetIndustry,
          experience_level: prefs.experienceLevel,
          preferred_tech: prefs.preferredTech,
          preferred_work_type: prefs.preferredWorkType,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveCareerPreferences warning:', err);
      }
    }
  }
}
