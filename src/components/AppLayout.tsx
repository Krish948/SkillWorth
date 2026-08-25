import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Wallet,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Plus,
  Bell,
  CheckCheck,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { QuickActionModal } from '@/components/QuickActionModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { getNotifications, markNotificationAsRead, clearAllNotifications, AppNotification } from '@/lib/notifications';

// Streamlined 5 Core Modules Navigation Architecture
const navItems = [
  { to: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  { to: '/skills', label: 'My Skills & Profile', shortLabel: 'Skills', icon: Sparkles },
  { to: '/career', label: 'Career Hub', shortLabel: 'Career', icon: Briefcase },
  { to: '/planner', label: 'Learning Studio', shortLabel: 'Studio', icon: ClipboardList },
  { to: '/finance', label: 'Finance & ROI', shortLabel: 'Finance', icon: Wallet },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setNotifications(getNotifications(user.id));
  }, [user?.id, notificationsOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    if (!user?.id) return;
    const updated = markNotificationAsRead(user.id, id);
    setNotifications(updated);
  };

  const handleClearAll = () => {
    if (!user?.id) return;
    clearAllNotifications(user.id);
    setNotifications([]);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 lg:px-8 gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl gradient-hero hover-glow flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base sm:text-xl tracking-tight text-foreground">SkillWorth</span>
          </Link>

          {/* Desktop & Laptop Navigation Bar (>= 768px) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 py-1">
            {navItems.map(item => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => setQuickActionOpen(true)}
              className="hover-glow text-xs gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl"
              title="Quick Action (+)"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline font-semibold">Quick Action</span>
            </Button>

            {/* Notifications Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-xl"
              onClick={() => setNotificationsOpen(true)}
              title="View notifications"
            >
              <Bell className="w-4 h-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </Button>

            <span className="hidden xl:inline text-xs text-muted-foreground max-w-[140px] truncate">{user?.email}</span>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile Top Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-xl text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Top Header Dropdown Drawer (< 768px) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-card/95 p-4 flex flex-col gap-2 backdrop-blur-2xl shadow-xl animate-fade-in">
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-muted/40 rounded-xl mb-1">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{user?.email || 'Logged In Student'}</span>
            </div>
            {navItems.map(item => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Page Body Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 min-w-0">
        {children}
      </main>

      {/* Floating Bottom Mobile Navigation Dock (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-2xl border-t border-border/80 py-1.5 px-2 flex items-center justify-around shadow-2xl">
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all touch-manipulation min-w-[56px] ${
                active ? 'text-primary font-bold scale-105' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-primary/10' : ''}`}>
                <item.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Quick Action Dialog */}
      <QuickActionModal open={quickActionOpen} onOpenChange={setQuickActionOpen} />

      {/* Notifications Drawer */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="sm:max-w-md panel-soft p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <SheetHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-display flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Notifications
                </SheetTitle>
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground hover:text-destructive gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </Button>
                )}
              </div>
              <SheetDescription className="text-xs">
                Live activity feed and system events.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-2.5 mt-4 max-h-[70vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="font-semibold text-foreground">No recent notifications</p>
                  <p className="mt-1">Notifications appear when you verify skills, parse resumes, or log transactions.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`rounded-2xl border border-border/60 p-3 text-xs space-y-1.5 transition-all ${
                      n.read ? 'bg-card/50 opacity-80' : 'bg-primary/5 border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-foreground">{n.title}</p>
                      {!n.read && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMarkAsRead(n.id)} title="Mark read">
                          <CheckCheck className="w-3.5 h-3.5 text-primary" />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-snug">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70">{new Date(n.timestampIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
