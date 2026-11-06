# Issue 06: valor monetário por extenso e conversão USD/BRL

## Comportamento implementado

- BRL é a moeda padrão para novos recibos (`defaultReceiptForm`).
- O valor por extenso é gerado em português brasileiro para BRL (reais/centavos) e USD (dólares/cents).
- A prévia e os arquivos PDF/JPG exibem o valor numérico e o valor por extenso.
- Quando o usuário informa um valor em USD, o recibo é finalizado em BRL.
- O recibo mantém o valor originalmente informado em USD, a taxa aplicada e a data/hora da cotação. Recibos antigos não são recalculados.
- A cotação mais recente é armazenada localmente para permitir consulta offline. Quando a API não responde, a última cotação salva é apresentada como desatualizada. Sem cotação e sem cache, não é permitido finalizar um recibo informado em USD.

## Fonte da cotação

Endpoint: `https://br.dolarapi.com/v1/cotacoes/usd`

A integração usa o campo `compra` (preço pelo qual o mercado compra o dólar) e `dataAtualizacao`. A documentação da DolarAPI descreve o endpoint brasileiro e o retorno dessas propriedades. Consulte: https://dolarapi.com/docs/brasil/operations/get-usd-brl

A DolarAPI documenta fontes de mercado (incluindo Investing.com) e a cotação de compra/venda. A cotação é uma referência de mercado, não uma promessa de taxa de liquidação bancária. O valor aplicado é congelado no recibo. A disponibilidade e a frequência de atualização dependem do provedor e do mercado. Validar a chamada no navegador e no WebView Android do ambiente de publicação antes de distribuir.

## Persistência e compatibilidade

Os campos `originalCurrency`, `originalAmount`, `exchangeRate` e `exchangeRateDate` são opcionais no modelo `Receipt`. Portanto, recibos anteriores continuam válidos e são exibidos com a moeda e o valor já gravados.

A cotação em cache é auxiliar e não altera dados de recibos existentes.

## Testes adicionados

- Zero, inteiro, decimal, singular/plural e valores grandes em BRL.
- Dólares e cents em USD.
- Conversão de centavos USD para centavos BRL e arredondamento.
- Rejeição de valores e taxas inválidos.
