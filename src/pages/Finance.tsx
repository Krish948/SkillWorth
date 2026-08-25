import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/contexts/ProfileContext';
import { useFinance, useSaveFinance, ExpenseItem } from '@/hooks/useFinance';
import { useUserSkills } from '@/hooks/useUserSkills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Wallet, Plus, X, Target, PiggyBank, TrendingDown, CalendarDays, Repeat2, Filter, Flame, Landmark, ShieldCheck, CircleDollarSign, TrendingUp, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatINR, formatINRCompact } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';
import { getStorageJson, setStorageJson } from '@/lib/local-storage';
import { buildFinancialGrowthStrategy } from '@/lib/financial-growth';
import { calculateSalaryFromSkills } from '@/data/skillsMapping';

const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Shopping', 'Other'];
const PAYMENT_MODES: Array<NonNullable<ExpenseItem['paymentMode']>> = ['UPI', 'Card', 'Cash', 'Bank Transfer', 'Auto Debit'];
const PIE_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#94a3b8'];
const PIE_COLOR_CLASSES = ['bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-sky-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-slate-400'];
const ESSENTIAL_CATEGORIES = ['Housing', 'Food', 'Transport', 'Utilities', 'Healthcare', 'Education'];

interface FinancialGrowthPrefs {
  debtBalance: number;
  debtApr: number;
  debtMonthlyPayment: number;
}

function growthPrefsKey(userId: string): string {
  return `skillworth:finance:growth:${userId}`;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Failed to save financial plan';
}

function getMonthKey(dateString: string): string {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 7);
  return parsed.toISOString().slice(0, 7);
}

function normalizeExpenses(rawExpenses: ExpenseItem[] | null | undefined): ExpenseItem[] {
  return (rawExpenses || []).map((expense, index) => {
    const amount = Number(expense.amount) || 0;
    const date = expense.date && expense.date.length >= 10 ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return {
      id: expense.id || `${expense.category || 'expense'}-${amount}-${date}-${index}`,
      category: expense.category || 'Other',
      amount,
      date,
      note: expense.note || '',
      paymentMode: expense.paymentMode || 'UPI',
      isRecurring: Boolean(expense.isRecurring),
    };
  });
}

export default function Finance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'ledger';

  const { user } = useAuth();
  const { profile } = useStudentProfile();
  const isMobile = useIsMobile();
  const { data: finance, isLoading, error } = useFinance();
  const { data: userSkills = [] } = useUserSkills();
  const saveFinance = useSaveFinance();

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newExpCat, setNewExpCat] = useState('');
  const [newExpAmt, setNewExpAmt] = useState('');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [newExpMode, setNewExpMode] = useState<NonNullable<ExpenseItem['paymentMode']>>('UPI');
  const [newExpNote, setNewExpNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [debtBalance, setDebtBalance] = useState(0);
  const [debtApr, setDebtApr] = useState(12);
  const [debtMonthlyPayment, setDebtMonthlyPayment] = useState(0);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  useEffect(() => {
    if (finance) {
      setIncome(Number(finance.income) || 0);
      setExpenses(normalizeExpenses(finance.expenses as ExpenseItem[]));
      setGoalName(finance.financial_goal || '');
      setGoalAmount(Number(finance.goal_amount) || 0);
    }
  }, [finance]);

  useEffect(() => {
    if (!user?.id) return;
    const prefs = getStorageJson<FinancialGrowthPrefs>(growthPrefsKey(user.id), {
      debtBalance: 0,
      debtApr: 12,
      debtMonthlyPayment: 0,
    });
    setDebtBalance(Math.max(0, Number(prefs.debtBalance) || 0));
    setDebtApr(Math.max(0, Number(prefs.debtApr) || 0));
    setDebtMonthlyPayment(Math.max(0, Number(prefs.debtMonthlyPayment) || 0));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setStorageJson(growthPrefsKey(user.id), {
      debtBalance,
      debtApr,
      debtMonthlyPayment,
    });
  }, [debtApr, debtBalance, debtMonthlyPayment, user?.id]);

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(expenses.map(expense => getMonthKey(expense.date || '')))).sort().reverse();
    return keys;
  }, [expenses]);

  const selectedMonthExpenses = useMemo(() => {
    if (monthFilter === 'all') return expenses;
    return expenses.filter(expense => getMonthKey(expense.date || '') === monthFilter);
  }, [expenses, monthFilter]);

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return selectedMonthExpenses
      .filter(expense => (categoryFilter === 'all' ? true : expense.category === categoryFilter))
      .filter(expense => {
        if (normalizedSearch.length === 0) return true;
        const note = (expense.note || '').toLowerCase();
        const category = expense.category.toLowerCase();
        const mode = (expense.paymentMode || '').toLowerCase();
        return note.includes(normalizedSearch) || category.includes(normalizedSearch) || mode.includes(normalizedSearch);
      });
  }, [categoryFilter, searchTerm, selectedMonthExpenses]);

  const totalExpenses = selectedMonthExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const currentSavings = income - totalExpenses;
  const savingsRate = income > 0 ? Math.round((currentSavings / income) * 100) : 0;
  const goalProgress = goalAmount > 0 ? Math.min(100, Math.round((Math.max(0, currentSavings) / goalAmount) * 100)) : 0;

  const essentialsSpend = selectedMonthExpenses
    .filter(expense => ESSENTIAL_CATEGORIES.includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const growthStrategy = useMemo(
    () =>
      buildFinancialGrowthStrategy({
        income,
        totalExpenses,
        essentialsExpenses: essentialsSpend,
        currentSavings: Math.max(0, currentSavings),
        goalAmount,
        debtBalance,
        debtApr,
        debtMonthlyPayment,
      }),
    [currentSavings, debtApr, debtBalance, debtMonthlyPayment, essentialsSpend, goalAmount, income, totalExpenses],
  );

  const skillNames = userSkills.map(us => us.skills?.name).filter(Boolean) as string[];
  const salary = calculateSalaryFromSkills(skillNames);

  const addExpense = () => {
    if (!newExpCat || !newExpAmt) {
      toast.error('Please specify category and amount.');
      return;
    }
    const amount = Number(newExpAmt);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: newExpCat,
      amount,
      date: newExpDate,
      paymentMode: newExpMode,
      note: newExpNote.trim(),
      isRecurring,
    };

    setExpenses(prev => [newExpense, ...prev]);
    setNewExpCat('');
    setNewExpAmt('');
    setNewExpNote('');
    toast.success('Transaction logged!');
  };

  const removeExpense = (id?: string) => {
    if (!id) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = () => {
    saveFinance.mutate(
      { income, expenses, savings: currentSavings, financial_goal: goalName, goal_amount: goalAmount },
      { onSuccess: () => toast.success('Financial tracker saved.'), onError: (err: unknown) => toast.error(getErrorMessage(err)) }
    );
  };

  if (isLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading financial insights"
          description="Preparing ledger transactions, runway metrics, and ROI forecasts..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load finance data"
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
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Finance & ROI</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Money Control</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Manage transactions & upskilling ROI.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Consolidated module combining your Expense Ledger, Financial Growth Strategy, and Career Upskilling ROI.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saveFinance.isPending} className="hover-glow">Save Financial Plan</Button>
        </div>
      </section>

      {/* Sub-Navigation Tabs */}
      <Tabs value={activeTabParam} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-muted/60 p-1.5 rounded-2xl h-auto max-w-xl">
          <TabsTrigger value="ledger" className="text-xs py-2 rounded-xl gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Transaction Ledger
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-xs py-2 rounded-xl gap-1.5">
            <Landmark className="w-3.5 h-3.5" /> Growth Strategy
          </TabsTrigger>
          <TabsTrigger value="roi" className="text-xs py-2 rounded-xl gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Career Upskilling ROI
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Transaction Ledger */}
        <TabsContent value="ledger" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
            <div className="space-y-6 min-w-0">
              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Add Expense Transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monthly Income (INR)</Label>
                    <Input type="number" value={income || ''} onChange={e => setIncome(Number(e.target.value))} placeholder="0" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newExpCat} onValueChange={setNewExpCat}>
                        <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (INR)</Label>
                      <Input type="number" value={newExpAmt} onChange={e => setNewExpAmt(e.target.value)} placeholder="0" />
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={newExpDate} onChange={e => setNewExpDate(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
                      <Select value={newExpMode} onValueChange={(v: NonNullable<ExpenseItem['paymentMode']>) => setNewExpMode(v)}>
                        <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_MODES.map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Input value={newExpNote} onChange={e => setNewExpNote(e.target.value)} placeholder="e.g. Course fee, laptop upgrade" />
                  </div>

                  <Button type="button" onClick={addExpense} className="w-full hover-glow">
                    <Plus className="w-4 h-4 mr-2" /> Log Expense Transaction
                  </Button>
                </CardContent>
              </Card>

              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Transaction Ledger</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search transactions..." />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger><SelectValue placeholder="Category filter" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-auto pr-1 pt-2">
                    {filteredExpenses.map(expense => (
                      <article key={expense.id} className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{expense.category}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{expense.paymentMode || 'UPI'}</Badge>
                          </div>
                          <p className="text-sm font-semibold mt-1">{formatINR(expense.amount)}</p>
                          <p className="text-[11px] text-muted-foreground">{expense.date} • {expense.note || 'No note'}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeExpense(expense.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </article>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <Card className="panel-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Monthly Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="rounded-xl border border-border/60 p-3 space-y-1">
                    <p className="text-muted-foreground">Income</p>
                    <p className="text-lg font-bold">{formatINR(income)}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3 space-y-1">
                    <p className="text-muted-foreground">Expenses Outflow</p>
                    <p className="text-lg font-bold text-amber-500">{formatINR(totalExpenses)}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3 space-y-1">
                    <p className="text-muted-foreground">Monthly Net Savings</p>
                    <p className="text-lg font-bold text-emerald-500">{formatINR(currentSavings)}</p>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </TabsContent>

        {/* Tab 2: Growth Strategy */}
        <TabsContent value="strategy" className="space-y-6">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" /> Financial Growth Strategy & Debt Payoff
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-muted-foreground">Burn Rate</p>
                  <p className="text-base font-bold mt-1">{formatINR(growthStrategy.burnRate)}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-muted-foreground">Savings Capacity</p>
                  <p className="text-base font-bold mt-1">{formatINR(growthStrategy.savingsCapacity)}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-muted-foreground">Runway</p>
                  <p className="text-base font-bold mt-1">{growthStrategy.runwayMonths === null ? 'N/A' : `${growthStrategy.runwayMonths} months`}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-muted-foreground">Emergency Goal</p>
                  <p className="text-base font-bold mt-1">{formatINR(growthStrategy.emergencyFundTarget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Career Upskilling ROI */}
        <TabsContent value="roi" className="space-y-6">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Career Upskilling & Compensation ROI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <p className="font-semibold text-foreground text-sm">Estimated Annual Salary</p>
                  <p className="text-2xl font-bold font-display text-emerald-500">{formatINR(salary.estimated)}</p>
                  <p className="text-muted-foreground">Calculated from your {skillNames.length} portfolio skills.</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <p className="font-semibold text-foreground text-sm">Target Role Compensation Peak</p>
                  <p className="text-2xl font-bold font-display text-primary">{formatINR(salary.max)}</p>
                  <p className="text-muted-foreground">Achievable with advanced tier skills & verification.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
