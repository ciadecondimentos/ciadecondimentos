import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db.server";
import { checkAdminAuth } from "./admin-auth.functions";

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS admin_push_tokens (token text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now())`;
}

// Public web-push config (safe for browser); read at runtime because it is not baked into the build.
export const getPushConfig = createServerFn({ method: "GET" }).handler(async () => {
  const env = process.env;
  const appId = env["FIREBASE_MESSAGING_APP_ID"] ?? "";
  return {
    apiKey: env["FIREBASE_MESSAGING_WEB_API_KEY"] ?? "",
    projectId: env["FIREBASE_MESSAGING_PROJECT_ID"] ?? "",
    appId,
    messagingSenderId: appId.split(":")[1] ?? "",
    vapidKey: env["FIREBASE_MESSAGING_VAPID_KEY"] ?? "",
  };
});

export const savePushToken = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => z.object({ token: z.string().min(10).max(4096) }).parse(d))
  .handler(async ({ data }) => {
    const auth = await checkAdminAuth();
    if (!auth?.authenticated) throw new Error("Não autorizado");
    await ensureTable();
    await sql`INSERT INTO admin_push_tokens (token) VALUES (${data.token}) ON CONFLICT (token) DO NOTHING`;
    return { ok: true };
  });

export async function notifyAdmins(title: string, body: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey || !connKey) return;
  await ensureTable();
  const rows = await sql`SELECT token FROM admin_push_tokens`;
  await Promise.all(
    rows.map(async (r: any) => {
      const res = await fetch(
        "https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": connKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: r.token,
              notification: { title, body },
              webpush: { fcm_options: { link: "/admin/pedidos" } },
            },
          }),
        },
      );
      if (!res.ok) {
        const txt = await res.text();
        console.error(`FCM send failed [${res.status}]: ${txt}`);
        if (res.status === 404 || res.status === 400) {
          await sql`DELETE FROM admin_push_tokens WHERE token = ${r.token}`;
        }
      }
    }),
  );
}
