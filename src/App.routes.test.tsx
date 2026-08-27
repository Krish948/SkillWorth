import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const authState: {
  user: { id: string; email: string } | null;
  loading: boolean;
} = {
  user: null,
  loading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: authState.user,
    loading: authState.loading,
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useUserSkills", () => ({
  useAllSkills: () => ({ data: [], isLoading: false, error: null }),
  useUserSkills: () => ({ data: [], isLoading: false, error: null }),
  useAddUserSkill: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useRemoveUserSkill: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}));

vi.mock("@/components/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => null,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/views/Index", () => ({ default: () => <div>Index Page</div> }));
vi.mock("@/views/Auth", () => ({ default: () => <div>Auth Page</div> }));
vi.mock("@/views/Dashboard", () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock("@/views/Skills", () => ({ default: () => <div>Skills Page</div> }));
vi.mock("@/views/Career", () => ({ default: () => <div>Career Page</div> }));
vi.mock("@/views/CareerQuiz", () => ({ default: () => <div>Career Quiz Page</div> }));
vi.mock("@/views/ResumeAnalyzerPage", () => ({ default: () => <div>Resume Analyzer Page</div> }));
vi.mock("@/views/InterviewSimulator", () => ({ default: () => <div>Interview Simulator Page</div> }));
vi.mock("@/views/StudentProfile", () => ({ default: () => <div>Student Profile Page</div> }));
vi.mock("@/views/Finance", () => ({ default: () => <div>Finance Page</div> }));
vi.mock("@/views/Simulation", () => ({ default: () => <div>Simulation Page</div> }));
vi.mock("@/views/Planner", () => ({ default: () => <div>Planner Page</div> }));
vi.mock("@/views/NotFound", () => ({ default: () => <div>Not Found</div> }));

import App from "@/App";

describe("app route protection", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    window.history.pushState({}, "", "/");
  });

  it("redirects unauthenticated users from protected routes to auth", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(await screen.findByText("Auth Page")).toBeInTheDocument();
  });

  it("shows loading state while auth state is resolving", () => {
    authState.loading = true;
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders protected page inside app layout for authenticated users", async () => {
    authState.user = { id: "user-1", email: "user@example.com" };
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
  });
});
