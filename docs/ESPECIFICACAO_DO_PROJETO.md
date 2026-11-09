# PJ OWL
## Especificação do Projeto e Levantamento de Requisitos

**Versão:** 1.0  
**Data:** 06/11/2026  
**Repositório:** https://github.com/BellaFGS/AppRecibos

---

## 1. Visão geral

O PJ OWL é uma aplicação de apoio à gestão de pequenos negócios e atividades autônomas. Seu propósito é reunir em uma interface simples controles que frequentemente ficam espalhados entre anotações, planilhas e conversas: custos de produção, formação de preço, agenda, despesas e recibos.

A aplicação possui identidade visual própria, interface responsiva e a mascote Júlio. O produto deve ser acolhedor e fácil de utilizar, sem abrir mão da precisão dos cálculos e da segurança dos registros financeiros.

A versão atual é uma aplicação web construída com React, TypeScript e Vite. A interface foi organizada por domínio e a persistência foi isolada atrás de repositórios. Na web, o armazenamento utiliza IndexedDB; no Android, a camada prevê SQLite via Capacitor. A direção é preservar a interface e priorizar funcionamento offline. A migração integral para Kotlin/Jetpack Compose não faz parte da estratégia.

## 2. Problema e justificativa

Autônomos e pequenos empreendedores precisam controlar entradas, despesas, materiais, tempo de trabalho e compromissos, mas nem sempre dispõem de ferramentas adequadas ou conhecimento técnico para manter planilhas complexas.

A ausência de controle pode levar à formação incorreta de preços, esquecimento de compromissos, perda de comprovantes e dificuldade para compreender o resultado financeiro do negócio.

O PJ OWL propõe centralizar essas atividades em uma ferramenta acessível, com cálculos transparentes e armazenamento local, reduzindo a dependência de serviços externos e permitindo uso em situações sem internet.

## 3. Objetivos

### 3.1 Objetivo geral
Desenvolver e distribuir uma aplicação multiplataforma, offline-first, para auxiliar trabalhadores autônomos e pequenos negócios na organização operacional e financeira.

### 3.2 Objetivos específicos
- Manter um perfil reutilizável do negócio, com identificação visual e assinatura padrão.
- Calcular custos de produtos a partir de múltiplos materiais e unidades de medida.
- Calcular custos de serviços e ferramentas cobrados por tempo, recorrência, requisição ou projeto.
- Sugerir preços com base em acréscimo ou margem, permitindo edição manual.
- Registrar despesas e acompanhar receitas e resultado líquido.
- Organizar compromissos e lembretes.
- Gerar recibos com dados do pagamento e assinaturas desenhadas.
- Consultar, exportar e compartilhar recibos finalizados.
- Preservar dados localmente e oferecer mecanismos de exportação e recuperação.
- Automatizar testes, validações e empacotamento por CI/CD.

## 4. Público-alvo

**Primário:** trabalhadores autônomos; artesãos e produtores de itens personalizados; pessoas que produzem e vendem doces, alimentos e lembranças; prestadores de serviços independentes; MEIs e pequenos negócios.

**Secundário:** profissionais de tecnologia que precisam calcular custos de SaaS, APIs, ferramentas, horas e requisições; pessoas que trabalham por projeto ou possuem cobranças recorrentes; pequenas equipes que desejem compartilhar um fluxo de organização, respeitando os limites de uma versão sem sincronização.

**Necessidades:** interface simples em português brasileiro; uso em celular e computador; funcionamento sem conexão constante; cálculos compreensíveis; registro rápido de pagamentos e compromissos; exportação de documentos para envio ao cliente.

## 5. Escopo do produto

### 5.1 Incluído na versão atual
- Aplicação web responsiva e navegação entre seis módulos.
- Persistência local isolada por repositórios, com IndexedDB na web e adaptador SQLite no Android.
- Perfil do negócio, logotipo e assinatura padrão.
- Calculadora de materiais e de cobranças por tempo.
- Composições salvas.
- Agenda e registro de despesas.
- Dashboard com indicadores derivados de recibos finalizados e despesas.
- Criação de recibos com assinatura do prestador e do cliente.
- Histórico com pesquisa, filtro, exportação para impressão/PDF e JPG.

### 5.2 Evolução planejada
- Empacotamento Android com Capacitor.
- Armazenamento local nativo e versionado, com migrações.
- Notificações locais agendadas.
- Compartilhamento nativo e gerenciamento de arquivos.
- Backup e restauração.
- Testes unitários, de integração e ponta a ponta.
- GitHub Actions para validação e geração de artefatos Android.
- Distribuição desktop com Tauri em etapa posterior.
- Melhorias de acessibilidade, validação e consistência financeira.

### 5.3 Fora do escopo atual
Backend obrigatório ou sincronização em nuvem; contas e autenticação; emissão fiscal de notas; integração bancária; assinatura digital qualificada ICP-Brasil; gestão contábil completa.

## 6. Tecnologias e arquitetura

### 6.1 Implementação atual
React, TypeScript, Vite, CSS, IndexedDB na web, SQLite via Capacitor no Android, Canvas para captura de assinaturas e APIs da plataforma para impressão, compartilhamento, clipboard e arquivos, conforme disponibilidade.

### 6.2 Estrutura observada
- `src/main.tsx`: entrada React, componentes, estado, regras e telas.
- `src/styles.css`: estilos e layout responsivo.
- `public/assets/pj-owl-logo.png`: identidade visual.
- `package.json`: dependências e scripts.
- `README.md`, `TODO.md` e `plan.md`: documentação e planejamento.

A aplicação foi modularizada por domínio. O estado compartilhado permanece coordenado em `app/App.tsx` para preservar os fluxos existentes, enquanto regras puras, componentes compartilhados, layout e persistência possuem módulos próprios.

### 6.3 Arquitetura alvo
Interface React/TypeScript preservada; Capacitor como contêiner Android; camada de persistência isolada; banco local nativo ou solução local compatível com Capacitor, com migrações; adaptadores para notificações, compartilhamento e arquivos; testes independentes das APIs específicas da plataforma; Tauri como alternativa futura para desktop.

## 7. Descrição dos módulos

### 7.1 Início / Dashboard
Apresenta resumo do negócio. A implementação calcula receitas a partir de recibos finalizados e despesas a partir dos lançamentos, com seleção semanal, mensal ou anual. Exibe resultado líquido, quantidade de recibos e próximos compromissos.


### 7.2 Custos
Permite criar composições com vários itens. Cada item possui quantidade utilizada, unidade utilizada, quantidade de referência, unidade de referência e preço pago. São aceitas unidades de comprimento (mm, cm, m), peso (g, kg), volume (ml, L) e unidade (un), com bloqueio de conversões entre grupos incompatíveis.

Há modo de cobrança por tempo/recorrência: mensal, semanal, diária, por hora, por requisição e por projeto. O usuário informa quantidade e preço unitário. O preço sugerido pode usar acréscimo (markup) ou margem desejada e pode ser substituído manualmente. Composições podem ser salvas e carregadas.

Evoluções solicitadas: cálculo de quantidade de compra, histórico de cálculos com data e descrição, resumo detalhado, alertas de preço e exclusão seletiva de cálculos salvos.

### 7.3 Agenda
Registra compromissos com data, horário, descrição, endereço e configuração de lembrete. Permite manter compromissos e registrar despesas.

A versão atual armazena o campo de lembrete, mas notificações locais efetivas e alertas automáticos em 7, 3 e 1 dia antes precisam ser implementados e validados no Android. Também está prevista uma ação para copiar o endereço.

### 7.4 Novo recibo
Permite informar cliente, documento, descrição, valor, moeda, data, método de pagamento, parcelamento e observações. O prestador pode utilizar a assinatura padrão do perfil e o cliente desenha sua assinatura no momento da emissão. A finalização cria identificador e grava recibo FINALIZADO.

O documento é apresentado em prévia e pode ser exportado no histórico. A assinatura desenhada é eletrônica simples, não assinatura qualificada ou certificada.

Evoluções solicitadas: máscara e validação de CPF/CNPJ, valor por extenso e refinamento do documento exportado.

### 7.5 Histórico
Lista recibos finalizados em modo somente leitura, com pesquisa por cliente e filtro por período. Permite exclusão individual e limpeza do histórico mediante confirmação. Disponibiliza exportação para impressão/PDF e JPG e compartilhamento de resumo.

### 7.6 Perfil
Armazena nome do proprietário, nome fantasia, data de início, documento, logotipo e assinatura padrão. Logotipo e assinatura são reutilizados na criação de recibos.

Evoluções: máscaras de documento, confirmação clara para apagar dados e opção separada para limpar cálculos sem apagar o perfil.

## 8. Requisitos funcionais

A situação “implementado” refere-se à inspeção da base atual e não substitui testes de aceitação.

| ID | Requisito | Situação |
|---|---|---|
| RF-001 | Disponibilizar navegação entre Início, Custos, Agenda, Novo recibo, Histórico e Perfil. | Implementado |
| RF-002 | Cadastrar e editar dados do negócio. | Implementado |
| RF-003 | Importar e remover logotipo do negócio. | Implementado |
| RF-004 | Desenhar e salvar assinatura padrão do prestador. | Implementado |
| RF-005 | Reutilizar assinatura padrão na criação de recibos. | Implementado |
| RF-006 | Adicionar múltiplos itens em uma composição de custos. | Implementado |
| RF-007 | Calcular proporcionalmente custo de materiais conforme quantidade e referência de compra. | Implementado |
| RF-008 | Impedir conversões entre unidades de grupos incompatíveis. | Implementado |
| RF-009 | Calcular cobranças por período, hora, requisição ou projeto. | Implementado |
| RF-010 | Sugerir preço usando acréscimo ou margem desejada. | Implementado |
| RF-011 | Permitir editar manualmente o preço final. | Implementado |
| RF-012 | Salvar e reutilizar composições de custo. | Implementado |
| RF-013 | Criar, editar e excluir compromissos. | Implementado |
| RF-014 | Registrar despesas com descrição, categoria, valor e data. | Implementado |
| RF-015 | Calcular receitas, despesas e resultado líquido por período. | Implementado |
| RF-016 | Exibir quantidade de recibos finalizados e próximos compromissos. | Implementado |
| RF-017 | Criar recibo com dados do cliente, pagamento, valor e descrição. | Implementado |
| RF-018 | Exigir assinatura do prestador e do cliente para finalizar. | Implementado |
| RF-019 | Gerar identificador e registrar data de finalização. | Implementado |
| RF-020 | Exibir recibos finalizados em modo somente leitura. | Implementado |
| RF-021 | Pesquisar recibos por cliente e filtrar por período. | Implementado |
| RF-022 | Exportar recibos para impressão/PDF e JPG. | Implementado |
| RF-023 | Compartilhar informações do recibo usando recursos do dispositivo/navegador. | Parcial |
| RF-024 | Persistir perfil, composições, agenda, despesas e recibos localmente. | Implementado por repositórios; IndexedDB na web e adaptador SQLite no Android |
| RF-025 | Exibir confirmação antes de exclusões destrutivas. | Parcial |
| RF-026 | Construir gráfico de movimentação a partir de dados reais agrupados no período selecionado. | Pendente |
| RF-027 | Aplicar máscara e validação de CPF/CNPJ. | Pendente |
| RF-028 | Aplicar máscara monetária consistente. | Pendente |
| RF-029 | Apresentar valor monetário por extenso no recibo. | Pendente |
| RF-030 | Disparar notificações locais 7, 3 e 1 dia antes do compromisso. | Pendente |
| RF-031 | Permitir copiar endereço do compromisso. | Pendente |
| RF-032 | Estimar quantidade de material a comprar a partir da quantidade necessária e unidade de compra. | Pendente |
| RF-033 | Manter histórico de cálculos com data, descrição, custo, preço sugerido e lucro. | Pendente |
| RF-034 | Sinalizar acréscimos superiores a 150% sobre o custo, sem bloquear edição manual. | Pendente |
| RF-035 | Sinalizar preço final abaixo do custo e lucro negativo. | Pendente |
| RF-036 | Excluir cálculos selecionados e limpar histórico mediante confirmação. | Pendente |
| RF-037 | Permitir limpar dados do aplicativo com confirmação e explicação do impacto. | Pendente |
| RF-038 | Oferecer backup e restauração dos dados locais. | Pendente |
| RF-039 | Manter dados no Android entre reinicializações e atualizações compatíveis. | Pendente |
| RF-040 | Oferecer compartilhamento nativo de recibos e arquivos no Android. | Pendente |

## 9. Requisitos não funcionais

| ID | Requisito | Critério / observação |
|---|---|---|
| RNF-001 | Usabilidade | Fluxos principais compreensíveis sem treinamento técnico. |
| RNF-002 | Idioma | Interface e mensagens em português brasileiro. |
| RNF-003 | Responsividade | Funcionar em celulares, tablets e desktops sem perder ações essenciais. |
| RNF-004 | Offline-first | Fluxos principais devem funcionar sem conexão após instalação/carregamento inicial. |
| RNF-005 | Persistência | Dados devem sobreviver ao fechamento do aplicativo. |
| RNF-006 | Integridade | Valores financeiros devem usar centavos inteiros sempre que aplicável. |
| RNF-007 | Precisão | Conversões e cálculos devem ser cobertos por testes automatizados. |
| RNF-008 | Segurança local | Dados privados não devem ser enviados a serviços externos sem consentimento. |
| RNF-009 | Recuperabilidade | Deve existir exportação, backup e restauração. |
| RNF-010 | Compatibilidade Android | Pacote testado nas versões Android definidas para release. |
| RNF-011 | Desempenho | Telas, pesquisa e cálculos comuns sem atrasos perceptíveis em dispositivos de referência. |
| RNF-012 | Acessibilidade | Controles com rótulos, foco visível, contraste e áreas de toque adequadas. |
| RNF-013 | Manutenibilidade | Regras, persistência e interface separadas em módulos testáveis. |
| RNF-014 | Testabilidade | Regras financeiras críticas com testes unitários; fluxos principais com testes de integração/E2E. |
| RNF-015 | CI/CD | Pull requests executam validação, testes e build. |
| RNF-016 | Distribuição | Pipeline gera artefato Android identificado por versão. |
| RNF-017 | Privacidade | Explicar onde os dados são armazenados e riscos de desinstalação/limpeza. |
| RNF-018 | Portabilidade | Interface web continua executável em navegador após inclusão do contêiner Android. |
| RNF-019 | Consistência visual | Componentes respeitam identidade visual e padrões do PJ OWL. |
| RNF-020 | Exportação | PDF/JPG compartilhados mantêm legibilidade, valores e identificação do recibo. |

## 10. Regras de negócio

- **RN-001:** somente recibos finalizados entram no total de receitas.
- **RN-002:** recibos finalizados são imutáveis; correções devem gerar novo recibo.
- **RN-003:** para finalizar, cliente, valor positivo, data e as duas assinaturas são obrigatórios.
- **RN-004:** assinatura padrão do prestador é carregada automaticamente, mas pode ser alterada no recibo sem modificar o perfil.
- **RN-005:** custo proporcional = preço de referência × (quantidade utilizada convertida / quantidade de referência convertida).
- **RN-006:** conversões só são permitidas no mesmo grupo dimensional: comprimento, peso, volume ou contagem.
- **RN-007:** markup é calculado sobre o custo; margem é calculada sobre o preço de venda. Não são conceitos equivalentes.
- **RN-008:** preço final pode ser editado, mas custo original e lucro resultante devem permanecer visíveis.
- **RN-009:** resultado líquido = receitas de recibos finalizados menos despesas do período.
- **RN-010:** lembretes devem respeitar data/hora local e permissões do sistema operacional.
- **RN-011:** apagar histórico ou todos os dados exige confirmação explícita.
- **RN-012:** assinatura desenhada é eletrônica simples, não certificação ICP-Brasil.

## 11. Dados principais

- **Perfil:** proprietário, nome fantasia, início da atividade, documento, logotipo e assinatura padrão.
- **Item de custo:** nome, quantidade/unidade utilizada, quantidade/unidade de referência e preço.
- **Composição:** identificação, nome, itens ou modalidade temporal, parâmetros e data de criação.
- **Compromisso:** data, horário, descrição, endereço e lembrete.
- **Despesa:** descrição, categoria, valor, data e observações.
- **Recibo:** identificador, dados do cliente e prestador, descrição, valor, moeda, pagamento, data, assinaturas, finalização e status.

## 12. Plano de testes e critérios de aceite

**Testes unitários:** conversões de unidades; rejeição de grupos incompatíveis; custo proporcional; markup e margem; lucro e preço abaixo do custo; parsing e formatação monetária; CPF/CNPJ; valor por extenso; agregação por período.

**Testes de integração:** persistência e recuperação de todos os domínios; finalização de recibo; filtros do histórico; exclusões; exportação e compartilhamento.

**Testes Android:** instalação e atualização; reinicialização e persistência; modo avião; permissões e entrega de notificações; compartilhamento PDF/JPG; teclado, rotação, áreas seguras e navegação do sistema; backup/restauração.

**Critérios mínimos de aceite:**
- Nenhum cálculo financeiro crítico pode depender de valores demonstrativos.
- Dados persistidos devem ser recuperados após encerrar e reabrir o aplicativo.
- Nenhum recibo pode ser finalizado sem validações obrigatórias.
- O usuário deve conseguir exportar recibo legível.
- Notificações devem ocorrer nos dias configurados, respeitando permissões e restrições Android.
- Testes e build devem passar no pipeline antes de uma release.

## 13. Riscos e medidas

| Risco | Impacto | Mitigação |
|---|---|---|
| Perda de dados locais | Alto | Repositórios, migrações versionadas e backup validado; manter testes de restauração e exportação. |
| Cálculos incorretos | Alto | Testes unitários, centavos inteiros e regras documentadas. |
| Notificações não entregues | Médio/alto | Validar permissões, agendamento e restrições de bateria. |
| Divergência navegador/Android | Médio | Adaptadores por plataforma e testes nos dois ambientes. |
| Crescimento do arquivo principal | Médio | Refatorar por domínio e responsabilidade. |
| Interpretação jurídica da assinatura | Alto | Informar que se trata de assinatura eletrônica simples. |

## 14. Roadmap sugerido

1. Fundação e qualidade: modularização, testes e revisão de regras financeiras.
2. Correções web: gráfico real, máscaras, valor por extenso, histórico de cálculos e alertas.
3. Persistência: camada de repositório, migração, backup e restauração.
4. Android: Capacitor, armazenamento local, notificações, arquivos e compartilhamento.
5. CI/CD: GitHub Actions para typecheck, testes e build web (**ativo**); APK de debug quando `android/` existir (issue #13).
6. Distribuição: releases versionadas e documentação de instalação.
7. Desktop: avaliar Tauri após estabilização Android.

## 15. Definição de pronto

Uma tarefa estará concluída quando o comportamento estiver implementado e revisado; validações e erros tratados; testes relevantes aprovados; interface utilizável em mobile e desktop; documentação atualizada; build de produção aprovado; dados existentes preservados; alterações registradas em commit e vinculadas à Issue correspondente.

## 16. Considerações finais

O PJ OWL já possui uma base web funcional com os principais módulos de organização. O próximo passo não é reconstruir a interface, mas consolidar a arquitetura, corrigir pontos demonstrativos, aumentar a cobertura de testes e preparar persistência e recursos nativos para uma distribuição Android confiável e offline-first.
