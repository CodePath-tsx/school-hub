import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { db } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const nav = useNavigate();
  useEffect(() => {
    if (!db.setupComplete()) nav({ to: "/setup", replace: true });
    else if (!db.license()) nav({ to: "/license", replace: true });
    else if (!db.currentUser()) nav({ to: "/login", replace: true });
    else nav({ to: "/app", replace: true });
  }, [nav]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">Loading…</div>
    </div>
  );
}
