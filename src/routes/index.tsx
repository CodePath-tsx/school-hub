import { createFileRoute, redirect } from "@tanstack/react-router";
import { db } from "@/lib/store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = db.currentUser();
    if (!user) throw redirect({ to: "/login" });
    if (!db.license()) throw redirect({ to: "/app/licence" });
    throw redirect({ to: "/app" });
  },
  component: () => null,
});
