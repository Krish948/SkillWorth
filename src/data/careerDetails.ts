export interface SkillTierRequirements {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
}

export interface CareerDetail {
  id: string;
  role: string;
  category: string;
  description: string;
  requiredEducation: string;
  skillTiers: SkillTierRequirements;
  industryDemand: 'High' | 'Very High' | 'Moderate' | 'Extreme';
  salaryMin: number;
  salaryMax: number;
  careerProgression: string[];
  relatedCareers: string[];
  requiredCertifications: string[];
  recommendedProjects: { title: string; description: string; difficulty: string }[];
  internshipOpportunities: { company: string; role: string; location: string; stipend: string }[];
  jobOpportunities: { title: string; company: string; location: string; type: string }[];
}

export const RICH_CAREERS: Record<string, CareerDetail> = {
  'Frontend Developer': {
    id: 'frontend-developer',
    role: 'Frontend Developer',
    category: 'frontend',
    description: 'Builds responsive, accessible, and performant web interfaces for modern web applications.',
    requiredEducation: 'Bachelor in CS, IT, Software Engineering, or equivalent practical experience / bootcamp certification.',
    skillTiers: {
      beginner: ['HTML', 'CSS', 'JavaScript', 'Git'],
      intermediate: ['React', 'TypeScript', 'Tailwind CSS', 'REST API'],
      advanced: ['Next.js', 'Redux', 'Accessibility', 'Testing', 'Performance'],
    },
    industryDemand: 'Very High',
    salaryMin: 700000, // in INR
    salaryMax: 1500000,
    careerProgression: [
      'Junior Frontend Developer',
      'Mid-Level Frontend Developer',
      'Senior Frontend Engineer',
      'Lead UI/UX Architect',
      'Engineering Manager',
    ],
    relatedCareers: ['Full Stack Developer', 'UI/UX Designer', 'Mobile Developer'],
    requiredCertifications: ['Meta Front-End Developer Professional Certificate', 'AWS Certified Cloud Practitioner'],
    recommendedProjects: [
      { title: 'Interactive Portfolio & Component Library', description: 'Design accessible React components with dark mode support.', difficulty: 'Beginner' },
      { title: 'SaaS Analytics Dashboard', description: 'Build a dynamic dashboard with Recharts, data fetching, and state management.', difficulty: 'Intermediate' },
      { title: 'Real-time Collaborative Canvas', description: 'WebSockets and canvas state synchronization for multi-user editing.', difficulty: 'Advanced' },
    ],
    internshipOpportunities: [
      { company: 'TechCorp India', role: 'Frontend Intern', location: 'Bengaluru / Remote', stipend: '₹25,000/mo' },
      { company: 'InnoLabs', role: 'UI Development Intern', location: 'Hyderabad / Hybrid', stipend: '₹30,000/mo' },
    ],
    jobOpportunities: [
      { title: 'Associate Frontend Engineer', company: 'Nexus Soft', location: 'Bengaluru', type: 'Full-time' },
      { title: 'React Developer', company: 'CloudScale Tech', location: 'Remote', type: 'Full-time' },
    ],
  },

  'Backend Developer': {
    id: 'backend-developer',
    role: 'Backend Developer',
    category: 'backend',
    description: 'Architects scalable server side APIs, microservices, data storage solutions, and cloud infrastructure.',
    requiredEducation: 'Bachelor in CS, IT, Information Systems, or equivalent self-taught engineering background.',
    skillTiers: {
      beginner: ['Python', 'Node.js', 'SQL', 'Git'],
      intermediate: ['Express.js', 'PostgreSQL', 'REST API', 'Docker'],
      advanced: ['System Design', 'Microservices', 'Redis', 'Kafka', 'AWS'],
    },
    industryDemand: 'Very High',
    salaryMin: 800000,
    salaryMax: 1700000,
    careerProgression: [
      'Junior Backend Engineer',
      'Backend Software Engineer',
      'Senior Systems Engineer',
      'Principal Backend Architect',
      'Director of Infrastructure',
    ],
    relatedCareers: ['Full Stack Developer', 'DevOps Engineer', 'Data Engineer'],
    requiredCertifications: ['AWS Certified Developer - Associate', 'MongoDB Certified Developer'],
    recommendedProjects: [
      { title: 'RESTful E-Commerce Microservice', description: 'Implement JWT auth, rate limiting, and PostgreSQL migrations.', difficulty: 'Beginner' },
      { title: 'Distributed Task Queue Engine', description: 'Redis pub-sub background worker queue for async processing.', difficulty: 'Intermediate' },
      { title: 'High-Throughput Streaming API', description: 'Kafka pipeline supporting 10k requests/sec with graceful fallback.', difficulty: 'Advanced' },
    ],
    internshipOpportunities: [
      { company: 'DataScale Systems', role: 'Backend Engineering Intern', location: 'Pune', stipend: '₹28,000/mo' },
      { company: 'FinTech Hub', role: 'API Developer Intern', location: 'Mumbai / Remote', stipend: '₹35,000/mo' },
    ],
    jobOpportunities: [
      { title: 'Junior Backend Developer', company: 'Zeta Networks', location: 'Bengaluru', type: 'Full-time' },
      { title: 'Node.js Systems Engineer', company: 'PayFlow', location: 'Remote', type: 'Full-time' },
    ],
  },

  'Full Stack Developer': {
    id: 'full-stack-developer',
    role: 'Full Stack Developer',
    category: 'full-stack',
    description: 'Master of both frontend interfaces and backend architectures, delivering end-to-end web products.',
    requiredEducation: 'Bachelor in Computer Science, Software Engineering, or equivalent software project experience.',
    skillTiers: {
      beginner: ['HTML', 'CSS', 'JavaScript', 'SQL'],
      intermediate: ['React', 'Node.js', 'Express.js', 'Docker'],
      advanced: ['Next.js', 'GraphQL', 'System Design', 'AWS', 'CI/CD'],
    },
    industryDemand: 'Extreme',
    salaryMin: 900000,
    salaryMax: 1900000,
    careerProgression: [
      'Junior Full Stack Developer',
      'Full Stack Software Engineer',
      'Lead Product Engineer',
      'Solutions Architect',
      'Chief Technology Officer (CTO)',
    ],
    relatedCareers: ['Frontend Developer', 'Backend Developer', 'Solutions Architect'],
    requiredCertifications: ['AWS Certified Solutions Architect - Associate', 'Full Stack Developer Nanodegree'],
    recommendedProjects: [
      { title: 'Full Stack Issue Tracker', description: 'React frontend, Express backend, PostgreSQL database, and automated CI/CD.', difficulty: 'Beginner' },
      { title: 'SaaS Marketplace Platform', description: 'Stripe payments, authentication, dashboard analytics, and role-based permissions.', difficulty: 'Intermediate' },
      { title: 'AI-Powered Document Workspace', description: 'Next.js, serverless functions, vector search DB, and live collaboration.', difficulty: 'Advanced' },
    ],
    internshipOpportunities: [
      { company: 'BuildFast Labs', role: 'Full Stack Intern', location: 'Gurugram', stipend: '₹30,000/mo' },
      { company: 'ProductHQ', role: 'Software Engineering Intern', location: 'Remote', stipend: '₹32,000/mo' },
    ],
    jobOpportunities: [
      { title: 'Full Stack Software Engineer', company: 'Nova Global', location: 'Bengaluru', type: 'Full-time' },
      { title: 'Senior Product Developer', company: 'LaunchPad Software', location: 'Hybrid', type: 'Full-time' },
    ],
  },

  'Data Scientist': {
    id: 'data-scientist',
    role: 'Data Scientist',
    category: 'data',
    description: 'Extracts actionable insights from complex structured and unstructured data using ML, statistical modeling, and algorithms.',
    requiredEducation: 'Bachelor / Master in Statistics, Mathematics, Computer Science, Data Science, or quantitative fields.',
    skillTiers: {
      beginner: ['Python', 'SQL', 'Data Analysis', 'Excel'],
      intermediate: ['Pandas', 'NumPy', 'Statistics', 'Machine Learning'],
      advanced: ['TensorFlow', 'PyTorch', 'Natural Language Processing', 'MLOps'],
    },
    industryDemand: 'Very High',
    salaryMin: 950000,
    salaryMax: 2000000,
    careerProgression: [
      'Associate Data Analyst / Scientist',
      'Data Scientist',
      'Senior Data Scientist',
      'Lead AI Research Scientist',
      'Head of Data Science',
    ],
    relatedCareers: ['Data Analyst', 'ML Engineer', 'AI Engineer'],
    requiredCertifications: ['TensorFlow Developer Certificate', 'IBM Data Science Professional Certificate'],
    recommendedProjects: [
      { title: 'Customer Churn Predictor', description: 'Scikit-learn classification model with EDA and feature importance visualization.', difficulty: 'Beginner' },
      { title: 'Sales Time-Series Forecasting', description: 'ARIMA/Prophet prediction model evaluating seasonal retail revenue.', difficulty: 'Intermediate' },
      { title: 'LLM Fine-Tuning Pipeline', description: 'Fine-tune open-weights LLM on domain-specific support transcripts.', difficulty: 'Advanced' },
    ],
    internshipOpportunities: [
      { company: 'InsightAnalytics', role: 'Data Science Intern', location: 'Bengaluru', stipend: '₹35,000/mo' },
      { company: 'Quant AI', role: 'ML Intern', location: 'Remote', stipend: '₹40,000/mo' },
    ],
    jobOpportunities: [
      { title: 'Data Scientist', company: 'Decision Point AI', location: 'Hyderabad', type: 'Full-time' },
      { title: 'Applied ML Scientist', company: 'Apex Intelligence', location: 'Remote', type: 'Full-time' },
    ],
  },

  'DevOps Engineer': {
    id: 'devops-engineer',
    role: 'DevOps Engineer',
    category: 'devops',
    description: 'Automates software delivery pipelines, manages cloud infrastructure, ensures uptime, security, and scalability.',
    requiredEducation: 'Bachelor in CS, IT, Telecommunications, or equivalent cloud/sysadmin experience.',
    skillTiers: {
      beginner: ['Linux', 'Bash', 'Git', 'CI/CD'],
      intermediate: ['Docker', 'AWS', 'Terraform', 'Monitoring'],
      advanced: ['Kubernetes', 'Prometheus', 'Grafana', 'SRE'],
    },
    industryDemand: 'Very High',
    salaryMin: 1000000,
    salaryMax: 2100000,
    careerProgression: [
      'Junior DevOps Engineer',
      'DevOps Engineer',
      'Senior Site Reliability Engineer (SRE)',
      'Infrastructure Architect',
      'VP of Infrastructure & Operations',
    ],
    relatedCareers: ['Cloud Engineer', 'Platform Engineer', 'Site Reliability Engineer'],
    requiredCertifications: ['AWS Certified DevOps Engineer - Professional', 'Certified Kubernetes Administrator (CKA)'],
    recommendedProjects: [
      { title: 'Automated CI/CD Pipeline', description: 'GitHub Actions workflow with linting, unit testing, and Docker deployment.', difficulty: 'Beginner' },
      { title: 'Infrastructure as Code with Terraform', description: 'Provision AWS VPC, EC2, and RDS clusters declaratively.', difficulty: 'Intermediate' },
      { title: 'Multi-Cluster Kubernetes Monitoring', description: 'Helm charts, Prometheus metrics, and Grafana dashboard alerting.', difficulty: 'Advanced' },
    ],
    internshipOpportunities: [
      { company: 'CloudNative Corp', role: 'DevOps Intern', location: 'Bengaluru', stipend: '₹30,000/mo' },
      { company: 'ScaleGrid', role: 'Cloud Infrastructure Intern', location: 'Remote', stipend: '₹35,000/mo' },
    ],
    jobOpportunities: [
      { title: 'DevOps Engineer', company: 'InfraScale Solutions', location: 'Pune', type: 'Full-time' },
      { title: 'SRE Specialist', company: 'Global Cloud Systems', location: 'Remote', type: 'Full-time' },
    ],
  },

  'Data Analyst': {
    id: 'data-analyst',
    role: 'Data Analyst',
    category: 'data',
    description: 'Transforms raw business data into meaningful dashboards, KPIs, business trends, and data-driven recommendations.',
    requiredEducation: 'Bachelor in Business, Economics, Statistics, Engineering, or relevant analytical fields.',
    skillTiers: {
      beginner: ['Excel', 'SQL', 'Communication'],
      intermediate: ['Data Analysis', 'Power BI', 'Tableau', 'Python'],
      advanced: ['Statistics', 'Business Analysis', 'Product Analytics'],
    },
    industryDemand: 'High',
    salaryMin: 600000,
    salaryMax: 1300000,
    careerProgression: [
      'Junior Business / Data Analyst',
      'Data Analyst',
      'Senior Data Analyst',
      'Lead Business Intelligence Architect',
      'Head of Analytics',
    ],
    relatedCareers: ['Data Scientist', 'Business Analyst', 'Product Manager'],
    requiredCertifications: ['Google Data Analytics Professional Certificate', 'Microsoft Certified: Power BI Data Analyst Associate'],
    recommendedProjects: [
      { title: 'E-Commerce Sales Performance Dashboard', description: 'Interactive Power BI report analyzing monthly product revenue trends.', difficulty: 'Beginner' },
      { title: 'Customer Cohort Retention Analysis', description: 'SQL queries and Tableau visuals tracking cohort churn rates.', difficulty: 'Intermediate' },
      { title: 'A/B Testing Funnel Evaluation', description: 'Statistical hypothesis testing in Python assessing landing page conversions.', difficulty: 'Advanced' },
    ],
    internshipOpportunities: [
      { company: 'MetricWorks', role: 'Data Analyst Intern', location: 'Mumbai', stipend: '₹22,000/mo' },
      { company: 'E-Com Express', role: 'BI Analytics Intern', location: 'Gurugram', stipend: '₹25,000/mo' },
    ],
    jobOpportunities: [
      { title: 'Associate Data Analyst', company: 'Retail Insights', location: 'Bengaluru', type: 'Full-time' },
      { title: 'Power BI Analyst', company: 'FinCorp Global', location: 'Hybrid', type: 'Full-time' },
    ],
  },

  'AI Engineer': {
    id: 'ai-engineer',
    role: 'AI Engineer',
    category: 'data',
    description: 'Designs, builds, and deploys Generative AI models, neural networks, LLM agents, and intelligent applications.',
    requiredEducation: 'Bachelor / Master in Computer Science, Artificial Intelligence, or Machine Learning.',
    skillTiers: {
      beginner: ['Python', 'SQL', 'Git'],
      intermediate: ['Machine Learning', 'PyTorch', 'Prompt Engineering'],
      advanced: ['MLOps', 'LLMOps', 'Natural Language Processing', 'Computer Vision'],
    },
    industryDemand: 'Extreme',
    salaryMin: 1200000,
    salaryMax: 2500000,
    careerProgression: [
      'Junior AI Engineer',
      'AI / ML Engineer',
      'Senior AI Architect',
      'Principal AI Researcher',
      'Chief AI Officer',
    ],
    relatedCareers: ['Data Scientist', 'ML Engineer', 'Full Stack Developer'],
    requiredCertifications: ['DeepLearning.AI AI Engineering Specialization', 'AWS Certified AI Practitioner'],
    recommendedProjects: [
      { title: 'RAG Document Question Answering Bot', description: 'LangChain, vector database, and local LLM integration.', difficulty: 'Beginner' },
      { title: 'Autonomous Multi-Agent Workflow Engine', description: 'Agents cooperating to perform software code audits automatically.', difficulty: 'Intermediate' },
      { title: 'Custom Vision Inspection Pipeline', description: 'Fine-tuned PyTorch vision model deployed with Triton Inference Server.', difficulty: 'Advanced' },
    ],
    internshipOpportunities: [
      { company: 'Cognitive Labs', role: 'Generative AI Intern', location: 'Bengaluru', stipend: '₹45,000/mo' },
      { company: 'DeepVision AI', role: 'AI Engineering Intern', location: 'Remote', stipend: '₹50,000/mo' },
    ],
    jobOpportunities: [
      { title: 'AI Software Engineer', company: 'Frontier AI', location: 'Bengaluru', type: 'Full-time' },
      { title: 'Generative AI Solutions Architect', company: 'Nexus Intelligence', location: 'Remote', type: 'Full-time' },
    ],
  },
};

export function getRichCareerDetail(roleName: string): CareerDetail {
  if (RICH_CAREERS[roleName]) {
    return RICH_CAREERS[roleName];
  }

  // Generic fallback if a role from DB isn't explicitly in RICH_CAREERS
  return {
    id: roleName.toLowerCase().replace(/\s+/g, '-'),
    role: roleName,
    category: 'tech',
    description: `Professional career track in ${roleName} involving core technical and domain skills.`,
    requiredEducation: 'Bachelor degree in relevant discipline or industry equivalent certifications.',
    skillTiers: {
      beginner: ['Git', 'Communication', 'Problem Solving'],
      intermediate: ['SQL', 'REST API', 'Agile/Scrum'],
      advanced: ['System Design', 'Leadership', 'Project Management'],
    },
    industryDemand: 'High',
    salaryMin: 650000,
    salaryMax: 1400000,
    careerProgression: [
      `Junior ${roleName}`,
      `Mid-Level ${roleName}`,
      `Senior ${roleName}`,
      `Lead ${roleName}`,
    ],
    relatedCareers: ['Software Engineer', 'Full Stack Developer'],
    requiredCertifications: ['Industry Recognized Professional Certification'],
    recommendedProjects: [
      { title: `${roleName} Core Project`, description: `Build a production-style application demonstrating ${roleName} fundamentals.`, difficulty: 'Intermediate' },
    ],
    internshipOpportunities: [
      { company: 'Tech Solutions Ltd', role: `${roleName} Intern`, location: 'Remote', stipend: '₹25,000/mo' },
    ],
    jobOpportunities: [
      { title: roleName, company: 'Innovate Solutions', location: 'Hybrid', type: 'Full-time' },
    ],
  };
}
