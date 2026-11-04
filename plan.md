# PJ OWL — plano de implementação

## Objetivo

Entregar uma aplicação web responsiva, offline-first e instalável como base para o PJ OWL. A versão utiliza armazenamento local do navegador para manter perfil, custos, agenda, despesas, recibos e assinaturas sem depender de servidor.

## Abordagem

- React + TypeScript + Vite, sem backend obrigatório.
- Estado centralizado em `App.tsx`, persistido com `localStorage` por domínio.
- Valores financeiros representados em centavos (`number` inteiro) e formatados em BRL/USD na borda da interface.
- Exportação local de recibos para uma página imprimível (PDF via diálogo de impressão) e JPG via canvas.
- Assinaturas desenhadas em canvas com Pointer Events e salvas como data URL local.
- Navegação por seções para reduzir fricção no uso móvel, com sidebar em desktop e barra inferior em telas pequenas.
- Ícones desenhados em SVG, sem dependência de imagens externas; Júlio é um símbolo de coruja consistente reutilizado na interface.

## Estrutura

```text
src/
  main.tsx        entrada React
  App.tsx         estado, regras e telas do produto
  styles.css      design system responsivo
public/
  manus-routes.json
index.html
```

## Design

### Movimento

Soft utility: uma mistura de editorial acolhedor com utilitário financeiro leve, inspirada pela referência de telas com fundo lilás, superfícies brancas, formas orgânicas e personagens amigáveis.

### Princípios

1. Uma decisão principal por cartão.
2. Hierarquia visual curta, com títulos claros e ações grandes.
3. Dados financeiros visíveis sem aspecto corporativo pesado.
4. Júlio aparece como guia contextual, nunca como decoração aleatória.

### Filosofia de cor

O lilás proprietário (`#9671D5`) traz calma e reconhecimento de marca. Branco e lavanda muito claro dão sensação de espaço; rosa, azul, coral, amarelo e verde-azulado codificam estados sem depender apenas de texto. Valores positivos usam verde-azulado; atenção usa coral.

### Layout

O desktop usa uma coluna lateral fixa e uma área de trabalho com cartões assimétricos. A tela inicial abre com um bloco de saudação e indicadores amplos; listas e ações ficam em cartões empilhados. No mobile, a navegação migra para a barra inferior e os cartões viram uma sequência vertical respirada.

### Elementos de assinatura

- Símbolo de Júlio: olhos circulares, sobrancelhas suaves e corpo em lilás/azul pastel.
- “Pílulas” de status com cores suaves e números grandes.
- Cantos de 22–28px e sombras difusas, remetendo à referência sem copiar suas ilustrações.

### Interação e animação

Hover com elevação discreta, entrada de cartões em `fade-up` e troca de seção com transição curta. Nenhuma ação depende de animação para comunicar estado. Feedback de salvamento aparece em toast persistente por poucos segundos.

### Tipografia

Sistema de fonte sans-serif com títulos em peso 800, números em 800 e corpo em 500. A escala usa 12/14/16/20/28/36px e bastante line-height para leitura de pessoas com pouca familiaridade digital.

### Essência da marca

“Um jeito leve de transformar trabalho autônomo em negócio organizado.” Personalidade: acolhedora, prática e confiável.

### Voz

CTAs são diretos e humanos: “Criar meu primeiro recibo” e “Guardar esta composição”. Microcopy evita jargão: “Júlio deixa tudo pronto para você continuar.”

### Marca

Wordmark “PJ OWL” com o “o” substituído visualmente pelo selo circular de Júlio no cabeçalho. A cor de assinatura é o lilás `#9671D5`.

## Build e entrega

- `pnpm install` instala dependências.
- `pnpm dev --host 0.0.0.0` abre o preview na porta 3000.
- `pnpm build` gera `dist/` estático.
- `pnpm check` executa TypeScript sem emitir arquivos.
- `public/manus-routes.json` declara a rota principal para o preview/publicação.
