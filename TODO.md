# PJ OWL — resultados

## 1. Shell navegável e identidade

- [x] A aplicação deve ter navegação intuitiva entre Início, Custos, Agenda, Novo recibo, Histórico e Perfil.
- [x] A interface deve ser integralmente em português brasileiro, com cartões arredondados, botões acessíveis, fundo lilás, superfícies brancas, cores pastel e mascote Júlio.
- [x] O projeto deve funcionar em desktop e mobile, com sidebar desktop e navegação inferior móvel.

## 2. Persistência offline

- [x] Dados do perfil, logo, assinatura, agendamentos, composições, despesas e recibos devem permanecer salvos no dispositivo usando armazenamento local.
- [x] O usuário deve conseguir limpar o histórico sem apagar perfil, logo ou assinatura padrão.
- [x] O sistema deve informar que os dados locais dependem do dispositivo e podem ser perdidos ao limpar o navegador.

## 3. Perfil e assinatura

- [x] O usuário deve editar proprietário, nome fantasia, início, CPF/CNPJ e importar/remover logotipo.
- [x] O usuário deve desenhar, limpar e salvar a assinatura padrão diretamente na tela.

## 4. Calculadora de custos

- [x] A calculadora deve aceitar múltiplos itens, unidades mm, cm, m, g, kg, ml, L e un, calcular custos proporcionais e rejeitar conversões incompatíveis.
- [x] O usuário deve editar e excluir itens, guardar composições, visualizar soma e reutilizar composições.
- [x] A sugestão deve suportar markup e margem, mostrar custo, percentual, preço e lucro, além de aceitar edição manual do preço final.

## 5. Agenda e despesas

- [x] O usuário deve criar, editar e excluir compromissos com data, horário, descrição, endereço e lembrete.
- [x] O usuário deve registrar despesas com descrição, categoria, valor, data e observações.
- [x] O dashboard deve considerar despesas salvas e receitas de recibos finalizados nos períodos semanais, mensais e anuais.

## 6. Recibos imutáveis

- [x] O formulário deve conter empresa, prestador, cliente, descrição, valor, moeda BRL/USD, pagamento, parcelamento e observações.
- [x] O recibo deve exigir assinatura do prestador e do cliente para finalizar.
- [x] Ao finalizar, o documento deve receber identificador único, data, status FINALIZADO e não possuir edição posterior.
- [x] Deve ser possível visualizar, imprimir/exportar PDF e exportar JPG localmente.

## 7. Histórico

- [x] Cada registro deve mostrar cliente, data, valor, método de pagamento e identificação.
- [x] Deve haver pesquisa por cliente, filtro por período e exclusão individual ou total com confirmação.
- [x] Deve haver compartilhamento por recursos disponíveis do navegador e aviso sobre assinatura eletrônica simples.

## 8. Qualidade e entrega

- [x] O projeto deve conter README, configuração de build, manifesto de rotas e tipos TypeScript.
- [x] O build de produção e o typecheck devem passar antes da entrega.
- [x] Deve existir uma visualização publicada e um pacote do código para download.

## Pendências de uma futura versão Android nativa

- [ ] Migrar o armazenamento local para JSON versionado interno/DataStore.
- [ ] Implementar notificações Android com AlarmManager e Sharesheet nativo.
- [ ] Gerar PDF/JPG com APIs Android e adicionar testes instrumentados.
- [ ] Configurar GitHub Actions e publicação de APK.
