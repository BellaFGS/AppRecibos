# Distribuição Android do PJ OWL

O PJ OWL mantém a interface React/TypeScript existente. O Capacitor empacota o build do Vite em um WebView Android e conecta recursos nativos (SQLite, notificações, teclado, splash screen e compartilhamento). Depois de instalado, o app abre a partir dos arquivos locais em `dist/`, sem servidor de desenvolvimento.

## Identidade e requisitos

- `appId`: `com.pjowl.recibos` (identificador Android definitivo; alterá-lo após distribuir o app cria outro aplicativo para o Android).
- Nome: `PJ OWL`.
- Build web: `dist/`.
- Android: Capacitor 8, Java 21 e Android SDK instalado.
- `minSdkVersion`: 24 (Android 7.0) ou superior. Confirme em `android/variables.gradle` após criar a plataforma.
- Cor de fundo e splash: `#f4effb`.
- Fontes: pilha de fontes do sistema para não depender do Google Fonts quando estiver offline.
- Ícone/splash de origem: `assets/icon-only.png`, `assets/icon-foreground.png`, `assets/icon-background.png` e `assets/splash*.png`.

## Preparar ambiente Windows

1. Instale Node.js 22 LTS, pnpm 11.25.0, JDK 21 e Android Studio.
2. No Android Studio, instale Android SDK Platform, Build-tools e Platform-tools disponíveis para o SDK atual.
3. Abra PowerShell na raiz do projeto e execute:

```powershell
pnpm install
pnpm check
pnpm test
pnpm build
```

## Criar e sincronizar a plataforma Android

Execute uma única vez para criar `android/`:

```powershell
pnpm cap:add:android
pnpm cap:configure:android
pnpm dlx @capacitor/assets@4.0.0 generate --android
pnpm cap:sync
```

Nas próximas alterações web ou de plugins, basta:

```powershell
pnpm build
pnpm cap:sync
```

O comando `cap sync` copia `dist/` para o projeto nativo e sincroniza os plugins Capacitor. Não abra o Android Studio antes de concluir a primeira sincronização.

### Ícone e splash screen

Os arquivos-base estão em `assets/`. Para gerar os tamanhos e recursos Android com o gerador oficial de assets:

```powershell
pnpm dlx @capacitor/assets@4.0.0 generate --android
```

Depois de gerar os recursos, aplique a versão mínima e sincronize novamente:

```powershell
pnpm cap:configure:android
pnpm cap:sync
```

Confira os recursos em `android/app/src/main/res/` antes de publicar. O ícone de origem tem fundo transparente; o fundo configurado é lilás claro.

### Versão mínima

Após `cap add android`, abra `android/variables.gradle` e confirme:

```gradle
minSdkVersion = 24
```

Se a versão gerada for menor, ajuste para 24. Não reduza abaixo do mínimo exigido pelas versões dos plugins Capacitor utilizados.

## Gerar APK de debug

No PowerShell:

```powershell
pnpm build
pnpm cap:sync
pnpm android:debug
```

O APK fica em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Para instalar em um dispositivo/emulador conectado por ADB:

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Ou abra `android/` no Android Studio e execute a configuração `app` em um emulador.

## Recursos nativos e comportamento offline

- Persistência Android: SQLite por `@capacitor-community/sqlite`.
- Notificações da agenda: `@capacitor/local-notifications`.
- Compartilhamento de arquivos e texto: `@capacitor/share`.
- Arquivos temporários para compartilhamento: `@capacitor/filesystem` em `Directory.Cache`.
- Teclado: plugin `@capacitor/keyboard`, com redimensionamento do conteúdo.
- Splash screen: plugin `@capacitor/splash-screen`.
- Navegação e formulários continuam em React. A meta viewport usa `viewport-fit=cover` e o CSS considera as safe areas do Android.
- O compartilhamento nativo abre a folha de compartilhamento do Android. Na web, usa Web Share API quando disponível e faz download como alternativa.
- A exportação PDF existente abre o diálogo de impressão do WebView/navegador. Em Android, confirme o fluxo de impressão/Salvar como PDF no dispositivo de destino.

A interface e os dados são locais. Recursos externos opcionais, como cotação cambial, podem exigir internet; os demais fluxos não devem depender de servidor local ou remoto.

## Checklist manual em Android

- [ ] Instalação e inicialização em modo avião, após instalação inicial.
- [ ] Nenhuma tela tenta carregar `localhost` ou o servidor Vite.
- [ ] Cadastro/edição de perfil e persistência após encerrar e reabrir o app.
- [ ] Criar e finalizar recibo, visualizar histórico e exportar JPG.
- [ ] Compartilhar resumo e arquivo por WhatsApp/Drive/outro app.
- [ ] Abrir diálogo de impressão e salvar recibo como PDF.
- [ ] Abrir formulários com teclado, rolar até os campos inferiores e fechar teclado.
- [ ] Conferir safe areas em aparelhos com recorte e barra de navegação por gestos.
- [ ] Alternar para outro app e retornar; confirmar que o estado persistido continua disponível.
- [ ] Pressionar Voltar em cada seção e confirmar comportamento esperado do WebView/Android.
- [ ] Confirmar notificações locais da agenda e permissões no Android 13+.

## Solução de problemas

- **`Unable to locate Android SDK`**: configure `ANDROID_HOME`/`ANDROID_SDK_ROOT` e instale o SDK pelo Android Studio.
- **`JAVA_HOME` incompatível**: use JDK 21 para o build Android.
- **Mudanças web não aparecem**: rode `pnpm build` e `pnpm cap:sync` antes de reinstalar.
- **Plugin nativo não encontrado**: rode `pnpm cap:sync` e faça rebuild do APK; hot reload web não registra plugins nativos.
- **Compartilhamento cancelado**: cancelar a folha nativa é uma ação normal, não um erro de exportação.
