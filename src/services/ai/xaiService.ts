export interface GrokInterviewPrompt {
  role: string;
  mode: string;
  previousQuestion?: string;
  candidateAnswer?: string;
}

const XAI_KEY = import.meta.env.VITE_XAI_API_KEY || import.meta.env.XAI_API_KEY || '';

export async function generateGrokInterviewFollowUp(prompt: GrokInterviewPrompt): Promise<string | null> {
  if (!XAI_KEY || XAI_KEY.includes('your-xai')) {
    return null;
  }

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: `You are an expert technical interviewer for the role of ${prompt.role} conducting a ${prompt.mode} interview. Ask sharp, relevant follow-up questions probing candidate's technical design, edge-case handling, and architectural trade-offs based on their previous answer.`,
          },
          {
            role: 'user',
            content: `Previous Question: "${prompt.previousQuestion || 'N/A'}"\nCandidate Answer: "${prompt.candidateAnswer || 'N/A'}"\nGenerate the next direct, single follow-up question.`,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    return null;
  }
}
