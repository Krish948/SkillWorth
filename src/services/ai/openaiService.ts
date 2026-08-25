export interface OpenAiAssessmentPrompt {
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

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '';

export async function generateOpenAiAssessment(prompt: OpenAiAssessmentPrompt): Promise<GeneratedQuestion[]> {
  if (!OPENAI_KEY || OPENAI_KEY.includes('your-openai')) {
    return [];
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical examiner. Return valid JSON containing array of questions for the given skill.',
          },
          {
            role: 'user',
            content: `Generate ${prompt.count || 3} technical assessment questions for skill: "${prompt.skillName}" at level: "${prompt.claimedLevel}". Return JSON format: [{ "question": string, "options": string[], "correctIndex": number, "explanation": string, "tier": 1|2|3, "concept": string }].`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch (err) {
    return [];
  }
}
