# Loja na raiz, painel admin em /admin com login

## O que muda para o visitante

- `ciadecondimentos.lovable.app` passa a mostrar a **loja do cliente** (catálogo, filtros, carrinho, checkout) — exatamente a loja atual, sem perder nada.
- `ciadecondimentos.lovable.app/admin` passa a ser o **painel administrativo**, protegido por senha.
- Quem tentar abrir qualquer página do admin sem estar autenticado é levado para `/admin/login`.

## Tela de login

Recriada em Tailwind v4 + TypeScript seguindo fielmente o modelo enviado:

- Fundo escuro em degradê (preto → marrom) com camadas animadas (brilho dourado girando e degradê deslizante).
- Cartão central em vidro (blur), borda dourada, animação de entrada suave.
- Emblema quadrado dourado com o ícone flutuando, título "Cia de Condimentos" e subtítulo "Painel Administrativo".
- Campos de e-mail e senha com rótulos dourados em caixa alta, brilho dourado no hover/foco, mensagens de erro em vermelho.
- Opção "Lembrar de mim", link "Esqueci minha senha", botão dourado com brilho deslizante, divisor "ou" e rodapé.
- Estados de carregando, erro ("senha incorreta") e sucesso, além de layout responsivo no celular.

## Segurança do acesso

O painel usa uma **senha única compartilhada**, guardada apenas no servidor (nunca no código do navegador). Após acertar a senha, uma sessão criptografada em cookie mantém o acesso por 7 dias, com botão de sair na barra lateral. A comparação da senha é feita no servidor de forma resistente a ataques de tempo.

Serão solicitados dois valores: a senha do painel e uma chave secreta de sessão (gerada automaticamente).

## Detalhes técnicos

Rotas (TanStack Router):

```text
src/routes/
  index.tsx              -> loja do cliente (conteúdo atual de loja/index.tsx)
  admin/login.tsx        -> tela de login (pública)
  admin/route.tsx        -> layout protegido (beforeLoad -> /admin/login)
  admin/index.tsx        -> dashboard (hoje src/routes/index.tsx)
  admin/produtos.tsx, admin/pedidos.tsx, admin/clientes.tsx,
  admin/financeiro.tsx, admin/fornecedores.tsx,
  admin/relatorios.tsx, admin/promocoes.tsx
```

- O layout atual `src/routes/loja/route.tsx` vira o layout da raiz da loja; `/loja` continua respondendo via redirecionamento permanente para `/` para não quebrar links já compartilhados.
- Todos os `Link to` da `Sidebar`, `Navbar` e páginas internas são atualizados para os caminhos `/admin/*`; o link "Ir para Loja" aponta para `/`.
- Novo `src/lib/admin-auth.functions.ts` com `adminLogin`, `adminLogout` e `getAdminSession`, usando `useSession` de `@tanstack/react-start/server`, `SESSION_SECRET` e `ADMIN_PASSWORD` (lidos dentro do handler), com comparação via hash + `timingSafeEqual`.
- Cada rota do admin recebe `head()` próprio com título/descrição e `robots: noindex`; a raiz da loja recebe metadados de SEO da loja (título, descrição, og/twitter).
- Nenhuma lógica de negócio, consulta SQL ou função de dados existente é alterada — apenas caminhos de rota e a nova camada de login.
- Correção paralela: erro de hidratação em `pedidos` (lista renderizada de forma diferente no servidor e no cliente) ao mover a página para `/admin/pedidos`.
