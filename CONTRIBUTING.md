# Guia de Contribuição | PJ OWL

Obrigado pelo interesse em contribuir com o **PJ OWL**!

Este documento apresenta as diretrizes para participação no desenvolvimento do projeto, incluindo padrões de código, organização das alterações, testes e processo de envio de contribuições.

O objetivo é manter o projeto organizado, sustentável e colaborativo, garantindo a qualidade do código e a consistência das funcionalidades existentes.

---

## 📌 Sobre o projeto

O PJ OWL é uma aplicação web responsiva voltada à organização e gestão de pequenos negócios, oferecendo funcionalidades para gerenciamento de recibos, custos, despesas, agenda e acompanhamento financeiro.

O projeto utiliza React, TypeScript e Vite, com estrutura modular e possibilidade de empacotamento para Android por meio do Capacitor.

Mais informações sobre a aplicação, tecnologias e arquitetura estão disponíveis no [README.md](README.md).

---

## 🚀 Como começar

Antes de contribuir, é recomendado:

1. Ter conhecimentos básicos de Git e GitHub.
2. Conhecer React e TypeScript.
3. Ter Node.js e pnpm instalados.
4. Consultar a documentação do projeto.
5. Verificar se já existe uma Issue relacionada à alteração desejada.

### Requisitos do ambiente

- Node.js 22.16 ou versão LTS compatível com o projeto.
- pnpm na versão especificada em `package.json`.
- Git.
- Editor de código de sua preferência.

### Preparando o ambiente

Faça um fork do repositório ou clone-o, conforme suas permissões de acesso.

```bash
git clone https://github.com/BellaFGS/AppRecibos.git
```

Acesse a pasta:

```bash
cd AppRecibos
```

Instale as dependências:

```bash
pnpm install
```

Execute a aplicação:

```bash
pnpm dev
```

---

## 🌿 Organização de branches

Para facilitar o desenvolvimento paralelo e evitar conflitos, recomenda-se utilizar branches específicas para cada alteração.

| Branch | Finalidade |
|---|---|
| `main` | Versão principal e estável do projeto |
| `develop` | Integração das funcionalidades em desenvolvimento |
| `feat/nome-da-funcionalidade` | Implementação de novas funcionalidades |
| `fix/nome-do-ajuste` | Correção de erros |
| `refactor/nome-da-alteracao` | Refatoração de código |
| `docs/nome-da-documentacao` | Alterações na documentação |
| `test/nome-do-teste` | Criação ou melhoria de testes |

### Criando uma branch

Antes de começar uma alteração, atualize sua branch de desenvolvimento:

```bash
git checkout develop
git pull origin develop
```

Crie uma branch específica:

```bash
git checkout -b feat/nome-da-funcionalidade
```

Exemplo:

```bash
git checkout -b feat/exportacao-recibos-pdf
```

Cada branch deve ter um objetivo claro e concentrar alterações relacionadas entre si.

---

## 💻 Padrões de desenvolvimento

Para preservar a organização e facilitar a manutenção do código, as contribuições devem seguir as seguintes diretrizes.

### 1. Organização dos arquivos

Respeite a estrutura modular existente:

- `src/app`: composição da aplicação e estado global.
- `src/domain`: modelos e regras de negócio.
- `src/features`: funcionalidades organizadas por domínio.
- `src/integration`: cenários de integração.
- `src/shared/components`: componentes reutilizáveis.
- `src/shared/layout`: navegação e estrutura visual.
- `src/shared/storage`: persistência e repositórios.

Evite adicionar funcionalidades em diretórios que não correspondam à responsabilidade do código.

### 2. TypeScript

- Utilize tipagem explícita sempre que necessário.
- Evite o uso indiscriminado de `any`.
- Prefira interfaces e tipos específicos.
- Evite duplicação de estruturas e definições.
- Mantenha as funções pequenas e com responsabilidades bem definidas.

### 3. Componentes React

- Priorize componentes reutilizáveis.
- Evite concentrar regras de negócio diretamente na interface.
- Separe lógica de apresentação quando necessário.
- Preserve os padrões visuais já existentes.
- Considere diferentes resoluções de tela durante o desenvolvimento.

### 4. Regras de negócio

Regras independentes da interface devem permanecer preferencialmente em `src/domain`.

Exemplos:

- Cálculos financeiros.
- Formatação monetária.
- Validação de documentos.
- Regras de emissão de recibos.
- Cálculos de custos e preços.
- Validações de dados.

Sempre que possível, implemente essas regras de forma independente dos componentes visuais.

### 5. Persistência

O acesso aos dados deve ser realizado por meio dos repositórios existentes em `src/shared/storage`.

Não acesse diretamente IndexedDB ou SQLite dentro dos componentes.

Alterações na estrutura dos dados devem considerar:

- Compatibilidade com registros existentes.
- Necessidade de migrações.
- Integridade das informações.
- Possibilidade de recuperação e backup.

### 6. Interface e responsividade

Toda alteração visual deve considerar:

- Computadores.
- Tablets.
- Smartphones.
- Diferentes resoluções e proporções de tela.
- Conteúdos extensos e valores numéricos grandes.
- Comportamento de modais e elementos interativos.

Evite que textos, documentos ou valores monetários comprometam a largura dos componentes.

Sempre que necessário, utilize truncamento visual com reticências, mantendo o conteúdo original disponível para consulta completa.

---

## 🧪 Testes e validação

Toda contribuição deve ser validada antes da abertura de um Pull Request.

Execute os seguintes comandos na raiz do projeto:

### Verificação de tipos

```bash
pnpm check
```

### Testes automatizados

```bash
pnpm test
```

### Build de produção

```bash
pnpm build
```

### Testes em modo de observação

```bash
pnpm test:watch
```

### Testes para integração contínua

```bash
pnpm test:ci
```

### O que deve ser testado?

Dependendo da alteração, considere validar:

- Cálculos e formatações.
- Validação de campos obrigatórios.
- Cadastro, edição e exclusão de registros.
- Persistência e recuperação de dados.
- Emissão e visualização de recibos.
- Exportação de documentos.
- Assinaturas.
- Agendamento de notificações.
- Navegação entre módulos.
- Responsividade da interface.

Novas regras de negócio devem possuir testes unitários sempre que aplicável.

Caso uma funcionalidade dependa de recursos nativos do Android, sua validação também deve considerar um ambiente Android compatível.

---

## 📝 Padrão de commits

Para facilitar a identificação das alterações no histórico do Git, recomenda-se utilizar mensagens de commit padronizadas.

| Prefixo | Utilização |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de erro |
| `refactor` | Refatoração sem alteração de comportamento esperado |
| `style` | Alterações visuais ou de formatação |
| `docs` | Alterações na documentação |
| `test` | Criação ou alteração de testes |
| `chore` | Manutenção e configurações |
| `perf` | Melhorias de desempenho |

### Exemplos

```bash
git commit -m "feat: adiciona exportação de recibos em PDF"
```

```bash
git commit -m "fix: corrige validação de CPF e CNPJ"
```

```bash
git commit -m "docs: atualiza documentação do projeto"
```

```bash
git commit -m "test: adiciona testes para calculadora de custos"
```

As mensagens devem ser objetivas e descrever claramente o propósito da alteração.

---

## 🔀 Processo de Pull Request

Após concluir uma contribuição, siga estas etapas:

1. Verifique se sua branch está atualizada.
2. Execute os testes e a verificação de tipos.
3. Gere o build de produção.
4. Revise os arquivos modificados.
5. Envie sua branch para o GitHub.
6. Abra um Pull Request direcionado à branch `develop`, conforme o fluxo de desenvolvimento do projeto.
7. Aguarde a revisão e eventuais solicitações de ajustes.

### Enviando as alterações

```bash
git add .
git commit -m "feat: descrição da alteração"
git push origin feat/nome-da-funcionalidade
```

### Modelo de descrição para Pull Requests

Ao abrir um Pull Request, procure informar:

- **Descrição:** o que foi desenvolvido ou corrigido?
- **Motivação:** qual problema a alteração resolve?
- **Implementação:** quais arquivos, módulos ou funcionalidades foram modificados?
- **Testes:** quais validações foram realizadas?
- **Evidências:** imagens ou vídeos, quando houver alterações visuais.

### Checklist de Pull Request

- [ ] A alteração possui um objetivo claro.
- [ ] O código segue a estrutura do projeto.
- [ ] Não foram introduzidas duplicações desnecessárias.
- [ ] Os tipos TypeScript estão corretos.
- [ ] Os testes foram executados.
- [ ] O build foi validado.
- [ ] A responsividade foi considerada.
- [ ] A documentação foi atualizada, quando necessário.
- [ ] Nenhuma credencial ou informação sensível foi adicionada.

---

## 🐛 Reportando problemas

Encontrou um erro ou comportamento inesperado?

Antes de abrir uma Issue:

1. Verifique se o problema já foi relatado.
2. Informe em qual módulo o erro acontece.
3. Descreva os passos necessários para reproduzir o problema.
4. Informe qual era o comportamento esperado.
5. Descreva o comportamento observado.
6. Adicione capturas de tela ou mensagens de erro, quando disponíveis.

### Modelo de Issue

**Título:** Descrição breve do problema.

**Módulo afetado:** Informe a funcionalidade relacionada.

**Descrição:** Explique o problema encontrado.

**Passos para reprodução:**
1. Acesse determinada tela.
2. Execute determinada ação.
3. Observe o comportamento.

**Resultado esperado:** Descreva o comportamento correto.

**Resultado obtido:** Descreva o comportamento apresentado.

**Ambiente:** Navegador, sistema operacional ou dispositivo utilizado.

---

## 🔐 Segurança e boas práticas

Para preservar a segurança do projeto:

- Não envie senhas, tokens ou chaves privadas ao repositório.
- Não inclua arquivos `.env` com credenciais reais.
- Não versione keystores ou arquivos de assinatura Android.
- Não compartilhe informações pessoais de clientes utilizadas em testes.
- Utilize dados fictícios durante o desenvolvimento.
- Evite adicionar dependências sem necessidade.
- Verifique a origem e a manutenção das bibliotecas utilizadas.

Problemas relacionados à segurança devem ser comunicados de maneira responsável aos mantenedores do projeto, evitando sua divulgação pública antes da análise.

---

## 📚 Documentação complementar

Antes de implementar mudanças estruturais, consulte os documentos existentes:

| Documento | Conteúdo |
|---|---|
| `README.md` | Apresentação geral e instruções do projeto |
| `docs/ARQUITETURA.md` | Organização e decisões arquiteturais |
| `docs/decisions/` | Registros de decisões técnicas |
| `docs/ANDROID.md` | Configuração e distribuição Android |
| `docs/QA_ANDROID_NOTIFICATIONS.md` | Validação das notificações Android |

Contribuições que alterem comportamentos importantes devem atualizar a documentação correspondente.

---

## 👥 Contribuidores

O PJ OWL é resultado do trabalho colaborativo de seus desenvolvedores.

Agradecemos a todas as pessoas que contribuíram com o planejamento, desenvolvimento, implementação, testes e evolução do projeto.

### Equipe de desenvolvimento

**Isabella Ferreira Gomes da Silva**

- GitHub: [@BellaFGS](https://github.com/BellaFGS)

**Matheus Cuero Silva**

- GitHub: [@Oroboni](https://github.com/Oroboni)

**Thomas Lourenço Lopes de Castro**

- GitHub: [@Thomas-1610](https://github.com/Thomas-1610)

---

## 💜 Considerações finais

A colaboração é essencial para a evolução do PJ OWL.

Toda contribuição, seja uma nova funcionalidade, correção, melhoria de desempenho, teste ou documentação, ajuda a tornar a aplicação mais completa, acessível e confiável.

Agradecemos seu interesse em participar do desenvolvimento do projeto!

**PJ OWL | Organização simples, gestão inteligente.**

Repositório: [github.com/BellaFGS/AppRecibos](https://github.com/BellaFGS/AppRecibos)