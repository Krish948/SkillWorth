export interface GeminiResumeExtractResult {
  extractedSkills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  evidence: { skill: string; evidenceText: string }[];
  recommendations: string[];
}

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

export async function analyzeResumeWithGemini(resumeText: string, targetRole: string): Promise<GeminiResumeExtractResult | null> {
  if (!GEMINI_KEY || GEMINI_KEY.includes('your-gemini')) {
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze the following resume for the target role "${targetRole}". Return JSON format with fields: extractedSkills (string[]), education (string[]), experience (string[]), projects (string[]), certifications (string[]), evidence ({skill: string, evidenceText: string}[]), recommendations (string[]).\n\nResume Content:\n${resumeText}`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const cleanJson = rawText.replace(/```json|```/g, '').trim();
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
