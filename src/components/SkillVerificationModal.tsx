import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, CheckCircle2, XCircle, BookOpen, Award, RotateCcw, AlertTriangle } from 'lucide-react';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { SkillAssessmentService, QuizQuestion, QuizEvaluationResult } from '@/services/ai/skillAssessmentService';
import { toast } from 'sonner';

interface SkillVerificationModalProps {
  skillName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  JavaScript: ['Asynchronous Programming', 'DOM Manipulation', 'Closure & Scope', 'ES6+ Features', 'Event Loop'],
  Python: ['Data Structures', 'OOP & Classes', 'Generators & Decorators', 'Concurrency & GIL', 'File & Stream I/O'],
  React: ['Hooks & Dependency Arrays', 'State Management', 'Virtual DOM & Reconciliation', 'Performance & Memoization'],
  SQL: ['Joins & Null Handling', 'Aggregations & Grouping', 'Window Functions', 'Indexing & Performance'],
  TypeScript: ['Generics & Interfaces', 'Type Narrowing', 'Utility Types', 'Strict Type Checking'],
  Node: ['Event Loop & Streams', 'Async I/O', 'Express Routing', 'Authentication & JWT'],
  Docker: ['Containerization', 'Dockerfile Directives', 'Multi-stage Builds', 'Docker Compose'],
};

export const SkillVerificationModal: React.FC<SkillVerificationModalProps> = ({ skillName, open, onOpenChange }) => {
  const { recordAssessmentAttempt } = useStudentProfile();

  const [selectedTopic, setSelectedTopic] = useState('General Concepts');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ question: QuizQuestion; selectedIndex: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [result, setResult] = useState<QuizEvaluationResult | null>(null);

  useEffect(() => {
    if (!skillName || !open) return;
    const defaultTopic = TOPIC_SUGGESTIONS[skillName]?.[0] || 'Core Fundamentals';
    setSelectedTopic(defaultTopic);
    setSelectedDifficulty('Intermediate');
    setQuizStarted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setResult(null);
  }, [skillName, open]);

  if (!skillName) return null;

  const startQuiz = async () => {
    setLoadingQuestions(true);
    try {
      const fetched = await SkillAssessmentService.generateQuizQuestions({
        skillName,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        count: 4,
      });
      setQuestions(fetched);
      setQuizStarted(true);
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedOption(null);
      setShowExplanation(false);
      setResult(null);
    } catch {
      toast.error('Could not generate quiz questions. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const currentQuestion = questions[currentIndex] || questions[0];

  const handleNext = async () => {
    if (selectedOption === null || !currentQuestion) {
      toast.error('Please select an answer option.');
      return;
    }

    const updated = [...userAnswers, { question: currentQuestion, selectedIndex: selectedOption }];
    setUserAnswers(updated);
    setSelectedOption(null);
    setShowExplanation(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Evaluate assessment against EXACT > 75% rule
      const evalResult = SkillAssessmentService.evaluateAssessment(skillName, selectedTopic, selectedDifficulty, updated);
      setResult(evalResult);

      // Record attempt and update skill status in context + DB
      await recordAssessmentAttempt({
        skillName,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        questionsAttempted: evalResult.totalQuestions,
        correctAnswers: evalResult.correctAnswers,
        totalQuestions: evalResult.totalQuestions,
        score: evalResult.score,
        percentage: evalResult.percentage,
        strongConcepts: evalResult.strongConcepts,
        weakConcepts: evalResult.weakConcepts,
        studyRecommendations: evalResult.recommendedTopics,
      });

      if (evalResult.verificationStatus === 'VERIFIED') {
        toast.success(`Assessment Passed! ${skillName} verified at ${evalResult.verifiedLevel} level (${evalResult.percentage}% score >= 75%).`);
      } else {
        toast.error(`Assessment Score ${evalResult.percentage}% (< 75%). Skill "${skillName}" remains NOT VERIFIED. Reach 75% or higher to verify.`);
      }
    }
  };

  const handleReset = () => {
    setQuizStarted(false);
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const availableTopics = TOPIC_SUGGESTIONS[skillName] || ['Core Fundamentals', 'Practical Execution', 'Architecture & Design', 'Debugging & Optimization'];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + (result ? 1 : 0)) / questions.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl panel-soft max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">AI Technical Assessment</Badge>
            {result && (
              <Badge variant={result.verificationStatus === 'VERIFIED' ? 'default' : 'outline'} className={result.verificationStatus === 'VERIFIED' ? 'bg-emerald-600 font-bold' : 'border-amber-500 text-amber-500 font-bold'}>
                {result.verificationStatus === 'VERIFIED' ? `VERIFIED (${result.percentage}%)` : `NOT VERIFIED (${result.percentage}%)`}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-2xl font-display flex items-center gap-2 mt-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" /> Verify Skill: {skillName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Score <strong>75% or higher</strong> (≥75%) in this technical assessment to upgrade your skill status to <strong>VERIFIED</strong>.
          </DialogDescription>
        </DialogHeader>

        {!quizStarted && !result && (
          <div className="space-y-5 pt-2 text-xs">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="font-semibold text-primary text-sm">Skill Verification Criteria:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Score &gt; 75%</strong> (76%, 80%, 100%) $\rightarrow$ <span className="text-emerald-500 font-semibold">VERIFIED</span></li>
                <li>• <strong>Score &le; 75%</strong> (75%, 74%, 50%) $\rightarrow$ <span className="text-amber-500 font-semibold">NOT VERIFIED</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-foreground">Select Assessment Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Choose topic" /></SelectTrigger>
                <SelectContent>
                  {availableTopics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-foreground">Select Difficulty Level</label>
              <Select value={selectedDifficulty} onValueChange={(v: any) => setSelectedDifficulty(v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Choose difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={startQuiz} disabled={loadingQuestions} className="hover-glow">
                {loadingQuestions ? 'Generating Quiz...' : 'Start Quiz Assessment →'}
              </Button>
            </div>
          </div>
        )}

        {loadingQuestions && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <ShieldCheck className="w-8 h-8 mx-auto text-primary animate-pulse mb-2" />
            <p className="font-semibold text-foreground">Generating AI Assessment...</p>
            <p className="mt-1">Building custom {selectedDifficulty} questions for {skillName} ({selectedTopic})...</p>
          </div>
        )}

        {quizStarted && !result && currentQuestion && (
          <div className="space-y-6 pt-2 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground font-semibold">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="text-primary font-bold">Topic: {currentQuestion.topic}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <Card className="panel-soft border-primary/30">
              <CardContent className="p-4 space-y-4">
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {currentQuestion.question}
                </p>

                <div className="space-y-2">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedOption(i); setShowExplanation(true); }}
                      className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        selectedOption === i
                          ? 'border-primary bg-primary/10 font-semibold text-foreground'
                          : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-primary/40 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-xs leading-snug">{opt}</span>
                    </button>
                  ))}
                </div>

                {showExplanation && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1 text-xs">
                    <p className="font-semibold text-primary">Concept Explanation:</p>
                    <p className="text-muted-foreground">{currentQuestion.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleNext} disabled={selectedOption === null} className="hover-glow">
                {currentIndex + 1 === questions.length ? 'Submit Assessment ✓' : 'Next Question →'}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6 pt-2 text-xs">
            <Card className={`panel-soft ${result.verificationStatus === 'VERIFIED' ? 'border-emerald-500/40 bg-[linear-gradient(135deg,hsl(160,84%,39%/0.08),transparent)]' : 'border-amber-500/40 bg-amber-500/5'}`}>
              <CardContent className="p-5 space-y-4 text-center">
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${result.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                  {result.verificationStatus === 'VERIFIED' ? <Award className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    {result.verificationStatus === 'VERIFIED' ? `${result.verifiedLevel} Verified!` : 'Assessment Not Verified'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Score: <span className={`font-bold text-sm ${result.verificationStatus === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>{result.percentage}%</span>
                    <span className="ml-2 text-[11px]">({result.correctAnswers}/{result.totalQuestions} Correct)</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.verificationStatus === 'VERIFIED'
                      ? 'Congratulations! Score > 75% threshold achieved. Skill is now VERIFIED.'
                      : 'Requirement: Score > 75% required for verification. 75% or lower does not verify.'}
                  </p>
                </div>
                <Progress value={result.percentage} className="h-2" />
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <p className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Strong Concepts
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.strongConcepts.map((sc, i) => <li key={i}>✓ {sc}</li>)}
                  {result.strongConcepts.length === 0 && <li>None demonstrated.</li>}
                </ul>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <p className="font-semibold text-amber-500 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Target Focus Areas
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.weakConcepts.map((wc, i) => <li key={i}>⚠ {wc}</li>)}
                  {result.weakConcepts.length === 0 && <li>All assessment concepts passed cleanly!</li>}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> Next Recommended Step</p>
              <p className="text-muted-foreground">{result.recommendedNextAssessment}</p>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-border/60">
              {result.verificationStatus !== 'VERIFIED' ? (
                <Button onClick={startQuiz} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Re-attempt Assessment
                </Button>
              ) : <div />}
              <Button onClick={handleClose} className="hover-glow">Close & View Profile ✓</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
