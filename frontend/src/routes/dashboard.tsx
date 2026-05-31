import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    // Client-side check only — SSR has no localStorage and will skip.
    if (typeof window !== "undefined" && !getToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardShell,
});

function DashboardShell() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
