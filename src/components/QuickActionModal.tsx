import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, Compass, MessageSquare, Plus, Wallet, Briefcase, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const actions = [
    {
      title: 'Add a New Skill',
      description: 'Add a technical or soft skill to your portfolio',
      icon: Sparkles,
      path: '/skills?tab=matrix',
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    },
    {
      title: 'Analyze Resume',
      description: 'Extract skills and check alignment against target roles',
      icon: FileText,
      path: '/skills?tab=resume',
      color: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
    },
    {
      title: 'Take Career DNA Quiz',
      description: 'Discover your optimal tech career matches',
      icon: Compass,
      path: '/skills?tab=quiz',
      color: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
    },
    {
      title: 'Practice Mock Interview',
      description: 'Career-specific technical interview simulation',
      icon: MessageSquare,
      path: '/planner?tab=interview',
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    },
    {
      title: 'Explore Career Roles',
      description: 'Browse role radar, skill tiers, and internship goals',
      icon: Briefcase,
      path: '/career?tab=explorer',
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
    },
    {
      title: 'Log Expense Transaction',
      description: 'Track income, expenses, and savings velocity',
      icon: Wallet,
      path: '/finance?tab=ledger',
      color: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg panel-soft">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" /> Quick Launch Hub
          </DialogTitle>
          <DialogDescription>
            Choose a quick action to launch immediately without navigating through menus.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          {actions.map(action => (
            <button
              key={action.title}
              onClick={() => handleAction(action.path)}
              className={`flex flex-col items-start p-3.5 rounded-xl border ${action.color} hover:bg-muted/40 transition-all text-left group`}
            >
              <div className="flex items-center gap-2">
                <action.icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-xs text-foreground">{action.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{action.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
