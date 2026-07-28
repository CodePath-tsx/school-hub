import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { db } from "@/lib/store";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const user = db.currentUser();
    if (!user) throw redirect({ to: "/login" });
    // Licence gate: only /app/licence is accessible without an active license
    if (!db.license() && !location.pathname.startsWith("/app/licence")) {
      throw redirect({ to: "/app/licence" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
