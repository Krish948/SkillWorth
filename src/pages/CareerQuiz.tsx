import { useState } from 'react';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { evaluateCareerQuiz, QuizAnswer, CareerMatchResult } from '@/lib/quiz-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, CheckCircle2, ArrowRight, BrainCircuit, RefreshCw, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const INTEREST_OPTIONS = [
  'building apps',
  'web design',
  'ui/ux',
  'databases',
  'system architecture',
  'apis',
  'end-to-end products',
  'ai/ml',
  'analytics',
  'statistics',
  'automation',
  'cloud infrastructure',
  'linux',
];

const STRENGTH_OPTIONS = [
  'problem solving',
  'creativity',
  'logic',
  'math & statistics',
  'attention to detail',
  'communication',
  'project organization',
];

const ABILITY_OPTIONS = [
  'coding & syntax',
  'data visualization',
  'database queries',
  'debugging',
  'ui wireframing',
  'system optimization',
];

export default function CareerQuiz() {
  const { profile, saveQuizResult, setTargetCareer } = useStudentProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['building apps', 'web design']);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>(['problem solving', 'logic']);
  const [workingStyle, setWorkingStyle] = useState<string>('collaborative');
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>(['coding & syntax']);
  const [results, setResults] = useState<CareerMatchResult[] | null>(null);

  const toggleArrayItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleCalculate = () => {
    const currentSkillNames = profile.skills.map(s => s.name);
    const answers: QuizAnswer = {
      interests: selectedInterests,
      strengths: selectedStrengths,
      workingStyle,
      preferences: [workingStyle],
      relevantAbilities: selectedAbilities,
    };

    const calculated = evaluateCareerQuiz(answers, currentSkillNames);
    setResults(calculated);

    const topResult = calculated[0];
    if (topResult) {
      saveQuizResult({
        completedAtIso: new Date().toISOString(),
        interests: selectedInterests,
        strengths: selectedStrengths,
        workingStyle,
        recommendedCareers: calculated.slice(0, 3).map(r => ({
          role: r.role,
          match: r.matchPercentage,
          explanation: r.explanation,
        })),
        targetCareer: topResult.role,
      });
    }

    setStep(4);
    toast.success('Career DNA Analysis complete!');
  };

  const handleSelectCareerTarget = (role: string) => {
    setTargetCareer(role);
    toast.success(`Target career set to ${role}`);
    navigate('/career');
  };

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <section className="page-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Career DNA</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Interactive Quiz</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Discover your optimal tech career match.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Analyze your interests, strengths, working style, and current skill readiness to pinpoint your ideal career trajectory.
            </p>
          </div>
          {results && (
            <Button variant="outline" onClick={() => setStep(1)} className="hover-glow">
              <RefreshCw className="w-4 h-4 mr-2" /> Retake Quiz
            </Button>
          )}
        </div>
      </section>

      {step < 4 && (
        <Card className="panel-soft max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {step} of 3</span>
              <span>{step === 1 ? 'Interests & Domain' : step === 2 ? 'Strengths & Style' : 'Abilities & Skills'}</span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" /> What topics & domains excite you most?
                </h2>
                <p className="text-sm text-muted-foreground">Select all that apply:</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(item => {
                    const active = selectedInterests.includes(item);
                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayItem(selectedInterests, setSelectedInterests, item)}
                        className="capitalize"
                      >
                        {item} {active && <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />}
                      </Button>
                    );
                  })}
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setStep(2)} disabled={selectedInterests.length === 0} className="hover-glow">
                    Next: Strengths & Style <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> What are your top natural strengths & working style?
                </h2>
                <p className="text-sm text-muted-foreground">Select your key strengths:</p>
                <div className="flex flex-wrap gap-2">
                  {STRENGTH_OPTIONS.map(item => {
                    const active = selectedStrengths.includes(item);
                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayItem(selectedStrengths, setSelectedStrengths, item)}
                        className="capitalize"
                      >
                        {item} {active && <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />}
                      </Button>
                    );
                  })}
                </div>

                <div className="pt-4 space-y-2">
                  <label className="text-sm font-semibold">Preferred Working Style:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={workingStyle === 'collaborative' ? 'default' : 'outline'}
                      onClick={() => setWorkingStyle('collaborative')}
                      className="h-auto py-3 justify-start flex-col items-start text-left"
                    >
                      <span className="font-semibold text-sm">Collaborative Team Player</span>
                      <span className="text-xs opacity-80 mt-1">Cross-functional product building</span>
                    </Button>
                    <Button
                      type="button"
                      variant={workingStyle === 'independent' ? 'default' : 'outline'}
                      onClick={() => setWorkingStyle('independent')}
                      className="h-auto py-3 justify-start flex-col items-start text-left"
                    >
                      <span className="font-semibold text-sm">Deep Focus / Independent</span>
                      <span className="text-xs opacity-80 mt-1">Complex system modeling & optimization</span>
                    </Button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} disabled={selectedStrengths.length === 0} className="hover-glow">
                    Next: Relevant Abilities <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" /> What technical abilities describe your current experience?
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ABILITY_OPTIONS.map(item => {
                    const active = selectedAbilities.includes(item);
                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayItem(selectedAbilities, setSelectedAbilities, item)}
                        className="capitalize"
                      >
                        {item} {active && <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />}
                      </Button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={handleCalculate} className="hover-glow">
                    Analyze Career DNA <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && results && (
        <div className="space-y-6">
          <Card className="panel-soft border-primary/40 bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),transparent)]">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" /> Top Recommended Career: {results[0].role}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-display font-bold text-primary">{results[0].matchPercentage}% Match</p>
                  <p className="text-sm text-muted-foreground mt-1">{results[0].explanation}</p>
                </div>
                <Button onClick={() => handleSelectCareerTarget(results[0].role)} className="hover-glow flex-shrink-0">
                  Set as Primary Target & View Explorer →
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold">Current Skill Readiness</p>
                  <div className="flex items-center gap-2">
                    <Progress value={results[0].skillReadiness} className="h-2 flex-1" />
                    <span className="text-sm font-semibold">{results[0].skillReadiness}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold">Missing Key Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results[0].missingSkills.slice(0, 4).map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        missing {skill}
                      </Badge>
                    ))}
                    {results[0].missingSkills.length === 0 && <Badge variant="secondary">All required skills present!</Badge>}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">Recommended Roadmap Sequence</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {results[0].recommendedRoadmap.map((stepText, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 bg-card p-3 text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <span>{stepText}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl font-display font-bold mt-8">Other Matching Careers</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {results.slice(1, 4).map(res => (
              <Card key={res.role} className="panel-soft">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold font-display">{res.role}</h3>
                    <Badge variant="secondary" className="text-sm">{res.matchPercentage}% Match</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{res.explanation}</p>
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span>Readiness: {res.skillReadiness}%</span>
                    <Button size="sm" variant="outline" onClick={() => handleSelectCareerTarget(res.role)}>
                      Select Role →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
