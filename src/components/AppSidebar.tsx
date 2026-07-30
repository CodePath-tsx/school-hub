import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  DoorOpen,
  CheckSquare,
  BarChart3,
  Shield,
  Settings as SettingsIcon,
  KeyRound,
  Power,
  Wallet,
  BookMarked,
} from "lucide-react";
import { db } from "@/lib/store";
import { useDb } from "@/lib/useDb";
import { initials } from "@/lib/store";

const sections: {
  label: string;
  items: { title: string; to: string; icon: typeof LayoutDashboard; exact?: boolean }[];
}[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", to: "/app", icon: LayoutDashboard, exact: true },
      { title: "Students", to: "/app/students", icon: Users },
      { title: "Teachers", to: "/app/teachers", icon: BookOpen },
    ],
  },
  {
    label: "Academic",
    items: [
      { title: "Groups", to: "/app/groups", icon: Layers },
      { title: "Classrooms", to: "/app/classrooms", icon: DoorOpen },
      { title: "Attendance", to: "/app/attendance", icon: CheckSquare },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Expenses", to: "/app/expenses", icon: Wallet },
      { title: "Statistics", to: "/app/statistics", icon: BarChart3 },
      { title: "Users & Roles", to: "/app/users", icon: Shield },
      { title: "Settings", to: "/app/settings", icon: SettingsIcon },
    ],
  },
  {
    label: "System",
    items: [{ title: "Licence", to: "/app/licence", icon: KeyRound }],
  },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const state = useDb();
  const user = state.session ? state.users.find((u) => u.id === state.session!.userId) : null;

  return (
    <aside className="w-64 shrink-0 h-full min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-sidebar-foreground/95 flex items-center justify-center">
          <BookMarked className="w-6 h-6 text-sidebar" />
        </div>
        <div className="leading-tight">
          <div className="font-bold text-lg">SchoolByte</div>
          <div className="text-sidebar-foreground/70 text-sm -mt-0.5">ERP</div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-5 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="px-3 py-2 text-[11px] font-semibold tracking-widest text-sidebar-foreground/50 uppercase">
              {sec.label}
            </div>
            <ul className="space-y-1">
              {sec.items.map((it) => {
                const active = it.exact ? path === it.to : path === it.to || path.startsWith(it.to + "/");
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span className="font-medium">{it.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-sidebar-border p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-foreground/15 flex items-center justify-center text-sidebar-foreground font-semibold">
            {initials(user.name.split(" ")[0], user.name.split(" ")[1] ?? "")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</div>
          </div>
          <button
            onClick={() => { db.logout(); nav({ to: "/login" }); }}
            className="w-9 h-9 rounded-lg hover:bg-sidebar-accent flex items-center justify-center"
            title="Sign out"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
