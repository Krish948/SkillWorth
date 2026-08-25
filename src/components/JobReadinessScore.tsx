import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Award, FileCheck, MessageSquareText, Layers, CheckCircle2 } from 'lucide-react';
import { ReadinessSignalBreakdown } from '@/lib/readiness-engine';

export const JobReadinessScoreCard: React.FC<{ breakdown: ReadinessSignalBreakdown }> = ({ breakdown }) => {
  return (
    <Card className="panel-soft border-primary/40 bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),transparent)]">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-xl font-display flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Overall Job Readiness: {breakdown.targetRole}
          </CardTitle>
          <Badge variant="default" className="text-base px-3 py-1 bg-primary text-primary-foreground font-bold">
            {breakdown.overallReadinessScore}% Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-xs text-muted-foreground leading-relaxed">{breakdown.explanation}</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-primary" /> Verified Skills</span>
              <span>40% weight</span>
            </div>
            <p className="text-lg font-bold font-display">{breakdown.verifiedSkillsScore}%</p>
            <Progress value={breakdown.verifiedSkillsScore} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">{breakdown.matchedVerifiedCount}/{breakdown.totalRequiredCount} verified</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-primary" /> Technical Level</span>
              <span>20% weight</span>
            </div>
            <p className="text-lg font-bold font-display">{breakdown.technicalLevelScore}%</p>
            <Progress value={breakdown.technicalLevelScore} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">Proficiency depth</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-primary" /> Projects</span>
              <span>15% weight</span>
            </div>
            <p className="text-lg font-bold font-display">{breakdown.projectsScore}%</p>
            <Progress value={breakdown.projectsScore} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">Portfolio proof</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><MessageSquareText className="w-3.5 h-3.5 text-primary" /> Mock Interview</span>
              <span>15% weight</span>
            </div>
            <p className="text-lg font-bold font-display">{breakdown.interviewScore}%</p>
            <Progress value={breakdown.interviewScore} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">Technical mock score</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-primary" /> Resume Quality</span>
              <span>10% weight</span>
            </div>
            <p className="text-lg font-bold font-display">{breakdown.resumeScore}%</p>
            <Progress value={breakdown.resumeScore} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">Role match quality</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/60">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Actionable Guidance to Reach 100% Readiness:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {breakdown.recommendations.map((rec, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
