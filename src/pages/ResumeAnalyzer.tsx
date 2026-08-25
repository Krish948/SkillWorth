import { useState } from 'react';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { parseResumeText, ParsedResumeResult } from '@/lib/resume-parser';
import { AiOrchestrator } from '@/services/ai/aiOrchestrator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Sparkles, Upload, CheckCircle2, AlertCircle, ShieldAlert, Award, FileSearch, CheckCheck, XCircle } from 'lucide-react';
import { RICH_CAREERS } from '@/data/careerDetails';
import { SkillVerificationModal } from '@/components/SkillVerificationModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SAMPLE_RESUME_TEXT = `
JANE DOE
Software Engineering Student | Full Stack Developer
Email: jane.doe@example.com | GitHub: github.com/janedoe | LinkedIn: linkedin.com/in/janedoe

EDUCATION
Bachelor of Technology in Computer Science & Engineering (2022 - 2026)
Coursework: Data Structures, Web Development, Database Management, Algorithms, Software Engineering

SKILLS
Programming Languages: JavaScript, TypeScript, Python, HTML5, CSS3, SQL
Frameworks & Libraries: React, Node.js, Express.js, Next.js, Tailwind CSS
Tools & Cloud: Git, GitHub, Docker, REST APIs, PostgreSQL, MongoDB, Postman

EXPERIENCE
Frontend Web Developer Intern | InnoLabs Tech (May 2025 - Aug 2025)
• Developed responsive user interface components using React, TypeScript, and Tailwind CSS.
• Integrated REST APIs for user profile management and data visualization dashboards.
• Reduced client-side initial bundle load time by 28% through lazy loading and image optimization.

PROJECTS
SaaS Analytics Dashboard Project
• Built a full stack analytics application with Next.js, Node.js, PostgreSQL, and Recharts.
• Implemented JWT authentication and automated CI/CD deployment on Vercel.

CERTIFICATIONS
• Meta Front-End Developer Professional Certificate
• AWS Certified Cloud Practitioner
`;

export default function ResumeAnalyzer() {
  const { profile, saveResumeData, setTargetCareer, addOrUpdateSkill } = useStudentProfile();
  const navigate = useNavigate();

  const [resumeText, setResumeText] = useState(SAMPLE_RESUME_TEXT);
  const [selectedTarget, setSelectedTarget] = useState(profile.targetCareer || 'Frontend Developer');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResumeResult | null>(null);
  const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste or upload resume text first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const baseResult = parseResumeText(resumeText, selectedTarget);

      // NVIDIA AI Document Extraction
      const nvidiaResult = await AiOrchestrator.analyzeResume(resumeText, selectedTarget);
      if (nvidiaResult && nvidiaResult.extractedSkills.length > 0) {
        const mergedSkills = Array.from(new Set([...baseResult.extractedSkills, ...nvidiaResult.extractedSkills]));
        baseResult.extractedSkills = mergedSkills;
        if (nvidiaResult.recommendations.length > 0) {
          baseResult.recommendations = Array.from(new Set([...baseResult.recommendations, ...nvidiaResult.recommendations]));
        }
      }

      setParsedResult(baseResult);

      saveResumeData({
        analyzedAtIso: new Date().toISOString(),
        extractedSkills: baseResult.extractedSkills,
        education: baseResult.education,
        experience: baseResult.experience,
        projects: baseResult.projects,
        certifications: baseResult.certifications,
        strengths: baseResult.strengths,
        weaknesses: baseResult.weaknesses,
        targetCareer: selectedTarget,
        matchScore: baseResult.matchScore,
      });

      toast.success(`Resume analyzed with NVIDIA AI! ATS Score: ${baseResult.atsAnalysis.atsScore}%.`);
    } catch (err) {
      toast.error('Error analyzing resume text.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImportSkillsToProfile = async () => {
    if (!parsedResult) return;

    for (const skillName of parsedResult.extractedSkills) {
      await addOrUpdateSkill(skillName, 'general', 3, 'RESUME_DETECTED');
    }

    toast.success('Extracted skills synced into your Student Skill Portfolio as Resume-Detected skills!');
  };

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <section className="page-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Resume Intelligence</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] border-emerald-500/40 text-emerald-500">NVIDIA AI Parser</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Deep ATS & Content Audit Engine.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Upload or paste your resume text for NVIDIA AI document understanding, keyword density evaluation, weak phrase detection, and target role matching.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="space-y-6 min-w-0">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center justify-between">
                <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Resume Content</span>
                <Button size="sm" variant="ghost" onClick={() => setResumeText(SAMPLE_RESUME_TEXT)}>Load Sample</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Career Alignment</Label>
                <Select value={selectedTarget} onValueChange={v => { setSelectedTarget(v); setTargetCareer(v); }}>
                  <SelectTrigger><SelectValue placeholder="Select target role" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(RICH_CAREERS).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Paste Resume Text or CV Content</Label>
                <Textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste your full resume here..."
                  className="min-h-[280px] font-mono text-xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full sm:w-auto hover-glow">
                  {isAnalyzing ? 'Analyzing with NVIDIA AI...' : 'Analyze Resume with NVIDIA AI'} <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {parsedResult && (
            <div className="space-y-6">
              <Card className="panel-soft border-primary/40 bg-[linear-gradient(135deg,hsl(var(--primary)/0.06),transparent)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                      <FileSearch className="w-5 h-5 text-primary" /> ATS Compatibility Score
                    </CardTitle>
                    <Badge variant="default" className="text-sm font-bold bg-primary">{parsedResult.atsAnalysis.atsScore}% ATS Score</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  <Progress value={parsedResult.atsAnalysis.atsScore} className="h-2.5" />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                      <p className="font-semibold text-foreground flex items-center gap-1.5"><CheckCheck className="w-4 h-4 text-emerald-500" /> Structure & Sections</p>
                      <p className="text-muted-foreground">Keyword Density Score: <span className="font-bold text-foreground">{parsedResult.atsAnalysis.keywordDensityScore}%</span></p>
                      <p className="text-muted-foreground">Readability Rating: <span className="font-bold text-foreground">{parsedResult.atsAnalysis.readabilityScore}%</span></p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                      <p className="font-semibold text-amber-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Formatting Alerts</p>
                      {parsedResult.atsAnalysis.formattingIssues.length === 0 ? (
                        <p className="text-emerald-500 font-medium">✓ No major ATS formatting issues detected!</p>
                      ) : (
                        <ul className="space-y-1 text-muted-foreground">
                          {parsedResult.atsAnalysis.formattingIssues.map((iss, i) => <li key={i}>⚠ {iss}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Matched Required Skills ({parsedResult.skillMatches.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsedResult.skillMatches.map(skill => (
                          <Badge key={skill} variant="default" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-amber-500" /> Missing Target Skills ({parsedResult.missingSkills.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsedResult.missingSkills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">missing {skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-foreground">Self-Declared / Resume-Detected Skills Notice</p>
                      <p className="text-muted-foreground">
                        Extracted skills are added to your profile as <strong>Self-Declared / Resume-Detected</strong> skills. Validate them in the Skill System to upgrade them to <strong>Verified Skills</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button onClick={handleImportSkillsToProfile} className="hover-glow">
                      Sync Extracted Skills to Profile
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/skills?tab=verification')}>
                      Go to Skill Verification →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          {parsedResult ? (
            <>
              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Extracted Resume Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <p className="font-semibold uppercase text-muted-foreground tracking-[0.14em] mb-1">Detected Skills ({parsedResult.extractedSkills.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {parsedResult.extractedSkills.map(s => (
                        <div key={s} className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-[10px]">{s}</Badge>
                          <Button size="icon" variant="ghost" className="h-5 w-5 text-emerald-500" onClick={() => setVerifyingSkill(s)} title="Verify skill">
                            <Award className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold uppercase text-muted-foreground tracking-[0.14em] mb-1">Education</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {parsedResult.education.map((edu, i) => <li key={i}>• {edu}</li>)}
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold uppercase text-muted-foreground tracking-[0.14em] mb-1">Experience</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {parsedResult.experience.map((exp, i) => <li key={i}>• {exp}</li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Content & Impact Audit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {parsedResult.contentAnalysis.genericStatements.length > 0 && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
                      <p className="font-semibold text-amber-500">Generic Phrase Warnings</p>
                      <ul className="space-y-1 text-muted-foreground">
                        {parsedResult.contentAnalysis.genericStatements.map((g, i) => <li key={i}>⚠ {g}</li>)}
                      </ul>
                    </div>
                  )}

                  {parsedResult.contentAnalysis.missingMetrics.length > 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                      <p className="font-semibold text-foreground">Missing Measurable Outcomes</p>
                      <ul className="space-y-1 text-muted-foreground">
                        {parsedResult.contentAnalysis.missingMetrics.map((m, i) => <li key={i}>• {m}</li>)}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold mb-1">Recommendations</p>
                    <ul className="space-y-1.5 text-muted-foreground">
                      {parsedResult.recommendations.map((rec, i) => <li key={i}>→ {rec}</li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="panel-soft">
              <CardContent className="p-6 text-center text-xs text-muted-foreground space-y-2">
                <Upload className="w-8 h-8 mx-auto opacity-50 mb-2" />
                <p className="font-semibold text-foreground text-sm">No Resume Analyzed Yet</p>
                <p>Paste your resume content on the left and click <strong>Analyze Resume with NVIDIA AI</strong> to view section extraction, ATS formatting score, and keyword alignment.</p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <SkillVerificationModal
        skillName={verifyingSkill}
        open={Boolean(verifyingSkill)}
        onOpenChange={() => setVerifyingSkill(null)}
      />
    </div>
  );
}
