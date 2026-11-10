# Pipeline de validação e APK

O workflow `.github/workflows/ci.yml` executa em `push` para `main`/`develop` (commits que alteram somente documentação Markdown são ignorados em `push`), em **todo `pull_request`** (sem filtro de branch — qualquer branch para qualquer branch) e manualmente via `workflow_dispatch`.

## Etapas

1. Job `validate-web`: instala pnpm 11.25.0 e Node.js 22, roda `pnpm check`, `pnpm test:ci` e `pnpm build`.
2. Job `android-release`: após a validação web, configura Java 21 e Android SDK.
3. Cria a plataforma Android com `cap add android` caso o diretório ainda não exista, configura `minSdkVersion`, gera ícones/splash e executa `cap sync android`.
4. Decodifica o keystore a partir do secret `KEYSTORE_BASE64` e executa `./gradlew assembleRelease`, gerando `app-release.apk` assinado.
5. Publica os artifacts: `pj-owl-android-release-apk` (14 dias) e `pj-owl-web-dist` (7 dias).

## Secrets (obrigatórios para o APK assinado)

Configure em **Settings > Secrets and variables > Actions** no GitHub:

| Secret | Descrição |
|---|---|
| `KEYSTORE_BASE64` | Keystore de release codificado em base64 |
| `KEYSTORE_PASSWORD` | Senha do keystore |
| `KEY_ALIAS` | Alias da chave |
| `KEY_PASSWORD` | Senha da chave |

O workflow falha com erro claro se algum secret estiver ausente.

## Lockfile

O workflow usa `pnpm install --no-frozen-lockfile` porque o `pnpm-lock.yaml` da base estava desatualizado em relação ao `package.json`. Depois de executar `pnpm install` localmente com pnpm 11.25.0, revisar e commitar o `pnpm-lock.yaml` atualizado, altere os passos de instalação para `pnpm install --frozen-lockfile`.
