# ADR-0001: Manter React/TypeScript como núcleo e modularizar por domínio

- **Status:** Aceita
- **Data:** 06/11/2026

## Contexto

A interface web já implementa os fluxos principais do PJ OWL. Uma reescrita nativa duplicaria regras e elevaria o custo de manutenção.

## Decisão

Manter React + TypeScript + Vite como núcleo. Organizar a aplicação por domínio em `features`, separar tipos e regras puras em `domain`, componentes compartilhados em `shared/components`, layout em `shared/layout` e infraestrutura de persistência em `shared/storage`. O Android será empacotado com Capacitor.

## Consequências

- A interface existente pode ser reutilizada na web e no Android.
- Regras puras podem ser testadas sem renderização.
- O estado compartilhado continua coordenado em `app` durante esta etapa para reduzir risco de regressão.
- Adaptadores de armazenamento podem evoluir sem acoplar componentes à tecnologia.
- Desktop nativo poderá ser avaliado futuramente sem alterar o domínio.
