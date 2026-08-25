import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAllSkills, useUserSkills, useAddUserSkill, useRemoveUserSkill } from '@/hooks/useUserSkills';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, X, Sparkles, Flame, ShieldCheck, FileText, Compass, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { StatePanel } from '@/components/ui/state-panel';
import { SkillHeatmap } from '@/components/SkillHeatmap';
import ResumeAnalyzer from '@/pages/ResumeAnalyzer';
import CareerQuiz from '@/pages/CareerQuiz';
import StudentProfile from '@/pages/StudentProfile';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Failed to update skill';
}

export default function Skills() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'matrix';

  const { profile, verifySkill } = useStudentProfile();
  const { data: allSkills = [], isLoading: allSkillsLoading, error: allSkillsError } = useAllSkills();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const addSkill = useAddUserSkill();
  const removeSkill = useRemoveUserSkill();

  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [level, setLevel] = useState(3);
  const [validatingSkillName, setValidatingSkillName] = useState<string | null>(null);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  const userSkillIds = userSkills.map(us => us.skill_id);
  const availableSkills = allSkills.filter(s => !userSkillIds.includes(s.id));

  const groupedUserSkills = useMemo(
    () =>
      Object.entries(
        userSkills.reduce<Record<string, typeof userSkills>>((groups, userSkill) => {
          const category = userSkill.skills?.category || 'uncategorized';
          if (!groups[category]) groups[category] = [];
          groups[category].push(userSkill);
          return groups;
        }, {}),
      )
        .map(([category, skills]) => ({
          category,
          skills: skills.sort((a, b) => b.level - a.level || (a.skills?.name || '').localeCompare(b.skills?.name || '')),
        }))
        .sort((a, b) => b.skills.length - a.skills.length || a.category.localeCompare(b.category)),
    [userSkills],
  );

  const handleAdd = () => {
    if (!selectedSkillId) return;
    addSkill.mutate({ skillId: selectedSkillId, level }, {
      onSuccess: () => {
        toast.success('Skill added to portfolio!');
        setSelectedSkillId('');
        setLevel(3);
      },
      onError: (err: unknown) => toast.error(getErrorMessage(err)),
    });
  };

  const handleRemove = (id: string) => {
    removeSkill.mutate(id, { onSuccess: () => toast.success('Skill removed') });
  };

  const confirmValidation = () => {
    if (!validatingSkillName) return;
    verifySkill(validatingSkillName);
    toast.success(`Skill "${validatingSkillName}" verified! Status upgraded to VERIFIED.`);
    setValidatingSkillName(null);
  };

  const levelLabels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const categories = [...new Set(allSkills.map(s => s.category))];

  if (allSkillsLoading || userSkillsLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading skill module"
          description="Preparing your unified skill matrix, heatmap, and profile..."
        />
      </div>
    );
  }

  if (allSkillsError || userSkillsError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load skills"
          description="Please refresh and try again."
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      {/* Module Header */}
      <section className="page-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">My Skills & Profile</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">{profile.targetCareer || 'Frontend Developer'}</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Skills, Audit, and Validation Hub.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              One unified module for your Skill Portfolio, Heatmap Matrix, Skill Verification, Resume Analyzer, and Career DNA Quiz.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[260px]">
            <div className="rounded-2xl border border-border/60 bg-card/90 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Skills Added</p>
              <p className="text-2xl font-display font-bold mt-2">{userSkills.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/90 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Verified</p>
              <p className="text-2xl font-display font-bold mt-2 text-emerald-500">{profile.skills.filter(s => s.status === 'VERIFIED').length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Navigation Tabs */}
      <Tabs value={activeTabParam} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 bg-muted/60 p-1.5 rounded-2xl h-auto">
          <TabsTrigger value="matrix" className="text-xs py-2 rounded-xl gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Skill Matrix
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="text-xs py-2 rounded-xl gap-1.5">
            <Flame className="w-3.5 h-3.5" /> 3-Way Heatmap
          </TabsTrigger>
          <TabsTrigger value="verification" className="text-xs py-2 rounded-xl gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Validation
          </TabsTrigger>
          <TabsTrigger value="resume" className="text-xs py-2 rounded-xl gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Resume Analyzer
          </TabsTrigger>
          <TabsTrigger value="quiz" className="text-xs py-2 rounded-xl gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Career DNA Quiz
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs py-2 rounded-xl gap-1.5">
            <User className="w-3.5 h-3.5" /> Full Profile
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Skill Matrix */}
        <TabsContent value="matrix" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(300px,390px)_minmax(0,1fr)]">
            <Card className="panel-soft xl:sticky xl:top-24 self-start">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Add a Skill
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                    <SelectTrigger><SelectValue placeholder="Select a skill..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <div key={cat}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">{cat}</div>
                          {availableSkills.filter(s => s.category === cat).map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Proficiency</span>
                    <span className="font-medium text-primary">{levelLabels[level]}</span>
                  </div>
                  <Slider value={[level]} onValueChange={([v]) => setLevel(v)} min={1} max={4} step={1} />
                </div>

                <Button onClick={handleAdd} disabled={!selectedSkillId || addSkill.isPending} className="w-full hover-glow">
                  <Plus className="w-4 h-4 mr-1" /> Add Skill
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold">Current Portfolio ({userSkills.length})</h2>
              </div>
              <div className="space-y-4">
                {groupedUserSkills.map(group => (
                  <Card key={group.category} className="panel-soft overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-[linear-gradient(120deg,hsl(var(--primary)/0.08),transparent)] py-3">
                      <CardTitle className="text-sm font-display flex items-center justify-between gap-3 capitalize">
                        <span>{group.category}</span>
                        <Badge variant="secondary" className="text-[10px]">{group.skills.length} skills</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {group.skills.map(us => {
                          const skillName = us.skills?.name || '';
                          const meta = profile.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
                          return (
                            <Card key={us.id} className="panel-soft group">
                              <CardContent className="p-3.5 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-medium text-sm truncate">{skillName}</p>
                                    {meta?.status === 'VERIFIED' && <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-emerald-600">Verified</Badge>}
                                    {meta?.status === 'RESUME_DETECTED' && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Resume</Badge>}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Lv.{us.level} – {levelLabels[us.level] || 'Intermediate'}
                                  </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemove(us.id)}>
                                  <X className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: 3-Way Heatmap */}
        <TabsContent value="heatmap">
          <SkillHeatmap
            skills={profile.skills}
            targetRole={profile.targetCareer || 'Frontend Developer'}
            onValidateSkill={(s) => setValidatingSkillName(s)}
          />
        </TabsContent>

        {/* Tab 3: Verification */}
        <TabsContent value="verification" className="space-y-6">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Skill Verification & Assessment Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Skill verification upgrades your skills from <strong>Self-Declared / Resume-Detected</strong> to <strong>VERIFIED</strong>. Verified skills carry a 40% weight in your Job Readiness score.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {profile.skills.map(s => (
                  <div key={s.name} className="rounded-xl border border-border/60 p-4 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <Badge variant={s.status === 'VERIFIED' ? 'default' : 'outline'} className={s.status === 'VERIFIED' ? 'bg-emerald-600' : ''}>
                        {s.status === 'VERIFIED' ? 'Verified' : s.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Level: {s.levelName}</p>

                    {s.status !== 'VERIFIED' ? (
                      <Button size="sm" onClick={() => setValidatingSkillName(s.name)} className="w-full text-xs hover-glow mt-2">
                        Pass Technical Verification →
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold pt-1">
                        <CheckCircle2 className="w-4 h-4" /> Assessment Verified
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Resume Analyzer */}
        <TabsContent value="resume">
          <ResumeAnalyzer />
        </TabsContent>

        {/* Tab 5: Career DNA Quiz */}
        <TabsContent value="quiz">
          <CareerQuiz />
        </TabsContent>

        {/* Tab 6: Full Profile */}
        <TabsContent value="profile">
          <StudentProfile />
        </TabsContent>
      </Tabs>

      {validatingSkillName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full panel-soft border-primary/50">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" /> Technical Skill Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                Confirm validation assessment for <strong>{validatingSkillName}</strong>. Demonstrating core code proficiency upgrades this skill to <strong>VERIFIED</strong>.
              </p>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <strong>Assessment Criterion:</strong> Code syntax review, core API understanding, and technical accuracy pass.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setValidatingSkillName(null)}>Cancel</Button>
                <Button onClick={confirmValidation} className="hover-glow">Pass & Verify Skill ✓</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
