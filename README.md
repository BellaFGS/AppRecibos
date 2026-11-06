# PJ OWL 

**Organize seu trabalho autônomo com mais clareza.** O PJ OWL é uma aplicação responsiva para controlar custos, compromissos, despesas e recibos em um só lugar.

## Objetivo
Ajudar trabalhadores autônomos e pequenos empreendedores a profissionalizar a gestão cotidiana do negócio, calcular preços com base nos custos reais e registrar pagamentos sem depender de conexão constante com a internet.

## Público-alvo
- Trabalhadores autônomos e prestadores de serviço;
- Pessoas que produzem e vendem doces, artesanatos e personalizados;
- Microempreendedores e pequenos negócios;
- Profissionais de tecnologia que precisam considerar ferramentas, assinaturas, horas e cobranças por requisição ou projeto.

## Funcionalidades disponíveis
- **Início:** resumo de receitas de recibos finalizados, despesas, resultado líquido e próximos compromissos.
- **Custos:** composição de materiais com unidades de medida e cálculo proporcional; cobrança por período, hora, requisição ou projeto; sugestão de preço por acréscimo ou margem; edição manual e composições salvas.
- **Agenda:** compromissos com data, horário, descrição, endereço e lembrete configurável.
- **Recibos:** dados do pagamento, duas assinaturas desenhadas, prévia e finalização.
- **Histórico:** consulta, pesquisa e filtro de recibos finalizados; exportação para impressão/PDF e JPG; compartilhamento conforme suporte do navegador.
- **Perfil:** dados do negócio, documento, logotipo e assinatura padrão.

> **Atenção:** a versão atual persiste os dados no armazenamento local (localStorage) do navegador. Não há sincronização ou backup automático. Limpar os dados do navegador ou trocar de dispositivo pode causar perda das informações. Exporte e guarde documentos importantes.

## Tecnologias
React, TypeScript, Vite, CSS e pnpm.

## Executar localmente
Requisitos: Node.js compatível com a versão do Vite e pnpm.

```bash
pnpm install
pnpm dev --host 0.0.0.0
```

## Verificações e build
```bash
pnpm check
pnpm build
pnpm preview
```
O build web de produção é gerado em `dist/`.

## Direção técnica
A estratégia é preservar a aplicação React/TypeScript como núcleo e empacotá-la para Android com **Capacitor**, evitando reimplementar a interface em Kotlin. A prioridade é uma experiência offline confiável.

Etapas planejadas:
1. Isolar a persistência da interface e criar uma camada de repositório.
2. Adotar armazenamento local Android robusto, com migrações e backup/exportação.
3. Empacotar com Capacitor e validar o uso em dispositivos Android.
4. Implementar notificações locais, compartilhamento nativo e gerenciamento de arquivos.
5. Automatizar testes, validações e geração de APK/AAB com GitHub Actions.
6. Avaliar Tauri para distribuição desktop após estabilizar Android.

Capacitor, banco local nativo, notificações e pipelines de publicação são **planejados**, não implementados na versão atual.

## Documentação
- [Especificação do projeto](docs/ESPECIFICACAO_DO_PROJETO.md)


## Organização
O desenvolvimento é acompanhado por GitHub Issues. Recomenda-se utilizar um quadro GitHub Projects com as colunas **Backlog**, **Pronto**, **Em andamento**, **Em revisão** e **Concluído**.

## Desenvolvedores
Isabella Ferreira Gomes da Silva
