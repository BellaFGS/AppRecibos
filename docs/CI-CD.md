# Pipeline de validação e APK

O workflow `.github/workflows/ci.yml` executa em `push` e `pull_request` para `main` e `develop` (commits que alteram somente documentação Markdown são ignorados em `push`).

## Etapas

1. Instala pnpm 11.25.0 e Node.js 22 com cache de pacotes.
2. Instala dependências.
3. Executa `pnpm check`, `pnpm test:ci` e `pnpm build`. Qualquer falha interrompe os jobs seguintes.
4. Após a validação web, configura Java 21 e Android SDK.
5. Cria a plataforma Android com `cap add android` caso o diretório ainda não exista.
6. Executa `cap sync android` e `./gradlew assembleDebug`.
7. Publica `app-debug.apk` como artifact `pj-owl-android-debug-apk`, disponível por 14 dias. O build web também é publicado como `pj-owl-web-dist` por 7 dias.

## Lockfile

O `pnpm-lock.yaml` que acompanha a base recebida estava desatualizado em relação ao `package.json` (inclusive sem a entrada de importador para notificações locais). Por isso, o workflow usa temporariamente `pnpm install --no-frozen-lockfile` para resolver as novas dependências Capacitor. Depois de executar `pnpm install` localmente com pnpm 11.25.0, revisar e commitar o `pnpm-lock.yaml` atualizado, altere os dois passos de instalação no workflow para `pnpm install --frozen-lockfile`. Esse é o modo recomendado para builds reproduzíveis.

## Segredos

O APK de debug usa a chave de debug gerada pelo Android Gradle Plugin. Não há keystore de produção, senha ou token no repositório. Para uma futura publicação assinada, armazene o keystore e as senhas em GitHub Actions Secrets e crie um job separado de release.
