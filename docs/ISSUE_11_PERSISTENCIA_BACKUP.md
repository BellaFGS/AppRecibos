# Issue 11: Persistência, migrações e backup

## O que foi implementado

- Contrato `KeyValueStorage` desacopla a aplicação do mecanismo físico de armazenamento.
- `IndexedDbStorage` é o adaptador web, com operações assíncronas e gravação transacional por registro.
- `CapacitorSqliteStorage` é o adaptador nativo Android/iOS, selecionado quando `Capacitor.isNativePlatform()` retornar verdadeiro.
- Repositórios separados para perfil, composições, agenda, despesas e recibos.
- Migração versionada (`meta:schemaVersion`) que importa as chaves `recibofacil:*` sem apagá-las.
- Backup JSON versionado e validação antes de alterar os dados.
- Restauração com tentativa de rollback caso alguma gravação falhe.
- A interface recebe erros de inicialização, gravação, exportação e restauração.

## Instalação

Na raiz do projeto:

```bash
pnpm install
```

As dependências `@capacitor/core` e `@capacitor-community/sqlite` foram adicionadas ao `package.json`. O adaptador SQLite será usado quando a plataforma Capacitor estiver instalada e inicializada; no navegador, o projeto usa IndexedDB. No Android, o plugin nativo precisa ser sincronizado com `npx cap sync android` depois da configuração do Capacitor.

## Estrutura adicionada

```text
src/
  shared/
    storage/
      types.ts
      indexedDbStorage.ts
      capacitorSqliteStorage.ts
      repositories.ts
      migrations.ts
      storageProvider.ts
      backup.ts
```

## Como funciona a migração legada

1. A inicialização consulta `meta:schemaVersion`.
2. Se a versão for anterior a 1, procura cada chave `recibofacil:profile`, `recibofacil:compositions`, `recibofacil:appointments`, `recibofacil:expenses` e `recibofacil:receipts`.
3. Cada valor é interpretado como JSON e gravado no novo armazenamento somente se ainda não existir no destino.
4. A versão do esquema é atualizada somente depois de todas as cópias concluírem.
5. As chaves antigas não são apagadas. Isso permite recuperação manual caso algo inesperado aconteça.

## Backup

O arquivo exportado usa o formato `pj-owl-backup`, versão 1, com data de criação, versão do esquema e os cinco domínios persistidos. A restauração valida o envelope e os tipos principais antes de escrever. Se uma gravação falhar, tenta restaurar os dados anteriores.

## Testes manuais de aceite

1. Com a versão anterior aberta, crie/edite perfil, composição, compromisso, despesa e recibo.
2. Atualize para esta versão no mesmo navegador. Confirme que todos os cinco domínios continuam presentes.
3. Abra DevTools > Application > IndexedDB e confirme o banco `pj-owl-database` e a store `records`.
4. Exporte um backup JSON e confira que o arquivo contém `format`, `backupVersion`, `schemaVersion`, `createdAt` e `data`.
5. Faça uma alteração nos dados e restaure o backup. Confirme que os dados retornaram ao estado exportado.
6. Tente restaurar um JSON inválido e confirme que a interface informa o erro e os dados atuais permanecem intactos.
7. Renomeie temporariamente o banco IndexedDB ou bloqueie o armazenamento e confirme que o aplicativo apresenta uma mensagem de falha, sem afirmar que salvou.
8. Pesquise no código por `localStorage`. A única ocorrência permitida deve estar no módulo de migração legado.

## Limites conhecidos desta etapa

O adaptador SQLite foi implementado, mas a instalação e sincronização da plataforma Android ainda dependem da etapa de configuração do Capacitor. O banco foi criado sem criptografia nesta etapa. A restauração usa rollback compensatório entre chaves, pois cada domínio é persistido em um registro independente. A interface de repositórios permite trocar a implementação sem alterar componentes.
