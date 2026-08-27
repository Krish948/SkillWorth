export interface AiAssessmentPrompt {
  skillName: string;
  claimedLevel: string;
  count?: number;
}

export type NvidiaAssessmentPrompt = AiAssessmentPrompt;

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tier: 1 | 2 | 3;
  concept: string;
}

export interface AiResumeExtractResult {
  extractedSkills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  evidence: { skill: string; evidenceText: string }[];
  recommendations: string[];
}

export type NvidiaResumeExtractResult = AiResumeExtractResult;

export interface AiInterviewPrompt {
  role: string;
  mode: string;
  previousQuestion?: string;
  candidateAnswer?: string;
}

export type NvidiaInterviewPrompt = AiInterviewPrompt;

const ACTIVE_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'deepseek-ai/deepseek-v4-pro-0813',
  'stepfun-ai/step-3.7-flash'
];

function getApiKey(): string {
  const env = import.meta.env;
  return (
    env.VITE_AI_API_KEY ||
    env.AI_API_KEY ||
    env.VITE_NVIDIA_API_KEY ||
    env.NVIDIA_API_KEY ||
    ''
  ).trim();
}

/**
 * Execute chat completion with automatic model fallback over active API endpoints
 */
export async function callAiApi(messages: { role: string; content: string }[], temperature = 0.3, maxTokens = 1024): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.includes('your-key') || apiKey.includes('your-nvidia') || apiKey.includes('your-ai')) {
    return null;
  }

  for (const model of ACTIVE_MODELS) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string' && content.trim().length > 0) {
        return content;
      }
    } catch {
      // Try next candidate model
      continue;
    }
  }

  return null;
}

/**
 * Clean JSON output from LLM responses (strips markdown ```json wrapper)
 */
export function cleanJsonString(rawText: string): string {
  let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrack = cleaned.indexOf('[');
  const lastBrack = cleaned.lastIndexOf(']');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrack !== -1 && lastBrack !== -1 && (firstBrace === -1 || firstBrack < firstBrace)) {
    cleaned = cleaned.substring(firstBrack, lastBrack + 1);
  } else if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * 1. Skill Assessment & Adaptive Quiz Generation via AI API
 */
export async function generateNvidiaAssessmentQuestions(prompt: AiAssessmentPrompt): Promise<GeneratedQuestion[]> {
  const messages = [
    {
      role: 'system',
      content: 'You are a senior technical examiner powered by AI. Return strictly valid JSON array of question objects for the requested skill.',
    },
    {
      role: 'user',
      content: `Generate ${prompt.count || 3} technical assessment questions for skill: "${prompt.skillName}" at level: "${prompt.claimedLevel}". Return valid JSON array format: [{ "question": string, "options": string[], "correctIndex": number, "explanation": string, "tier": 1|2|3, "concept": string }]. Ensure options has 4 strings and correctIndex is between 0 and 3.`,
    },
  ];

  const content = await callAiApi(messages, 0.2, 1024);
  if (!content) return [];

  try {
    const cleanJson = cleanJsonString(content);
    const parsed = JSON.parse(cleanJson);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch {
    return [];
  }
}

export const generateAssessmentQuestions = generateNvidiaAssessmentQuestions;

/**
 * 2. Resume Document Analysis & Skill Evidence Extraction via AI API
 */
export async function analyzeResumeWithNvidia(resumeText: string, targetRole: string): Promise<AiResumeExtractResult | null> {
  const messages = [
    {
      role: 'system',
      content: 'You are an advanced ATS resume parsing engine powered by AI. Return strictly valid JSON object.',
    },
    {
      role: 'user',
      content: `Analyze this resume for target role "${targetRole}". Return valid JSON object with keys: extractedSkills (string[]), education (string[]), experience (string[]), projects (string[]), certifications (string[]), evidence ({skill: string, evidenceText: string}[]), recommendations (string[]).\n\nResume Text:\n${resumeText}`,
    },
  ];

  const content = await callAiApi(messages, 0.2, 1024);
  if (!content) return null;

  try {
    const cleanJson = cleanJsonString(content);
    const parsed = JSON.parse(cleanJson);
    return {
      extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch {
    return null;
  }
}

export const analyzeResumeWithAi = analyzeResumeWithNvidia;

/**
 * 3. Mock Interview Conversational Follow-Up via AI API
 */
export async function generateNvidiaInterviewFollowUp(prompt: AiInterviewPrompt): Promise<string | null> {
  const messages = [
    {
      role: 'system',
      content: `You are a senior technical interviewer powered by AI conducting a ${prompt.mode} interview for ${prompt.role}. Ask a sharp, single concise follow-up question probing technical design or architectural trade-offs based on the candidate's previous response. Do not add intro greetings, output just the follow-up question.`,
    },
    {
      role: 'user',
      content: `Previous Question: "${prompt.previousQuestion || 'N/A'}"\nCandidate Answer: "${prompt.candidateAnswer || 'N/A'}"\nGenerate next follow-up question.`,
    },
  ];

  return await callAiApi(messages, 0.4, 256);
}

export const generateInterviewFollowUp = generateNvidiaInterviewFollowUp;

/**
 * 4. Dynamic Career Match Guidance & Rationale via AI API
 */
export async function generateCareerMatchGuidance(
  targetRole: string,
  userInterests: string[],
  userSkills: string[]
): Promise<string | null> {
  const messages = [
    {
      role: 'system',
      content: 'You are an executive career coach powered by AI. Provide a concise 2-sentence match rationale and strategic growth advice.',
    },
    {
      role: 'user',
      content: `Target Role: "${targetRole}"\nUser Interests: ${userInterests.join(', ')}\nUser Skills: ${userSkills.join(', ')}\nProvide high-impact career advice.`,
    },
  ];

  return await callAiApi(messages, 0.4, 256);
}
