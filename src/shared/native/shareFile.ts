import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível preparar o arquivo.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Formato de arquivo inválido.'));
        return;
      }
      resolve(result.split(',')[1] ?? '');
    };
    reader.readAsDataURL(blob);
  });
}

export async function shareFile(blob: Blob, fileName: string, title: string, text: string): Promise<void> {
  const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });

  if (Capacitor.isNativePlatform()) {
    const data = await toBase64(blob);
    const saved = await Filesystem.writeFile({
      path: `pj-owl/${fileName}`,
      data,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({ title, text, files: [saved.uri], dialogTitle: 'Compartilhar arquivo' });
    return;
  }

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({ title, text, files: [file] });
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function shareText(title: string, text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, dialogTitle: 'Compartilhar pelo PJ OWL' });
    return;
  }
  if (navigator.share) {
    await navigator.share({ title, text });
    return;
  }
  await navigator.clipboard?.writeText(text);
}
