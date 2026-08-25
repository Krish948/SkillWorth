import { useState } from 'react';
import { useStudentProfile } from '@/contexts/ProfileContext';
import {
  getInterviewBankForRole,
  generateDynamicFollowUp,
  generateInterviewReport,
  InterviewMode,
  ExperienceLevel,
  DifficultyLevel,
  InterviewTurn,
} from '@/lib/interview-engine';
import { AiOrchestrator } from '@/services/ai/aiOrchestrator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Sparkles, Send, CheckCircle2, RotateCcw, Trophy, ShieldAlert, Award } from 'lucide-react';
import { RICH_CAREERS } from '@/data/careerDetails';
import { toast } from 'sonner';

export default function InterviewSimulator() {
  const { profile, addInterviewSession } = useStudentProfile();

  const [selectedRole, setSelectedRole] = useState(profile.targetCareer || 'Frontend Developer');
  const [selectedMode, setSelectedMode] = useState<InterviewMode>('Technical');
  const [selectedExp, setSelectedExp] = useState<ExperienceLevel>('Mid');
  const [selectedDiff, setSelectedDiff] = useState<DifficultyLevel>('Medium');

  const [sessionActive, setSessionActive] = useState(false);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [userAnswerText, setUserAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalReport, setFinalReport] = useState<ReturnType<typeof generateInterviewReport> | null>(null);

  const startSession = () => {
    const bank = getInterviewBankForRole(selectedRole);
    const firstQ = bank.questions[0]?.question || `Can you introduce your experience and key technical achievements as a ${selectedRole}?`;

    setSessionActive(true);
    setTurns([]);
    setCurrentQuestionText(firstQ);
    setUserAnswerText('');
    setFinalReport(null);
    toast.success(`NVIDIA AI Mock Interview started for ${selectedRole} (${selectedMode} - ${selectedExp} Level)!`);
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswerText.trim()) {
      toast.error('Please type your response before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTurn: InterviewTurn = {
        question: currentQuestionText,
        candidateAnswer: userAnswerText,
      };

      const updatedTurns = [...turns, newTurn];
      setTurns(updatedTurns);
      setUserAnswerText('');

      if (updatedTurns.length >= 3) {
        // End session & generate final report
        const report = generateInterviewReport(selectedRole, selectedMode, updatedTurns);
        setFinalReport(report);
        setSessionActive(false);

        // Add to ProfileContext interview sessions
        addInterviewSession({
          id: `int-${Date.now()}`,
          dateIso: new Date().toISOString(),
          role: selectedRole,
          technicalAccuracyScore: report.technicalAccuracyScore,
          communicationScore: report.communicationScore,
          confidenceScore: report.confidenceScore,
          overallScore: report.overallScore,
          feedback: report.recommendedTopics,
          weakAreas: report.missingConcepts,
        });

        toast.success(`Interview complete! Overall Readiness Score: ${report.overallScore}%.`);
      } else {
        // Generate NVIDIA AI dynamic follow-up question
        let followUp = await AiOrchestrator.getInterviewFollowUp(selectedRole, selectedMode, currentQuestionText, userAnswerText);
        if (!followUp) {
          followUp = generateDynamicFollowUp(selectedRole, selectedMode, currentQuestionText, userAnswerText);
        }
        setCurrentQuestionText(followUp);
      }
    } catch (err) {
      toast.error('Error generating follow-up question.');
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
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Mock Interview</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] border-emerald-500/40 text-emerald-500">NVIDIA AI Interviewer</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Real-time Technical & HR Interviews.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Practice role-specific mock interviews powered by NVIDIA AI with dynamic follow-up questions tailored to your actual answers.
            </p>
          </div>
        </div>
      </section>

      {!sessionActive && !finalReport && (
        <Card className="panel-soft max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Configure Interview Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-semibold text-foreground">Target Role</label>
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
                <label className="font-semibold text-foreground">Interview Type / Mode</label>
                <Select value={selectedMode} onValueChange={(v: InterviewMode) => setSelectedMode(v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Mode" /></SelectTrigger>
                  <SelectContent>
                    {['Technical', 'HR', 'Behavioral', 'Project-Based', 'Resume-Based', 'Role-Specific'].map(m => (
                      <SelectItem key={m} value={m}>{m} Interview</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground">Experience Level</label>
                <Select value={selectedExp} onValueChange={(v: ExperienceLevel) => setSelectedExp(v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Experience" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior (0-2 Yrs)</SelectItem>
                    <SelectItem value="Mid">Mid-Level (2-5 Yrs)</SelectItem>
                    <SelectItem value="Senior">Senior (5+ Yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground">Difficulty</label>
                <Select value={selectedDiff} onValueChange={(v: DifficultyLevel) => setSelectedDiff(v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={startSession} className="w-full hover-glow h-11 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" /> Start NVIDIA AI Mock Interview →
            </Button>
          </CardContent>
        </Card>
      )}

      {sessionActive && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="panel-soft border-primary/40">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{selectedMode} Mode</Badge>
                  <Badge variant="outline">{selectedRole}</Badge>
                </div>
                <Badge variant="secondary">Turn {turns.length + 1} of 3</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {turns.map((t, idx) => (
                  <div key={idx} className="space-y-2 text-xs">
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-primary">
                      <p className="font-bold">NVIDIA AI Interviewer (Question {idx + 1}):</p>
                      <p className="text-foreground mt-1">{t.question}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-3 text-foreground ml-4">
                      <p className="font-bold text-muted-foreground">You:</p>
                      <p className="mt-1 leading-relaxed">{t.candidateAnswer}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs space-y-1">
                  <p className="font-bold text-primary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> NVIDIA AI Interviewer (Current Question):
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
                  placeholder="Type your response here... (Mention your technical design choices, tools, or real metrics)"
                  className="min-h-[140px] text-xs font-mono"
                />
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={() => setSessionActive(false)} className="text-xs text-muted-foreground">
                    End Session Early
                  </Button>
                  <Button onClick={handleAnswerSubmit} disabled={isSubmitting || !userAnswerText.trim()} className="hover-glow">
                    {isSubmitting ? 'Analyzing Response with NVIDIA AI...' : 'Submit Answer →'} <Send className="w-4 h-4 ml-2" />
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
              <Badge variant="secondary" className="uppercase tracking-[0.14em]">Interview Evaluation</Badge>
              <Badge variant="default" className="bg-emerald-600 font-bold">{finalReport.overallScore}% Overall</Badge>
            </div>
            <CardTitle className="text-2xl font-display mt-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-emerald-500" /> Candidate Interview Report Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-muted-foreground font-semibold">Technical Accuracy</p>
                <p className="text-2xl font-bold font-display text-primary mt-1">{finalReport.technicalAccuracyScore}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-muted-foreground font-semibold">Communication</p>
                <p className="text-2xl font-bold font-display text-sky-500 mt-1">{finalReport.communicationScore}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-muted-foreground font-semibold">Confidence</p>
                <p className="text-2xl font-bold font-display text-violet-500 mt-1">{finalReport.confidenceScore}%</p>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/30 text-emerald-500 space-y-1">
              <p className="font-bold text-sm">Readiness Tier: {finalReport.readinessLevel}</p>
              <p className="text-foreground">Based strictly on your answers during this {selectedMode} interview.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <p className="font-semibold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Strong Responses</p>
                <ul className="space-y-1 text-muted-foreground">
                  {finalReport.strongAnswers.map((s, i) => <li key={i}>✓ {s}</li>)}
                </ul>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <p className="font-semibold text-amber-500 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Areas Needing Growth</p>
                <ul className="space-y-1 text-muted-foreground">
                  {finalReport.weakAnswers.map((w, i) => <li key={i}>⚠ {w}</li>)}
                  {finalReport.weakAnswers.length === 0 && <li>All questions answered with strong detail!</li>}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5"><Award className="w-4 h-4 text-primary" /> Study Recommendations</p>
              <ul className="space-y-1 text-muted-foreground">
                {finalReport.recommendedTopics.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button onClick={startSession} variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> Start Another Interview</Button>
              <Button onClick={() => setFinalReport(null)} className="hover-glow">Close & View Studio ✓</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
