
import React, { useState } from 'react';
import type { Receipt } from '../../domain/models';
import { longDate, money } from '../../domain/utils';
import { amountToWords } from '../../domain/moneyWords';
import { filterReceipts } from '../../domain/receipts';
import { formatExchangeRateDate } from '../receipts/exchangeRate';
import { EmptyState, Icon } from '../../shared/components/ui';
import { PageTitle } from '../../shared/layout/AppLayout';
import { shareFile } from '../../shared/native/shareFile';
import { Modal } from '../../shared/components/Modal';
import { formatDocument } from '../../shared/validation/document';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { FileSharer } from '@capgo/capacitor-file-sharer';

export function History({
  receipts,
  setDeleteTarget,
  notify,
}: {
  receipts: Receipt[];
  setDeleteTarget: (target: { type: 'receipt' | 'all'; id?: string }) => void;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const filtered = filterReceipts(receipts, { query, from, to });

  return (
    <div className="page">
      <PageTitle
        eyebrow="Tudo que já foi entregue"
        title="Histórico de recibos"
        description="Documentos finalizados ficam aqui, sempre em modo somente leitura."
        icon="history"
      />

      <div className="history-tools card">
        <div className="search-field">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente"
          />
        </div>

        <div className="date-filter">
          <Icon name="filter" size={16} />

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Data inicial"
          />

          <span>até</span>

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Data final"
          />
        </div>
      </div>

      {filtered.length ? (
        <div className="history-list">
          {filtered.map((receipt) => (
            <ReceiptRow
              key={receipt.id}
              receipt={receipt}
              onDelete={() =>
                setDeleteTarget({ type: 'receipt', id: receipt.id })
              }
              onView={() => setSelectedReceipt(receipt)}
              notify={notify}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            title={
              receipts.length
                ? 'Nada encontrado por aqui'
                : 'Seu histórico está esperando o primeiro recibo'
            }
            text={
              receipts.length
                ? 'Tente mudar a busca ou o período selecionado.'
                : 'Quando você finalizar um recibo, ele aparecerá aqui protegido contra alterações.'
            }
            mood="thinking"
          />
        </div>
      )}

      <p className="privacy-note">
        <Icon name="lock" size={14} />
        Um recibo finalizado não pode ser editado. Se precisar corrigir algo,
        crie um novo documento.
      </p>

      <Modal
        open={!!selectedReceipt}
        onOpenChange={(open) => {
          if (!open) setSelectedReceipt(null);
        }}
        title="Recibo completo"
        description={selectedReceipt?.id}
        size="wide"
      >
        {selectedReceipt && <ReceiptDetails receipt={selectedReceipt} />}
      </Modal>
    </div>
  );
}


  export function ReceiptRow({
    receipt,
    onDelete,
    onView,
    notify,
  }: {
    receipt: Receipt;
    onDelete: () => void;
    onView: () => void;
    notify: (message: string) => void;
  }) {
  // Exportação do recibo como JPG

  const exportJpg = async () => {
    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '900px';
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    iframe.style.opacity = '0.01';
    iframe.style.zIndex = '-1';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentDocument;

      if (!doc) {
        throw new Error('Não foi possível criar o documento temporário.');
      }

      doc.open();
      doc.write(receiptPrintHtml(receipt));
      doc.close();

      await waitForImages(doc);

      if (doc.fonts) {
        await doc.fonts.ready;
      }

      // Aguarda o WebView concluir a renderização.
      await new Promise<void>((resolve) => {
        iframe.contentWindow?.requestAnimationFrame(() => {
          iframe.contentWindow?.requestAnimationFrame(() => resolve());
        });
      });

      const height = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight,
        1200
      );

      iframe.style.height = `${height}px`;

      const canvas = await html2canvas(doc.body, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true,
        windowWidth: 900,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
      });

      if (!canvas.width || !canvas.height) {
        throw new Error('A imagem foi gerada vazia.');
      }

      // Gera diretamente uma imagem JPEG em Base64.
      const base64Data = canvas.toDataURL('image/jpeg', 0.92);

      if (!base64Data || !base64Data.startsWith('data:image/jpeg;base64,')) {
        throw new Error('Não foi possível converter o recibo para JPG.');
      }

      const filename = `${receipt.id}.jpg`;

      if (Capacitor.isNativePlatform()) {
        // Salva diretamente na pasta Downloads do Android.
        const result = await FileSharer.save({
          filename,
          contentType: 'image/jpeg',
          base64Data,
          android: {
            saveDirectory: 'downloads',
            relativePath: 'Download/PJ OWL',
          },
        });

        console.log('JPG salvo:', result);
      } else {
        // Exportação pelo navegador.
        const response = await fetch(base64Data);
        const blob = await response.blob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
      }

      notify('Recibo JPG exportado com sucesso!');

    } catch (error) {
      console.error('Erro ao exportar recibo JPG:', error);

      const message =
        error instanceof Error ? error.message : String(error);

      notify(`Erro ao exportar JPG: ${message}`);

    } finally {
      iframe.remove();
    }
  };


  // Compartilhamento do recibo como PDF.
  const share = async () => {
    try {
      const pdf = await generateReceiptPdf(receipt);
      const blob = pdf.output('blob');

      await shareFile(
        blob,
        `${receipt.id}.pdf`,
        `Recibo ${receipt.id}`,
        `${receipt.id} — ${receipt.clientName.toUpperCase()} — ${money(receipt.amount, receipt.currency).toUpperCase()}`
      );

      notify('Recibo PDF pronto para compartilhar.');
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        notify('Não foi possível abrir o compartilhamento.');
      }
    }
  };

  return (
    <div className="card receipt-row">
      <div className="receipt-row-main">
        <span className="receipt-file-icon">
          <Icon name="receipt" />
        </span>

        <div className="receipt-row-copy">
          <strong
            className="receipt-row-client"
            title={receipt.clientName}
          >
            {receipt.clientName}
          </strong>

          <span
            className="receipt-row-amount"
            title={money(receipt.amount, receipt.currency)}
          >
            {money(receipt.amount, receipt.currency).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="receipt-row-actions">
        <button
          type="button"
          onClick={onView}
          title="Visualizar recibo completo"
          aria-label="Visualizar recibo completo"
        >
          <Icon name="info" size={16} />
        </button>

        <button
          type="button"
          onClick={() => void exportJpg()}
          title="Exportar JPG"
          aria-label="Exportar JPG"
        >
          <Icon name="download" size={16} />
        </button>

        <button
          type="button"
          onClick={() => void share()}
          title="Compartilhar como PDF"
          aria-label="Compartilhar como PDF"
        >
          <Icon name="share" size={16} />
        </button>

        <button
          type="button"
          className="danger-action"
          onClick={onDelete}
          title="Excluir recibo"
          aria-label="Excluir recibo"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}


export function ReceiptDetails({ receipt }: { receipt: Receipt }) {
  return (
    <div className="receipt-details-modal">
      {receipt.providerLogo && (
        <img
          className="saved-receipt-logo"
          src={receipt.providerLogo}
          alt="Logo do negócio"
        />
      )}

      <div className="receipt-details-heading">
        <div>
          <span>PRESTADOR</span>
          <strong>{receipt.businessName || 'PJ OWL'}</strong>

          <small>
            {receipt.providerName.toUpperCase()} ·{' '}
            {receipt.providerDocument
              ? formatDocument(receipt.providerDocument).toUpperCase()
              : 'SEM DOCUMENTO'}
          </small>
        </div>

        <strong className="receipt-details-value">
          {money(receipt.amount, receipt.currency).toUpperCase()}
        </strong>
      </div>

      <div className="receipt-details-grid">
        <p>
          <span>CLIENTE</span>
          <strong>{receipt.clientName.toUpperCase()}</strong>
        </p>

        <p>
          <span>CPF/CNPJ CLIENTE</span>
          <strong>
            {receipt.clientDocument
              ? formatDocument(receipt.clientDocument).toUpperCase()
              : 'NÃO INFORMADO'}
          </strong>
        </p>

        <p>
          <span>REFERENTE A</span>
          <strong>{receipt.description || 'SERVICO OU PRODUTO'}</strong>
        </p>

        <p>
          <span>PAGAMENTO</span>
          <strong>
            {receipt.paymentMethod}
            {receipt.installment
              ? ` · ${receipt.installment.toUpperCase()}`
              : ''}
          </strong>
        </p>

        <p>
          <span>DATA</span>
          <strong>{longDate(receipt.paymentDate).toUpperCase()}</strong>
        </p>

        <p>
          <span>VALOR POR EXTENSO</span>
          <strong>
            {amountToWords(receipt.amount, receipt.currency).toUpperCase()}
          </strong>
        </p>
      </div>

      {receipt.originalCurrency === 'USD' &&
        receipt.originalAmount !== undefined && (
          <p className="muted">
            VALOR INFORMADO: {money(receipt.originalAmount, 'USD').toUpperCase()}
            {' · '}COTAÇÃO {receipt.exchangeRate?.toFixed(4) ?? 'N/D'} BRL/USD
          </p>
        )}

      {receipt.notes && (
        <p>
          <b>OBSERVAÇÕES:</b> {receipt.notes.toUpperCase()}
        </p>
      )}

      <div className="saved-signatures">
        <div>
          {receipt.providerSignature && (
            <img
              src={receipt.providerSignature}
              alt="Assinatura do prestador"
            />
          )}

          <span>PRESTADOR: {receipt.providerName.toUpperCase()}</span>
        </div>

        <div>
          {receipt.clientSignature && (
            <img
              src={receipt.clientSignature}
              alt="Assinatura do cliente"
            />
          )}

          <span>CLIENTE: {receipt.clientName.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// TRATAMENTO DE IMAGENS
// ======================================================

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();

    // Data URLs não precisam de configuração CORS.
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);

    img.src = src;
  });
}

/**
 * Converte uma imagem para PNG em Base64.
 *
 * Isso permite incorporar a logo e as assinaturas
 * diretamente no documento PDF.
 */
async function imageToPng(src: string): Promise<LoadedImage | null> {
  try {
    const img = await loadImage(src);

    if (!img) return null;

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    if (!width || !height) return null;

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) return null;

    context.drawImage(img, 0, 0);

    const data = canvas.toDataURL('image/png');

    return {
      data,
      width,
      height,
    };
  } catch (error) {
    console.error('Erro ao converter imagem:', error);
    return null;
  }
}

/**
 * Adiciona uma imagem ao PDF mantendo sua proporção.
 */
function addImageContained(
  doc: jsPDF,
  image: LoadedImage,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
) {
  const ratio = Math.min(
    maxWidth / image.width,
    maxHeight / image.height
  );

  const width = image.width * ratio;
  const height = image.height * ratio;

  const centeredX = x + (maxWidth - width) / 2;
  const centeredY = y + (maxHeight - height) / 2;

  doc.addImage(
    image.data,
    'PNG',
    centeredX,
    centeredY,
    width,
    height,
    undefined,
    'FAST'
  );
}

/**
 * Aguarda as imagens do HTML terminarem de carregar.
 */
async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

// ======================================================
// GERAÇÃO DO PDF
// ======================================================

export async function generateReceiptPdf(
  receipt: Receipt
): Promise<jsPDF> {
  const doc = new jsPDF({
    unit: 'pt',
    orientation: 'portrait',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  let y = 50;

  // --------------------------------------------------
  // CABEÇALHO E LOGO
  // --------------------------------------------------

  const logo = receipt.providerLogo
    ? await imageToPng(receipt.providerLogo)
    : null;

  const headerTextX = logo ? 145 : 50;

  if (logo) {
    addImageContained(
      doc,
      logo,
      50,
      35,
      75,
      75
    );
  }

  doc.setFontSize(25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(47, 38, 66);

  const businessName = (receipt.businessName || 'PJ OWL').toUpperCase();

  const businessLines = doc.splitTextToSize(
    businessName,
    logo ? 260 : 350
  );

  doc.text(businessLines, headerTextX, y + 5);

  const businessHeight = businessLines.length * 29;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);

  const providerY = y + businessHeight + 5;

  doc.text(
    receipt.providerName.toUpperCase(),
    headerTextX,
    providerY
  );

  const provDoc = receipt.providerDocument
    ? formatDocument(receipt.providerDocument)
    : 'SEM DOCUMENTO';

  doc.text(
    provDoc.toUpperCase(),
    headerTextX,
    providerY + 17
  );

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  doc.text(
    receipt.id,
    pageW - 50,
    50,
    { align: 'right' }
  );

  y = Math.max(
    logo ? 130 : 105,
    providerY + 35
  );

  doc.setDrawColor(200, 200, 200);
  doc.line(50, y, pageW - 50, y);

  y += 35;

  // --------------------------------------------------
  // TÍTULO DO RECIBO
  // --------------------------------------------------

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  doc.text('RECIBO DE PAGAMENTO', 50, y);

  y += 34;

  const clientDoc = receipt.clientDocument
    ? formatDocument(receipt.clientDocument)
    : 'SEM DOCUMENTO';

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');

  const receivedText = doc.splitTextToSize(
    `RECEBI DE ${receipt.clientName.toUpperCase()} — ${clientDoc.toUpperCase()} A IMPORTÂNCIA DE:`,
    pageW - 100
  );

  doc.text(receivedText, 50, y);

  y += receivedText.length * 17 + 12;

  // --------------------------------------------------
  // VALOR
  // --------------------------------------------------

  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 80, 178);

  doc.text(
    money(receipt.amount, receipt.currency).toUpperCase(),
    50,
    y
  );

  y += 24;

  doc.setTextColor(81, 71, 95);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const amountWords = doc.splitTextToSize(
    `(${amountToWords(receipt.amount, receipt.currency).toUpperCase()})`,
    pageW - 100
  );

  doc.text(amountWords, 50, y);

  y += amountWords.length * 14 + 15;

  // --------------------------------------------------
  // CONVERSÃO DE MOEDA
  // --------------------------------------------------

  if (
    receipt.originalCurrency === 'USD' &&
    receipt.originalAmount !== undefined
  ) {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const originalValue = doc.splitTextToSize(
      `VALOR INFORMADO: ${money(receipt.originalAmount, 'USD').toUpperCase()} (${amountToWords(receipt.originalAmount, 'USD').toUpperCase()})`,
      pageW - 100
    );

    doc.text(originalValue, 50, y);

    y += originalValue.length * 14 + 5;

    doc.text(
      `COTAÇÃO UTILIZADA: ${receipt.exchangeRate?.toFixed(4) ?? 'NÃO REGISTRADA'} BRL/USD`,
      50,
      y
    );

    y += 20;
  }

  // --------------------------------------------------
  // DETALHES
  // --------------------------------------------------

  y += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  doc.text('DETALHES:', 50, y);

  y += 18;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const detalhes: [string, string][] = [
    [
      'REFERENTE A:',
      (receipt.description || 'SERVICO OU PRODUTO').toUpperCase(),
    ],
    [
      'FORMA DE PAGAMENTO:',
      `${receipt.paymentMethod.toUpperCase()}${receipt.installment ? ` · ${receipt.installment.toUpperCase()}` : ''}`,
    ],
    [
      'DATA:',
      longDate(receipt.paymentDate).toUpperCase(),
    ],
    [
      'CLIENTE:',
      receipt.clientDocument
        ? formatDocument(receipt.clientDocument).toUpperCase()
        : 'NÃO INFORMADO',
    ],
  ];

  for (const [label, value] of detalhes) {
    const valueLines = doc.splitTextToSize(
      value,
      pageW - 260
    );

    const rowHeight = Math.max(
      16,
      valueLines.length * 14
    );

    if (y + rowHeight > pageH - 50) {
      doc.addPage();
      y = 50;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(label, 50, y);

    doc.setFont('helvetica', 'normal');
    doc.text(valueLines, 200, y);

    y += rowHeight + 5;
  }

  // --------------------------------------------------
  // OBSERVAÇÕES
  // --------------------------------------------------

  if (receipt.notes) {
    y += 12;

    if (y > pageH - 100) {
      doc.addPage();
      y = 50;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(50, y, pageW - 50, y);

    y += 20;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    doc.text('OBSERVAÇÕES:', 50, y);

    y += 17;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const notesLines = doc.splitTextToSize(
      receipt.notes.toUpperCase(),
      pageW - 100
    );

    for (const line of notesLines) {
      if (y > pageH - 45) {
        doc.addPage();
        y = 50;
      }

      doc.text(line, 50, y);
      y += 14;
    }
  }

  // --------------------------------------------------
  // ASSINATURAS
  // --------------------------------------------------

  y += 25;

  if (y > pageH - 160) {
    doc.addPage();
    y = 50;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(50, y, pageW - 50, y);

  y += 28;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  doc.text('ASSINATURAS:', 50, y);

  y += 22;

  // Assinatura do prestador

  const providerSignature = receipt.providerSignature
    ? await imageToPng(receipt.providerSignature)
    : null;

  if (providerSignature || receipt.providerSignature) {
    if (y > pageH - 110) {
      doc.addPage();
      y = 50;
    }

    if (providerSignature) {
      addImageContained(
        doc,
        providerSignature,
        50,
        y,
        200,
        55
      );
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    doc.text(
      `PRESTADOR: ${receipt.providerName.toUpperCase()}`,
      50,
      y + 70
    );

    y += 90;
  }

  // Assinatura do cliente

  const clientSignature = receipt.clientSignature
    ? await imageToPng(receipt.clientSignature)
    : null;

  if (clientSignature || receipt.clientSignature) {
    if (y > pageH - 110) {
      doc.addPage();
      y = 50;
    }

    if (clientSignature) {
      addImageContained(
        doc,
        clientSignature,
        50,
        y,
        200,
        55
      );
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    doc.text(
      `CLIENTE: ${receipt.clientName.toUpperCase()}`,
      50,
      y + 70
    );

    y += 90;
  }

  // --------------------------------------------------
  // RODAPÉ
  // --------------------------------------------------

  if (y > pageH - 35) {
    doc.addPage();
    y = 50;
  }

  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);

  doc.text(
    'Documento gerado pelo PJ OWL · assinatura eletrônica simples',
    50,
    y + 10
  );

  return doc;
}

// ======================================================
// EXPORTAÇÃO PARA IMPRESSÃO / PDF PELO NAVEGADOR
// ======================================================

export function receiptPrintHtml(receipt: Receipt) {
  const logoHtml = receipt.providerLogo
    ? `
      <img
        class="business-logo"
        src="${receipt.providerLogo}"
        alt="Logo do negócio"
      />
    `
    : '';

  const providerSignatureHtml = receipt.providerSignature
    ? `
      <img
        src="${receipt.providerSignature}"
        alt="Assinatura do prestador"
      />
    `
    : '';

  const clientSignatureHtml = receipt.clientSignature
    ? `
      <img
        src="${receipt.clientSignature}"
        alt="Assinatura do cliente"
      />
    `
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${receipt.id}</title>

<style>
* {
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  color: #2f2642;
  max-width: 760px;
  margin: 40px auto;
  padding: 0 32px;
}

header {
  display: flex;
  align-items: center;
  gap: 22px;
  justify-content: space-between;
  border-bottom: 1px solid #ddd;
  padding-bottom: 28px;
}

.header-business {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.business-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  flex-shrink: 0;
}

.header-business-info {
  min-width: 0;
}

h1 {
  font-size: 30px;
  margin: 0 0 10px;
  overflow-wrap: anywhere;
}

h2 {
  margin-top: 48px;
}

.amount {
  font-size: 40px;
  font-weight: 800;
  color: #7150b2;
}

.amount-words {
  font-size: 15px;
  line-height: 1.5;
  margin-top: 8px;
  color: #51475f;
}

.conversion {
  font-size: 12px;
  color: #8a8291;
}

.details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 36px 0;
}

.details span {
  display: block;
  color: #8a8291;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 7px;
}

.details strong {
  font-size: 17px;
  overflow-wrap: anywhere;
}

.signatures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 70px;
  margin-top: 90px;
}

.signatures div {
  border-top: 1px solid #bdb6c8;
  padding-top: 10px;
  text-align: center;
  color: #62596e;
}

.signatures img {
  width: 100%;
  height: 80px;
  object-fit: contain;
  display: block;
  margin-bottom: -4px;
}

.footer {
  margin-top: 70px;
  color: #8a8291;
  font-size: 12px;
}

@media print {
  body {
    margin: 15px auto;
    padding: 0 20px;
  }

  header {
    break-inside: avoid;
  }

  .business-logo {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .signatures {
    break-inside: avoid;
  }
}

@media (max-width: 550px) {
  header {
    align-items: flex-start;
    flex-direction: column;
  }

  .details,
  .signatures {
    grid-template-columns: 1fr;
    gap: 25px;
  }
}
</style>
</head>

<body>

<header>
  <div class="header-business">
    ${logoHtml}

    <div class="header-business-info">
      <h1>${(receipt.businessName || 'PJ OWL').toUpperCase()}</h1>

      <p>
        ${(receipt.providerName || '').toUpperCase()}
        ·
        ${
          receipt.providerDocument
            ? formatDocument(receipt.providerDocument).toUpperCase()
            : 'SEM DOCUMENTO'
        }
      </p>
    </div>
  </div>

  <strong>${receipt.id}</strong>
</header>

<h2>RECIBO DE PAGAMENTO</h2>

<p>
  RECEBI DE
  <strong>${receipt.clientName.toUpperCase()}</strong>
  —
  ${
    receipt.clientDocument
      ? formatDocument(receipt.clientDocument).toUpperCase()
      : 'SEM DOCUMENTO'
  }
  A IMPORTÂNCIA DE:
</p>

<div class="amount">
  ${money(receipt.amount, receipt.currency).toUpperCase()}
</div>

<p class="amount-words">
  (${amountToWords(receipt.amount, receipt.currency).toUpperCase()})
</p>

${
  receipt.originalCurrency === 'USD' &&
  receipt.originalAmount !== undefined
    ? `
      <p class="conversion">
        VALOR INFORMADO:
        ${money(receipt.originalAmount, 'USD').toUpperCase()}
        (${amountToWords(receipt.originalAmount, 'USD').toUpperCase()})
        · COTAÇÃO UTILIZADA:
        ${receipt.exchangeRate?.toFixed(4) ?? 'NÃO REGISTRADA'}
        BRL/USD
        (${
          receipt.exchangeRateDate
            ? formatExchangeRateDate(receipt.exchangeRateDate).toUpperCase()
            : 'DATA NÃO REGISTRADA'
        })
      </p>
    `
    : ''
}

<div class="details">

  <div>
    <span>REFERENTE A</span>
    <strong>
      ${(receipt.description || 'SERVICO OU PRODUTO').toUpperCase()}
    </strong>
  </div>

  <div>
    <span>FORMA DE PAGAMENTO</span>
    <strong>
      ${receipt.paymentMethod.toUpperCase()}
      ${
        receipt.installment
          ? ` · ${receipt.installment.toUpperCase()}`
          : ''
      }
    </strong>
  </div>

  <div>
    <span>DATA</span>
    <strong>${longDate(receipt.paymentDate).toUpperCase()}</strong>
  </div>

  <div>
    <span>CLIENTE</span>
    <strong>
      ${
        receipt.clientDocument
          ? formatDocument(receipt.clientDocument).toUpperCase()
          : 'NÃO INFORMADO'
      }
    </strong>
  </div>

</div>

${
  receipt.notes
    ? `
      <p>
        <strong>OBSERVAÇÕES:</strong>
        ${receipt.notes.toUpperCase()}
      </p>
    `
    : ''
}

<div class="signatures">

  <div>
    ${providerSignatureHtml}
    <span>
      PRESTADOR: ${receipt.providerName.toUpperCase()}
    </span>
  </div>

  <div>
    ${clientSignatureHtml}
    <span>
      CLIENTE: ${receipt.clientName.toUpperCase()}
    </span>
  </div>

</div>

<p class="footer">
  DOCUMENTO GERADO PELO PJ OWL EM
  ${new Date(receipt.finalizedAt).toLocaleString('pt-BR')}.
  A ASSINATURA DESENHADA É ELETRÔNICA SIMPLES.
</p>

</body>
</html>`;
}
