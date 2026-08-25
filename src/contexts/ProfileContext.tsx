import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSkills, useAllSkills, useAddUserSkill, useRemoveUserSkill, UserSkillRow } from '@/hooks/useUserSkills';
import { getStorageJson, setStorageJson } from '@/lib/local-storage';
import { supabase } from '@/integrations/supabase/client';
import { addNotification } from '@/lib/notifications';

export type SkillValidationStatus = 'SELF_DECLARED' | 'RESUME_DETECTED' | 'VERIFIED';
export type SkillLevelName = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface StudentSkill {
  id: string; // user_skill id or local key
  skillId: string;
  name: string;
  category: string;
  level: number; // 1 = Beginner, 2 = Intermediate, 3 = Advanced, 4 = Expert, 5 = Master
  levelName: SkillLevelName;
  status: SkillValidationStatus;
  updatedAtIso: string;
}

export interface QuizResult {
  completedAtIso: string;
  interests: string[];
  strengths: string[];
  workingStyle: string;
  recommendedCareers: { role: string; match: number; explanation: string }[];
  targetCareer: string;
}

export interface ResumeData {
  analyzedAtIso: string;
  extractedSkills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  strengths: string[];
  weaknesses: string[];
  targetCareer: string;
  matchScore: number;
}

export interface InterviewSession {
  id: string;
  dateIso: string;
  role: string;
  technicalAccuracyScore: number; // 0-100
  communicationScore: number; // 0-100
  confidenceScore: number; // 0-100
  overallScore: number; // 0-100
  feedback: string[];
  weakAreas: string[];
}

export interface StudentProfileState {
  targetCareer: string;
  skills: StudentSkill[];
  quizResult: QuizResult | null;
  resumeData: ResumeData | null;
  interviewSessions: InterviewSession[];
}

interface ProfileContextValue {
  profile: StudentProfileState;
  loading: boolean;
  setTargetCareer: (career: string) => void;
  addOrUpdateSkill: (skillName: string, category: string, level: number, status: SkillValidationStatus) => Promise<void>;
  verifySkill: (skillName: string) => void;
  removeSkill: (skillName: string) => Promise<void>;
  saveQuizResult: (result: QuizResult) => void;
  saveResumeData: (data: ResumeData) => void;
  addInterviewSession: (session: InterviewSession) => void;
  getVerifiedSkills: () => StudentSkill[];
  getSelfDeclaredSkills: () => StudentSkill[];
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function getLevelName(level: number): SkillLevelName {
  if (level <= 1) return 'Beginner';
  if (level === 2) return 'Intermediate';
  if (level === 3) return 'Advanced';
  return 'Expert';
}

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: allSkills = [] } = useAllSkills();
  const { data: userSkillsRows = [], isLoading: userSkillsLoading } = useUserSkills();
  const addSkillMutation = useAddUserSkill();
  const removeSkillMutation = useRemoveUserSkill();

  const [localTargetCareer, setLocalTargetCareer] = useState<string>('Frontend Developer');
  const [localSkillsMeta, setLocalSkillsMeta] = useState<Record<string, { status: SkillValidationStatus; updatedAtIso: string }>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);

  // Load target goal from Supabase profiles table
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('goals')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.goals) {
          setLocalTargetCareer(data.goals);
        }
      });
  }, [user?.id]);

  // Load persistent metadata from localStorage
  useEffect(() => {
    if (!user?.id) return;
    const key = `skillworth:student-profile:${user.id}`;
    const stored = getStorageJson<Partial<StudentProfileState>>(key, {});
    if (stored.targetCareer) setLocalTargetCareer(stored.targetCareer);
    if (stored.quizResult) setQuizResult(stored.quizResult);
    if (stored.resumeData) setResumeData(stored.resumeData);
    if (stored.interviewSessions) setInterviewSessions(stored.interviewSessions);

    const metaKey = `skillworth:skills-meta:${user.id}`;
    const storedMeta = getStorageJson<Record<string, { status: SkillValidationStatus; updatedAtIso: string }>>(metaKey, {});
    setLocalSkillsMeta(storedMeta);
  }, [user?.id]);

  // Persist metadata on update
  useEffect(() => {
    if (!user?.id) return;
    const key = `skillworth:student-profile:${user.id}`;
    setStorageJson(key, {
      targetCareer: localTargetCareer,
      quizResult,
      resumeData,
      interviewSessions,
    });
  }, [localTargetCareer, quizResult, resumeData, interviewSessions, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const metaKey = `skillworth:skills-meta:${user.id}`;
    setStorageJson(metaKey, localSkillsMeta);
  }, [localSkillsMeta, user?.id]);

  // Combine Supabase user_skills with local metadata (validation status)
  const skills: StudentSkill[] = useMemo(() => {
    return userSkillsRows.map(us => {
      const name = us.skills?.name || '';
      const category = us.skills?.category || 'general';
      const meta = localSkillsMeta[name] || { status: 'SELF_DECLARED', updatedAtIso: us.created_at };
      return {
        id: us.id,
        skillId: us.skill_id,
        name,
        category,
        level: us.level,
        levelName: getLevelName(us.level),
        status: meta.status,
        updatedAtIso: meta.updatedAtIso || us.created_at,
      };
    });
  }, [userSkillsRows, localSkillsMeta]);

  const setTargetCareer = (career: string) => {
    setLocalTargetCareer(career);
    if (user?.id) {
      supabase.from('profiles').update({ goals: career }).eq('user_id', user.id).then();
    }
  };

  const addOrUpdateSkill = async (skillName: string, category: string, level: number, status: SkillValidationStatus) => {
    // Check if skill exists in userSkillsRows
    const existing = userSkillsRows.find(us => us.skills?.name.toLowerCase() === skillName.toLowerCase());
    if (existing) {
      await addSkillMutation.mutateAsync({ skillId: existing.skill_id, level });
    } else {
      // Look up skill in allSkills DB table
      const matched = allSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
      if (matched) {
        await addSkillMutation.mutateAsync({ skillId: matched.id, level });
      }
    }

    setLocalSkillsMeta(prev => ({
      ...prev,
      [skillName]: { status, updatedAtIso: new Date().toISOString() },
    }));

    if (user?.id) {
      addNotification(user.id, {
        title: 'Skill Portfolio Updated',
        message: `Added/updated skill "${skillName}" at Level ${level} (${status}).`,
        type: 'success',
      });
    }
  };

  const verifySkill = (skillName: string) => {
    setLocalSkillsMeta(prev => ({
      ...prev,
      [skillName]: { status: 'VERIFIED', updatedAtIso: new Date().toISOString() },
    }));

    if (user?.id) {
      addNotification(user.id, {
        title: 'Skill Verified!',
        message: `Technical assessment passed! "${skillName}" upgraded to VERIFIED status.`,
        type: 'success',
      });
    }
  };

  const removeSkill = async (skillName: string) => {
    const existing = userSkillsRows.find(us => us.skills?.name.toLowerCase() === skillName.toLowerCase());
    if (existing) {
      await removeSkillMutation.mutateAsync(existing.id);
    }
    setLocalSkillsMeta(prev => {
      const next = { ...prev };
      delete next[skillName];
      return next;
    });

    if (user?.id) {
      addNotification(user.id, {
        title: 'Skill Removed',
        message: `Removed "${skillName}" from your portfolio.`,
        type: 'warning',
      });
    }
  };

  const saveQuizResult = (result: QuizResult) => {
    setQuizResult(result);
    if (result.targetCareer) {
      setTargetCareer(result.targetCareer);
    }
    if (user?.id) {
      addNotification(user.id, {
        title: 'Career DNA Quiz Completed',
        message: `Target career set to ${result.targetCareer || 'Frontend Developer'}.`,
        type: 'success',
      });
    }
  };

  const saveResumeData = (data: ResumeData) => {
    setResumeData(data);
    setLocalSkillsMeta(prev => {
      const next = { ...prev };
      data.extractedSkills.forEach(skillName => {
        if (!next[skillName]) {
          next[skillName] = { status: 'RESUME_DETECTED', updatedAtIso: new Date().toISOString() };
        }
      });
      return next;
    });
    if (user?.id) {
      addNotification(user.id, {
        title: 'Resume Analyzed',
        message: `Analyzed resume for ${data.targetCareer}. ${data.extractedSkills.length} skills extracted.`,
        type: 'info',
      });
    }
  };

  const addInterviewSession = (session: InterviewSession) => {
    setInterviewSessions(prev => [session, ...prev]);
    if (user?.id) {
      addNotification(user.id, {
        title: 'Mock Interview Recorded',
        message: `Technical simulation score for ${session.role}: ${session.overallScore}%.`,
        type: 'success',
      });
    }
  };

  const getVerifiedSkills = () => skills.filter(s => s.status === 'VERIFIED');
  const getSelfDeclaredSkills = () => skills.filter(s => s.status !== 'VERIFIED');

  const profileState: StudentProfileState = {
    targetCareer: localTargetCareer,
    skills,
    quizResult,
    resumeData,
    interviewSessions,
  };

  return (
    <ProfileContext.Provider
      value={{
        profile: profileState,
        loading: userSkillsLoading,
        setTargetCareer,
        addOrUpdateSkill,
        verifySkill,
        removeSkill,
        saveQuizResult,
        saveResumeData,
        addInterviewSession,
        getVerifiedSkills,
        getSelfDeclaredSkills,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export function useStudentProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useStudentProfile must be used within a ProfileProvider');
  }
  return context;
}
