export type InterviewMode = 'Technical' | 'HR' | 'Behavioral' | 'Project-Based' | 'Resume-Based' | 'Role-Specific';
export type ExperienceLevel = 'Junior' | 'Mid' | 'Senior';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  idealAnswerKey: string;
  hint: string;
}

export interface InterviewTurn {
  question: string;
  candidateAnswer: string;
  feedback?: string;
}

export interface CareerInterviewBank {
  role: string;
  topics: string[];
  questions: InterviewQuestion[];
}

export const INTERVIEW_BANKS: Record<string, CareerInterviewBank> = {
  'Frontend Developer': {
    role: 'Frontend Developer',
    topics: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'Performance & Accessibility'],
    questions: [
      {
        id: 'fe-1',
        category: 'JavaScript',
        question: 'Explain the difference between microtasks and macrotasks in the JavaScript Event Loop, and give an example of each.',
        idealAnswerKey: 'Microtasks (Promises, process.nextTick, queueMicrotask) run immediately after the current script executes before rendering. Macrotasks (setTimeout, setInterval, I/O) run on subsequent event loop ticks.',
        hint: 'Think about Promise.then vs setTimeout callbacks.',
      },
      {
        id: 'fe-2',
        category: 'React',
        question: 'How does React Virtual DOM diffing algorithm work, and why are unique keys required when rendering lists?',
        idealAnswerKey: 'React uses a heuristic O(n) diffing algorithm comparing element types and keys. Unique keys help React identify which items changed, were added, or were removed across re-renders without re-mounting the entire list DOM node structure.',
        hint: 'Focus on reconciliation and element identity.',
      },
      {
        id: 'fe-3',
        category: 'Performance',
        question: 'What strategies would you use to optimize Largest Contentful Paint (LCP) and reduce Cumulative Layout Shift (CLS)?',
        idealAnswerKey: 'For LCP: prioritize hero image fetching, preconnect fonts, serve next-gen formats, and reduce server response time. For CLS: specify explicit width/height on images and media, reserve layout space, and avoid dynamic top banner insertions without layout containment.',
        hint: 'Mention explicit dimensions, font preloading, and resource prioritization.',
      },
    ],
  },

  'Data Analyst': {
    role: 'Data Analyst',
    topics: ['SQL', 'Excel', 'Python', 'Statistics', 'Data Interpretation'],
    questions: [
      {
        id: 'da-1',
        category: 'SQL',
        question: 'What is the difference between WHERE and HAVING clauses in SQL, and when would you use a Window Function like RANK() over GROUP BY?',
        idealAnswerKey: 'WHERE filters rows before aggregation occurs, while HAVING filters aggregated group results after GROUP BY. Window functions calculate aggregations across partitions without collapsing individual rows.',
        hint: 'Consider execution order and row collapse vs row preservation.',
      },
      {
        id: 'da-2',
        category: 'Statistics',
        question: 'Explain what a p-value represents in a hypothesis test and how you would explain statistical significance to a business stakeholder.',
        idealAnswerKey: 'A p-value measures the probability of observing test results at least as extreme as observed, assuming the null hypothesis is true. A p-value below alpha (0.05) indicates the observed difference is unlikely due to random noise alone.',
        hint: 'Avoid claiming p-value is the probability that the null hypothesis is true.',
      },
      {
        id: 'da-3',
        category: 'Data Interpretation',
        question: 'If user retention drops by 15% following a new feature release, how would you investigate the root cause using data?',
        idealAnswerKey: 'Segment retention drop by platform/device, cohort release date, user demographics, and feature interaction metrics. Compare dropoff funnels and run anomaly detection across underlying telemetry.',
        hint: 'Structure your response with segmentation, cohort analysis, and funnel dropoff checks.',
      },
    ],
  },

  'Backend Developer': {
    role: 'Backend Developer',
    topics: ['System Design', 'Databases', 'REST/gRPC', 'Security', 'Caching'],
    questions: [
      {
        id: 'be-1',
        category: 'Databases',
        question: 'Compare ACID properties in relational databases with BASE properties in NoSQL databases. When would you choose PostgreSQL over MongoDB?',
        idealAnswerKey: 'ACID guarantees Atomicity, Consistency, Isolation, and Durability for strict transactional integrity. BASE prioritize Basic Availability, Soft state, and Eventual consistency. Choose Postgres when relational joins, strict schema enforcement, and financial transactions are required.',
        hint: 'Discuss transactional guarantees vs horizontal scale/schema flexibility.',
      },
      {
        id: 'be-2',
        category: 'Caching',
        question: 'How do Redis Cache Aside, Write Through, and Write Back caching strategies differ?',
        idealAnswerKey: 'Cache Aside: App queries cache first; on miss, loads from DB and writes to cache. Write Through: App writes to cache, which synchronously updates DB. Write Back: App writes to cache, which asynchronously writes to DB in background batches.',
        hint: 'Focus on read/write sequence and consistency tradeoffs.',
      },
    ],
  },
};

export function getInterviewBankForRole(role: string): CareerInterviewBank {
  if (INTERVIEW_BANKS[role]) {
    return INTERVIEW_BANKS[role];
  }
  return INTERVIEW_BANKS['Frontend Developer'];
}

export function generateDynamicFollowUp(
  role: string,
  mode: InterviewMode,
  previousQuestion: string,
  candidateAnswerText: string,
): string {
  const answerLower = candidateAnswerText.toLowerCase();

  // Dynamic Keyword Probing
  if (answerLower.includes('honeypot')) {
    return 'You mentioned building a honeypot system. How did you detect and classify suspicious activity, and what safeguards prevented attackers from using your honeypot to pivot into internal networks?';
  }
  if (answerLower.includes('microservices') || answerLower.includes('microservice')) {
    return 'Since you mentioned a microservices architecture, how did you manage service-to-service authentication, distributed transaction consistency, and cascading failures?';
  }
  if (answerLower.includes('redux') || answerLower.includes('zustand') || answerLower.includes('state')) {
    return 'You highlighted state management in your answer. How do you prevent unnecessary selector re-renders and structure complex async side-effects in production?';
  }
  if (answerLower.includes('acid') || answerLower.includes('postgres') || answerLower.includes('sql')) {
    return 'You brought up relational database guarantees. How do you handle deadlocks under high concurrency and optimize complex SQL join queries?';
  }
  if (answerLower.includes('docker') || answerLower.includes('kubernetes') || answerLower.includes('ci/cd')) {
    return 'You referenced deployment containerization. How do you optimize Docker image layer caching and manage environment secrets securely in your deployment pipeline?';
  }
  if (answerLower.includes('a/b test') || answerLower.includes('cohort') || answerLower.includes('funnel')) {
    return 'Following up on your analytics approach: how do you ensure sample ratio mismatch (SRM) does not bias your statistical evaluation during A/B tests?';
  }

  // Mode-Specific Contextual Follow-Ups
  if (mode === 'HR' || mode === 'Behavioral') {
    return `Can you walk me through a specific conflict or technical disagreement you encountered while applying that approach, and how you reached alignment with your team?`;
  }
  if (mode === 'Project-Based' || mode === 'Resume-Based') {
    return `That’s a helpful overview. What was the single biggest technical trade-off or bottleneck you faced in that implementation, and what would you re-architect if you built it again today?`;
  }

  // General Role-Specific Dynamic Follow-Up
  return `That makes sense. If your solution needed to scale to 10x current traffic or handle unexpected edge-case inputs, what specific architectural modifications would you make to maintain reliability?`;
}

export function evaluateInterviewResponse(
  question: InterviewQuestion,
  userAnswerText: string,
): {
  technicalAccuracyScore: number;
  communicationScore: number;
  confidenceScore: number;
  overallScore: number;
  feedback: string[];
  weakAreas: string[];
} {
  const answerLower = userAnswerText.toLowerCase();
  const keyWords = question.idealAnswerKey.toLowerCase().split(/\s+/).filter(w => w.length > 4);

  let matchedWordCount = 0;
  keyWords.forEach(kw => {
    if (answerLower.includes(kw)) matchedWordCount++;
  });

  const matchRatio = keyWords.length > 0 ? matchedWordCount / keyWords.length : 0.5;
  const wordCount = userAnswerText.trim().split(/\s+/).length;

  let technicalAccuracyScore = Math.min(95, Math.max(30, Math.round(matchRatio * 100 + (wordCount >= 25 ? 15 : 0))));
  let communicationScore = wordCount >= 30 ? 88 : wordCount >= 15 ? 75 : 55;
  let confidenceScore = wordCount >= 40 ? 90 : 70;

  if (userAnswerText.trim().length === 0) {
    technicalAccuracyScore = 0;
    communicationScore = 0;
    confidenceScore = 0;
  }

  const overallScore = Math.round(technicalAccuracyScore * 0.5 + communicationScore * 0.3 + confidenceScore * 0.2);

  const feedback: string[] = [];
  const weakAreas: string[] = [];

  if (technicalAccuracyScore >= 75) {
    feedback.push(`Strong technical coverage of ${question.category} concepts.`);
  } else {
    feedback.push(`Needs deeper technical precision regarding ${question.category}. Review key terminology.`);
    weakAreas.push(question.category);
  }

  if (wordCount < 20) {
    feedback.push('Elaborate more in your response. Provide real-world code or operational examples.');
  } else {
    feedback.push('Clear structural flow and explanation length.');
  }

  return {
    technicalAccuracyScore,
    communicationScore,
    confidenceScore,
    overallScore,
    feedback,
    weakAreas,
  };
}

export function generateInterviewReport(
  role: string,
  mode: InterviewMode,
  turns: InterviewTurn[],
): {
  overallScore: number;
  technicalAccuracyScore: number;
  communicationScore: number;
  confidenceScore: number;
  strongAnswers: string[];
  weakAnswers: string[];
  missingConcepts: string[];
  recommendedTopics: string[];
  readinessLevel: string;
} {
  if (turns.length === 0) {
    return {
      overallScore: 0,
      technicalAccuracyScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      strongAnswers: [],
      weakAnswers: [],
      missingConcepts: ['No answers provided'],
      recommendedTopics: ['Practice answering interview prompts'],
      readinessLevel: 'Needs Preparation',
    };
  }

  let totalTech = 0;
  let totalComm = 0;
  let totalConf = 0;
  const strongAnswers: string[] = [];
  const weakAnswers: string[] = [];
  const missingConcepts: string[] = [];

  turns.forEach((turn, idx) => {
    const wordCount = turn.candidateAnswer.trim().split(/\s+/).length;
    let tech = Math.min(95, Math.max(35, Math.round(wordCount * 1.8)));
    let comm = wordCount >= 25 ? 85 : 60;
    let conf = wordCount >= 35 ? 88 : 65;

    if (wordCount >= 25) {
      strongAnswers.push(`Turn ${idx + 1}: ${turn.question.slice(0, 50)}...`);
    } else {
      weakAnswers.push(`Turn ${idx + 1}: ${turn.question.slice(0, 50)}... (Answer was brief)`);
      missingConcepts.push(`Elaborate on ${role} implementation details for Question ${idx + 1}`);
    }

    totalTech += tech;
    totalComm += comm;
    totalConf += conf;
  });

  const avgTech = Math.round(totalTech / turns.length);
  const avgComm = Math.round(totalComm / turns.length);
  const avgConf = Math.round(totalConf / turns.length);
  const overallScore = Math.round(avgTech * 0.5 + avgComm * 0.3 + avgConf * 0.2);

  let readinessLevel = 'Needs Preparation';
  if (overallScore >= 85) readinessLevel = 'High Job Readiness (Offer Ready)';
  else if (overallScore >= 70) readinessLevel = 'Moderate Readiness (Solid Candidate)';
  else if (overallScore >= 55) readinessLevel = 'Developing Competency';

  const recommendedTopics = [
    `Deepen technical explanations for ${role} architecture`,
    `Use STAR method (Situation, Task, Action, Result) for structured responses`,
    `Include measurable metrics and edge-case error handling in answers`,
  ];

  return {
    overallScore,
    technicalAccuracyScore: avgTech,
    communicationScore: avgComm,
    confidenceScore: avgConf,
    strongAnswers,
    weakAnswers,
    missingConcepts,
    recommendedTopics,
    readinessLevel,
  };
}
