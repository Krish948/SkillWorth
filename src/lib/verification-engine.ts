import { SkillLevelName, SkillValidationStatus } from '@/contexts/ProfileContext';
import { AiOrchestrator } from '@/services/ai/aiOrchestrator';

export interface AssessmentQuestion {
  id: string;
  skillName: string;
  tier: 1 | 2 | 3; // 1 = Fundamentals, 2 = Intermediate/Practical, 3 = Advanced/Architecture
  concept: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VerificationResult {
  skillName: string;
  verificationScore: number; // 0-100%
  verifiedLevel: SkillLevelName;
  levelNumber: number; // 1-4
  status: SkillValidationStatus;
  strongConcepts: string[];
  weakConcepts: string[];
  studyRecommendations: string[];
}

export const SKILL_QUESTION_BANKS: Record<string, AssessmentQuestion[]> = {
  Python: [
    {
      id: 'py-1',
      skillName: 'Python',
      tier: 1,
      concept: 'Data Structures & Mutability',
      question: 'What is the key difference between a Python tuple and a list regarding mutability and memory efficiency?',
      options: [
        'Tuples are mutable and use more memory than lists.',
        'Lists are immutable while tuples can be modified in place.',
        'Tuples are immutable and generally more memory-efficient than lists.',
        'Both lists and tuples are immutable in Python.',
      ],
      correctIndex: 2,
      explanation: 'Tuples are immutable data structures in Python, allowing Python to allocate memory in a single block, making them lighter and faster than mutable lists.',
    },
    {
      id: 'py-2',
      skillName: 'Python',
      tier: 2,
      concept: 'Generators & Memory Management',
      question: 'How do Python generators differ from list comprehensions when processing large data streams?',
      options: [
        'Generators evaluate all elements immediately in memory.',
        'Generators use yield to lazily produce items one at a time, consuming far less memory.',
        'List comprehensions are slower because they use background threads.',
        'Generators can only handle string types.',
      ],
      correctIndex: 1,
      explanation: 'Generators return an iterator that produces items lazily using the yield statement, making them ideal for processing large datasets without loading everything into memory.',
    },
    {
      id: 'py-3',
      skillName: 'Python',
      tier: 3,
      concept: 'OOP & Decorators / Meta-programming',
      question: 'In Python, what is the role offunctools.wraps when creating custom function decorators?',
      options: [
        'It compiles the decorator into C extension code.',
        'It preserves the original function’s metadata such as __name__ and __doc__.',
        'It automatically caches function return values.',
        'It prevents exception bubbling.',
      ],
      correctIndex: 1,
      explanation: 'functools.wraps copies name, docstrings, and parameter annotations from the original wrapped function to the wrapper function.',
    },
    {
      id: 'py-4',
      skillName: 'Python',
      tier: 3,
      concept: 'GIL & Concurrency',
      question: 'How does the Global Interpreter Lock (GIL) impact multi-threaded CPU-bound execution in CPython?',
      options: [
        'It allows multiple threads to execute Python bytecode simultaneously across all CPU cores.',
        'It restricts execution to one native thread per process at a time, making multiprocessing better for CPU-bound tasks.',
        'It disables memory garbage collection during async loops.',
        'It converts synchronous code to non-blocking I/O.',
      ],
      correctIndex: 1,
      explanation: 'The GIL prevents CPython threads from running Python bytecode in parallel on multiple CPU cores. For CPU-bound parallelism, multiprocessing or C extensions are preferred.',
    },
  ],

  SQL: [
    {
      id: 'sql-1',
      skillName: 'SQL',
      tier: 1,
      concept: 'Joins & Null Handling',
      question: 'What is the primary difference between an INNER JOIN and a LEFT JOIN in SQL?',
      options: [
        'INNER JOIN returns matching rows from both tables; LEFT JOIN returns all rows from the left table and matched rows from the right.',
        'LEFT JOIN is faster because it bypasses indexes.',
        'INNER JOIN includes NULL rows from the right table.',
        'Both joins produce identical result sets in all cases.',
      ],
      correctIndex: 0,
      explanation: 'INNER JOIN filters out rows that do not match the join condition in both tables. LEFT JOIN retains all rows from the left table regardless of matches in the right table.',
    },
    {
      id: 'sql-2',
      skillName: 'SQL',
      tier: 2,
      concept: 'Aggregations & Grouping',
      question: 'What is the execution order difference between WHERE and HAVING clauses in SQL queries?',
      options: [
        'HAVING filters rows before GROUP BY; WHERE filters aggregated groups after.',
        'WHERE filters individual rows before grouping; HAVING filters aggregated groups after GROUP BY.',
        'WHERE can only be used with window functions.',
        'HAVING cannot filter on aggregate functions like COUNT().',
      ],
      correctIndex: 1,
      explanation: 'WHERE filters raw table rows prior to aggregation. HAVING filters grouped rows after aggregate functions (COUNT, SUM, AVG) have been evaluated.',
    },
    {
      id: 'sql-3',
      skillName: 'SQL',
      tier: 3,
      concept: 'Window Functions & Ranking',
      question: 'How does DENSE_RANK() differ from RANK() when encountering tie values in SQL window functions?',
      options: [
        'DENSE_RANK() skips rank numbers after a tie.',
        'RANK() leaves no gaps in ranking numbers.',
        'DENSE_RANK() produces consecutive rank numbers without skipping, while RANK() skips ranks after ties.',
        'DENSE_RANK() can only be used with text columns.',
      ],
      correctIndex: 2,
      explanation: 'RANK() assigns duplicate ranks to ties and skips subsequent ranks (e.g. 1, 2, 2, 4). DENSE_RANK() assigns duplicate ranks without skipping (e.g. 1, 2, 2, 3).',
    },
  ],

  React: [
    {
      id: 'react-1',
      skillName: 'React',
      tier: 1,
      concept: 'State & Component Lifecycle',
      question: 'Why should you never mutate React state directly (e.g. state.count = 5)?',
      options: [
        'Mutating state directly bypasses React’s re-rendering trigger and breaks component reconciliation.',
        'Direct mutation crashes JavaScript engines.',
        'React state is read-only at the browser hardware level.',
        'It causes automatic DOM page reloads.',
      ],
      correctIndex: 0,
      explanation: 'React relies on immutability to compare previous state references with new state references. Mutating state directly does not trigger component re-renders.',
    },
    {
      id: 'react-2',
      skillName: 'React',
      tier: 2,
      concept: 'Hooks & Dependency Array',
      question: 'In useEffect(fn, [deps]), what happens if a state variable used inside fn is omitted from the dependency array?',
      options: [
        'React throws a runtime syntax error.',
        'The effect can capture stale closure state values across re-renders.',
        'The effect runs on every single animation frame.',
        'The component automatically converts to a class component.',
      ],
      correctIndex: 1,
      explanation: 'Omitting reactive dependencies from the useEffect dependency array creates a stale closure, causing the effect to reference old variable values from earlier renders.',
    },
    {
      id: 'react-3',
      skillName: 'React',
      tier: 3,
      concept: 'Optimization & Reconciliation',
      question: 'When should React.useMemo or React.useCallback be applied to optimize component performance?',
      options: [
        'Wrap every single function and variable in every component unconditionally.',
        'Use them to memoize expensive computations or maintain referential identity for props passed to memoized child components.',
        'Use them to replace async API calls.',
        'They automatically fix layout shift issues.',
      ],
      correctIndex: 1,
      explanation: 'useMemo and useCallback avoid unnecessary re-computations or child re-renders when passing callbacks/values as props to memoized components.',
    },
  ],
};

export function getQuestionBankForSkill(skillName: string): AssessmentQuestion[] {
  if (SKILL_QUESTION_BANKS[skillName]) {
    return SKILL_QUESTION_BANKS[skillName];
  }
  return [
    {
      id: `${skillName.toLowerCase()}-gen-1`,
      skillName,
      tier: 1,
      concept: 'Core Concepts',
      question: `Which statement best describes core fundamentals of ${skillName}?`,
      options: [
        `${skillName} provides structured patterns and standards for solving domain problems.`,
        `${skillName} is deprecated and cannot be used in modern environments.`,
        `${skillName} applies only to legacy hardware systems.`,
        `None of the above.`,
      ],
      correctIndex: 0,
      explanation: `${skillName} establishes foundational patterns and practices within its technical domain.`,
    },
    {
      id: `${skillName.toLowerCase()}-gen-2`,
      skillName,
      tier: 2,
      concept: 'Practical Execution',
      question: `When implementing ${skillName} in production, what is a key operational requirement?`,
      options: [
        `Ignoring error handling and logging.`,
        `Ensuring proper configuration, security best practices, and robust exception handling.`,
        `Disabling network encryption.`,
        `Hardcoding secrets in source files.`,
      ],
      correctIndex: 1,
      explanation: `Production readiness for ${skillName} requires security, robust handling, and maintainable configuration.`,
    },
    {
      id: `${skillName.toLowerCase()}-gen-3`,
      skillName,
      tier: 3,
      concept: 'Architecture & Optimization',
      question: `How do you optimize performance and scalability when working with ${skillName}?`,
      options: [
        `By profiling bottlenecks, caching key assets, and maintaining modular architecture.`,
        `By duplicating code across all components.`,
        `By removing all tests.`,
        `By increasing server latency.`,
      ],
      correctIndex: 0,
      explanation: `Optimization involves profiling performance metrics, leveraging caching, and modular system design.`,
    },
  ];
}

export async function getAiGeneratedOrBankedQuestions(skillName: string, claimedLevel: string): Promise<AssessmentQuestion[]> {
  try {
    const aiQuestions = await AiOrchestrator.getAssessmentQuestions(skillName, claimedLevel);
    if (aiQuestions && aiQuestions.length > 0) {
      return aiQuestions.map((q, idx) => ({
        id: `ai-${skillName.toLowerCase()}-${idx}`,
        skillName,
        tier: (q.tier || (idx % 3 + 1)) as 1 | 2 | 3,
        concept: q.concept || 'Domain Knowledge',
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  } catch (err) {
    // fallback to banked questions
  }
  return getQuestionBankForSkill(skillName);
}

export function evaluateSkillAssessment(
  skillName: string,
  userAnswers: { question: AssessmentQuestion; selectedIndex: number }[],
): VerificationResult {
  let correctCount = 0;
  const totalQuestions = userAnswers.length;
  const strongConcepts: string[] = [];
  const weakConcepts: string[] = [];

  userAnswers.forEach(ans => {
    if (ans.selectedIndex === ans.question.correctIndex) {
      correctCount++;
      strongConcepts.push(ans.question.concept);
    } else {
      weakConcepts.push(ans.question.concept);
    }
  });

  // Calculate raw unrounded percentage to ensure strict > 75 check without ambiguous rounding
  const rawPercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const verificationScore = Math.round(rawPercentage);

  // EXACT RULE: 75% or higher score (>=75%) marks skill as VERIFIED. Score < 75% remains UNVERIFIED.
  // Examples: 75% -> VERIFIED, 76% -> VERIFIED, 80% -> VERIFIED, 90% -> VERIFIED, 100% -> VERIFIED.
  // 74% -> SELF_DECLARED, 50% -> SELF_DECLARED.
  const isVerified = rawPercentage >= 75;
  const status: SkillValidationStatus = isVerified ? 'VERIFIED' : 'SELF_DECLARED';

  let verifiedLevel: SkillLevelName = 'Beginner';
  let levelNumber = 1;

  if (verificationScore >= 90) {
    verifiedLevel = 'Expert';
    levelNumber = 4;
  } else if (verificationScore >= 80) {
    verifiedLevel = 'Advanced';
    levelNumber = 3;
  } else if (verificationScore >= 60) {
    verifiedLevel = 'Intermediate';
    levelNumber = 2;
  }

  const studyRecommendations: string[] = [];
  weakConcepts.forEach(concept => {
    studyRecommendations.push(`Review ${concept} fundamentals and practical implementation patterns for ${skillName}.`);
  });
  if (studyRecommendations.length === 0) {
    studyRecommendations.push(`Excellent domain mastery! Ready to architect advanced ${skillName} solutions.`);
  }

  return {
    skillName,
    verificationScore,
    verifiedLevel,
    levelNumber,
    status,
    strongConcepts: Array.from(new Set(strongConcepts)),
    weakConcepts: Array.from(new Set(weakConcepts)),
    studyRecommendations,
  };
}
