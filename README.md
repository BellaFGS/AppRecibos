# PJ OWL

Aplicação web responsiva para organização de pequenos negócios, com foco em recibos, custos, agenda e histórico. O projeto mantém a interface React/TypeScript existente e prepara a base para distribuição web e empacotamento Android com Capacitor.

## Documentação

- **Especificação:** [`docs/ESPECIFICACAO_DO_PROJETO.md`](docs/ESPECIFICACAO_DO_PROJETO.md) (requisitos, regras, roadmap).
- **Índice:** [`docs/README.md`](docs/README.md).
- **Implementado vs planejado:** tabela na [seção 8 da especificação](docs/ESPECIFICACAO_DO_PROJETO.md#8-requisitos-funcionais).

## Tecnologias

- React + TypeScript
- Vite
- CSS
- pnpm
- IndexedDB na web
- SQLite no Android via Capacitor
- Vitest para testes unitários
- Git e GitHub para versionamento e colaboração

## Estrutura do projeto

```text
src/
├── app/                    # composição da aplicação e estado global
│   └── App.tsx
├── domain/                 # modelos e regras puras de negócio
│   ├── models.ts
│   ├── utils.ts
│   └── utils.test.ts
├── features/               # módulos organizados por domínio/tela
│   ├── agenda/
│   ├── costs/
│   ├── dashboard/
│   ├── history/
│   ├── profile/
│   └── receipts/
├── integration/            # cenários integrados de recibos e persistência
└── shared/
│   ├── components/         # componentes visuais reutilizáveis
│   ├── layout/             # navegação e estrutura visual
│   └── storage/             # persistência, repositórios, migrações e backup
├── main.tsx                # ponto de entrada
└── styles.css              # identidade visual global
```

## Requisitos

- Node.js 22.16 ou versão LTS compatível com a versão de Vite fixada no lockfile.
- pnpm na versão indicada em `package.json` (`packageManager`).
- Git.

## Instalação e execução

```bash
pnpm install
pnpm dev
```

## Android (Capacitor)

Requisitos: JDK 17+ e Android SDK (ou Android Studio).

```bash
pnpm install
pnpm android:apk
cd android && ./gradlew assembleDebug   # Windows: gradlew.bat assembleDebug
```

O CI publica o APK de debug como artifact quando `android/` está no repositório.

## Validação

Execute os comandos na raiz do repositório:

```bash
pnpm check
pnpm test
pnpm build
```

- `pnpm check`: verifica os tipos TypeScript.
- `pnpm test`: executa os testes automatizados uma vez.
- `pnpm test:watch`: mantém os testes em observação durante o desenvolvimento.
- `pnpm test:ci`: executa a suíte em modo não interativo no pipeline de CI.
- `pnpm build`: executa a verificação TypeScript e gera a versão de produção.
- `pnpm preview`: serve localmente o build gerado.

## Padrões de desenvolvimento

1. Componentes de tela pertencem a `src/features/<dominio>`.
2. Componentes visuais genéricos pertencem a `src/shared/components`.
3. Regras de negócio puras e modelos ficam em `src/domain`.
4. Acesso a dados deve passar pelos repositórios em `src/shared/storage`.
5. Não acessar `localStorage`, IndexedDB ou SQLite diretamente dentro de componentes.
6. Evitar duplicação: extrair componentes e funções reutilizáveis quando houver comportamento compartilhado.
7. Preferir funções pequenas, nomes explícitos e tipos específicos em vez de `any`.
8. Toda regra de negócio nova deve ter testes unitários.
9. Manter a identidade visual existente e validar manualmente os seis módulos após alterações de interface.

## Estratégia de testes

- **Unitários:** cálculos, formatação, validações, migrações e backup.
- **Integração:** finalização de recibos, persistência via repositórios, releitura e filtros do histórico.
- **Interface/E2E:** fluxos de recibo, agenda, custos, histórico e perfil. A automação E2E de navegador ainda não está configurada; a suíte atual cobre regras unitárias e integração de domínio/persistência.

## Arquitetura e decisões

Consulte [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) e os registros em [`docs/decisions`](docs/decisions).

## Estado da implementação

A modularização mantém a interface e as folhas de estilo atuais. A camada de persistência foi iniciada na Issue 11 e continua isolada em `shared/storage`. A integração nativa Android e os testes em dispositivo devem ser validados no ambiente Android antes da distribuição.

## Público-alvo

Autônomos, MEIs, artesãos, prestadores de serviços e pequenos empreendedores que precisam organizar custos, compromissos e recibos sem depender continuamente de conexão com a internet.

## Licença

Definir a licença antes de publicar o repositório como software de código aberto.
