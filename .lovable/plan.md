# Checkout obrigatório e acesso protegido ao painel

## Objetivo
- Exigir nome, telefone e endereço antes de concluir qualquer pedido.
- Manter o envio da localização como opcional.
- Salvar o telefone junto ao cadastro do cliente para aparecer nos dados reais do pedido.
- Proteger `/admin` e todas as telas administrativas, redirecionando visitantes sem sessão para `/admin/login`.
- Remover o acesso alternativo pelo navegador e manter apenas a sessão criada após credenciais válidas.

## Implementação
- Adicionar o campo de telefone ao formulário de finalização e validar os três campos obrigatórios antes de PIX, dinheiro ou cartão.
- Atualizar o processamento do pedido para criar ou atualizar o cliente com o telefone informado.
- Ativar a verificação de sessão no layout do painel, sem bloquear a própria tela de login.
- Ajustar o login para depender somente da autenticação segura no servidor.
- Validar o fluxo completo: visitante em `/admin` vai ao login; login válido abre o painel; checkout bloqueia dados incompletos e aceita localização vazia.

## Detalhes técnicos
- A proteção será feita antes de renderizar as páginas administrativas.
- O telefone será normalizado e validado com quantidade mínima de dígitos.
- A sessão continuará em cookie e não será substituída por armazenamento local.
