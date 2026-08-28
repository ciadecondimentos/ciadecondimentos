import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // DESATIVADO PARA O PREVIEW PARA GARANTIR ACESSO
    return;
  },
  component: () => <Outlet />,
});


