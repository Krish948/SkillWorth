import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentSkill } from '@/contexts/ProfileContext';
import { RICH_CAREERS } from '@/data/careerDetails';
import { Flame, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface SkillHeatmapProps {
  skills: StudentSkill[];
  targetRole: string;
  onValidateSkill?: (skillName: string) => void;
}

export const SkillHeatmap: React.FC<SkillHeatmapProps> = ({ skills, targetRole, onValidateSkill }) => {
  const career = RICH_CAREERS[targetRole] || RICH_CAREERS['Frontend Developer'];

  const allRequired = [
    ...career.skillTiers.beginner,
    ...career.skillTiers.intermediate,
    ...career.skillTiers.advanced,
  ];
  const uniqueRequired = Array.from(new Set(allRequired));

  // Determine expected level per required skill
  const getExpectedLevel = (skillName: string): number => {
    if (career.skillTiers.beginner.includes(skillName)) return 2; // Intermediate expected
    if (career.skillTiers.intermediate.includes(skillName)) return 3; // Advanced expected
    if (career.skillTiers.advanced.includes(skillName)) return 4; // Expert expected
    return 2;
  };

  const levelLabels: Record<number, string> = {
    0: 'None',
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
    5: 'Master',
  };

  const heatmapRows = uniqueRequired.map(skillName => {
    const userSkill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    const claimedLevel = userSkill ? userSkill.level : 0;
    const validatedLevel = userSkill && userSkill.status === 'VERIFIED' ? userSkill.level : userSkill ? Math.max(1, userSkill.level - 1) : 0;
    const expectedLevel = getExpectedLevel(skillName);

    const requiresValidation = userSkill && userSkill.status !== 'VERIFIED';
    const isGap = claimedLevel < expectedLevel;
    const isStrength = claimedLevel >= expectedLevel && userSkill?.status === 'VERIFIED';

    return {
      skillName,
      claimedLevel,
      claimedLabel: levelLabels[claimedLevel] || 'None',
      validatedLevel,
      validatedLabel: levelLabels[validatedLevel] || 'Unvalidated',
      expectedLevel,
      expectedLabel: levelLabels[expectedLevel] || 'Intermediate',
      status: userSkill?.status || 'MISSING',
      requiresValidation,
      isGap,
      isStrength,
    };
  });

  const strengths = heatmapRows.filter(r => r.isStrength);
  const gaps = heatmapRows.filter(r => r.isGap);
  const validationNeeded = heatmapRows.filter(r => r.requiresValidation);

  return (
    <Card className="panel-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" /> Skill Heatmap Matrix: {targetRole}
          </CardTitle>
          <Badge variant="outline">Claimed vs Validated vs Required</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Strengths ({strengths.length})
            </p>
            <p className="text-xs text-muted-foreground mt-1">Verified skills meeting expected industry level.</p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Skill Gaps ({gaps.length})
            </p>
            <p className="text-xs text-muted-foreground mt-1">Skills below expected industry role level.</p>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Needs Validation ({validationNeeded.length})
            </p>
            <p className="text-xs text-muted-foreground mt-1">Claimed skills requiring assessment verification.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase tracking-[0.1em]">
                <th className="pb-3 font-semibold">Skill Name</th>
                <th className="pb-3 font-semibold">Claimed Level</th>
                <th className="pb-3 font-semibold">Validated Level</th>
                <th className="pb-3 font-semibold">Industry Required</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {heatmapRows.map(row => (
                <tr key={row.skillName} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{row.skillName}</span>
                      {row.status === 'VERIFIED' && <Badge variant="default" className="text-[9px] px-1 py-0 bg-emerald-600">Verified</Badge>}
                      {row.status === 'RESUME_DETECTED' && <Badge variant="secondary" className="text-[9px] px-1 py-0">Resume</Badge>}
                      {row.status === 'SELF_DECLARED' && <Badge variant="outline" className="text-[9px] px-1 py-0">Self-Declared</Badge>}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={row.claimedLevel > 0 ? 'secondary' : 'outline'} className="text-[10px]">
                      {row.claimedLabel}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <span className={row.status === 'VERIFIED' ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
                      {row.validatedLabel}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-primary">
                    {row.expectedLabel}
                  </td>
                  <td className="py-3 text-right">
                    {row.requiresValidation && onValidateSkill && (
                      <button
                        onClick={() => onValidateSkill(row.skillName)}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Validate Now →
                      </button>
                    )}
                    {row.status === 'VERIFIED' && (
                      <span className="text-[10px] text-emerald-500">✓ Validated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
