# 🦉 PJ OWL

**Organização simples, gestão inteligente.**

O **PJ OWL** é uma aplicação de organização e gestão comercial desenvolvida para trabalhadores autônomos, Microempreendedores Individuais (MEIs), artesãos, prestadores de serviços e pequenos empreendedores.

A plataforma reúne ferramentas para gerenciamento de recibos, controle de custos e despesas, formação de preços, organização de compromissos e acompanhamento financeiro.

Desenvolvido com React e TypeScript, o projeto possui arquitetura modular, armazenamento local e suporte à distribuição Android por meio do Capacitor.

Seu objetivo é oferecer uma solução acessível e prática para organizar atividades comerciais em um único ambiente, com funcionalidades que podem ser utilizadas sem depender continuamente de uma conexão com a internet, conforme os recursos disponíveis em cada plataforma.

---

## 📌 Funcionalidades

### Dashboard

- Indicadores financeiros e operacionais.
- Acompanhamento de receitas, despesas, custos e resultados.
- Gráficos e visualizações financeiras.
- Atalhos para os principais módulos.

### Gerenciamento de recibos

- Cadastro de clientes e informações comerciais.
- Emissão e armazenamento de recibos.
- Identificação por numeração e data.
- Assinatura do responsável e do cliente.
- Exportação e compartilhamento de documentos em PDF.

### Gerenciamento de custos

- Cadastro de materiais e recursos.
- Organização por categorias e subcategorias.
- Controle de quantidades e unidades de medida.
- Cálculos por peso, volume, comprimento, quantidade e tempo.
- Histórico e detalhamento dos custos.

### Calculadora de preços

- Cálculo do custo de produção ou execução de serviços.
- Consideração de materiais e tempo de trabalho.
- Formação de preços e margens de lucro.
- Ajuste manual do preço sugerido.
- Modelos de cobrança por hora, mês, requisição, utilização ou demanda eventual.

### Agenda

- Cadastro, edição e exclusão de compromissos.
- Organização por data e horário.
- Descrição e informações dos compromissos.
- Lembretes e notificações locais no Android.
- Atualização e cancelamento de notificações.

### Histórico de recibos

- Consulta de documentos emitidos.
- Visualização dos dados e assinaturas.
- Identificação de clientes, valores e datas.
- Acesso aos registros anteriores.

### Gerenciamento de despesas

- Registro de gastos comerciais.
- Descrição, valores e datas.
- Consulta e detalhamento de despesas.
- Histórico de movimentações.

### Experiência de uso

- Interface responsiva.
- Suporte a computadores, tablets e smartphones.
- Formatação monetária brasileira.
- Persistência local de informações.
- Funcionamento offline para os recursos locais compatíveis.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| React | Construção da interface |
| TypeScript | Tipagem estática |
| Vite | Desenvolvimento e build |
| CSS | Estilização e responsividade |
| pnpm | Gerenciamento de dependências |
| IndexedDB | Persistência na versão web |
| SQLite | Persistência na versão Android |
| Capacitor | Integração com recursos nativos |
| Vitest | Testes automatizados |
| Git | Controle de versão |
| GitHub | Hospedagem do projeto |
| GitHub Actions | Automação de CI/CD |

---

## 🏗️ Arquitetura

O PJ OWL utiliza uma arquitetura modular, organizada por funcionalidades e responsabilidades.

A estrutura principal está dividida em:

- `src/app`: composição principal da aplicação.
- `src/domain`: modelos e regras de negócio.
- `src/features`: módulos funcionais.
- `src/integration`: cenários de integração.
- `src/shared/components`: componentes reutilizáveis.
- `src/shared/layout`: navegação e estrutura visual.
- `src/shared/storage`: persistência e repositórios.

A documentação detalhada da arquitetura está disponível em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 💻 Requisitos para desenvolvimento

Para executar o projeto localmente, são necessários:

- Node.js 22.16 ou versão compatível com as dependências.
- pnpm na versão definida no `package.json`.
- Git.
- Editor de código de sua preferência.

Para desenvolvimento Android, também são necessários:

- Android Studio.
- Android SDK.
- JDK 21.
- Dependências do Capacitor.

As configurações específicas do ambiente Android estão documentadas em [docs/ANDROID.md](docs/ANDROID.md).

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/BellaFGS/AppRecibos.git
```

### 2. Acesse o diretório do projeto

```bash
cd AppRecibos
```

### 3. Instale as dependências

```bash
pnpm install
```

### 4. Inicie o ambiente de desenvolvimento

```bash
pnpm dev
```

O Vite disponibilizará o endereço local da aplicação no terminal.

---

## 🧪 Verificação e testes

O projeto disponibiliza comandos para verificação estática, execução de testes e compilação.

| Comando | Finalidade |
|---|---|
| `pnpm check` | Verificação de tipos |
| `pnpm test` | Execução dos testes |
| `pnpm test:watch` | Testes em modo de observação |
| `pnpm test:ci` | Testes para integração contínua |
| `pnpm build` | Build de produção |
| `pnpm preview` | Visualização do build |

Para conhecer os procedimentos específicos de validação Android, consulte [docs/ANDROID-TESTING.md](docs/ANDROID-TESTING.md).

---

## 📱 Distribuição Android

O PJ OWL utiliza Capacitor para empacotar a aplicação web em um aplicativo Android.

A integração permite utilizar recursos nativos da plataforma, incluindo armazenamento SQLite, notificações locais e compartilhamento de arquivos.

Para instruções de configuração, sincronização, geração de APK e solução de problemas, consulte [docs/ANDROID.md](docs/ANDROID.md).

---

## 🔄 Integração contínua

O projeto utiliza GitHub Actions para automatizar etapas de verificação, testes e compilação.

O pipeline contempla:

- Validação do código.
- Execução de testes automatizados.
- Build da aplicação web.
- Geração de APK de debug.

Os detalhes das etapas e configurações estão disponíveis em [docs/CI-CD.md](docs/CI-CD.md).

---

## 🎯 Público-alvo

O PJ OWL foi desenvolvido principalmente para:

- Trabalhadores autônomos.
- Microempreendedores Individuais (MEIs).
- Artesãos.
- Pequenos comerciantes.
- Confeiteiros e produtores de alimentos.
- Prestadores de serviços.
- Profissionais de tecnologia.
- Pequenos negócios que precisam organizar custos, preços e atividades comerciais.

---

## 📚 Documentação

A documentação do projeto está organizada em arquivos específicos para facilitar a consulta e evitar a duplicação de informações.

| Documento | Descrição |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Diretrizes e procedimentos para contribuição. |
| [LICENSE](LICENSE) | Licença e permissões de utilização do código-fonte. |
| [COPYRIGHT.md](COPYRIGHT.md) | Direitos autorais, autoria e propriedade intelectual. |
| [TERMS_OF_USE.md](TERMS_OF_USE.md) | Condições gerais de utilização. |
| [SECURITY.md](SECURITY.md) | Política de segurança e comunicação de vulnerabilidades. |
| [docs/INDEX.md](docs/INDEX.md) | Índice da documentação técnica. |

---

## 🤝 Contribuição

O PJ OWL é um projeto colaborativo e recebe contribuições para sua evolução.

Correções, melhorias, sugestões e novas funcionalidades são bem-vindas, desde que respeitem as diretrizes de desenvolvimento, os critérios de qualidade e as condições estabelecidas para o projeto.

Antes de contribuir, consulte o [CONTRIBUTING.md](CONTRIBUTING.md) para conhecer os procedimentos e orientações aplicáveis.

---

## 📄 Licença e direitos autorais

O PJ OWL possui código-fonte disponibilizado sob uma licença própria, que permite o uso, estudo, modificação e redistribuição gratuita, desde que respeitadas as condições estabelecidas no arquivo [LICENSE](LICENSE).

O projeto é atualmente disponibilizado sem finalidade lucrativa. Entretanto, sua responsável poderá adotar modelos de sustentabilidade financeira e distribuição comercial próprios no futuro, respeitando os direitos autorais e as autorizações aplicáveis às contribuições de terceiros.

**Atenção:** a licença permite que pessoas e empresas utilizem o PJ OWL gratuitamente em suas próprias atividades comerciais, mas não autoriza terceiros a comercializar o aplicativo, cobrar pelo acesso, oferecer versões pagas ou explorar comercialmente sua distribuição ou hospedagem.

Por possuir restrições à exploração comercial por terceiros, o PJ OWL é um projeto de código-fonte disponível (*source-available*), não uma distribuição sob licença Open Source aprovada pela OSI.

Para informações detalhadas sobre permissões, restrições, autoria e propriedade intelectual, consulte:

- [LICENSE](LICENSE)
- [COPYRIGHT.md](COPYRIGHT.md)
- [TERMS_OF_USE.md](TERMS_OF_USE.md)

---

## 👥 Colaboradores

O desenvolvimento do PJ OWL conta com a participação dos seguintes colaboradores:

- [Isabella Ferreira Gomes da Silva](https://github.com/BellaFGS)
- [Matheus Cuero Silva](https://github.com/Oroboni)
- [Thomas Lourenço Lopes de Castro](https://github.com/Thomas-1610)

A identificação dos colaboradores representa o reconhecimento de suas contribuições ao projeto. Para informações sobre autoria e direitos relacionados ao código-fonte, consulte [COPYRIGHT.md](COPYRIGHT.md).

---

## 🔗 Links do projeto

- **Repositório oficial:** [github.com/BellaFGS/AppRecibos](https://github.com/BellaFGS/AppRecibos)
- **Portfólio da responsável pelo projeto:** [AllebStrix](https://bellafgs.github.io/Portifolio_Bella/)

---

**PJ OWL | Organização simples, gestão inteligente.**