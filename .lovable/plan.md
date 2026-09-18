# Plano: edição no fluxo de caixa

## Objetivo
Adicionar uma ação de editar em todas as linhas de entrada e saída, ao lado da lixeira nas movimentações manuais e ao lado do frete nas vendas.

## Implementação
- Reutilizar o formulário de lançamento em modo de edição, preenchendo os dados atuais.
- Permitir alterar data, categoria, descrição e valor em movimentações manuais.
- Nas entradas originadas de pedidos, permitir alterar data e valor, preservando cliente e itens relacionados.
- Salvar no banco e atualizar imediatamente totais, gráfico e tabela.
- Manter a ação de frete e a exclusão nos locais atuais.

## Validação
- Conferir abertura preenchida do formulário em entradas e saídas.
- Salvar uma edição e confirmar atualização imediata da linha e dos totais.
