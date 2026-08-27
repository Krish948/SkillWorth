import { useState, useEffect } from 'react';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, Sparkles, FileText, Trophy, Award, Settings, Mail } from 'lucide-react';
import { RICH_CAREERS } from '@/data/careerDetails';
import { SkillHeatmap } from '@/components/SkillHeatmap';
import { JobReadinessScoreCard } from '@/components/JobReadinessScore';
import { calculateMultiSignalReadiness } from '@/lib/readiness-engine';
import { SkillVerificationModal } from '@/components/SkillVerificationModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function StudentProfile() {
  const { profile, setTargetCareer, verifySkill } = useStudentProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCareer, setSelectedCareer] = useState(profile.targetCareer || 'Frontend Developer');
  const [validatingSkillName, setValidatingSkillName] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setDisplayName(data.name);
      });
  }, [user?.id]);

  const readinessBreakdown = calculateMultiSignalReadiness(
    selectedCareer,
    profile.skills,
    profile.resumeData,
    profile.interviewSessions,
  );

  const handleCareerChange = (role: string) => {
    setSelectedCareer(role);
    setTargetCareer(role);
    toast.success(`Target career goal updated to ${role}`);
  };

  const handleValidateSkill = (skillName: string) => {
    setValidatingSkillName(skillName);
  };

  const handleSaveProfileSettings = async () => {
    if (!user?.id) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: displayName, goals: selectedCareer })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile settings updated successfully!');
      setSettingsOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to update profile settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const verifiedSkills = profile.skills.filter(s => s.status === 'VERIFIED');
  const resumeSkills = profile.skills.filter(s => s.status === 'RESUME_DETECTED');
  const selfDeclaredSkills = profile.skills.filter(s => s.status === 'SELF_DECLARED');

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <section className="page-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Student Profile</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Single Source of Truth</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Unified Career & Skill Portfolio.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Your central profile connects your Quiz results, Resume Analysis, Verified Skills, Interview Performance, and Job Readiness into one source of truth.
            </p>
          </div>
          <Button onClick={() => setSettingsOpen(true)} variant="outline" className="hover-glow gap-2">
            <Settings className="w-4 h-4" /> Account & Profile Settings
          </Button>
        </div>
      </section>

      <JobReadinessScoreCard breakdown={readinessBreakdown} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
        <div className="space-y-6 min-w-0">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center justify-between">
                <span className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Target Career Goal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Target Career Track</Label>
                <Select value={selectedCareer} onValueChange={handleCareerChange}>
                  <SelectTrigger><SelectValue placeholder="Select target role" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(RICH_CAREERS).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground">{RICH_CAREERS[selectedCareer]?.description}</p>
                <p className="text-muted-foreground">Required Education: {RICH_CAREERS[selectedCareer]?.requiredEducation}</p>
              </div>
            </CardContent>
          </Card>

          <SkillHeatmap
            skills={profile.skills}
            targetRole={selectedCareer}
            onValidateSkill={handleValidateSkill}
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Skill Validation Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-500">Verified Skills ({verifiedSkills.length})</span>
                  <span>{verifiedSkills.length} verified</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {verifiedSkills.map(s => (
                    <Badge key={s.name} variant="default" className="bg-emerald-600 text-[10px]">
                      ✓ {s.name} (Lv.{s.level})
                    </Badge>
                  ))}
                  {verifiedSkills.length === 0 && <p className="text-muted-foreground">No verified skills yet. Click "Validate Now" in the Heatmap.</p>}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex justify-between font-semibold">
                  <span className="text-amber-500">Resume-Detected Skills ({resumeSkills.length})</span>
                  <span>Unverified</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {resumeSkills.map(s => (
                    <Badge key={s.name} variant="secondary" className="text-[10px]">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex justify-between font-semibold">
                  <span>Self-Declared Skills ({selfDeclaredSkills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selfDeclaredSkills.map(s => (
                    <Badge key={s.name} variant="outline" className="text-[10px]">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Connected Module Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Career DNA Quiz</span>
                {profile.quizResult ? (
                  <Badge variant="default" className="text-[10px]">Completed</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => navigate('/skills?tab=quiz')}>Take Quiz →</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Resume Analysis</span>
                {profile.resumeData ? (
                  <Badge variant="default" className="text-[10px]">{profile.resumeData.matchScore}% Match</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => navigate('/skills?tab=resume')}>Analyze →</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Interview Simulator</span>
                {profile.interviewSessions.length > 0 ? (
                  <Badge variant="default" className="text-[10px]">{profile.interviewSessions[0].overallScore}% Avg</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => navigate('/planner?tab=interview')}>Simulate →</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <SkillVerificationModal
        skillName={validatingSkillName || ''}
        open={Boolean(validatingSkillName)}
        onOpenChange={() => setValidatingSkillName(null)}
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md panel-soft p-0 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]">
          <DialogHeader className="p-6 pb-4 border-b border-border/60 flex-none">
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Profile & Account Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Update your user profile, display name, and target career goal.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs min-h-0">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-muted-foreground select-none">
                <Mail className="w-4 h-4 flex-shrink-0" /> {user?.email || 'N/A'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Full Display Name</Label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Target Career Track</Label>
              <Select value={selectedCareer} onValueChange={handleCareerChange}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Target role" /></SelectTrigger>
                <SelectContent className="z-[100]">
                  {Object.keys(RICH_CAREERS).map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 px-6 border-t border-border/60 flex-none bg-muted/20">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfileSettings} disabled={savingSettings} className="hover-glow">
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
