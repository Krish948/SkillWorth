import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { useJobs } from '@/hooks/useJobs';
import { useFinance } from '@/hooks/useFinance';
import { useUserSkills } from '@/hooks/useUserSkills';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatePanel } from '@/components/ui/state-panel';
import { formatINR, formatINRCompact } from '@/lib/currency';
import { getStorageJson, getStorageItem, setStorageJson, setStorageItem } from '@/lib/local-storage';
import { RICH_CAREERS } from '@/data/careerDetails';
import {
  buildActionNudges,
  buildFinanceProjection,
  buildLearningPlan,
  buildMilestonesFromPlan,
  getRoleReadiness,
  mergeMilestones,
  type LearningMilestone,
  type MilestoneStatus,
} from '@/lib/career-roadmap';
import { buildAdaptiveLearningPlan } from '@/lib/adaptive-planner';
import InterviewSimulator from '@/pages/InterviewSimulator';
import { CalendarCheck2, Siren, Rocket, Clock3, Flag, Search, MessageSquare, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

function storageKey(userId: string, suffix: string): string {
  return `skillworth:planner:${suffix}:${userId}`;
}

const statusColumns: MilestoneStatus[] = ['planned', 'in-progress', 'completed', 'blocked'];

export default function Planner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'roadmap';

  const { user } = useAuth();
  const { profile, setTargetCareer } = useStudentProfile();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();
  const { data: finance, isLoading: financeLoading, error: financeError } = useFinance();

  const [weeklyHours, setWeeklyHours] = useState(6);
  const [milestones, setMilestones] = useState<LearningMilestone[]>([]);
  const [sprintSearch, setSprintSearch] = useState('');
  const [milestoneSearch, setMilestoneSearch] = useState('');

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  const skillNames = useMemo(
    () => userSkills.map(us => us.skills?.name).filter(Boolean) as string[],
    [userSkills],
  );

  const learningPlan = useMemo(
    () => buildLearningPlan(skillNames, jobs, weeklyHours, 5),
    [skillNames, jobs, weeklyHours],
  );

  useEffect(() => {
    if (!user?.id) return;
    const hoursKey = storageKey(user.id, 'weekly-hours');
    const storedHours = getStorageItem(hoursKey);
    if (storedHours) {
      const parsed = Number(storedHours);
      if (!Number.isNaN(parsed) && parsed > 0) setWeeklyHours(parsed);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setStorageItem(storageKey(user.id, 'weekly-hours'), String(weeklyHours));
  }, [weeklyHours, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const milestonesKey = storageKey(user.id, 'milestones');
    const existing = getStorageJson<LearningMilestone[]>(milestonesKey, []);
    const generated = buildMilestonesFromPlan(learningPlan, weeklyHours);
    const merged = mergeMilestones(existing, generated);

    setMilestones(merged);
    setStorageJson(milestonesKey, merged);
  }, [learningPlan, weeklyHours, user?.id]);

  const selectedJob = jobs.find(job => job.role === profile.targetCareer) || jobs[0] || null;
  const readiness = getRoleReadiness(skillNames, selectedJob);

  const adaptivePlan = useMemo(
    () =>
      buildAdaptiveLearningPlan({
        learningPlan,
        milestones,
        weeklyHours,
        lastActiveIso: new Date().toISOString(),
        readiness,
        hasFinancePlan: Boolean(finance),
      }),
    [finance, learningPlan, milestones, readiness, weeklyHours],
  );

  const completedMilestones = milestones.filter(milestone => milestone.status === 'completed').length;
  const targetCareerDetail = RICH_CAREERS[profile.targetCareer || 'Frontend Developer'] || RICH_CAREERS['Frontend Developer'];

  const visibleLearningPlan = useMemo(
    () =>
      adaptivePlan.items.filter(item =>
        sprintSearch.trim().length === 0
          ? true
          : item.skill.toLowerCase().includes(sprintSearch.trim().toLowerCase()),
      ),
    [adaptivePlan.items, sprintSearch],
  );

  const groupedMilestones = statusColumns.map(status => ({
    status,
    items: milestones.filter(milestone => {
      if (milestone.status !== status) return false;
      if (milestoneSearch.trim().length === 0) return true;
      const query = milestoneSearch.trim().toLowerCase();
      return (
        milestone.skill.toLowerCase().includes(query)
        || milestone.title.toLowerCase().includes(query)
      );
    }),
  }));

  const setMilestoneStatus = (id: string, status: MilestoneStatus) => {
    setMilestones(prev =>
      prev.map(milestone =>
        milestone.id === id
          ? { ...milestone, status, updatedAtIso: new Date().toISOString() }
          : milestone,
      ),
    );
  };

  if (userSkillsLoading || jobsLoading || financeLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading execution studio"
          description="Compiling dynamic roadmap, focus sprints, and mock interview tools..."
        />
      </div>
    );
  }

  if (userSkillsError || jobsError || financeError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load planner"
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
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Learning Studio</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">{profile.targetCareer || 'Frontend Developer'}</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Plan, Execute, & Practice.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Consolidated module combining your Dynamic Career Roadmap, Weekly Focus Kanban, and Mock Interview Simulator.
            </p>
          </div>

          <div className="w-full lg:w-[260px] rounded-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Weekly Hours Pace</p>
            <Input
              className="mt-2 h-10 rounded-xl"
              type="number"
              min={2}
              max={40}
              value={weeklyHours}
              onChange={e => setWeeklyHours(Math.max(2, Math.min(40, Number(e.target.value || 2))))}
            />
          </div>
        </div>
      </section>

      {/* Sub-Navigation Tabs */}
      <Tabs value={activeTabParam} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-muted/60 p-1.5 rounded-2xl h-auto max-w-xl">
          <TabsTrigger value="roadmap" className="text-xs py-2 rounded-xl gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Dynamic Roadmap
          </TabsTrigger>
          <TabsTrigger value="kanban" className="text-xs py-2 rounded-xl gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> Focus & Kanban
          </TabsTrigger>
          <TabsTrigger value="interview" className="text-xs py-2 rounded-xl gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Mock Interview
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dynamic Career Roadmap */}
        <TabsContent value="roadmap" className="space-y-6">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" /> Personalized Roadmap for {profile.targetCareer || 'Frontend Developer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This roadmap is dynamically generated from your profile, target career requirements, and missing skill gaps.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-500">Phase 1: Beginner Skill Tier</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {targetCareerDetail.skillTiers.beginner.map(s => (
                      <Badge key={s} variant={skillNames.includes(s) ? 'default' : 'outline'} className="text-xs">
                        {s} {skillNames.includes(s) && '✓'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-500">Phase 2: Intermediate Tier</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {targetCareerDetail.skillTiers.intermediate.map(s => (
                      <Badge key={s} variant={skillNames.includes(s) ? 'default' : 'outline'} className="text-xs">
                        {s} {skillNames.includes(s) && '✓'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-500">Phase 3: Advanced Tier</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {targetCareerDetail.skillTiers.advanced.map(s => (
                      <Badge key={s} variant={skillNames.includes(s) ? 'default' : 'outline'} className="text-xs">
                        {s} {skillNames.includes(s) && '✓'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">Recommended Portfolio Project Goals</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {targetCareerDetail.recommendedProjects.map((p, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-card p-3 text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{p.title}</span>
                        <Badge variant="secondary" className="text-[9px]">{p.difficulty}</Badge>
                      </div>
                      <p className="text-muted-foreground">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Focus Stack & Weekly Kanban */}
        <TabsContent value="kanban" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <div className="space-y-6 min-w-0">
              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" /> Focus Stack & Urgency Sprints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={sprintSearch}
                      onChange={e => setSprintSearch(e.target.value)}
                      placeholder="Search sprints or skills..."
                      className="pl-9 h-10 rounded-xl"
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {visibleLearningPlan.slice(0, 3).map(item => (
                      <article key={item.skill} className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Priority {item.priority}</p>
                            <h3 className="text-base font-semibold mt-1">{item.skill}</h3>
                          </div>
                          <Badge variant="secondary">{item.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{item.focusReason}</p>
                        <Progress value={Math.min(100, Math.round(item.urgencyScore))} className="h-1.5" />
                        <p className="font-semibold text-primary">+{formatINRCompact(item.estimatedSalaryBoost)}/yr boost</p>
                      </article>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <CalendarCheck2 className="w-5 h-5 text-primary" /> Milestone Board
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupedMilestones.map(column => (
                      <div key={column.status} className="rounded-2xl border border-border/60 p-4 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold capitalize">{column.status}</p>
                          <Badge variant="outline" className="text-[10px]">{column.items.length}</Badge>
                        </div>

                        {column.items.map(milestone => (
                          <article key={milestone.id} className="rounded-xl border border-border/60 p-3 bg-card text-xs space-y-2">
                            <div className="flex justify-between font-medium">
                              <span>{milestone.skill}</span>
                              <Badge variant="secondary" className="text-[9px]">{milestone.estimatedHours}h</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-1 pt-1">
                              {statusColumns.map(s => (
                                <Button
                                  key={s}
                                  size="sm"
                                  variant={milestone.status === s ? 'default' : 'outline'}
                                  className="h-6 text-[10px] capitalize"
                                  onClick={() => setMilestoneStatus(milestone.id, s)}
                                >
                                  {s}
                                </Button>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Flag className="w-5 h-5 text-primary" /> Role Readiness Gate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="rounded-xl border border-border/60 p-3 space-y-2">
                    <p className="font-semibold">{readiness?.role || 'N/A'}</p>
                    <p className="text-muted-foreground">{readiness?.matchedRequiredCount}/{readiness?.requiredCount} must-haves matched</p>
                    <Progress value={readiness?.score || 0} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </TabsContent>

        {/* Tab 3: Interview Simulator */}
        <TabsContent value="interview">
          <InterviewSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
