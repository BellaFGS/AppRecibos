# Testes automatizados do PJ OWL

## Comandos

- `pnpm test`: executa todos os testes uma vez (Vitest).
- `pnpm test:watch`: mantém o Vitest em modo observação durante o desenvolvimento.
- `pnpm test:ci`: executa a suíte em modo não interativo para integração contínua.
- `pnpm check`: verifica os tipos TypeScript.
- `pnpm build`: executa a verificação de tipos e gera a versão de produção.

## Cobertura funcional atual

- Regras financeiras: parsing e formatação monetária, conversão de unidades, custo proporcional, markup, margem, preço manual e lucro/prejuízo.
- Recibos: finalização com validação do registro, persistência pelo repositório e leitura posterior.
- Histórico: busca por cliente e filtros por data inicial/final.
- Câmbio e valor por extenso: conversão USD/BRL, validação de cotação, reais/centavos, dólares/cents e valores grandes.
- Persistência e backup: repositórios, migração do legado, exportação, restauração e rollback em caso de falha.

## Integração contínua

O workflow `.github/workflows/ci.yml` instala as dependências com lockfile congelado e executa `pnpm check`, `pnpm test` e `pnpm build`. Qualquer falha interrompe o job e deixa o pipeline vermelho.

## Como adicionar testes

- Coloque testes unitários junto ao módulo, com sufixo `.test.ts` ou `.test.tsx`.
- Coloque cenários que cruzam domínio e persistência em `src/integration/`.
- Não dependa de API externa: use mocks/fakes determinísticos para rede, relógio e armazenamento.
- Não use dados reais de clientes nos fixtures.
