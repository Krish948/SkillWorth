import { callAiApi, cleanJsonString } from './nvidiaService';

export interface QuizQuestionPrompt {
  skillName: string;
  topic?: string;
  difficulty?: string;
  count?: number;
  existingQuestionTexts?: string[];
}

export interface QuizQuestion {
  id: string;
  skillName: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  concept: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tier: 1 | 2 | 3 | 4;
}

export interface QuizEvaluationResult {
  skillName: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  verificationStatus: 'VERIFIED' | 'NOT_VERIFIED';
  verifiedLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  strongConcepts: string[];
  weakConcepts: string[];
  skillGaps: string[];
  recommendedTopics: string[];
  recommendedNextAssessment: string;
}

export class SkillAssessmentService {
  /**
   * Generate randomized, topic-relevant assessment questions via AI with schema validation
   */
  static async generateQuizQuestions(prompt: QuizQuestionPrompt): Promise<QuizQuestion[]> {
    const skill = prompt.skillName;
    const topic = prompt.topic || 'General Concepts';
    const diff = prompt.difficulty || 'Intermediate';
    const count = prompt.count || 4;

    const messages = [
      {
        role: 'system',
        content: `You are an expert technical examiner. Generate structured JSON multiple-choice questions for technical skill validation. Output ONLY valid JSON array.`,
      },
      {
        role: 'user',
        content: `Generate ${count} distinct technical assessment questions for:
Skill: "${skill}"
Topic/Concept: "${topic}"
Difficulty Level: "${diff}"

Rules:
1. Each question must specifically test "${topic}" within "${skill}". Do not output generic unrelated questions.
2. Return JSON array format:
[
  {
    "question": "Clear problem statement or code snippet?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed conceptual explanation",
    "concept": "${topic}",
    "tier": 2
  }
]
3. Exactly 4 unique options per question.
4. correctIndex must be an integer between 0 and 3.`,
      },
    ];

    const rawContent = await callAiApi(messages, 0.3, 1500);
    if (!rawContent) return this.getFallbackQuestions(skill, topic, diff);

    try {
      const clean = cleanJsonString(rawContent);
      const parsed = JSON.parse(clean);
      const rawArray = Array.isArray(parsed) ? parsed : parsed.questions || [];

      const validQuestions: QuizQuestion[] = [];
      for (let i = 0; i < rawArray.length; i++) {
        const item = rawArray[i];
        if (
          item &&
          typeof item.question === 'string' &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          typeof item.correctIndex === 'number' &&
          item.correctIndex >= 0 &&
          item.correctIndex <= 3
        ) {
          validQuestions.push({
            id: `ai-q-${Date.now()}-${i}`,
            skillName: skill,
            topic: item.concept || topic,
            difficulty: (diff as any) || 'Intermediate',
            concept: item.concept || topic,
            question: item.question.trim(),
            options: item.options.map((o: any) => String(o).trim()),
            correctIndex: Math.floor(item.correctIndex),
            explanation: item.explanation || `Explanations for ${topic}`,
            tier: item.tier || (diff === 'Advanced' ? 3 : diff === 'Expert' ? 4 : 2),
          });
        }
      }

      if (validQuestions.length > 0) {
        return validQuestions;
      }
    } catch {
      // Fallback if parsing fails
    }

    return this.getFallbackQuestions(skill, topic, diff);
  }

  /**
   * Evaluate answers against the EXACT >75% verification rule:
   * Score > 75% -> VERIFIED (76%, 80%, 90%, 100%)
   * Score <= 75% -> NOT VERIFIED (75%, 74%, 50%)
   */
  static evaluateAssessment(
    skillName: string,
    topic: string,
    difficulty: string,
    answers: { question: QuizQuestion; selectedIndex: number }[]
  ): QuizEvaluationResult {
    let correctCount = 0;
    const totalQuestions = answers.length;
    const strongConcepts: string[] = [];
    const weakConcepts: string[] = [];

    answers.forEach(ans => {
      if (ans.selectedIndex === ans.question.correctIndex) {
        correctCount++;
        strongConcepts.push(ans.question.concept);
      } else {
        weakConcepts.push(ans.question.concept);
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const score = correctCount * 25; // 0-100 normalized score

    // EXACT RULE: > 75% triggers VERIFIED. 75% or below triggers NOT_VERIFIED.
    const verificationStatus: 'VERIFIED' | 'NOT_VERIFIED' = percentage > 75 ? 'VERIFIED' : 'NOT_VERIFIED';

    let verifiedLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Intermediate';
    if (difficulty === 'Advanced' || percentage >= 90) verifiedLevel = 'Advanced';
    if (difficulty === 'Expert' || (percentage >= 95 && difficulty === 'Advanced')) verifiedLevel = 'Expert';
    if (percentage <= 50) verifiedLevel = 'Beginner';

    const uniqueStrong = Array.from(new Set(strongConcepts));
    const uniqueWeak = Array.from(new Set(weakConcepts));

    const recommendedTopics = uniqueWeak.map(c => `Study and practice ${c} in ${skillName}`);
    if (recommendedTopics.length === 0) {
      recommendedTopics.push(`Master advanced pattern design and architecture for ${skillName}`);
    }

    const recommendedNextAssessment = verificationStatus === 'VERIFIED'
      ? `Attempt Next Level (${difficulty === 'Intermediate' ? 'Advanced' : 'Expert'}) for ${skillName}`
      : `Re-take ${skillName} (${topic}) assessment after reviewing ${uniqueWeak.slice(0, 2).join(', ')}`;

    return {
      skillName,
      topic,
      difficulty,
      totalQuestions,
      correctAnswers: correctCount,
      score,
      percentage,
      verificationStatus,
      verifiedLevel,
      strongConcepts: uniqueStrong,
      weakConcepts: uniqueWeak,
      skillGaps: uniqueWeak,
      recommendedTopics,
      recommendedNextAssessment,
    };
  }

  /**
   * Structured, reliable topic-relevant bank fallback when network/AI calls are unavailable
   */
  private static getFallbackQuestions(skill: string, topic: string, diff: string): QuizQuestion[] {
    return [
      {
        id: `fb-1-${Date.now()}`,
        skillName: skill,
        topic: topic,
        difficulty: (diff as any) || 'Intermediate',
        concept: `${topic} Execution`,
        question: `What is a primary best practice when working with ${topic} in ${skill}?`,
        options: [
          `Properly handle exceptions, maintain immutability, and follow standard architectural guidelines for ${topic}.`,
          `Bypass validation and disable security error logs.`,
          `Hardcode environment secrets directly inside source code.`,
          `Ignore performance profiling and memory allocations.`,
        ],
        correctIndex: 0,
        explanation: `Production ready ${skill} implementations require robust handling of ${topic}, explicit data boundaries, and proper error handling.`,
        tier: 2,
      },
      {
        id: `fb-2-${Date.now()}`,
        skillName: skill,
        topic: topic,
        difficulty: (diff as any) || 'Intermediate',
        concept: `${topic} Optimization`,
        question: `How do you optimize resource utilization and responsiveness when managing ${topic} in ${skill}?`,
        options: [
          `Duplicating objects synchronously across UI loops.`,
          `By profiling execution hot-paths, caching repeated lookups, and isolating async I/O.`,
          `Removing all unit test suites.`,
          `Increasing payload size unconditionally.`,
        ],
        correctIndex: 1,
        explanation: `Profiling hot-paths and memoizing/caching expensive ${topic} computations minimizes execution latency in ${skill}.`,
        tier: 3,
      },
      {
        id: `fb-3-${Date.now()}`,
        skillName: skill,
        topic: topic,
        difficulty: (diff as any) || 'Intermediate',
        concept: `${topic} Architecture`,
        question: `What is the key advantage of modular abstraction when structuring ${topic} in ${skill}?`,
        options: [
          `It increases system complexity without benefit.`,
          `It decouples business logic, simplifies unit testing, and enhances code maintainability.`,
          `It prevents code compilation.`,
          `It restricts API integration.`,
        ],
        correctIndex: 1,
        explanation: `Decoupling ${topic} logic ensures modularity, testability, and clean separation of concerns in ${skill}.`,
        tier: 2,
      },
      {
        id: `fb-4-${Date.now()}`,
        skillName: skill,
        topic: topic,
        difficulty: (diff as any) || 'Intermediate',
        concept: `${topic} Edge Cases`,
        question: `How should null/undefined or unexpected inputs be handled when processing ${topic}?`,
        options: [
          `Return arbitrary fallback numbers silently without logging.`,
          `Allow uncaught null reference exceptions to crash the application process.`,
          `Enforce input schema validation, check boundary conditions, and throw meaningful typed errors.`,
          `Disable type checking completely.`,
        ],
        correctIndex: 2,
        explanation: `Explicit input validation and boundary checking prevent unexpected runtime crashes when handling ${topic}.`,
        tier: 3,
      },
    ];
  }
}
