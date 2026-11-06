# Arquitetura técnica do PJ OWL

**Versão:** 1.0  
**Data:** 06/11/2026  
**Escopo:** consolidação da arquitetura React/TypeScript.

## 1. Objetivo

Organizar o código por responsabilidade e domínio sem reescrever a interface nem alterar os fluxos existentes. A arquitetura deve permitir manutenção localizada, reutilização de componentes e testes de regras de negócio sem renderizar a aplicação inteira.

## 2. Visão em camadas

```text
Apresentação
  app/App.tsx
  features/*
  shared/components/*
  shared/layout/*
        |
        v
Domínio
  domain/models.ts
  domain/utils.ts
        |
        v
Infraestrutura
  shared/storage/*
```

A camada de apresentação recebe dados e callbacks. Regras puras ficam no domínio. Persistência fica atrás de contratos e repositórios.

## 3. Organização por responsabilidade

| Diretório | Responsabilidade |
|---|---|
| `app/` | Composição da aplicação, navegação, estado compartilhado e coordenação dos casos de uso |
| `domain/` | Tipos de domínio, valores padrão e funções puras |
| `features/dashboard` | Resumo e indicadores |
| `features/costs` | Calculadora e composições |
| `features/agenda` | Compromissos e despesas |
| `features/receipts` | Criação e prévia de recibos |
| `features/history` | Consulta e exportação de recibos finalizados |
| `features/profile` | Dados do negócio e ações de backup |
| `shared/components` | Componentes visuais reutilizáveis |
| `shared/layout` | Navegação e estrutura responsiva |
| `shared/storage` | Contratos, adaptadores, repositórios, migrações e backup |

## 4. Regras de dependência

- `domain` não importa React, componentes ou infraestrutura.
- `features` podem importar `domain` e `shared`, mas não devem importar outra feature.
- `shared/components` não conhece regras específicas de telas.
- `shared/storage` não importa componentes de interface.
- `app` é o ponto de composição e pode conectar features, domínio e infraestrutura.
- `main.tsx` apenas carrega estilos globais e monta `<App />`.

## 5. Estado e persistência

O estado compartilhado continua coordenado em `app/App.tsx` para preservar o comportamento atual. A persistência deve ocorrer exclusivamente por `AppRepositories` e pelos adaptadores definidos em `shared/storage`.

Componentes não devem conhecer IndexedDB, SQLite, `localStorage` ou chaves internas. A migração legada é a única área autorizada a ler as antigas chaves `recibofacil:*`.

## 6. Reutilização de componentes

Componentes visuais genéricos ficam em `shared/components/ui.tsx`. A estrutura de navegação fica em `shared/layout/AppLayout.tsx`. Quando um componente crescer ou ganhar responsabilidade independente, deve ser extraído para arquivo próprio sem alterar sua API visual desnecessariamente.

## 7. Estratégia de qualidade

### Verificações locais

```bash
pnpm check
pnpm test
pnpm build
```

### Testes

- Testes unitários para funções puras de domínio.
- Testes de persistência para repositórios, migrações e backup.
- Testes de integração para fluxos que atravessam domínio e armazenamento.
- Testes E2E para os seis módulos e para os fluxos críticos de backup/restauração.

### Revisão manual de interface

Após alterações estruturais, validar:
- Dashboard e indicadores.
- Calculadora de custos.
- Agenda e despesas.
- Criação e prévia de recibo.
- Histórico e exportações.
- Perfil, logo, assinatura e backup.
- Layout desktop e mobile.

## 8. Decisões e limites

- React + TypeScript + Vite permanecem como núcleo da aplicação.
- Capacitor é a estratégia de empacotamento Android, sem reescrita da interface em Kotlin.
- IndexedDB é o adaptador web.
- SQLite via plugin Capacitor é o adaptador nativo planejado/implementado na camada de infraestrutura.
- A sincronização em nuvem não faz parte do escopo atual.
- Tauri pode ser avaliado futuramente para desktop, sem acoplar o domínio a ele.
- A identidade visual e a folha `styles.css` foram preservadas nesta refatoração.

## 9. Critérios de aceite do épico

- [x] Ponto de entrada reduzido a bootstrap da aplicação.
- [x] Tipos e funções puras separados da interface.
- [x] Componentes comuns e layout compartilhado extraídos.
- [x] Telas organizadas por domínio.
- [x] Persistência permanece isolada em `shared/storage`.
- [x] Scripts de validação documentados.
- [x] Decisões arquiteturais registradas.
- [ ] Testes e build executados no ambiente de desenvolvimento do projeto.
- [ ] Revisão visual manual nos navegadores e dispositivos suportados.
