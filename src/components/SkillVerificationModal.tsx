import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, CheckCircle2, XCircle, BookOpen, Award } from 'lucide-react';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { getAiGeneratedOrBankedQuestions, evaluateSkillAssessment, AssessmentQuestion, VerificationResult } from '@/lib/verification-engine';
import { toast } from 'sonner';

interface SkillVerificationModalProps {
  skillName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SkillVerificationModal: React.FC<SkillVerificationModalProps> = ({ skillName, open, onOpenChange }) => {
  const { verifySkill } = useStudentProfile();

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ question: AssessmentQuestion; selectedIndex: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!skillName || !open) return;
    setLoadingQuestions(true);
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setResult(null);

    getAiGeneratedOrBankedQuestions(skillName, 'Intermediate')
      .then(fetched => setQuestions(fetched))
      .finally(() => setLoadingQuestions(false));
  }, [skillName, open]);

  if (!skillName) return null;

  const currentQuestion = questions[currentIndex] || questions[0];

  const handleNext = () => {
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
      // Calculate final verification result
      const finalEval = evaluateSkillAssessment(skillName, updated);
      setResult(finalEval);

      // Verify skill in ProfileContext state & database
      verifySkill(skillName);
      toast.success(`Technical Assessment Complete! Skill "${skillName}" verified as ${finalEval.verifiedLevel} (${finalEval.verificationScore}%).`);
    }
  };

  const handleReset = () => {
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

  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + (result ? 1 : 0)) / questions.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl panel-soft max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">NVIDIA AI Assessment</Badge>
            {result && <Badge variant="default" className="bg-emerald-600 font-bold">{result.verifiedLevel} Level</Badge>}
          </div>
          <DialogTitle className="text-2xl font-display flex items-center gap-2 mt-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" /> Verify Skill: {skillName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Adaptive NVIDIA AI technical assessment evaluating concepts, practical execution, and problem solving.
          </DialogDescription>
        </DialogHeader>

        {loadingQuestions ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <ShieldCheck className="w-8 h-8 mx-auto text-primary animate-pulse mb-2" />
            <p className="font-semibold text-foreground">Generating NVIDIA AI Assessment...</p>
            <p className="mt-1">Building custom questions for {skillName}...</p>
          </div>
        ) : !result && currentQuestion ? (
          <div className="space-y-6 pt-2 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground font-semibold">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="text-primary font-bold">Tier {currentQuestion.tier}: {currentQuestion.concept}</span>
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
        ) : result ? (
          <div className="space-y-6 pt-2 text-xs">
            <Card className="panel-soft border-emerald-500/40 bg-[linear-gradient(135deg,hsl(160,84%,39%/0.08),transparent)]">
              <CardContent className="p-5 space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">{result.verifiedLevel} Verified!</h3>
                  <p className="text-xs text-muted-foreground mt-1">Verification Score: <span className="font-bold text-emerald-500 text-sm">{result.verificationScore}%</span></p>
                </div>
                <Progress value={result.verificationScore} className="h-2" />
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <p className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Demonstrated Strong Concepts
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.strongConcepts.map((sc, i) => <li key={i}>✓ {sc}</li>)}
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
              <p className="font-semibold text-foreground flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> Recommended Next Steps</p>
              <ul className="space-y-1 text-muted-foreground">
                {result.studyRecommendations.map((rec, i) => <li key={i}>• {rec}</li>)}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button onClick={handleClose} className="hover-glow">Close & View Profile ✓</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
