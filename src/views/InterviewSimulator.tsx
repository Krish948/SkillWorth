import { useState } from 'react';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { AiOrchestrator } from '@/services/ai/aiOrchestrator';
import { InterviewConfig, EvaluatedTurn, InterviewReport } from '@/services/ai/mockInterviewService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Sparkles, Send, CheckCircle2, RotateCcw, Trophy, ShieldAlert, Award } from 'lucide-react';
import { RICH_CAREERS } from '@/data/careerDetails';
import { toast } from 'sonner';

export default function InterviewSimulator() {
  const { profile, addInterviewSession } = useStudentProfile();

  const [selectedRole, setSelectedRole] = useState(profile.targetCareer || 'Frontend Developer');
  const [selectedMode, setSelectedMode] = useState<InterviewConfig['interviewType']>('Technical');
  const [selectedExp, setSelectedExp] = useState<InterviewConfig['experienceLevel']>('Mid');
  const [selectedDiff, setSelectedDiff] = useState<InterviewConfig['difficulty']>('Medium');
  const [techStackInput, setTechStackInput] = useState('React, TypeScript, JavaScript, REST APIs');
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [specificTopicsInput, setSpecificTopicsInput] = useState('State Management, Virtual DOM, Async Code');

  const [sessionActive, setSessionActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [userAnswerText, setUserAnswerText] = useState('');
  const [turns, setTurns] = useState<Array<{ question: string; candidateAnswer: string; evaluation?: EvaluatedTurn }>>([]);
  const [finalReport, setFinalReport] = useState<InterviewReport | null>(null);

  const currentConfig: InterviewConfig = {
    role: selectedRole,
    experienceLevel: selectedExp,
    interviewType: selectedMode,
    difficulty: selectedDiff,
    techStack: techStackInput.split(',').map(s => s.trim()).filter(Boolean),
    jobDescription: jobDescriptionInput.trim(),
    specificTopics: specificTopicsInput.split(',').map(s => s.trim()).filter(Boolean),
    numberOfQuestions: 3,
  };

  const startSession = async () => {
    setIsStarting(true);
    setTurns([]);
    setUserAnswerText('');
    setFinalReport(null);

    try {
      const openingQuestion = await AiOrchestrator.getInterviewOpeningQuestion(currentConfig);
      setCurrentQuestionText(openingQuestion);
      setSessionActive(true);
      toast.success(`AI Mock Interview started for ${selectedRole} (${selectedMode} - ${selectedExp} Level)!`);
    } catch {
      toast.error('Could not start mock interview. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswerText.trim()) {
      toast.error('Please type your response before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const turnIndex = turns.length;
      const question = currentQuestionText;
      const answer = userAnswerText.trim();

      const evaluation = await AiOrchestrator.evaluateInterviewTurn(currentConfig, turnIndex, question, answer);

      const updatedTurns = [...turns, { question, candidateAnswer: answer, evaluation }];
      setTurns(updatedTurns);
      setUserAnswerText('');

      if (updatedTurns.length >= 3) {
        const evaluatedList = updatedTurns.map(t => t.evaluation!).filter(Boolean);
        const report = AiOrchestrator.compileInterviewReport(currentConfig, evaluatedList);
        setFinalReport(report);
        setSessionActive(false);

        addInterviewSession({
          id: `int-${Date.now()}`,
          dateIso: new Date().toISOString(),
          role: selectedRole,
          technicalAccuracyScore: report.categoryScores.technicalKnowledge,
          communicationScore: report.categoryScores.communication,
          confidenceScore: report.categoryScores.problemSolving,
          overallScore: report.overallScore,
          feedback: report.recommendedTopics,
          weakAreas: report.weaknesses,
        });

        toast.success(`Mock Interview Complete! Overall Readiness Score: ${report.overallScore}%.`);
      } else {
        const followUp = await AiOrchestrator.getInterviewFollowUp(selectedRole, selectedMode, question, answer);
        setCurrentQuestionText(followUp || `Can you elaborate on how you would measure performance metrics and handle edge cases for that implementation in ${selectedRole}?`);
      }
    } catch (err) {
      toast.error('Error evaluating response. Retrying...');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <section className="page-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Mock Interview Studio</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] border-emerald-500/40 text-emerald-500">Fully AI-Powered Evaluator</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Real-time Technical & HR Interviews.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Practice role-specific mock interviews generated dynamically based on candidate role, experience level, tech stack, and job description.
            </p>
          </div>
        </div>
      </section>

      {!sessionActive && !finalReport && (
        <Card className="panel-soft max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Configure AI Mock Interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-semibold">Target Job Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Target role" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(RICH_CAREERS).map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Interview Type / Mode</Label>
                <Select value={selectedMode} onValueChange={(v: any) => setSelectedMode(v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Mode" /></SelectTrigger>
                  <SelectContent>
                    {['Technical', 'Behavioral', 'HR', 'Scenario-Based', 'Project-Based', 'Role-Specific'].map(m => (
                      <SelectItem key={m} value={m}>{m} Interview</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Experience Level</Label>
                <Select value={selectedExp} onValueChange={(v: any) => setSelectedExp(v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Experience" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior (0-2 Yrs / Fresher)</SelectItem>
                    <SelectItem value="Mid">Mid-Level (2-5 Yrs)</SelectItem>
                    <SelectItem value="Senior">Senior (5+ Yrs / Lead)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Difficulty</Label>
                <Select value={selectedDiff} onValueChange={(v: any) => setSelectedDiff(v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Tech Stack & Primary Skills (Comma separated)</Label>
              <Input
                value={techStackInput}
                onChange={e => setTechStackInput(e.target.value)}
                placeholder="e.g. React, TypeScript, Node.js, SQL, Docker"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Specific Focus Topics (Optional)</Label>
              <Input
                value={specificTopicsInput}
                onChange={e => setSpecificTopicsInput(e.target.value)}
                placeholder="e.g. System Design, State Management, Database Indexing"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Target Job Description (Optional)</Label>
              <Textarea
                value={jobDescriptionInput}
                onChange={e => setJobDescriptionInput(e.target.value)}
                placeholder="Paste job description text to tailor questions directly to JD requirements..."
                className="min-h-[80px] font-mono text-xs"
              />
            </div>

            <Button onClick={startSession} disabled={isStarting} className="w-full hover-glow h-11 text-sm font-semibold mt-2">
              <Sparkles className="w-4 h-4 mr-2" /> {isStarting ? 'Generating Custom Interview...' : 'Start AI Mock Interview →'}
            </Button>
          </CardContent>
        </Card>
      )}

      {sessionActive && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="panel-soft border-primary/40">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{selectedMode} Mode</Badge>
                  <Badge variant="outline">{selectedRole}</Badge>
                  <Badge variant="secondary">{selectedExp} Level</Badge>
                </div>
                <Badge variant="outline" className="border-primary/50 text-primary font-bold">
                  Question {turns.length + 1} of 3
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {turns.map((t, idx) => (
                  <div key={idx} className="space-y-2 text-xs">
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-primary">
                      <p className="font-bold">AI Interviewer (Question {idx + 1}):</p>
                      <p className="text-foreground mt-1">{t.question}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-3 text-foreground ml-4 space-y-2">
                      <p className="font-bold text-muted-foreground">Your Response:</p>
                      <p className="leading-relaxed">{t.candidateAnswer}</p>

                      {t.evaluation && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between font-bold text-primary">
                            <span>Turn Evaluation Score: {t.evaluation.overallScore}%</span>
                            <span>Correctness: {t.evaluation.correctnessScore}%</span>
                          </div>
                          <p className="text-foreground"><strong>✓ What was correct:</strong> {t.evaluation.whatWasCorrect}</p>
                          {t.evaluation.whatWasIncorrect && (
                            <p className="text-amber-500"><strong>⚠ Improvement Area:</strong> {t.evaluation.whatWasIncorrect}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs space-y-1">
                  <p className="font-bold text-primary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> AI Interviewer (Current Question):
                  </p>
                  <p className="text-sm font-semibold text-foreground pt-1 leading-relaxed">
                    "{currentQuestionText}"
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Textarea
                  value={userAnswerText}
                  onChange={e => setUserAnswerText(e.target.value)}
                  placeholder="Type your answer here... (Mention design choices, tools, algorithms, or real metrics)"
                  className="min-h-[140px] text-xs font-mono"
                />
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={() => setSessionActive(false)} className="text-xs text-muted-foreground">
                    End Session Early
                  </Button>
                  <Button onClick={handleAnswerSubmit} disabled={isSubmitting || !userAnswerText.trim()} className="hover-glow">
                    {isSubmitting ? 'Evaluating Response with AI Engine...' : 'Submit Answer →'} <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {finalReport && (
        <Card className="panel-soft max-w-3xl mx-auto border-emerald-500/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="uppercase tracking-[0.14em]">AI Interview Assessment Report</Badge>
              <Badge variant="default" className="bg-emerald-600 font-bold text-sm">{finalReport.overallScore}% Overall Score</Badge>
            </div>
            <CardTitle className="text-2xl font-display mt-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-emerald-500" /> Candidate Performance Report Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-muted-foreground font-semibold">Technical Depth</p>
                <p className="text-2xl font-bold font-display text-primary mt-1">{finalReport.categoryScores.technicalKnowledge}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-muted-foreground font-semibold">Problem Solving</p>
                <p className="text-2xl font-bold font-display text-sky-500 mt-1">{finalReport.categoryScores.problemSolving}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-muted-foreground font-semibold">Communication</p>
                <p className="text-2xl font-bold font-display text-violet-500 mt-1">{finalReport.categoryScores.communication}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-muted-foreground font-semibold">Role Fit</p>
                <p className="text-2xl font-bold font-display text-emerald-500 mt-1">{finalReport.categoryScores.roleKnowledge}%</p>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/30 text-emerald-500 space-y-1">
              <p className="font-bold text-sm">Readiness Tier: {finalReport.interviewReadiness}</p>
              <p className="text-foreground">Evaluated dynamically across your actual responses during this {selectedMode} interview.</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm text-foreground">Detailed Question Feedback</h3>
              {finalReport.evaluatedTurns.map((turn, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex justify-between items-center font-semibold text-foreground">
                    <span>Question {i + 1}: "{turn.question.slice(0, 60)}..."</span>
                    <Badge variant={turn.overallScore >= 75 ? 'default' : 'outline'} className={turn.overallScore >= 75 ? 'bg-emerald-600' : ''}>
                      {turn.overallScore}% Score
                    </Badge>
                  </div>
                  <p className="text-muted-foreground"><strong>Your Answer:</strong> "{turn.candidateAnswer}"</p>
                  <p className="text-emerald-500"><strong>✓ What Was Correct:</strong> {turn.whatWasCorrect}</p>
                  <p className="text-amber-500"><strong>⚠ What Was Incorrect/Weak:</strong> {turn.whatWasIncorrect}</p>
                  <p className="text-foreground"><strong>💡 Missing Ideal Information:</strong> {turn.missingInformation}</p>
                  <p className="text-primary font-medium"><strong>👉 Improvement Tip:</strong> {turn.improvementSuggestion}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <p className="font-semibold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Demonstrated Strengths</p>
                <ul className="space-y-1 text-muted-foreground">
                  {finalReport.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                </ul>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <p className="font-semibold text-amber-500 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Targeted Skill Gaps</p>
                <ul className="space-y-1 text-muted-foreground">
                  {finalReport.weaknesses.map((w, i) => <li key={i}>⚠ {w}</li>)}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5"><Award className="w-4 h-4 text-primary" /> Recommended Next Steps</p>
              <ul className="space-y-1 text-muted-foreground">
                {finalReport.recommendedTopics.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button onClick={startSession} variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> Start Another Interview</Button>
              <Button onClick={() => setFinalReport(null)} className="hover-glow">Close Report ✓</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
