# 🦉 PJ OWL

Aplicação web responsiva desenvolvida para auxiliar autônomos, Microempreendedores Individuais (MEIs), artesãos, prestadores de serviços e pequenos empreendedores no gerenciamento de suas atividades comerciais.

O PJ OWL centraliza funcionalidades de emissão e gerenciamento de recibos, controle de custos e despesas, organização de compromissos, acompanhamento financeiro e armazenamento de informações comerciais.

O projeto utiliza React e TypeScript, com arquitetura modular organizada por funcionalidades e uma camada de persistência local. Sua estrutura também permite o empacotamento para dispositivos Android por meio do Capacitor.

O objetivo é oferecer uma ferramenta simples, acessível e funcional, permitindo que pequenos empreendedores organizem suas atividades sem depender continuamente de uma conexão com a internet.

---

## 📌 Funcionalidades

### 1. Dashboard

Painel inicial para acompanhamento das informações financeiras e operacionais do negócio.

- Exibição de indicadores financeiros.
- Acompanhamento de receitas, despesas, custos e resultados.
- Gráficos com visualização de dados e navegação horizontal.
- Atalhos para acesso às principais funcionalidades.
- Formatação visual de números extensos para preservar a responsividade.
- Indicadores numéricos interativos, permitindo visualizar os valores completos em janelas modais.
- Organização das informações em uma interface adaptável a diferentes tamanhos de tela.

### 2. Gerenciamento de recibos

Módulo responsável pela criação, visualização, armazenamento e compartilhamento de recibos.

**Cadastro e emissão:**
- Identificação do cliente.
- Nome e documento do cliente (CPF/CNPJ).
- Descrição do serviço ou produto.
- Valor da transação.
- Data de emissão.
- Numeração identificadora do recibo.
- Validação dos campos necessários para emissão.

**Perfil comercial:**
- Nome do responsável pelo negócio.
- Nome fantasia.
- CPF/CNPJ.
- Logotipo comercial opcional.
- Assinatura digitalizada do responsável, opcional.

A emissão de recibos depende do preenchimento dos campos obrigatórios do perfil comercial: nome, nome fantasia e CPF/CNPJ.

**Assinaturas:**
- Armazenamento da assinatura do responsável.
- Captura da assinatura do cliente.
- Incorporação das assinaturas ao documento final.

**Visualização e exportação:**
- Visualização completa do recibo em janela modal.
- Exportação do documento em PDF.
- Compartilhamento do recibo como arquivo PDF, inclusive por aplicativos como WhatsApp.
- Preservação dos dados e das assinaturas no documento exportado.
- Padronização dos campos textuais em letras maiúsculas.

O PDF deve conter todas as informações do recibo, incluindo identificação das partes, descrição, valores, data e assinaturas.

### 3. Gerenciamento de custos

Módulo destinado ao controle dos recursos utilizados na produção de produtos ou prestação de serviços.

- Cadastro de materiais e recursos.
- Organização por categorias e subcategorias.
- Registro de custos unitários.
- Controle de quantidades e unidades de medida.
- Suporte a unidades de peso, volume, comprimento e quantidade.
- Suporte a custos relacionados ao tempo de trabalho.
- Formatação de valores monetários em Real (R$).
- Entrada de quantidades decimais, como metros, centímetros, gramas, quilogramas, mililitros e litros.
- Cálculo do custo total dos recursos utilizados.
- Histórico de custos cadastrados.
- Visualização detalhada dos registros.

A calculadora permite organizar diferentes tipos de custos, auxiliando na formação do preço de venda e na identificação do investimento necessário para produzir um determinado item ou executar um serviço.

### 4. Calculadora de preços

Ferramenta para auxiliar na formação de preços de produtos e serviços.

- Cálculo baseado nos custos de produção.
- Consideração de materiais e recursos utilizados.
- Inclusão do tempo de trabalho.
- Cálculo de custos recorrentes e eventuais.
- Sugestão de preço de venda.
- Definição de margem de lucro.
- Possibilidade de ajustar manualmente o preço sugerido.
- Exibição do custo original e do resultado calculado.

Também contempla serviços e ferramentas de tecnologia que utilizam modelos de cobrança diferentes, como:

- Cobrança mensal.
- Cobrança por hora.
- Cobrança por requisição.
- Cobrança por utilização.
- Cobrança por demanda ou serviço eventual.

### 5. Agenda e notificações

Módulo para organização de compromissos e atividades comerciais.

- Cadastro de compromissos.
- Definição de data e horário.
- Inclusão de descrição.
- Edição e exclusão de compromissos.
- Visualização detalhada dos compromissos em janelas modais.
- Configuração de lembretes por antecedência em dias e/ou horários.
- Notificações locais no Android.
- Reprogramação dos lembretes quando um compromisso é alterado.
- Cancelamento das notificações quando um compromisso é excluído.

Os lembretes são locais e não dependem de conexão com a internet após o agendamento.

Na versão web, o sistema informa as limitações de notificações em segundo plano. A experiência de notificações locais é disponibilizada pela integração Android.

### 6. Histórico de recibos

Área destinada à consulta dos recibos emitidos.

- Listagem dos recibos salvos.
- Identificação do cliente.
- Número do recibo.
- Data de emissão.
- Valor da transação.
- Visualização completa do recibo em modal.
- Acesso às informações e assinaturas registradas.
- Organização dos registros para facilitar consultas posteriores.

### 7. Gerenciamento de despesas

Módulo para registrar e acompanhar os gastos do negócio.

- Cadastro de despesas.
- Descrição do gasto.
- Registro de valores e datas.
- Listagem das despesas cadastradas.
- Exibição da descrição diretamente nos cards.
- Visualização do resumo completo em modal.
- Consulta dos registros anteriores.

### 8. Responsividade e experiência de uso

A interface foi desenvolvida para se adaptar a diferentes dispositivos e resoluções.

Entre os cuidados de interface estão:

- Layout adaptável para computadores, tablets e smartphones.
- Navegação organizada por módulos.
- Cards com dimensões controladas.
- Limitação visual de textos e números extensos com reticências.
- Preservação dos valores originais nos dados.
- Exibição das informações completas em janelas modais.
- Formatação monetária brasileira.
- Padronização dos campos textuais dos recibos em letras maiúsculas.

A limitação visual de números extensos evita que valores muito grandes comprometam a organização dos cards ou provoquem rolagem horizontal indesejada.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| React | Construção da interface |
| TypeScript | Tipagem estática e segurança do código |
| Vite | Servidor de desenvolvimento e build |
| CSS | Estilização e responsividade |
| pnpm | Gerenciamento de dependências |
| IndexedDB | Persistência local na web |
| SQLite | Persistência local no Android |
| Capacitor | Empacotamento e integração nativa |
| @capacitor/local-notifications | Notificações locais no Android |
| Vitest | Testes automatizados |
| Git | Controle de versão |
| GitHub | Hospedagem e colaboração |
| GitHub Actions | Automação de integração contínua |

---

## 🏗️ Estrutura do projeto

A aplicação utiliza uma organização modular baseada em funcionalidades, separando componentes visuais, regras de negócio, persistência e integração.

```text
src/
├── app/
│   └── App.tsx
│
├── domain/
│   ├── models.ts
│   ├── utils.ts
│   └── utils.test.ts
│
├── features/
│   ├── agenda/
│   ├── costs/
│   ├── dashboard/
│   ├── expenses/
│   ├── history/
│   ├── profile/
│   └── receipts/
│
├── integration/
│   └── # Cenários integrados e testes
│
├── shared/
│   ├── components/
│   ├── layout/
│   └── storage/
│
├── main.tsx
└── styles.css
```

### Responsabilidade dos diretórios

- **app:** composição principal da aplicação e gerenciamento do estado global.
- **domain:** modelos, regras de negócio e funções independentes da interface.
- **features:** módulos funcionais da aplicação, organizados por domínio.
- **integration:** cenários de integração entre funcionalidades e persistência.
- **shared/components:** componentes visuais reutilizáveis.
- **shared/layout:** navegação, estrutura visual e elementos de organização da interface.
- **shared/storage:** persistência, repositórios, migrações e mecanismos de backup.

---

## ⚙️ Requisitos para desenvolvimento

Para executar o projeto localmente, são necessários:

- Node.js 22.16 ou versão LTS compatível com as dependências fixadas no projeto.
- pnpm na versão especificada em `package.json`, quando houver a propriedade `packageManager`.
- Git.
- Editor de código de sua preferência.

Para o desenvolvimento Android, também são necessários:

- Android Studio.
- Android SDK.
- JDK compatível com a versão do Gradle utilizada.
- Capacitor CLI e dependências nativas configuradas.

---

## 🚀 Instalação e execução

Clone o repositório:

```bash
git clone https://github.com/BellaFGS/AppRecibos.git
```

Entre no diretório:

```bash
cd AppRecibos
```

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

O Vite disponibilizará o endereço local da aplicação no terminal.

---

## 🧪 Validação e testes

Antes de enviar alterações ao repositório, execute os comandos na raiz do projeto.

### Verificação de tipos

```bash
pnpm check
```

Verifica possíveis inconsistências de tipagem no TypeScript.

### Testes automatizados

```bash
pnpm test
```

Executa a suíte de testes utilizando Vitest.

### Testes em modo de observação

```bash
pnpm test:watch
```

Mantém os testes em execução durante o desenvolvimento.

### Testes para integração contínua

```bash
pnpm test:ci
```

Executa os testes em modo não interativo, apropriado para pipelines de CI.

### Build de produção

```bash
pnpm build
```

Realiza a verificação TypeScript e gera os arquivos de produção.

### Visualização do build

```bash
pnpm preview
```

Executa um servidor local para visualizar a versão compilada.

---

## 📐 Padrões de desenvolvimento

O projeto segue algumas diretrizes para manter a organização e facilitar a manutenção.

1. Componentes específicos de funcionalidades devem permanecer em `src/features/<dominio>`.
2. Componentes genéricos e reutilizáveis devem permanecer em `src/shared/components`.
3. Modelos e regras de negócio independentes da interface devem ficar em `src/domain`.
4. O acesso aos dados deve ocorrer por meio dos repositórios de `src/shared/storage`.
5. Componentes não devem acessar diretamente `localStorage`, IndexedDB ou SQLite.
6. Comportamentos compartilhados devem ser extraídos para funções ou componentes reutilizáveis.
7. Preferir funções pequenas, nomes explícitos e tipagem específica.
8. Evitar a utilização de `any` sem necessidade.
9. Regras de negócio novas devem possuir testes unitários.
10. Alterações visuais devem preservar a identidade existente e considerar diferentes tamanhos de tela.
11. Alterações na persistência devem considerar compatibilidade com os dados já armazenados.
12. Funcionalidades nativas devem ser verificadas em ambiente Android.

---

## 🔬 Estratégia de testes

A estratégia de testes contempla diferentes níveis de validação.

### Testes unitários

Devem contemplar:

- Cálculos de custos.
- Formação de preços.
- Formatação monetária.
- Tratamento de quantidades decimais.
- Validação de CPF/CNPJ.
- Validação de perfil comercial.
- Regras de emissão de recibos.
- Migrações de banco de dados.
- Regras de notificações.

### Testes de integração

Devem contemplar:

- Finalização e armazenamento de recibos.
- Persistência por meio dos repositórios.
- Recuperação de registros.
- Consulta e filtragem do histórico.
- Integração entre custos e calculadora de preços.
- Agendamento e cancelamento de notificações.
- Exportação de documentos e preservação das assinaturas.

### Testes de interface

Os fluxos prioritários para validação manual ou automatizada são:

- Cadastro e edição do perfil comercial.
- Emissão de recibos.
- Validação dos documentos.
- Assinatura do cliente e responsável.
- Exportação e compartilhamento de PDFs.
- Cadastro de custos e despesas.
- Utilização da calculadora.
- Cadastro e consulta de compromissos.
- Visualização dos indicadores do dashboard.
- Navegação entre os módulos.
- Responsividade em dispositivos móveis.

A automação E2E de navegador ainda não está configurada. A suíte existente contempla testes unitários e cenários de integração de domínio e persistência.

---

## 🗄️ Persistência e armazenamento

O projeto utiliza uma camada de armazenamento isolada para permitir diferentes mecanismos de persistência conforme a plataforma.

### Versão web

Utiliza IndexedDB para armazenamento local dos dados.

### Versão Android

Utiliza SQLite por meio da integração nativa disponibilizada pelo Capacitor.

A camada de armazenamento centraliza operações de leitura, gravação, atualização e exclusão, reduzindo o acoplamento entre os módulos da aplicação e a implementação do banco de dados.

A evolução dessa camada deve considerar:

- Integridade dos registros.
- Compatibilidade entre versões.
- Migrações de estrutura.
- Recuperação dos dados.
- Backup e restauração.
- Preservação dos registros existentes durante atualizações.

---

## 📱 Aplicativo Android com Capacitor

A interface React é empacotada localmente para Android utilizando Capacitor.

Para adicionar a plataforma Android pela primeira vez:

```bash
pnpm cap:add:android
```

Para gerar a versão web e sincronizar os arquivos e plugins nativos:

```bash
pnpm build
pnpm cap:sync
```

O projeto utiliza notificações locais por meio de:

```text
@capacitor/local-notifications
```

A integração permite programar, atualizar e cancelar notificações relacionadas aos compromissos cadastrados.

A documentação complementar sobre ambiente, ícones, splash screen, instalação e geração de APK está disponível em:

- `docs/ANDROID.md`
- `docs/QA_ANDROID_NOTIFICATIONS.md`

---

## 🔄 Integração contínua (CI/CD)

O projeto utiliza GitHub Actions para automatizar a validação e a compilação.

O workflow executa verificações em pushes e pull requests direcionados às branches `main` e `develop`.

### Etapas do pipeline

1. Configuração do ambiente Node.js.
2. Instalação das dependências.
3. Verificação de tipos TypeScript.
4. Execução dos testes automatizados.
5. Build da aplicação web.
6. Configuração da plataforma Android no runner.
7. Sincronização do Capacitor.
8. Compilação do APK de debug.
9. Publicação do APK como artifact da execução.

A compilação de debug não exige chaves privadas de assinatura.

A distribuição de versões assinadas deve utilizar um processo específico de gerenciamento seguro de credenciais, mantendo chaves e segredos fora do repositório.

---

## 📚 Arquitetura e decisões técnicas

A documentação arquitetural e os registros de decisões do projeto estão organizados em:

- `docs/ARQUITETURA.md`: descrição da arquitetura e organização técnica.
- `docs/decisions/`: registros de decisões arquiteturais.
- `docs/ANDROID.md`: configuração e distribuição Android.
- `docs/QA_ANDROID_NOTIFICATIONS.md`: roteiro de validação das notificações Android.

Esses documentos devem ser atualizados sempre que uma mudança relevante modificar a estrutura, as responsabilidades ou as decisões técnicas da aplicação.

---

## 🎯 Público-alvo

O PJ OWL é direcionado principalmente a:

- Trabalhadores autônomos.
- Microempreendedores Individuais (MEIs).
- Artesãos.
- Pequenos comerciantes.
- Confeiteiros e produtores de alimentos.
- Prestadores de serviços.
- Profissionais da área de tecnologia.
- Pequenos negócios que precisam controlar custos e precificar serviços.

A proposta é reunir ferramentas essenciais de organização comercial em uma única aplicação, reduzindo a necessidade de utilizar diferentes planilhas e aplicativos para tarefas cotidianas.

---

## 📌 Estado de implementação

O projeto possui uma estrutura modular em React e TypeScript, com funcionalidades organizadas por domínio e uma camada de persistência local preparada para diferentes plataformas.

A evolução contempla:

- Organização dos módulos funcionais.
- Centralização da navegação.
- Controle financeiro e operacional.
- Gerenciamento de recibos e documentos.
- Formatação e validação de dados.
- Melhorias de responsividade.
- Persistência local.
- Integração com Android.
- Notificações locais.
- Testes automatizados.
- Pipeline de integração contínua.

As funcionalidades nativas e os fluxos de exportação devem ser validados em ambiente de execução antes da distribuição de uma nova versão.

---

## 🔮 Melhorias futuras

Algumas possibilidades de evolução do projeto incluem:

- Aprimoramento da geração e compartilhamento de recibos em PDF.
- Melhorias na experiência de backup e restauração.
- Ampliação da cobertura de testes automatizados.
- Configuração de testes E2E.
- Aprimoramento dos relatórios financeiros.
- Filtros avançados no histórico.
- Sincronização opcional entre dispositivos.
- Melhorias de acessibilidade.
- Publicação de versão assinada para distribuição Android.

