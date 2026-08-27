import { useEffect, useState } from 'react';
import { useUserSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { useFinance } from '@/hooks/useFinance';
import { calculateSalaryFromSkills, getJobMatchScore, skillSalaryMap } from '@/data/skillsMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Briefcase, TrendingUp, Wallet, ShieldCheck, FileText, Compass, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatINR, formatINRCompact, formatINRRange } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';
import { getStorageJson, setStorageJson } from '@/lib/local-storage';
import { getTopSkillRecommendations, getWeeklyActions } from '@/lib/recommendations';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { calculateMultiSignalReadiness } from '@/lib/readiness-engine';

const CHART_COLORS = [
  'hsl(160,84%,39%)',
  'hsl(262,83%,58%)',
  'hsl(38,92%,50%)',
  'hsl(199,89%,48%)',
  'hsl(0,84%,60%)',
  'hsl(280,70%,48%)',
  'hsl(24,95%,53%)',
  'hsl(173,58%,39%)',
];

const CHART_DOT_COLORS = [
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-red-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
];

export default function Dashboard() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useStudentProfile();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();
  const { data: finance, isLoading: financeLoading, error: financeError } = useFinance();
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setCompletedActions([]);
      return;
    }
    const key = `skillworth:weekly-actions:${user.id}`;
    setCompletedActions(getStorageJson<string[]>(key, []));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const key = `skillworth:weekly-actions:${user.id}`;
    setStorageJson(key, completedActions);
  }, [completedActions, user?.id]);

  if (userSkillsLoading || jobsLoading || financeLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading command center"
          description="Fetching readiness, skills, jobs, and financial velocity..."
        />
      </div>
    );
  }

  if (userSkillsError || jobsError || financeError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load command center"
          description="Please refresh the page and try again."
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const skillNames = userSkills.map(us => us.skills?.name).filter(Boolean) as string[];
  const skillRecommendations = getTopSkillRecommendations(skillNames, jobs, 3);
  const weeklyActions = getWeeklyActions(skillNames, jobs, Boolean(finance));

  const completedCount = weeklyActions.filter(action => completedActions.includes(action.id)).length;
  const completionRate = weeklyActions.length > 0
    ? Math.round((completedCount / weeklyActions.length) * 100)
    : 0;
  const salary = calculateSalaryFromSkills(skillNames);

  const topJobs = jobs
    .map(j => ({ ...j, match: getJobMatchScore(skillNames, j.required_skills) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 5);

  const skillsByCategory = userSkills.reduce((acc, us) => {
    const cat = us.skills?.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const entries = Object.entries(skillsByCategory)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const categoryData = entries.length <= 6
    ? entries
    : [
        ...entries.slice(0, 5),
        { name: 'Other', value: entries.slice(5).reduce((sum, item) => sum + item.value, 0) },
      ];

  const totalSkillsCount = categoryData.reduce((sum, item) => sum + item.value, 0);

  const pieChartData = categoryData.map((item, i) => ({
    ...item,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const totalExpenses = finance?.expenses
    ? finance.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    : 0;
  const monthlySavings = (finance?.income || 0) - totalExpenses;

  const readinessBreakdown = calculateMultiSignalReadiness(
    profile.targetCareer || 'Frontend Developer',
    profile.skills,
    profile.resumeData,
    profile.interviewSessions,
  );

  const salaryChartData = userSkills.map(us => {
    const name = us.skills?.name || '';
    const boost = (us.level / 5) * (skillSalaryMap[name]?.salaryBoost || 5000);
    return { name, boost };
  });
  const visibleSalaryChartData = isMobile ? salaryChartData.slice(0, 6) : salaryChartData;

  const shortcuts = [
    { title: 'Resume Analyzer', desc: 'Audit resume fit & extract skills', path: '/skills?tab=resume', icon: FileText, color: 'text-sky-500' },
    { title: 'Career DNA Quiz', desc: 'Assess interests & working style', path: '/skills?tab=quiz', icon: Compass, color: 'text-violet-500' },
    { title: 'Mock Interview', desc: 'Career-specific technical questions', path: '/planner?tab=interview', icon: MessageSquare, color: 'text-amber-500' },
    { title: 'Skill Verification', desc: 'Pass validation checks for 100% readiness', path: '/skills?tab=verification', icon: ShieldCheck, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <section className="page-hero">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,360px)] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Command Center</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">{profile.targetCareer || 'Frontend Developer'}</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">All your career momentum, in one command center.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Track multi-signal job readiness, complete weekly execution tasks, and monitor salary growth across one unified hub.
            </p>
          </div>

          <Card className="panel-soft border-primary/40 bg-card/95">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold">Job Readiness Signal</p>
                <Badge variant="default" className="text-xs font-bold bg-primary">{readinessBreakdown.overallReadinessScore}% Ready</Badge>
              </div>
              <Progress value={readinessBreakdown.overallReadinessScore} className="h-2" />
              <p className="text-[11px] text-muted-foreground leading-snug">
                Targeting <strong>{profile.targetCareer || 'Frontend Developer'}</strong>. Combine verified skills, resume audit, and interview practice to maximize your readiness.
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/skills?tab=profile')} className="w-full text-xs hover-glow">
                View Full Readiness Breakdown →
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <OnboardingChecklist />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Skills Portfolio', value: `${userSkills.length} skills`, icon: Sparkles, color: 'gradient-career' },
          { label: 'High Job Matches', value: `${topJobs.filter(j => j.match > 50).length} roles`, icon: Briefcase, color: 'gradient-salary' },
          { label: 'Est. Annual Salary', value: formatINRCompact(salary.estimated), icon: TrendingUp, color: 'gradient-finance' },
          { label: 'Monthly Savings', value: formatINR(monthlySavings), icon: Wallet, color: 'gradient-simulation' },
        ].map(s => (
          <Card key={s.label} className="panel-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-display font-bold mt-1 truncate">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {shortcuts.map(sc => (
          <Link key={sc.title} to={sc.path} className="rounded-2xl border border-border/60 bg-card/80 p-3.5 hover:bg-muted/40 transition-all group">
            <sc.icon className={`w-5 h-5 ${sc.color} group-hover:scale-110 transition-transform mb-2`} />
            <p className="text-xs font-bold font-display text-foreground">{sc.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sc.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_340px]">
        <div className="space-y-6 min-w-0">
          <Card className="panel-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center justify-between">
                Weekly Mission Control
                <Link to="/planner" className="text-xs text-primary font-normal hover:underline">Open Execution Studio →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Weekly completion velocity</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />

              <div className="space-y-3">
                {weeklyActions.map(action => {
                  const checked = completedActions.includes(action.id);
                  return (
                    <label key={action.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          setCompletedActions(prev => {
                            if (value === true) return prev.includes(action.id) ? prev : [...prev, action.id];
                            return prev.filter(id => id !== action.id);
                          });
                        }}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium leading-tight">{action.title}</p>
                          <Badge variant={action.impact === 'high' ? 'default' : 'secondary'} className="h-5 text-[10px]">
                            {action.impact} impact
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{action.detail}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display">Salary Impact by Skill</CardTitle>
            </CardHeader>
            <CardContent>
              {salaryChartData.length === 0 ? (
                <p className="text-muted-foreground text-xs py-6 text-center">Add skills in My Skills to view salary impact charts</p>
              ) : (
                <div className="h-64 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibleSalaryChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 11 }} angle={-30} textAnchor="end" height={60} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatINRCompact(v)} />
                      <Tooltip formatter={(v: number) => [formatINR(v), 'Salary Boost']} />
                      <Bar dataKey="boost" fill="hsl(160,84%,39%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center justify-between">
                Top Role Matches
                <Link to="/career?tab=radar" className="text-xs text-primary font-normal hover:underline">Role Radar →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topJobs.length === 0 && <p className="text-muted-foreground text-xs">Add skills to see job matches</p>}
              {topJobs.map(j => (
                <div key={j.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{j.role}</p>
                    <p className="text-xs text-muted-foreground">{formatINRRange(j.salary_min, j.salary_max)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Progress value={j.match} className="w-20 sm:w-24 h-2" />
                    <span className="text-xs font-semibold w-8 text-right">{j.match}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <Card className="gradient-finance hover-glow text-primary-foreground border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display text-primary-foreground">Growth Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg bg-primary-foreground/15 px-3 py-2">
                <p className="opacity-80">Estimated annual salary</p>
                <p className="text-xl font-display font-bold">{formatINR(salary.estimated)}</p>
              </div>
              <div className="rounded-lg bg-primary-foreground/15 px-3 py-2">
                <p className="opacity-80">Monthly savings trend</p>
                <p className="text-lg font-display font-semibold">{formatINR(monthlySavings)}</p>
              </div>
              <p className="opacity-85">Momentum grows fastest when you complete weekly actions and validate one high-impact skill.</p>
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display">Recommended Next Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillRecommendations.length === 0 ? (
                <p className="text-xs text-muted-foreground">You already have the highest-priority mapped skills.</p>
              ) : (
                skillRecommendations.map(rec => (
                  <div key={rec.skill} className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{rec.skill}</p>
                      <span className="text-primary font-semibold">+{formatINRCompact(rec.salaryBoost)}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {rec.reasons.map((reason, idx) => (
                        <li key={`${rec.skill}-${idx}`}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center justify-between">
                Skills Distribution
                <Link to="/skills?tab=matrix" className="text-xs text-primary font-normal hover:underline">Manage →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-4">No skills added yet</p>
              ) : (
                <>
                  <div className="h-48 sm:h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 30 : 40}
                          outerRadius={isMobile ? 60 : 72}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={1}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                        >
                          {pieChartData.map((item) => <Cell key={item.name} fill={item.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 mt-2 text-xs">
                    {pieChartData.map((item, i) => {
                      const percent = totalSkillsCount > 0 ? Math.round((item.value / totalSkillsCount) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CHART_DOT_COLORS[i % CHART_DOT_COLORS.length]}`} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="text-muted-foreground">{item.value} ({percent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
