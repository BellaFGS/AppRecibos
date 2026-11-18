# Arquitetura do Sistema PJ OWL

## 1. Visão arquitetural

O PJ OWL é uma aplicação multiplataforma desenvolvida para gerenciamento de atividades financeiras e operacionais, com foco em controle de custos, precificação, emissão de recibos, agenda e acompanhamento de despesas.

Sua arquitetura foi projetada seguindo o conceito **offline-first**, priorizando o armazenamento local dos dados e permitindo que as funcionalidades principais sejam utilizadas sem conexão com a internet.

O sistema possui duas plataformas de execução:

- **Web:** aplicação executada diretamente no navegador, utilizando IndexedDB para persistência.
- **Android:** aplicação empacotada com Capacitor, executada em uma WebView e utilizando SQLite para persistência local.

A aplicação não possui backend próprio, autenticação de usuários, banco de dados remoto ou sincronização automática em nuvem. Os dados permanecem no dispositivo do usuário, sendo possível realizar exportação e importação de backups manualmente.

### 1.1. Características principais

- Arquitetura offline-first.
- Aplicação multiplataforma Web e Android.
- Separação entre interface, regras de domínio e infraestrutura.
- Persistência local com IndexedDB e SQLite.
- Repositórios responsáveis pelo acesso aos dados.
- Regras financeiras centralizadas na camada de domínio.
- Integrações nativas por meio do Capacitor.
- Backup e restauração em formato JSON.
- Consulta externa de cotação do dólar, com cache e fallback offline.
- Notificações locais para compromissos da agenda.

---

## 2. Modelo arquitetural e organização das camadas

O sistema utiliza uma organização modular baseada na separação de responsabilidades.

Embora não implemente uma arquitetura formal de Clean Architecture ou Domain-Driven Design em sua totalidade, sua estrutura adota princípios semelhantes, principalmente na separação entre interface, regras de negócio e infraestrutura.

### 2.1. Camada de apresentação

**Diretório:** `src/features/`

Responsável por apresentar as funcionalidades do sistema e permitir a interação do usuário.

Cada funcionalidade possui seus próprios componentes e telas.

Principais módulos:

| Módulo | Responsabilidade |
|---|---|
| Dashboard | Apresentação de indicadores e informações gerais. |
| Costs | Gerenciamento de custos e recursos utilizados. |
| Agenda | Cadastro e acompanhamento de compromissos. |
| Expenses | Registro e controle de despesas. |
| Receipts | Criação, edição e finalização de recibos. |
| History | Consulta e exportação de registros anteriores. |
| Profile | Gerenciamento dos dados do perfil comercial. |
| Help | Orientações de utilização e acesso ao formulário de feedback. |

A camada de apresentação utiliza React e TypeScript, com componentes funcionais e hooks para controlar os estados das interfaces.

### 2.2. Camada de aplicação e orquestração

**Arquivo principal:** `src/app/App.tsx`

Responsável por coordenar o funcionamento geral da aplicação.

O componente principal atua como ponto de composição do sistema, realizando atividades como:

- Inicialização do mecanismo de armazenamento.
- Criação dos repositórios.
- Carregamento dos dados persistidos.
- Gerenciamento dos estados globais.
- Disponibilização dos dados para as telas.
- Persistência automática das alterações.
- Controle da navegação entre funcionalidades.
- Gerenciamento de exportação e restauração de backups.
- Controle de operações globais de exclusão.
- Exibição de notificações e mensagens.
- Tratamento do botão de voltar no Android.
- Sincronização das notificações locais da agenda.

O gerenciamento de estado é realizado com os hooks nativos do React, principalmente `useState`, `useEffect` e `useRef`.

Atualmente, o projeto não utiliza bibliotecas externas de gerenciamento global de estado, como Redux ou Zustand.

### 2.3. Camada de domínio

**Diretório:** `src/domain/`

Concentra os modelos, cálculos e regras de negócio da aplicação.

Essa camada representa os conceitos centrais do sistema e procura manter suas regras independentes das tecnologias de interface e persistência.

Principais arquivos:

| Arquivo | Responsabilidade |
|---|---|
| `models.ts` | Definição das interfaces, tipos e modelos de dados. |
| `calculator.ts` | Cálculos de custos, recursos e estimativas de materiais. |
| `financial.ts` | Regras financeiras relacionadas à precificação, margem e markup. |
| `receipts.ts` | Regras de finalização e filtragem de recibos. |
| `moneyWords.ts` | Conversão de valores monetários para sua representação por extenso. |
| `utils.ts` | Funções auxiliares utilizadas pelo domínio. |

As regras dessa camada são utilizadas pelas funcionalidades da aplicação, evitando que cálculos importantes fiquem concentrados exclusivamente nos componentes visuais.

### 2.4. Camada de infraestrutura e serviços compartilhados

**Diretório:** `src/shared/`

Responsável por disponibilizar recursos técnicos utilizados por diferentes funcionalidades.

Principais responsabilidades:

- Persistência local.
- Implementação dos repositórios.
- Migração de dados.
- Exportação e restauração de backups.
- Integração com recursos nativos.
- Componentes compartilhados.
- Layout e navegação.
- Manipulação e compartilhamento de arquivos.

Subdiretórios importantes:

| Diretório | Responsabilidade |
|---|---|
| `storage/` | Abstração de armazenamento, repositórios, migrações e backups. |
| `native/` | Integrações com funcionalidades nativas do Android e recursos do navegador. |
| `components/` | Componentes reutilizáveis da interface. |
| `layout/` | Estrutura visual e navegação principal. |

### 2.5. Integrações

O projeto possui serviços específicos para integração com recursos externos e funcionalidades nativas.

Entre eles:

- Consulta da cotação do dólar.
- Notificações locais do Android.
- Compartilhamento de arquivos.
- Geração de documentos.
- Exportação de imagens.
- Integração com recursos disponibilizados pelo navegador.

O diretório `src/integration/` contém atualmente um teste de integração (`receiptFlow.test.ts`). A orquestração principal da aplicação está concentrada em `src/app/App.tsx` e nos serviços específicos de cada funcionalidade.

---

## 3. Visão geral da arquitetura

O fluxo arquitetural pode ser representado da seguinte maneira:

```mermaid
flowchart TD
    U[Usuário]

    subgraph Presentation["Camada de apresentação"]
        F[Features]
        C[Componentes compartilhados]
        L[Layout e navegação]
    end

    subgraph Application["Camada de aplicação"]
        A[App.tsx]
        S[Gerenciamento de estado]
        O[Orquestração dos fluxos]
    end

    subgraph Domain["Camada de domínio"]
        M[Modelos]
        R[Regras de negócio]
        CAL[Cálculos financeiros]
    end

    subgraph Infrastructure["Infraestrutura"]
        RP[Repositórios]
        SP[Storage Provider]
        BK[Backup e migrações]
        NI[Integrações nativas]
        API[Serviço de cotação]
    end

    subgraph Persistence["Persistência local"]
        IDB[(IndexedDB)]
        SQL[(SQLite)]
    end

    subgraph External["Serviços externos"]
        D[DolarApi]
    end

    U --> F
    F --> A
    C --> F
    L --> F

    A --> S
    A --> O
    A --> RP

    F --> R
    F --> CAL
    R --> M
    CAL --> M

    RP --> SP
    SP --> IDB
    SP --> SQL

    A --> BK
    A --> NI
    F --> API
    API --> D