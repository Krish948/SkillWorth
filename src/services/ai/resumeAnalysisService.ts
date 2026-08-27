import { callAiApi, cleanJsonString } from './nvidiaService';

export interface ResumeAnalysisPrompt {
  resumeText: string;
  targetRole: string;
  jobDescription?: string;
}

export interface AtsScoreBreakdown {
  overallAtsScore: number; // 0-100
  formattingScore: number; // 0-100 (Weight: 20%)
  keywordScore: number; // 0-100 (Weight: 25%)
  skillsScore: number; // 0-100 (Weight: 20%)
  experienceScore: number; // 0-100 (Weight: 15%)
  projectScore: number; // 0-100 (Weight: 10%)
  contentQualityScore: number; // 0-100 (Weight: 10%)
}

export interface DetailedResumeAnalysis {
  atsBreakdown: AtsScoreBreakdown;
  extractedSkills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  sectionsDetected: {
    contactInfo: boolean;
    summary: boolean;
    education: boolean;
    experience: boolean;
    projects: boolean;
    skills: boolean;
    certifications: boolean;
  };
  formattingIssues: string[];
  resumeProblems: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  jdMatchDetails?: {
    requiredSkillMatchScore: number;
    preferredSkillMatchScore: number;
    experienceRelevanceScore: number;
    educationMatchScore: number;
  };
}

export class ResumeAnalysisService {
  /**
   * Transparent ATS scoring engine analyzing actual resume content & JD matching
   */
  static async analyzeResume(prompt: ResumeAnalysisPrompt): Promise<DetailedResumeAnalysis> {
    const resumeText = prompt.resumeText;
    const targetRole = prompt.targetRole;
    const jd = prompt.jobDescription || '';

    const messages = [
      {
        role: 'system',
        content: `You are an expert ATS Resume Auditor and HR Parsing Engine. Return ONLY valid JSON analyzing the resume text.`,
      },
      {
        role: 'user',
        content: `Target Role: "${targetRole}"
Job Description: "${jd || 'Standard Industry Benchmark for ' + targetRole}"

Resume Text:
${resumeText}

Analyze the resume and return valid JSON with keys:
{
  "formattingScore": 85,
  "keywordScore": 80,
  "skillsScore": 75,
  "experienceScore": 70,
  "projectScore": 85,
  "contentQualityScore": 78,
  "extractedSkills": ["React", "TypeScript", "Node.js"],
  "matchedKeywords": ["REST API", "CI/CD"],
  "missingKeywords": ["Redux", "Docker"],
  "matchedSkills": ["React", "TypeScript"],
  "missingSkills": ["Docker", "GraphQL"],
  "sectionsDetected": {
    "contactInfo": true,
    "summary": true,
    "education": true,
    "experience": true,
    "projects": true,
    "skills": true,
    "certifications": false
  },
  "formattingIssues": ["Missing phone number", "No quantifiable metrics in project bullet 2"],
  "resumeProblems": ["Generic phrase used: 'worked on features'"],
  "strengths": ["Clear project descriptions with tech stack listed"],
  "weaknesses": ["Lack of metrics (percentages, speed, throughput)"],
  "recommendations": ["Quantify impact with numbers", "Add Docker and GraphQL to skills section"]
}`,
      },
    ];

    const raw = await callAiApi(messages, 0.2, 1024);
    if (raw) {
      try {
        const clean = cleanJsonString(raw);
        const parsed = JSON.parse(clean);

        const fmt = Math.min(100, Math.max(20, Number(parsed.formattingScore) || 75));
        const kw = Math.min(100, Math.max(20, Number(parsed.keywordScore) || 70));
        const sk = Math.min(100, Math.max(20, Number(parsed.skillsScore) || 70));
        const exp = Math.min(100, Math.max(20, Number(parsed.experienceScore) || 65));
        const prj = Math.min(100, Math.max(20, Number(parsed.projectScore) || 70));
        const cq = Math.min(100, Math.max(20, Number(parsed.contentQualityScore) || 70));

        // Exact weighted ATS formula:
        // Formatting 20%, Keywords 25%, Skills 20%, Experience 15%, Projects 10%, Content Quality 10%
        const overallAtsScore = Math.round(
          fmt * 0.20 + kw * 0.25 + sk * 0.20 + exp * 0.15 + prj * 0.10 + cq * 0.10
        );

        return {
          atsBreakdown: {
            overallAtsScore,
            formattingScore: fmt,
            keywordScore: kw,
            skillsScore: sk,
            experienceScore: exp,
            projectScore: prj,
            contentQualityScore: cq,
          },
          extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
          matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
          missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
          matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
          missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
          sectionsDetected: {
            contactInfo: parsed.sectionsDetected?.contactInfo ?? true,
            summary: parsed.sectionsDetected?.summary ?? true,
            education: parsed.sectionsDetected?.education ?? true,
            experience: parsed.sectionsDetected?.experience ?? true,
            projects: parsed.sectionsDetected?.projects ?? true,
            skills: parsed.sectionsDetected?.skills ?? true,
            certifications: parsed.sectionsDetected?.certifications ?? false,
          },
          formattingIssues: Array.isArray(parsed.formattingIssues) ? parsed.formattingIssues : [],
          resumeProblems: Array.isArray(parsed.resumeProblems) ? parsed.resumeProblems : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          jdMatchDetails: jd ? {
            requiredSkillMatchScore: sk,
            preferredSkillMatchScore: kw,
            experienceRelevanceScore: exp,
            educationMatchScore: fmt,
          } : undefined,
        };
      } catch {
        // Fallthrough to rule-based parser
      }
    }

    return this.ruleBasedAnalysis(resumeText, targetRole, jd);
  }

  /**
   * Transparent rule-based parser fallback using the exact 6-factor ATS formula
   */
  private static ruleBasedAnalysis(resumeText: string, targetRole: string, jd?: string): DetailedResumeAnalysis {
    const textLower = resumeText.toLowerCase();

    const sections = {
      contactInfo: textLower.includes('@') || textLower.includes('email') || textLower.includes('phone'),
      summary: textLower.includes('summary') || textLower.includes('objective') || textLower.includes('about'),
      education: textLower.includes('education') || textLower.includes('bachelor') || textLower.includes('degree'),
      experience: textLower.includes('experience') || textLower.includes('employment') || textLower.includes('work'),
      projects: textLower.includes('project') || textLower.includes('portfolio'),
      skills: textLower.includes('skill') || textLower.includes('technologies'),
      certifications: textLower.includes('certif'),
    };

    const formattingIssues: string[] = [];
    if (!sections.contactInfo) formattingIssues.push('Missing contact email/phone.');
    if (!sections.education) formattingIssues.push('Education section not detected.');
    if (!sections.experience && !sections.projects) formattingIssues.push('Neither experience nor project section detected.');
    if (resumeText.length < 200) formattingIssues.push('Resume content is too brief (less than 200 characters).');

    const formattingScore = Math.max(30, 100 - (formattingIssues.length * 18));
    const keywordScore = Math.min(95, Math.max(35, Math.round(resumeText.length * 0.03)));
    const skillsScore = sections.skills ? 85 : 50;
    const experienceScore = sections.experience ? 80 : 50;
    const projectScore = sections.projects ? 85 : 45;

    const hasNumbers = /\d+%|\d+x|\$\d+|\d+ users|\d+ ms/i.test(resumeText);
    const contentQualityScore = hasNumbers ? 85 : 60;

    const overallAtsScore = Math.round(
      formattingScore * 0.20 + keywordScore * 0.25 + skillsScore * 0.20 + experienceScore * 0.15 + projectScore * 0.10 + contentQualityScore * 0.10
    );

    return {
      atsBreakdown: {
        overallAtsScore,
        formattingScore,
        keywordScore,
        skillsScore,
        experienceScore,
        projectScore,
        contentQualityScore,
      },
      extractedSkills: [],
      matchedKeywords: [],
      missingKeywords: [],
      matchedSkills: [],
      missingSkills: [],
      sectionsDetected: sections,
      formattingIssues,
      resumeProblems: !hasNumbers ? ['Missing quantifiable metrics (percentages, speed, user count)'] : [],
      strengths: sections.projects ? ['Includes projects section'] : [],
      weaknesses: !hasNumbers ? ['Lacks quantifiable performance impact metrics'] : [],
      recommendations: ['Quantify project achievements with metrics (e.g. "improved load time by 30%").'],
    };
  }
}
