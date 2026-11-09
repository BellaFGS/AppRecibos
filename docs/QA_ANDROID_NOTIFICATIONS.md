# Validação Android: notificações da Agenda

Este roteiro documenta os testes manuais necessários para homologar notificações locais no Android. **Os testes em dispositivo/emulador ainda precisam ser executados no ambiente Android do projeto; este documento não declara resultados que não foram observados.**

## Pré-requisitos

1. Instalar as dependências com `pnpm install` para atualizar o `pnpm-lock.yaml` com `@capacitor/local-notifications`.
2. Gerar a versão web com `pnpm build`.
3. No arquivo `android/app/src/main/AndroidManifest.xml`, declarar a permissão de alarmes exatos dentro de `<manifest>`: `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />`.
4. Sincronizar o projeto Android com Capacitor (`npx cap sync android`).
5. Abrir o projeto Android no Android Studio e executar em emulador ou dispositivo físico com Android 13 ou superior, além de repetir ao menos o fluxo principal em uma versão Android anterior.
6. Garantir que data e hora automáticas estejam habilitadas no dispositivo.

> O ZIP analisado não contém a pasta nativa `android/`. Caso ela ainda não exista no repositório local, inicialize a plataforma Android com `npx cap add android` antes de sincronizar.

## Casos de teste

| ID | Cenário | Passos | Resultado esperado |
|---|---|---|---|
| NOT-01 | Permissão contextual | Abrir Agenda e salvar compromisso sem lembretes | Nenhuma solicitação de permissão deve aparecer. |
| NOT-02 | Permissão contextual | Selecionar 7, 3 e 1 dia e salvar | Android solicita permissão no momento do cadastro; após permitir, alertas futuros são agendados. |
| NOT-03 | Permissão negada | Selecionar lembretes e negar a permissão | Compromisso é salvo; interface informa que a permissão precisa ser habilitada nas configurações. |
| NOT-04 | Lembrete de 7 dias | Criar compromisso com data/hora pelo menos 8 dias à frente e selecionar 7 dias | Notificação aparece 7 dias antes, no horário do compromisso. |
| NOT-05 | Lembrete de 3 dias | Criar compromisso com data/hora pelo menos 4 dias à frente e selecionar 3 dias | Notificação aparece 3 dias antes, no horário do compromisso. |
| NOT-06 | Lembrete de 1 dia | Criar compromisso com data/hora pelo menos 2 dias à frente e selecionar 1 dia | Notificação aparece 1 dia antes, no horário do compromisso. |
| NOT-07 | Múltiplos alertas | Selecionar 7, 3 e 1 dia | Os três alertas são registrados, sem duplicação. |
| NOT-08 | Reagendamento | Editar data e horário de compromisso que já possui alertas | Alertas antigos deixam de existir e os novos passam a usar a data/hora atualizada. |
| NOT-09 | Remoção | Excluir compromisso com alertas pendentes | Nenhuma notificação daquele compromisso deve aparecer depois da exclusão. |
| NOT-10 | Reinicialização | Agendar alertas, fechar o app e reiniciar o dispositivo | Alertas futuros continuam programados pelo sistema Android. |
| NOT-11 | Offline | Ativar modo avião após programar alertas | Notificações locais continuam sendo entregues. |
| NOT-12 | Copiar endereço | Cadastrar endereço, tocar em “Copiar endereço” e colar em outro campo/app | Texto completo é copiado e o app mostra feedback de sucesso. |
| NOT-13 | Sem endereço | Criar compromisso sem endereço | A ação de copiar endereço não é exibida. |
| EXP-01 | Despesas separadas | Abrir item “Despesas” na navegação | Tela independente abre com cadastro e histórico de despesas. |
| EXP-02 | Preservação | Atualizar o app com dados de despesas já cadastrados | Registros anteriores continuam visíveis na nova seção. |

## Registro da execução

Preencher após executar cada caso:

| ID | Resultado (Passou/Falhou) | Android / dispositivo | Evidência / observações |
|---|---|---|---|
| NOT-01 a NOT-13 | Pendente | A preencher | A preencher |
| EXP-01 a EXP-02 | Pendente | A preencher | A preencher |

## Observações técnicas

- O agendamento é feito com `@capacitor/local-notifications` 8.3 ou superior; não utiliza serviço remoto nem exige internet.
- Os alertas solicitam agendamento exato. No Android 12 ou superior, a permissão `SCHEDULE_EXACT_ALARM` deve estar declarada e o acesso a alarmes e lembretes pode depender de autorização nas configurações do sistema. Se o usuário não conceder, o Android pode entregar o alerta com atraso.
- A sincronização ao iniciar o app recria alertas futuros somente se a permissão já estiver concedida. Ela não abre uma solicitação de permissão inesperada.
- O app usa um identificador estável por compromisso e antecedência (7, 3 ou 1 dia), permitindo cancelar e substituir os alertas durante edição e exclusão.
- Alertas cuja data calculada já passou não são agendados retroativamente.
