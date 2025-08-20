# AppRecibos

# Gerador de Recibos Android

Um aplicativo Android nativo desenvolvido em Kotlin para gerar recibos de pagamento em formato PDF e JPEG.

## Funcionalidades

- ✅ Formulário para preenchimento de dados do cliente e empresa
- ✅ Conversão automática de valores por extenso em português brasileiro
- ✅ Geração de recibos em formato PDF
- ✅ Geração de recibos em formato JPEG
- ✅ Interface moderna com Material Design
- ✅ Validação de campos obrigatórios
- ✅ Seletor de data integrado
- ✅ Armazenamento seguro de arquivos

## Campos do Formulário

### Dados da Empresa (pré-preenchidos, editáveis)
- Nome da empresa
- Nome do responsável
- Documento do responsável (CPF/CNPJ)

### Dados do Cliente (obrigatórios)
- Nome do cliente
- Documento do cliente (CPF/RG/CNPJ)
- Valor do serviço (com conversão automática por extenso)
- Data do pagamento (com seletor de data)
- Descrição do serviço proposto

## Recibo Gerado

O recibo inclui todas as informações preenchidas no formulário, formatadas profissionalmente com:
- Cabeçalho "RECIBO DE PAGAMENTO"
- Seções organizadas para dados da empresa, cliente e pagamento
- Valor em formato monetário e por extenso
- Espaços para assinaturas do responsável e cliente
- Data e hora de geração do recibo

## Requisitos do Sistema

- Android 7.0 (API level 24) ou superior
- Permissões de armazenamento (solicitadas automaticamente)

## Como Usar

1. **Abrir o aplicativo**: Toque no ícone "Gerador de Recibos"

2. **Preencher dados da empresa**: 
   - Os campos já vêm pré-preenchidos com dados padrão
   - Edite conforme necessário para sua empresa

3. **Preencher dados do cliente**:
   - Nome completo do cliente (obrigatório)
   - Documento (CPF/RG/CNPJ) (obrigatório)
   - Valor do serviço (obrigatório) - será convertido automaticamente por extenso
   - Data do pagamento - toque para abrir o seletor de data
   - Descrição detalhada do serviço (obrigatório)

4. **Gerar recibo**: Toque em "Gerar Recibo"

5. **Salvar arquivo**: Escolha entre:
   - "Salvar PDF" - gera arquivo PDF
   - "Salvar JPEG" - gera imagem JPEG
   - "Voltar" - retorna ao formulário

6. **Localizar arquivos salvos**:
   - PDFs: pasta Downloads
   - JPEGs: pasta Pictures/Imagens

## Instalação no Android Studio

1. **Abrir projeto**:
   - Abra o Android Studio
   - Selecione "Open an existing Android Studio project"
   - Navegue até a pasta do projeto e selecione

2. **Sincronizar dependências**:
   - O Android Studio irá automaticamente sincronizar as dependências
   - Aguarde o processo de build terminar

3. **Executar aplicativo**:
   - Conecte um dispositivo Android ou inicie um emulador
   - Clique no botão "Run" (▶️) ou pressione Shift+F10

## Dependências Principais

- **Material Design Components**: Interface moderna e responsiva
- **iText7**: Geração de documentos PDF
- **Kotlinx DateTime**: Manipulação de datas
- **View Binding**: Acesso seguro às views

## Estrutura do Projeto

```
app/src/main/
├── java/com/example/geradorrecibos/
│   ├── MainActivity.kt          # Atividade principal
│   └── NumeroExtenso.kt        # Conversão de números por extenso
├── res/
│   ├── layout/
│   │   ├── activity_main.xml   # Layout do formulário
│   │   └── layout_recibo.xml   # Layout do recibo
│   ├── values/
│   │   ├── strings.xml         # Textos do aplicativo
│   │   ├── colors.xml          # Cores do tema
│   │   └── themes.xml          # Temas Material Design
│   └── xml/                    # Configurações de backup e FileProvider
└── AndroidManifest.xml         # Configurações e permissões
```

## Permissões

O aplicativo solicita as seguintes permissões:
- `WRITE_EXTERNAL_STORAGE` (Android 9 e inferior)
- `READ_EXTERNAL_STORAGE` (Android 12 e inferior)
- `READ_MEDIA_IMAGES` (Android 13+)

## Compatibilidade

- **Versão mínima**: Android 7.0 (API 24)
- **Versão alvo**: Android 14 (API 34)
- **Linguagem**: Kotlin
- **Arquitetura**: MVVM com View Binding

## Personalização

Para personalizar o aplicativo para sua empresa:

1. **Editar dados padrão**: Modifique os valores pré-preenchidos em `activity_main.xml`
2. **Alterar cores**: Edite o arquivo `res/values/colors.xml`
3. **Modificar textos**: Edite o arquivo `res/values/strings.xml`
4. **Trocar ícone**: Substitua os arquivos em `res/mipmap/`

## Suporte

Este aplicativo foi desenvolvido seguindo as melhores práticas do Android e está pronto para uso em produção. Para dúvidas ou suporte, consulte a documentação oficial do Android ou entre em contato com o desenvolvedor.

---

**Desenvolvido com ❤️ em Kotlin para Android**

