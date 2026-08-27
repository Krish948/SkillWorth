-- Assessment attempts table
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  skill_name TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'NOT_VERIFIED' CHECK (verification_status IN ('VERIFIED', 'NOT_VERIFIED')),
  strong_concepts JSONB NOT NULL DEFAULT '[]',
  weak_concepts JSONB NOT NULL DEFAULT '[]',
  study_recommendations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assessment attempts" ON public.assessment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessment attempts" ON public.assessment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mock interview sessions table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Technical',
  experience_level TEXT NOT NULL DEFAULT 'Mid',
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  technical_accuracy_score INTEGER NOT NULL DEFAULT 0,
  communication_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  problem_solving_score INTEGER NOT NULL DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  readiness_level TEXT NOT NULL DEFAULT 'Needs Preparation',
  strong_answers JSONB NOT NULL DEFAULT '[]',
  weak_answers JSONB NOT NULL DEFAULT '[]',
  detailed_feedback JSONB NOT NULL DEFAULT '[]',
  recommended_topics JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own interview sessions" ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Resume analyses table
CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  ats_score INTEGER NOT NULL DEFAULT 0,
  formatting_score INTEGER NOT NULL DEFAULT 0,
  keyword_score INTEGER NOT NULL DEFAULT 0,
  skills_score INTEGER NOT NULL DEFAULT 0,
  experience_score INTEGER NOT NULL DEFAULT 0,
  project_score INTEGER NOT NULL DEFAULT 0,
  content_score INTEGER NOT NULL DEFAULT 0,
  extracted_skills JSONB NOT NULL DEFAULT '[]',
  missing_skills JSONB NOT NULL DEFAULT '[]',
  formatting_issues JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own resume analyses" ON public.resume_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume analyses" ON public.resume_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User career preferences table
CREATE TABLE IF NOT EXISTS public.user_career_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL DEFAULT 'Frontend Developer',
  target_industry TEXT DEFAULT 'Software & Technology',
  experience_level TEXT DEFAULT 'Fresher',
  preferred_tech JSONB DEFAULT '[]',
  preferred_work_type TEXT DEFAULT 'Remote',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_career_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own career preferences" ON public.user_career_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own career preferences" ON public.user_career_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own career preferences" ON public.user_career_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_career_preferences_updated_at BEFORE UPDATE ON public.user_career_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
