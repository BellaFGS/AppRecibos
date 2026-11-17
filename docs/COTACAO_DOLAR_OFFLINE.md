# Cotação do dólar com suporte offline

A cotação USD/BRL é consultada pelo endpoint `https://br.dolarapi.com/v1/cotacoes/usd`.

## Funcionamento

- A última cotação válida é persistida no `localStorage` do dispositivo/navegador.
- O cache é considerado recente por até 3 horas.
- Ao abrir uma tela que utiliza USD, o app usa imediatamente a cotação local e consulta a API se o cache estiver vencido.
- A cotação é verificada novamente quando a conexão retorna, quando o app volta a ficar visível e a cada 3 horas enquanto a tela estiver aberta.
- Sem internet, o app utiliza a última cotação salva. Se nunca houve uma consulta bem-sucedida naquele dispositivo, informa que não há cotação disponível.
- O botão **Atualizar cotação** força uma nova consulta, mesmo que o cache ainda esteja recente.
- Falhas da API não apagam nem substituem a última cotação válida.

## Arquivos envolvidos

- `src/features/receipts/exchangeRate.ts`: consulta, validação, cache, controle de validade e hook de sincronização.
- `src/features/receipts/Receipts.tsx`: utiliza o serviço na criação de recibos em dólar.
- `src/features/costs/Costs.tsx`: utiliza o mesmo serviço na calculadora de custos.

## Observação sobre o modo offline

Não é possível obter uma cotação realmente atualizada sem conexão com a internet. No modo offline, o aplicativo apresenta a última cotação que conseguiu salvar, mantendo também a data/hora informada pela API. A primeira utilização em cada instalação/dispositivo precisa ocorrer com internet para criar o cache.
