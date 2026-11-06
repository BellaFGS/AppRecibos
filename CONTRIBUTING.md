# Contribuindo com o PJ OWL

## Antes de alterar

1. Atualize sua branch com `main`.
2. Leia `docs/ARQUITETURA.md`.
3. Identifique o domínio afetado e mantenha a alteração localizada.

## Antes de abrir PR

Execute:

```bash
pnpm check
pnpm test
pnpm build
```

## Regras

- Não misture regras de negócio com JSX.
- Não acesse o armazenamento diretamente em componentes.
- Adicione testes para novas regras e correções de cálculos.
- Preserve acessibilidade, responsividade e identidade visual.
- Descreva mudanças, testes executados e riscos conhecidos no PR.
