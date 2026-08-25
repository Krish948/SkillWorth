import { RICH_CAREERS } from '@/data/careerDetails';

export interface AtsAnalysisResult {
  atsScore: number; // 0-100%
  formattingIssues: string[];
  missingSections: string[];
  keywordDensityScore: number;
  readabilityScore: number;
}

export interface ContentAnalysisResult {
  strongPoints: string[];
  weakPoints: string[];
  genericStatements: string[];
  missingMetrics: string[];
  projectQualityScore: number;
}

export interface ParsedResumeResult {
  extractedSkills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillMatches: string[];
  missingSkills: string[];
  matchScore: number; // 0-100%
  jobReadinessImpact: number; // 0-10%
  atsAnalysis: AtsAnalysisResult;
  contentAnalysis: ContentAnalysisResult;
}

const COMMON_TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'HTML', 'CSS',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
  'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Git', 'GitHub', 'CI/CD', 'REST', 'GraphQL', 'Tailwind CSS', 'Bootstrap', 'Sass',
  'Linux', 'Bash', 'Terraform', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'Power BI', 'Tableau', 'Excel', 'Figma', 'UI/UX', 'Testing', 'Vitest', 'Jest', 'Playwright', 'Cybersecurity'
];

const GENERIC_PHRASES = [
  'worked on features',
  'good team player',
  'responsible for',
  'hardworking student',
  'passionate developer',
  'handled tasks',
  'assisted with',
  'helped team',
];

export function parseResumeText(resumeText: string, targetRole: string): ParsedResumeResult {
  const textLower = resumeText.toLowerCase();

  // 1. Extract Skills
  const extractedSkills: string[] = [];
  COMMON_TECH_SKILLS.forEach(skill => {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(resumeText)) {
      extractedSkills.push(skill);
    }
  });

  // 2. Extract Sections
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);

  const education: string[] = [];
  const experience: string[] = [];
  const projects: string[] = [];
  const certifications: string[] = [];

  let currentSection = '';
  lines.forEach(line => {
    const lLower = line.toLowerCase();
    if (lLower.includes('education')) currentSection = 'edu';
    else if (lLower.includes('experience') || lLower.includes('employment') || lLower.includes('work history')) currentSection = 'exp';
    else if (lLower.includes('project')) currentSection = 'proj';
    else if (lLower.includes('certification') || lLower.includes('certificate')) currentSection = 'cert';
    else if (lLower.includes('skill')) currentSection = 'skills';
    else {
      if (currentSection === 'edu' && line.length > 5) education.push(line);
      else if (currentSection === 'exp' && line.length > 5) experience.push(line);
      else if (currentSection === 'proj' && line.length > 5) projects.push(line);
      else if (currentSection === 'cert' && line.length > 5) certifications.push(line);
    }
  });

  // 3. ATS Analysis
  const missingSections: string[] = [];
  if (education.length === 0) missingSections.push('Education');
  if (experience.length === 0) missingSections.push('Work Experience');
  if (projects.length === 0) missingSections.push('Projects');

  const formattingIssues: string[] = [];
  if (resumeText.length < 200) formattingIssues.push('Resume text is too brief (less than 200 characters).');
  if (!textLower.includes('@')) formattingIssues.push('Missing contact email address.');

  const keywordDensityScore = Math.min(100, extractedSkills.length * 12);
  const readabilityScore = resumeText.length >= 300 && resumeText.length <= 3000 ? 90 : 70;
  const atsScore = Math.max(30, Math.round(100 - (missingSections.length * 15) - (formattingIssues.length * 10) + (extractedSkills.length * 3)));

  const atsAnalysis: AtsAnalysisResult = {
    atsScore: Math.min(98, atsScore),
    formattingIssues,
    missingSections,
    keywordDensityScore,
    readabilityScore,
  };

  // 4. Content Analysis
  const genericStatements: string[] = [];
  GENERIC_PHRASES.forEach(phrase => {
    if (textLower.includes(phrase)) {
      genericStatements.push(`Contains generic phrase: "${phrase}"`);
    }
  });

  const missingMetrics: string[] = [];
  const hasNumbers = /\d+%|\d+x|\$\d+|\d+ users|\d+ ms/i.test(resumeText);
  if (!hasNumbers) {
    missingMetrics.push('Missing quantifiable metrics/impact (e.g., "improved speed by 25%", "reduced load times by 300ms", "built for 10k users").');
  }

  const strongPoints: string[] = [];
  const weakPoints: string[] = [];

  if (extractedSkills.length >= 5) strongPoints.push(`Strong technical skill variety detected (${extractedSkills.length} skills).`);
  else weakPoints.push('Limited technical skills explicitly listed.');

  if (projects.length >= 2) strongPoints.push('Good project experience section detailing portfolio work.');
  else weakPoints.push('Few or no project descriptions found. Add 2+ technical projects.');

  if (certifications.length > 0) strongPoints.push('Includes relevant industry certifications.');

  const projectQualityScore = projects.length >= 2 && hasNumbers ? 88 : projects.length >= 1 ? 70 : 50;

  const contentAnalysis: ContentAnalysisResult = {
    strongPoints,
    weakPoints,
    genericStatements,
    missingMetrics,
    projectQualityScore,
  };

  // 5. Target Role Alignment & Skill Gaps
  const roleDetail = RICH_CAREERS[targetRole] || RICH_CAREERS['Frontend Developer'];
  const requiredTargetSkills = [
    ...roleDetail.skillTiers.beginner,
    ...roleDetail.skillTiers.intermediate,
  ];

  const skillMatches = requiredTargetSkills.filter(req =>
    extractedSkills.some(ext => ext.toLowerCase() === req.toLowerCase())
  );
  const missingSkills = requiredTargetSkills.filter(req =>
    !extractedSkills.some(ext => ext.toLowerCase() === req.toLowerCase())
  );

  const matchRatio = requiredTargetSkills.length > 0 ? skillMatches.length / requiredTargetSkills.length : 0.5;
  const matchScore = Math.min(96, Math.max(30, Math.round(matchRatio * 100)));
  const jobReadinessImpact = Math.round(matchScore * 0.1);

  // Recommendations
  const recommendations: string[] = [];
  if (missingSkills.length > 0) {
    recommendations.push(`Add or highlight missing target skills: ${missingSkills.slice(0, 4).join(', ')}.`);
  }
  if (!hasNumbers) {
    recommendations.push('Add quantifiable metrics (percentages, speed improvements, user count) to your project bullet points.');
  }
  if (genericStatements.length > 0) {
    recommendations.push('Replace generic phrases with action-oriented technical verbs (e.g. "Engineered", "Architected", "Optimized").');
  }

  return {
    extractedSkills,
    education,
    experience,
    projects,
    certifications,
    strengths: strongPoints,
    weaknesses: weakPoints,
    recommendations,
    skillMatches,
    missingSkills,
    matchScore,
    jobReadinessImpact,
    atsAnalysis,
    contentAnalysis,
  };
}
