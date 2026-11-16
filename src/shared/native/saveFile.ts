import { Capacitor } from '@capacitor/core';
import { FileSharer } from '@capgo/capacitor-file-sharer';
import { shareFile, toBase64 } from './shareFile';

export type SaveFileResult = 'downloads' | 'share' | 'browser';

/**
 * Salva um arquivo para o usuário.
 *
 * - Android: tenta gravar em Downloads/PJ OWL. Se o plugin recusar
 *   (ex.: ERR_PARAM_DATA_INVALID), cai para a folha de compartilhamento,
 *   de onde o usuário pode salvar em Arquivos/Drive/WhatsApp etc.
 * - Navegador: download normal.
 *
 * IMPORTANTE: `base64Data` deve conter SOMENTE o Base64, sem o prefixo
 * "data:image/jpeg;base64,". O `toBase64` já remove esse prefixo.
 */
export async function saveFileToDownloads(
  blob: Blob,
  filename: string,
  title: string,
): Promise<SaveFileResult> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    return 'browser';
  }

  const base64Data = await toBase64(blob);
  if (!base64Data) {
    throw new Error('O arquivo gerado está vazio.');
  }

  try {
    await FileSharer.save({
      filename,
      contentType: blob.type || 'application/octet-stream',
      base64Data,
      android: {
        saveDirectory: 'downloads',
        relativePath: 'PJ OWL',
      },
    });
    return 'downloads';
  } catch (error) {
    console.warn('FileSharer.save falhou; usando compartilhamento.', error);
    await shareFile(blob, filename, title, '');
    return 'share';
  }
}
