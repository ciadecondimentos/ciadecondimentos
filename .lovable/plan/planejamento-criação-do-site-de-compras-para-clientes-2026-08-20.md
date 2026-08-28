# Planejamento: Criação do Site de Compras para Clientes

Implementar uma interface de e-commerce moderna para os clientes, conectada diretamente ao banco de dados administrativo, com separação de produtos por unidade/peso e integração de pagamentos.

## Ações Realizadas
- [x] Atualização de todos os logotipos para a versão com fundo transparente.
- [x] Criação de `src/lib/store.functions.ts` para processamento de pedidos no banco.
- [x] Configuração da estrutura de rotas em `src/routes/loja/`.
- [x] Implementação do layout base (`loja/route.tsx`) e página inicial (`loja/index.tsx`) do e-commerce.

## Próximos Passos
- [ ] Refinamento do Carrinho de Compras com suporte a quantidades parciais para produtos por KG.
- [ ] Implementação de filtros por categoria na barra de busca e navegação.
- [ ] Adição de detalhes de produtos (modal de visualização rápida).
- [ ] Simulação do fluxo de pagamento PIX (geração de QR Code fictício).
- [ ] Integração final dos pedidos realizados na loja com a aba de "Pedidos" do Painel Admin.

## Detalhes Técnicos
- **Framework**: TanStack Start v1 (React 19).
- **Estilização**: Tailwind CSS v4 com paleta Marrom/Dourado/Vermelho.
- **Estado**: TanStack Query para sincronização de produtos e mutações de pedidos.
- **UX**: Design "Glassmorphism" no header e cards com micro-interações.
