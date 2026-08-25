export interface NvidiaAssessmentPrompt {
  skillName: string;
  claimedLevel: string;
  count?: number;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tier: 1 | 2 | 3;
  concept: string;
}

export interface NvidiaResumeExtractResult {
  extractedSkills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  evidence: { skill: string; evidenceText: string }[];
  recommendations: string[];
}

export interface NvidiaInterviewPrompt {
  role: string;
  mode: string;
  previousQuestion?: string;
  candidateAnswer?: string;
}

const NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY || import.meta.env.NVIDIA_API_KEY || '';

/**
 * 1. Skill Assessment & Adaptive Quiz Generation via NVIDIA API
 */
export async function generateNvidiaAssessmentQuestions(prompt: NvidiaAssessmentPrompt): Promise<GeneratedQuestion[]> {
  if (!NVIDIA_KEY || NVIDIA_KEY.includes('your-nvidia')) {
    return [];
  }

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical examiner powered by NVIDIA AI. Return strictly valid JSON array of questions for the specified skill.',
          },
          {
            role: 'user',
            content: `Generate ${prompt.count || 3} technical assessment questions for skill: "${prompt.skillName}" at level: "${prompt.claimedLevel}". Return valid JSON array format: [{ "question": string, "options": string[], "correctIndex": number, "explanation": string, "tier": 1|2|3, "concept": string }].`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const cleanJson = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch (err) {
    return [];
  }
}

/**
 * 2. Resume Document Analysis & Skill Evidence Extraction via NVIDIA API
 */
export async function analyzeResumeWithNvidia(resumeText: string, targetRole: string): Promise<NvidiaResumeExtractResult | null> {
  if (!NVIDIA_KEY || NVIDIA_KEY.includes('your-nvidia')) {
    return null;
  }

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a senior ATS resume parsing engine powered by NVIDIA AI. Return strictly valid JSON.',
          },
          {
            role: 'user',
            content: `Analyze this resume for target role "${targetRole}". Return valid JSON with keys: extractedSkills (string[]), education (string[]), experience (string[]), projects (string[]), certifications (string[]), evidence ({skill: string, evidenceText: string}[]), recommendations (string[]).\n\nResume Text:\n${resumeText}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleanJson = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      extractedSkills: parsed.extractedSkills || [],
      education: parsed.education || [],
      experience: parsed.experience || [],
      projects: parsed.projects || [],
      certifications: parsed.certifications || [],
      evidence: parsed.evidence || [],
      recommendations: parsed.recommendations || [],
    };
  } catch (err) {
    return null;
  }
}

/**
 * 3. Mock Interview Conversational Follow-Up via NVIDIA API
 */
export async function generateNvidiaInterviewFollowUp(prompt: NvidiaInterviewPrompt): Promise<string | null> {
  if (!NVIDIA_KEY || NVIDIA_KEY.includes('your-nvidia')) {
    return null;
  }

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are a senior technical interviewer powered by NVIDIA AI conducting a ${prompt.mode} interview for ${prompt.role}. Ask a sharp, single follow-up question probing technical design or architecture trade-offs based on the candidate's previous response.`,
          },
          {
            role: 'user',
            content: `Previous Question: "${prompt.previousQuestion || 'N/A'}"\nCandidate Answer: "${prompt.candidateAnswer || 'N/A'}"\nGenerate next follow-up question.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 256,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    return null;
  }
}
