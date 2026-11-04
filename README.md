# PJ OWL

Aplicação web responsiva e offline-first para trabalhadores autônomos organizarem custos, agenda, despesas e recibos.

## Executar

```bash
pnpm install
pnpm dev --host 0.0.0.0
```

Abra o endereço de preview indicado pelo ambiente. Para validar o build:

```bash
pnpm check
pnpm build
```

## Dados locais

Os dados são salvos no `localStorage` do navegador. Não há login ou backend obrigatório nesta versão. Isso permite usar os fluxos principais offline, mas significa que limpar os dados do navegador, trocar de dispositivo ou desinstalar uma futura versão nativa pode remover as informações. Faça exportações dos recibos importantes.

## Recibos

Recibos finalizados ficam somente para leitura. A opção PDF abre uma página pronta para impressão e a opção JPG gera uma imagem local. A assinatura desenhada no app é uma assinatura eletrônica simples; não é automaticamente uma assinatura qualificada ICP-Brasil.

## Escopo futuro Android

A base visual e os fluxos estão preparados para uma migração para Kotlin/Jetpack Compose com JSON versionado, DataStore, notificações locais e Sharesheet nativo.

## Calculadora por tempo e recorrência

Além das composições de materiais, a calculadora aceita cobranças mensais, semanais, diárias, por hora, por requisição e por projeto. O cálculo considera quantidade vezes preço unitário e mantém separado o custo original, o preço sugerido e o restante após o custo.
