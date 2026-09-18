import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { checkAdminAuth } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // A própria tela de login não pode ser protegida
    if (location.pathname.startsWith("/admin/login")) return;

    let authenticated = false;
    try {
      const result = await checkAdminAuth();
      authenticated = !!result?.authenticated;
    } catch {
      authenticated = false;
    }

    if (!authenticated) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: () => <Outlet />,
});
