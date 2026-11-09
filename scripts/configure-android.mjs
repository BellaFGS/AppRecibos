import { readFile } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const variablesPath = resolve('android/variables.gradle');
let contents;
try {
  contents = await readFile(variablesPath, 'utf8');
} catch {
  console.error('Projeto Android não encontrado. Execute pnpm cap:add:android primeiro.');
  process.exit(1);
}

const declaration = /(minSdkVersion\s*=\s*)\d+/;
if (!declaration.test(contents)) {
  console.error('Não foi possível localizar minSdkVersion em android/variables.gradle.');
  process.exit(1);
}

contents = contents.replace(declaration, '$1' + '24');
await writeFile(variablesPath, contents, 'utf8');
console.log('Android configurado: minSdkVersion = 24 (Android 7.0).');
