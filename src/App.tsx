import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import AppLayout from "@/components/AppLayout";

import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./views/Index"));
const Auth = lazy(() => import("./views/Auth"));
const Dashboard = lazy(() => import("./views/Dashboard"));
const Skills = lazy(() => import("./views/Skills"));
const Career = lazy(() => import("./views/Career"));
const Finance = lazy(() => import("./views/Finance"));
const Planner = lazy(() => import("./views/Planner"));
const NotFound = lazy(() => import("./views/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

// Redirect helpers for consolidated navigation
function RedirectTab({ to, tab }: { to: string; tab: string }) {
  return <Navigate to={`${to}?tab=${tab}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ProfileProvider>
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* 5 Core Consolidated Hubs */}
                <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
                <Route path="/career" element={<ProtectedRoute><Career /></ProtectedRoute>} />
                <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />

                {/* Legacy Deep Link Aliases (redirect to consolidated module tabs) */}
                <Route path="/quiz" element={<ProtectedRoute><RedirectTab to="/skills" tab="quiz" /></ProtectedRoute>} />
                <Route path="/resume" element={<ProtectedRoute><RedirectTab to="/skills" tab="resume" /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><RedirectTab to="/skills" tab="profile" /></ProtectedRoute>} />
                <Route path="/interview" element={<ProtectedRoute><RedirectTab to="/planner" tab="interview" /></ProtectedRoute>} />
                <Route path="/simulation" element={<ProtectedRoute><RedirectTab to="/career" tab="simulation" /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
