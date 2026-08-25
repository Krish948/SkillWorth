import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { getJobMatchScore, getSkillGaps, careerPaths, calculateSalaryFromSkills } from '@/data/skillsMapping';
import { RICH_CAREERS, CareerDetail, getRichCareerDetail } from '@/data/careerDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Radar, Layers, Search, Compass, FlaskConical, BookOpen, GraduationCap, Briefcase, Award } from 'lucide-react';
import { formatINRRange } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';
import Simulation from '@/pages/Simulation';
import { toast } from 'sonner';

export default function Career() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'explorer';

  const { profile, setTargetCareer } = useStudentProfile();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [roleSearch, setRoleSearch] = useState('');
  const [demandSearch, setDemandSearch] = useState('');
  const [selectedCareerDetail, setSelectedCareerDetail] = useState<CareerDetail | null>(null);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  const skillNames = userSkills.map(us => us.skills?.name).filter(Boolean) as string[];

  const jobMatches = useMemo(
    () =>
      jobs
        .map(job => ({
          ...job,
          match: getJobMatchScore(skillNames, job.required_skills),
          gaps: getSkillGaps(skillNames, job.required_skills),
          detail: getRichCareerDetail(job.role),
        }))
        .sort((a, b) => b.match - a.match),
    [jobs, skillNames],
  );

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(jobs.map(job => job.category)))],
    [jobs],
  );

  const filteredMatches = useMemo(
    () =>
      activeCategory === 'all'
        ? jobMatches
        : jobMatches.filter(job => job.category === activeCategory),
    [activeCategory, jobMatches],
  );

  const roleFilteredMatches = useMemo(
    () =>
      filteredMatches.filter(job =>
        roleSearch.trim().length === 0
          ? true
          : job.role.toLowerCase().includes(roleSearch.trim().toLowerCase()),
      ),
    [filteredMatches, roleSearch],
  );

  const roleSpotlight = roleFilteredMatches[0];

  const demandGaps = useMemo(() => {
    const demandBySkill: Record<string, number> = {};
    roleFilteredMatches.forEach(job => {
      job.gaps.forEach(skill => {
        demandBySkill[skill] = (demandBySkill[skill] || 0) + 1;
      });
    });
    return Object.entries(demandBySkill)
      .map(([skill, demand]) => ({ skill, demand }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 8);
  }, [roleFilteredMatches]);

  const visibleDemandGaps = useMemo(
    () =>
      demandGaps.filter(item =>
        demandSearch.trim().length === 0
          ? true
          : item.skill.toLowerCase().includes(demandSearch.trim().toLowerCase()),
      ),
    [demandGaps, demandSearch],
  );

  const handleSelectRoleTarget = (roleName: string) => {
    setTargetCareer(roleName);
    toast.success(`Target career set to ${roleName}`);
  };

  if (userSkillsLoading || jobsLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading career module"
          description="Mapping career tracks, role fit, and skill analysis..."
        />
      </div>
    );
  }

  if (userSkillsError || jobsError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load career data"
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
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Career Hub</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">{profile.targetCareer || 'Frontend Developer'}</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Explore roles, signals, & decision paths.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Consolidated module combining Career Explorer, Role Radar, and Career Decision Simulation.
            </p>
          </div>
        </div>
      </section>

      {/* Sub-Navigation Tabs */}
      <Tabs value={activeTabParam} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-muted/60 p-1.5 rounded-2xl h-auto max-w-xl">
          <TabsTrigger value="explorer" className="text-xs py-2 rounded-xl gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Career Explorer
          </TabsTrigger>
          <TabsTrigger value="radar" className="text-xs py-2 rounded-xl gap-1.5">
            <Radar className="w-3.5 h-3.5" /> Role Radar
          </TabsTrigger>
          <TabsTrigger value="simulation" className="text-xs py-2 rounded-xl gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" /> Decision Simulator
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Career Explorer */}
        <TabsContent value="explorer" className="space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="capitalize text-xs"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map(job => {
              const detail = job.detail;
              return (
                <Card key={job.id} className="panel-soft flex flex-col justify-between hover-glow group">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="capitalize text-[10px]">{job.category}</Badge>
                      <Badge variant={job.match >= 75 ? 'default' : 'outline'} className="text-xs">
                        {job.match}% match
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-display mt-2">{job.role}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{detail.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground font-semibold">Salary Range:</p>
                      <p className="font-bold text-foreground">{formatINRRange(detail.salaryMin, detail.salaryMax)}</p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-semibold">Skill Tiers:</p>
                      <div className="flex flex-wrap gap-1">
                        {detail.skillTiers.beginner.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                        ))}
                        {detail.skillTiers.intermediate.slice(0, 2).map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <Button size="sm" onClick={() => setSelectedCareerDetail(detail)} className="w-full text-xs hover-glow">
                        View Full Career Profile →
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleSelectRoleTarget(job.role)} className="w-full text-xs">
                        Set as Primary Target Goal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Role Radar */}
        <TabsContent value="radar" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
            <div className="space-y-6 min-w-0">
              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Radar className="w-5 h-5 text-primary" /> Role Match Radar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {roleSpotlight && (
                    <div className="rounded-xl border border-border/60 p-4 bg-card/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Spotlight Match</span>
                        <Badge variant="default">{roleSpotlight.match}% Ready</Badge>
                      </div>
                      <p className="text-xl font-bold font-display">{roleSpotlight.role}</p>
                      <p className="text-xs text-muted-foreground">{formatINRRange(roleSpotlight.salary_min, roleSpotlight.salary_max)}</p>
                      <Progress value={roleSpotlight.match} className="h-2" />
                    </div>
                  )}

                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={roleSearch}
                      onChange={e => setRoleSearch(e.target.value)}
                      placeholder="Search roles in radar..."
                      className="pl-9"
                    />
                  </div>

                  <div className="space-y-2 max-h-[440px] overflow-auto pr-1">
                    {roleFilteredMatches.map(job => (
                      <article key={job.id} className="rounded-2xl border border-border/60 bg-background/70 p-3.5 space-y-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">{job.role}</p>
                            <p className="text-xs text-muted-foreground">{formatINRRange(job.salary_min, job.salary_max)}</p>
                          </div>
                          <Badge variant={job.match >= 75 ? 'default' : 'secondary'}>{job.match}%</Badge>
                        </div>
                        <Progress value={job.match} className="h-1.5" />
                        {job.gaps.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {job.gaps.map(gap => (
                              <Badge key={`${job.id}-${gap}`} variant="outline" className="text-[10px]">missing {gap}</Badge>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" /> Skill Demand Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <Input value={demandSearch} onChange={e => setDemandSearch(e.target.value)} placeholder="Search demand skills..." />
                  {visibleDemandGaps.map(item => (
                    <div key={item.skill} className="rounded-xl border border-border/60 p-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{item.skill}</span>
                        <span className="text-muted-foreground">{item.demand} roles</span>
                      </div>
                      <Progress value={Math.min(100, item.demand * 16)} className="h-1.5 mt-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        </TabsContent>

        {/* Tab 3: Career Simulation */}
        <TabsContent value="simulation">
          <Simulation />
        </TabsContent>
      </Tabs>

      {/* Rich Career Detail Modal */}
      {selectedCareerDetail && (
        <Dialog open={Boolean(selectedCareerDetail)} onOpenChange={() => setSelectedCareerDetail(null)}>
          <DialogContent className="sm:max-w-2xl panel-soft max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="capitalize text-xs">{selectedCareerDetail.category}</Badge>
                <Badge variant="default">{selectedCareerDetail.industryDemand} Demand</Badge>
              </div>
              <DialogTitle className="text-2xl font-display mt-2">{selectedCareerDetail.role}</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">{selectedCareerDetail.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-3 text-xs">
              <div className="rounded-xl bg-primary/10 p-3 space-y-1 text-primary">
                <p className="font-semibold flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> Required Education</p>
                <p className="text-foreground">{selectedCareerDetail.requiredEducation}</p>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">Skill Requirements by Tier</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/60 p-3 space-y-1">
                    <p className="font-semibold text-emerald-500">Beginner Tier</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedCareerDetail.skillTiers.beginner.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3 space-y-1">
                    <p className="font-semibold text-sky-500">Intermediate Tier</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedCareerDetail.skillTiers.intermediate.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3 space-y-1">
                    <p className="font-semibold text-violet-500">Advanced Tier</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedCareerDetail.skillTiers.advanced.map(s => <Badge key={s} variant="default" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 flex items-center gap-1.5"><Award className="w-4 h-4 text-primary" /> Recommended Certifications</p>
                <ul className="space-y-1 text-muted-foreground">
                  {selectedCareerDetail.requiredCertifications.map((cert, i) => <li key={i}>• {cert}</li>)}
                </ul>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> Recommended Portfolio Projects</p>
                <div className="space-y-2">
                  {selectedCareerDetail.recommendedProjects.map((p, i) => (
                    <div key={i} className="rounded-xl border border-border/60 p-2.5 bg-card">
                      <div className="flex justify-between font-semibold">
                        <span>{p.title}</span>
                        <Badge variant="outline" className="text-[9px]">{p.difficulty}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> Internship Opportunities</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedCareerDetail.internshipOpportunities.map((intern, i) => (
                    <div key={i} className="rounded-xl border border-border/60 p-2.5 bg-card">
                      <p className="font-semibold">{intern.role} @ {intern.company}</p>
                      <p className="text-muted-foreground">{intern.location} • {intern.stipend}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCareerDetail(null)}>Close</Button>
                <Button onClick={() => { handleSelectRoleTarget(selectedCareerDetail.role); setSelectedCareerDetail(null); }} className="hover-glow">
                  Set as Primary Career Goal ✓
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
