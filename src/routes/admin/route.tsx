import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { checkAdminAuth } from "@/lib/admin-auth.functions";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import adminIcon from "@/assets/admin-icon-192.png.asset.json";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { name: "theme-color", content: "#8E1611" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Cia Admin" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: adminIcon.url },
    ],
  }),
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
  component: () => (
    <>
      <InstallAppBanner />
      <Outlet />
    </>
  ),
});
