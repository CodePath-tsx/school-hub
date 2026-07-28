import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border rounded-2xl ${className}`}>{children}</div>
  );
}

export function Badge({
  tone = "default",
  children,
  dot = false,
}: {
  tone?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  children: ReactNode;
  dot?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
    info: "bg-info/12 text-info",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-xs font-medium ${tones[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}

export function Avatar({ initials, tone = "primary" }: { initials: string; tone?: "primary" | "info" | "warning" | "success" }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/12 text-info",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/12 text-success",
  };
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${tones[tone]}`}>
      {initials}
    </div>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "danger" }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tones: Record<string, string> = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
  };
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
