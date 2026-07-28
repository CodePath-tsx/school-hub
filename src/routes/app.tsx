import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { db } from "@/lib/store";
import { Menu, X } from "lucide-react";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!db.setupComplete()) throw redirect({ to: "/setup" });
    if (!db.license()) throw redirect({ to: "/license" });
    if (!db.currentUser()) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-xl">
            <AppSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 h-14 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="w-10 h-10 rounded-lg border flex items-center justify-center" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-bold text-primary">SchoolByte ERP</div>
          <div className="w-10" />
        </div>
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
