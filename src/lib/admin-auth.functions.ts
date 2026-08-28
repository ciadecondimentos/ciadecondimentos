import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

// Sessão simplificada para o admin
type AdminSession = { 
  isAuthorized: boolean;
};

const SESSION_NAME = "cia_admin_auth";

// Configuração da sessão usando o padrão TanStack Start
const getSessionConfig = () => ({
  password: process.env['SESSION_SECRET'] || "a-very-long-secret-key-that-must-be-32-chars-long",
  name: SESSION_NAME,
  cookie: {
    path: "/",
    httpOnly: false,
    sameSite: "lax" as const,
    secure: false,
  }
});

/**
 * Função para realizar o login do administrador
 */
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { email: string; password: string })
  .handler(async ({ data }) => {
    const ADMIN_EMAIL = "ciadecondimentos@outlook.com";
    const ADMIN_PASS = process.env['ADMIN_PASSWORD'] || "admin123";

    console.log("Tentativa de login:", data.email);

    if (data.email && data.email.toLowerCase() === ADMIN_EMAIL && data.password === ADMIN_PASS) {
      const session = await useSession<AdminSession>(getSessionConfig());
      await session.update({ isAuthorized: true });
      console.log("Login bem-sucedido!");
      return { success: true };
    }

    console.log("Login falhou.");
    return { success: false, message: "E-mail ou senha inválidos" };
  });

/**
 * Função para verificar se o usuário está autenticado
 */
export const checkAdminAuth = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await useSession<AdminSession>(getSessionConfig());
    return { authenticated: !!session.data.isAuthorized };
  });

/**
 * Função para logout
 */
export const adminLogout = createServerFn({ method: "POST" })
  .handler(async () => {
    const session = await useSession<AdminSession>(getSessionConfig());
    await session.clear();
    return { success: true };
  });
