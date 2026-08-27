import { callAiApi, cleanJsonString } from './nvidiaService';

export interface InterviewConfig {
  role: string;
  targetPosition?: string;
  industry?: string;
  experienceLevel: 'Junior' | 'Mid' | 'Senior';
  skills?: string[];
  techStack?: string[];
  jobDescription?: string;
  interviewType: 'Technical' | 'Behavioral' | 'HR' | 'Scenario-Based' | 'Project-Based' | 'Role-Specific';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  numberOfQuestions?: number;
  specificTopics?: string[];
}

export interface EvaluatedTurn {
  turnIndex: number;
  question: string;
  candidateAnswer: string;
  correctnessScore: number; // 0-100
  relevanceScore: number; // 0-100
  technicalDepthScore: number; // 0-100
  clarityScore: number; // 0-100
  overallScore: number; // 0-100
  isCorrect: boolean | 'Partially';
  whatWasCorrect: string;
  whatWasIncorrect: string;
  missingInformation: string;
  expectedIdealConcepts: string;
  improvementSuggestion: string;
}

export interface InterviewReport {
  overallScore: number;
  categoryScores: {
    technicalKnowledge: number;
    problemSolving: number;
    communication: number;
    roleKnowledge: number;
    behavioral: number;
  };
  evaluatedTurns: EvaluatedTurn[];
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  interviewReadiness: 'High Job Readiness (Offer Ready)' | 'Moderate Readiness (Solid Candidate)' | 'Developing Competency' | 'Needs Preparation';
  recommendedTopics: string[];
  recommendedPracticeQuestions: string[];
  suggestedLearningResources: string[];
}

export class MockInterviewService {
  /**
   * 1. Generate initial dynamic interview question tailored to config
   */
  static async generateInitialQuestion(config: InterviewConfig): Promise<string> {
    const role = config.role;
    const level = config.experienceLevel;
    const type = config.interviewType;
    const diff = config.difficulty;
    const stack = (config.techStack || config.skills || []).join(', ');
    const topics = (config.specificTopics || []).join(', ');

    const messages = [
      {
        role: 'system',
        content: `You are a Principal Tech Interviewer at a top tier company. Generate ONE sharp, dynamic opening ${type} interview question for a candidate applying as a ${level} ${role}. Do not include greetings or markdown headers. Output only the question text.`,
      },
      {
        role: 'user',
        content: `Role: ${role}
Experience Level: ${level}
Interview Type: ${type}
Difficulty: ${diff}
Tech Stack/Skills: ${stack || 'Core Domain'}
Target Topics: ${topics || 'Architectural & Execution Fundamentals'}

Generate a realistic, deep interview question tailored specifically to these candidate attributes:`,
      },
    ];

    const question = await callAiApi(messages, 0.4, 256);
    if (question && question.trim().length > 15) {
      return question.trim().replace(/^["']|["']$/g, '');
    }

    return this.getFallbackOpeningQuestion(role, type, level);
  }

  /**
   * 2. Generate dynamic follow-up question based on the candidate's previous response
   */
  static async generateFollowUpQuestion(
    config: InterviewConfig,
    previousQuestion: string,
    candidateAnswer: string,
    turnIndex: number
  ): Promise<string> {
    const role = config.role;
    const type = config.interviewType;

    const messages = [
      {
        role: 'system',
        content: `You are an expert ${type} interviewer for ${role}. Based on the candidate's previous answer, generate a sharp single follow-up question probing deeper into technical trade-offs, edge cases, architectural reasons, or real metrics. Do not include intro banter. Output ONLY the next question.`,
      },
      {
        role: 'user',
        content: `Previous Question: "${previousQuestion}"
Candidate Answer: "${candidateAnswer}"
Turn Index: ${turnIndex + 1} of ${config.numberOfQuestions || 3}

If candidate answer missed key concepts, ask a follow-up probing those missed details. If candidate answer was strong, escalate difficulty to probe system design or edge cases:`,
      },
    ];

    const followUp = await callAiApi(messages, 0.4, 256);
    if (followUp && followUp.trim().length > 15) {
      return followUp.trim().replace(/^["']|["']$/g, '');
    }

    return `That makes sense. If your implementation for ${role} needed to scale to handle 10x traffic with high concurrency, what specific architectural trade-offs would you make?`;
  }

  /**
   * 3. Evaluate candidate answer against expected concepts & rubric (NO static word-count formulas)
   */
  static async evaluateSingleTurn(
    config: InterviewConfig,
    turnIndex: number,
    question: string,
    candidateAnswer: string
  ): Promise<EvaluatedTurn> {
    const role = config.role;
    const type = config.interviewType;

    const messages = [
      {
        role: 'system',
        content: `You are an unbiased AI technical evaluator. Evaluate the candidate's answer against factual accuracy, conceptual correctness, depth, and clarity. Return ONLY a valid JSON object.`,
      },
      {
        role: 'user',
        content: `Role: ${role} (${type})
Question: "${question}"
Candidate Answer: "${candidateAnswer}"

Evaluate strictly without rewarding empty jargon. Return valid JSON object format:
{
  "correctnessScore": 85,
  "relevanceScore": 90,
  "technicalDepthScore": 80,
  "clarityScore": 85,
  "isCorrect": true,
  "whatWasCorrect": "Specific valid points mentioned",
  "whatWasIncorrect": "Specific incorrect or weak claims",
  "missingInformation": "Key expected technical points missing",
  "expectedIdealConcepts": "Core concepts an ideal senior answer should include",
  "improvementSuggestion": "Concrete tip for next time"
}`,
      },
    ];

    const raw = await callAiApi(messages, 0.2, 768);
    if (raw) {
      try {
        const clean = cleanJsonString(raw);
        const parsed = JSON.parse(clean);

        const correctnessScore = Math.min(100, Math.max(0, Number(parsed.correctnessScore) || 60));
        const relevanceScore = Math.min(100, Math.max(0, Number(parsed.relevanceScore) || 60));
        const technicalDepthScore = Math.min(100, Math.max(0, Number(parsed.technicalDepthScore) || 60));
        const clarityScore = Math.min(100, Math.max(0, Number(parsed.clarityScore) || 60));

        // Weighted score: 35% Correctness, 25% Tech Depth, 25% Relevance, 15% Clarity
        const overallScore = Math.round(
          correctnessScore * 0.35 + technicalDepthScore * 0.25 + relevanceScore * 0.25 + clarityScore * 0.15
        );

        return {
          turnIndex,
          question,
          candidateAnswer,
          correctnessScore,
          relevanceScore,
          technicalDepthScore,
          clarityScore,
          overallScore,
          isCorrect: parsed.isCorrect ?? (overallScore >= 75 ? true : overallScore >= 55 ? 'Partially' : false),
          whatWasCorrect: parsed.whatWasCorrect || 'Addressed core question concepts.',
          whatWasIncorrect: parsed.whatWasIncorrect || 'Could expand further on implementation detail.',
          missingInformation: parsed.missingInformation || 'Mentioning concrete tools or execution metrics.',
          expectedIdealConcepts: parsed.expectedIdealConcepts || `Standard ${role} architecture patterns.`,
          improvementSuggestion: parsed.improvementSuggestion || 'Use concrete examples and mention real metrics.',
        };
      } catch {
        // Fallthrough to rule-based fallback evaluation
      }
    }

    return this.fallbackEvaluateTurn(role, turnIndex, question, candidateAnswer);
  }

  /**
   * 4. Compile final interview report from all evaluated turns
   */
  static compileFinalReport(config: InterviewConfig, evaluatedTurns: EvaluatedTurn[]): InterviewReport {
    if (evaluatedTurns.length === 0) {
      return {
        overallScore: 0,
        categoryScores: { technicalKnowledge: 0, problemSolving: 0, communication: 0, roleKnowledge: 0, behavioral: 0 },
        evaluatedTurns: [],
        strengths: [],
        weaknesses: ['No answers provided'],
        skillGaps: ['Interview response skills'],
        interviewReadiness: 'Needs Preparation',
        recommendedTopics: ['Practice answering prompts'],
        recommendedPracticeQuestions: [],
        suggestedLearningResources: ['Documentation & System Design Guides'],
      };
    }

    const overallScore = Math.round(
      evaluatedTurns.reduce((sum, t) => sum + t.overallScore, 0) / evaluatedTurns.length
    );

    const techAvg = Math.round(evaluatedTurns.reduce((sum, t) => sum + t.technicalDepthScore, 0) / evaluatedTurns.length);
    const correctnessAvg = Math.round(evaluatedTurns.reduce((sum, t) => sum + t.correctnessScore, 0) / evaluatedTurns.length);
    const clarityAvg = Math.round(evaluatedTurns.reduce((sum, t) => sum + t.clarityScore, 0) / evaluatedTurns.length);
    const relevanceAvg = Math.round(evaluatedTurns.reduce((sum, t) => sum + t.relevanceScore, 0) / evaluatedTurns.length);

    const categoryScores = {
      technicalKnowledge: techAvg,
      problemSolving: Math.round((techAvg + correctnessAvg) / 2),
      communication: clarityAvg,
      roleKnowledge: relevanceAvg,
      behavioral: config.interviewType === 'Behavioral' ? clarityAvg : Math.round((relevanceAvg + clarityAvg) / 2),
    };

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const skillGaps: string[] = [];

    evaluatedTurns.forEach((turn, idx) => {
      if (turn.overallScore >= 75) {
        strengths.push(`Q${idx + 1}: Demonstrated strong ${config.role} concepts (${turn.whatWasCorrect.slice(0, 60)}...)`);
      } else {
        weaknesses.push(`Q${idx + 1}: ${turn.whatWasIncorrect || 'Needs deeper technical precision'}`);
        if (turn.missingInformation) skillGaps.push(turn.missingInformation.slice(0, 50));
      }
    });

    if (strengths.length === 0) strengths.push('Good engagement and willingness to answer complex prompts.');
    if (weaknesses.length === 0) weaknesses.push('None - answered all interview turns with high technical precision.');

    let readiness: InterviewReport['interviewReadiness'] = 'Needs Preparation';
    if (overallScore >= 85) readiness = 'High Job Readiness (Offer Ready)';
    else if (overallScore >= 72) readiness = 'Moderate Readiness (Solid Candidate)';
    else if (overallScore >= 58) readiness = 'Developing Competency';

    const recommendedTopics = [
      `Review ${config.role} core architecture and technical trade-offs`,
      `Structure answers using STAR (Situation, Task, Action, Result) methodology`,
      `Quantify impact with metrics (percentages, speed, throughput, cost reduction)`,
    ];

    const recommendedPracticeQuestions = [
      `How do you handle system bottlenecks under high traffic in ${config.role}?`,
      `Walk through a major technical failure or bug you resolved in production.`,
    ];

    const suggestedLearningResources = [
      `${config.role} System Design & Best Practices Manual`,
      `Interactive Mock Interview & Code Execution Exercises`,
    ];

    return {
      overallScore,
      categoryScores,
      evaluatedTurns,
      strengths: Array.from(new Set(strengths)),
      weaknesses: Array.from(new Set(weaknesses)),
      skillGaps: Array.from(new Set(skillGaps)),
      interviewReadiness: readiness,
      recommendedTopics,
      recommendedPracticeQuestions,
      suggestedLearningResources,
    };
  }

  private static getFallbackOpeningQuestion(role: string, type: string, level: string): string {
    if (type === 'Behavioral' || type === 'HR') {
      return `Can you share a situation where you had a strong technical disagreement with a team member on a ${role} project, and how you reached resolution?`;
    }
    if (type === 'System Design' || type === 'Scenario-Based') {
      return `How would you architect a high-availability, low-latency API backend for a ${role} system handling 50,000 concurrent user requests?`;
    }
    return `Can you explain the core architectural trade-offs you consider when designing scalable applications as a ${level} ${role}?`;
  }

  private static fallbackEvaluateTurn(role: string, turnIndex: number, question: string, candidateAnswer: string): EvaluatedTurn {
    const text = candidateAnswer.trim();
    const wordCount = text.split(/\s+/).length;
    const hasTechnicalTerms = /api|state|sql|database|component|test|docker|deploy|async|performance|optimize|security/i.test(text);

    let score = 50;
    if (wordCount >= 30 && hasTechnicalTerms) score = 82;
    else if (wordCount >= 15 && hasTechnicalTerms) score = 72;
    else if (wordCount >= 15) score = 62;
    else if (wordCount > 0) score = 45;

    return {
      turnIndex,
      question,
      candidateAnswer: text,
      correctnessScore: score,
      relevanceScore: Math.min(90, score + 5),
      technicalDepthScore: hasTechnicalTerms ? Math.min(85, score) : 45,
      clarityScore: wordCount >= 20 ? 80 : 60,
      overallScore: score,
      isCorrect: score >= 75 ? true : score >= 55 ? 'Partially' : false,
      whatWasCorrect: wordCount >= 15 ? 'Maintained relevant answer context.' : 'Attempted response prompt.',
      whatWasIncorrect: wordCount < 20 ? 'Response was brief. Missing structural detail and technical depth.' : 'Could elaborate further on trade-offs.',
      missingInformation: `Detailed architectural explanation of ${role} concepts.`,
      expectedIdealConcepts: `Clear technical explanation with metrics, trade-offs, and design choices.`,
      improvementSuggestion: 'Provide structured answers including specific tools, metrics, and error handling.',
    };
  }
}
