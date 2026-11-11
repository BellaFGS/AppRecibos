import React, { useState } from 'react';
import type { Receipt } from '../../domain/models';
import { longDate, money, shortDate } from '../../domain/utils';
import { amountToWords } from '../../domain/moneyWords';
import { filterReceipts } from '../../domain/receipts';
import { formatExchangeRateDate } from '../receipts/exchangeRate';
import { Button, EmptyState, Icon } from '../../shared/components/ui';
import { PageTitle } from '../../shared/layout/AppLayout';
import { shareFile } from '../../shared/native/shareFile';
import { Modal } from '../../shared/components/Modal';
import { formatDocument } from '../../shared/validation/document';
import jsPDF from 'jspdf';

export function History({ receipts, setDeleteTarget, notify }: { receipts: Receipt[]; setDeleteTarget: (target: { type: 'receipt' | 'all'; id?: string }) => void; notify: (message: string) => void }) {
  const [query, setQuery] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const filtered = filterReceipts(receipts, { query, from, to });
  return <div className="page"><PageTitle eyebrow="Tudo que já foi entregue" title="Histórico de recibos" description="Documentos finalizados ficam aqui, sempre em modo somente leitura." action={receipts.length ? 'Limpar histórico' : undefined} onAction={() => setDeleteTarget({ type: 'all' })} icon="history" /><div className="history-tools card"><div className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente" /></div><div className="date-filter"><Icon name="filter" size={16} /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Data inicial" /><span>até</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Data final" /></div></div>{filtered.length ? <div className="history-list">{filtered.map((receipt) => <ReceiptRow key={receipt.id} receipt={receipt} onDelete={() => setDeleteTarget({ type: 'receipt', id: receipt.id })} onView={() => setSelectedReceipt(receipt)} notify={notify} />)}</div> : <div className="card"><EmptyState title={receipts.length ? 'Nada encontrado por aqui' : 'Seu histórico está esperando o primeiro recibo'} text={receipts.length ? 'Tente mudar a busca ou o período selecionado.' : 'Quando você finalizar um recibo, ele aparecerá aqui protegido contra alterações.'} mood="thinking" /></div>}<p className="privacy-note"><Icon name="lock" size={14} /> Um recibo finalizado não pode ser editado. Se precisar corrigir algo, crie um novo documento.</p><Modal open={!!selectedReceipt} onOpenChange={(open) => { if (!open) setSelectedReceipt(null); }} title="Recibo completo" description={selectedReceipt?.id} size="wide">{selectedReceipt && <ReceiptDetails receipt={selectedReceipt} />}</Modal></div>;
}

export function ReceiptRow({ receipt, onDelete, onView, notify }: { receipt: Receipt; onDelete: () => void; onView: () => void; notify: (message: string) => void }) {
  const exportPdf = () => {
    const popup = window.open('', '_blank', 'width=760,height=900');
    if (!popup) {
      notify('Permita pop-ups para exportar o PDF.');
      return;
    }
    popup.document.write(receiptPrintHtml(receipt));
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 300);
  };

  const share = async () => {
    try {
      const pdf = await generateReceiptPdf(receipt);
      const blob = pdf.output('blob');
      await shareFile(blob, `${receipt.id}.pdf`, `Recibo ${receipt.id}`, `${receipt.id} — ${receipt.clientName.toUpperCase()} — ${money(receipt.amount, receipt.currency).toUpperCase()}`);
      notify('Recibo PDF pronto para compartilhar.');
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        notify('Não foi possível abrir o compartilhamento.');
      }
    }
  };

  return <div className="card receipt-row">
    <div className="receipt-row-main">
      <span className="receipt-file-icon"><Icon name="receipt" /></span>
      <div>
        <div className="receipt-row-title">
          <strong>{receipt.clientName}</strong>
          <span className="status-chip"><Icon name="check" size={12} /> finalizado</span>
        </div>
        <span>{receipt.description || 'SERVICO OU PRODUTO'} · {shortDate(receipt.paymentDate).toUpperCase()} · {receipt.paymentMethod}</span>
        <small>{receipt.id}</small>
      </div>
    </div>
    <strong className="receipt-row-amount">{money(receipt.amount, receipt.currency).toUpperCase()}</strong>
    <div className="receipt-row-actions">
      <button onClick={onView} title="Visualizar recibo completo"><Icon name="info" size={16} /><span>Ver</span></button>
      <button onClick={exportPdf} title="Exportar PDF"><Icon name="download" size={16} /><span>PDF</span></button>
      <button onClick={() => void share()} title="Compartilhar como PDF"><Icon name="share" size={16} /><span>Compartilhar</span></button>
      <button className="danger-action" onClick={onDelete} title="Excluir"><Icon name="trash" size={16} /></button>
    </div>
  </div>;
}

export function ReceiptDetails({ receipt }: { receipt: Receipt }) { 
  return <div className="receipt-details-modal">
    {receipt.providerLogo && <img className="saved-receipt-logo" src={receipt.providerLogo} alt="Logo do negócio" />}
    <div className="receipt-details-heading">
      <div><span>PRESTADOR</span><strong>{receipt.businessName || 'PJ OWL'}</strong><small>{receipt.providerName.toUpperCase()} · {receipt.providerDocument ? formatDocument(receipt.providerDocument).toUpperCase() : 'SEM DOCUMENTO'}</small></div>
      <strong className="receipt-details-value">{money(receipt.amount, receipt.currency).toUpperCase()}</strong>
    </div>
    <div className="receipt-details-grid">
      <p><span>CLIENTE</span><strong>{receipt.clientName.toUpperCase()}</strong></p>
      <p><span>CPF/CNPJ CLIENTE</span><strong>{receipt.clientDocument ? formatDocument(receipt.clientDocument).toUpperCase() : 'NÃO INFORMADO'}</strong></p>
      <p><span>REFERENTE A</span><strong>{receipt.description || 'SERVICO OU PRODUTO'}</strong></p>
      <p><span>PAGAMENTO</span><strong>{receipt.paymentMethod}{receipt.installment ? ` · ${receipt.installment.toUpperCase()}` : ''}</strong></p>
      <p><span>DATA</span><strong>{longDate(receipt.paymentDate).toUpperCase()}</strong></p>
      <p><span>VALOR POR EXTENSO</span><strong>{amountToWords(receipt.amount, receipt.currency).toUpperCase()}</strong></p>
    </div>
    {receipt.originalCurrency === 'USD' && receipt.originalAmount !== undefined && <p className="muted">VALOR INFORMADO: {money(receipt.originalAmount, 'USD').toUpperCase()} · COTAÇÃO {receipt.exchangeRate?.toFixed(4) ?? 'N/D'} BRL/USD</p>}
    {receipt.notes && <p><b>OBSERVAÇÕES:</b> {receipt.notes.toUpperCase()}</p>}
    <div className="saved-signatures">
      <div>{receipt.providerSignature && <img src={receipt.providerSignature} alt="Assinatura do prestador" />}<span>PRESTADOR: {receipt.providerName.toUpperCase()}</span></div>
      <div>{receipt.clientSignature && <img src={receipt.clientSignature} alt="Assinatura do cliente" />}<span>CLIENTE: {receipt.clientName.toUpperCase()}</span></div>
    </div>
  </div>; 
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawImageAt(doc: jsPDF, src: string, x: number, y: number, w: number, h: number): Promise<jsPDF> {
  return loadImage(src).then((img) => {
    if (!img) return doc;
    doc.addImage(src, 'PNG', x, y, w, h, undefined, 'FAST');
    return doc;
  });
}

export async function generateReceiptPdf(receipt: Receipt): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 50;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.businessName || 'PJ OWL', 50, y);
  y += 24;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text(receipt.providerName, 50, y);
  const provDoc = receipt.providerDocument ? formatDocument(receipt.providerDocument) : 'SEM DOCUMENTO';
  doc.text(provDoc.toUpperCase(), 50, y + 18);
  y += 42;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(receipt.id, pageW - 50, y, { align: 'right' });
  y += 28;

  doc.setDrawColor(200, 200, 200);
  doc.line(50, y, pageW - 50, y);
  y += 28;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RECIBO DE PAGAMENTO', 50, y);
  y += 34;

  const clientDoc = receipt.clientDocument ? formatDocument(receipt.clientDocument) : 'SEM DOCUMENTO';
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`RECEBI DE ${receipt.clientName.toUpperCase()} — ${clientDoc.toUpperCase()} A IMPORTÂNCIA DE:`, 50, y);
  y += 28;

  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 80, 178);
  doc.text(money(receipt.amount, receipt.currency).toUpperCase(), 50, y);
  y += 24;

  doc.setTextColor(81, 71, 95);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${amountToWords(receipt.amount, receipt.currency).toUpperCase()})`, 50, y);
  y += 24;

  if (receipt.originalCurrency === 'USD' && receipt.originalAmount !== undefined) {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`VALOR INFORMADO: ${money(receipt.originalAmount, 'USD').toUpperCase()} (${amountToWords(receipt.originalAmount, 'USD').toUpperCase()})`, 50, y);
    y += 16;
    doc.text(`COTAÇÃO UTILIZADA: ${receipt.exchangeRate?.toFixed(4) ?? 'NÃO REGISTRADA'} BRL/USD`, 50, y);
    y += 20;
  }

  y += 22;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('DETALHES:', 50, y);
  y += 16;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const detalhes = [
    [`REFERENTE A:`, (receipt.description || 'SERVICO OU PRODUTO').toUpperCase()],
    [`FORMA DE PAGAMENTO:`, `${receipt.paymentMethod.toUpperCase()}${receipt.installment ? ` · ${receipt.installment.toUpperCase()}` : ''}`],
    [`DATA:`, longDate(receipt.paymentDate).toUpperCase()],
    [`CLIENTE:`, receipt.clientDocument ? formatDocument(receipt.clientDocument).toUpperCase() : 'NÃO INFORMADO'],
  ];

  detalhes.forEach(([label, value]) => {
    doc.text(label, 50, y);
    doc.text(value, 200, y);
    y += 16;
  });

  if (receipt.notes) {
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(50, y, pageW - 50, y);
    y += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES:', 50, y);
    y += 16;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    if (receipt.notes.length > 100) {
      const lines = receipt.notes.split('\n');
      for (const ln of lines) {
        if (y > pageH - 40) {
          doc.addPage();
          y = 50;
        }
        doc.text(ln.toUpperCase(), 50, y);
        y += 13;
      }
    } else {
      doc.text(receipt.notes.toUpperCase(), 50, y);
      y += 13;
    }
  }

  y += 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(50, y, pageW - 50, y);
  y += 28;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('ASSINATURAS:', 50, y);
  y += 22;

  // Prestador
  doc.setTextColor(60, 60, 60);
  if (receipt.providerSignature) {
    await drawImageAt(doc, receipt.providerSignature, 50, y, 200, 55);
    doc.text(receipt.providerName.toUpperCase(), 290, y);
    y += 70;
  }

  // Cliente
  doc.setTextColor(60, 60, 60);
  if (receipt.clientSignature) {
    await drawImageAt(doc, receipt.clientSignature, 50, y, 200, 55);
    doc.text(receipt.clientName.toUpperCase(), 290, y);
    y += 65;
  }

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text('Documento gerado pelo PJ OWL · assinatura eletrônica simples', 50, y);

  return doc;
}

export function receiptPrintHtml(receipt: Receipt) { 
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${receipt.id}</title>
<style>
body{font-family:Arial,sans-serif;color:#2f2642;max-width:760px;margin:40px auto;padding:0 32px}
header{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:28px}
h1{font-size:30px}
h2{margin-top:48px}
.amount{font-size:40px;font-weight:800;color:#7150b2}
.amount-words{font-size:15px;line-height:1.5;margin-top:8px;color:#51475f}
.conversion{font-size:12px;color:#8a8291}
.details{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:36px 0}
.details span{display:block;color:#8a8291;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}
.details strong{font-size:17px}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:70px;margin-top:90px}
.signatures div{border-top:1px solid #bdb6c8;padding-top:10px;text-align:center;color:#62596e}
.signatures img{width:100%;height:80px;object-fit:contain;display:block;margin-bottom:-4px}
.footer{margin-top:70px;color:#8a8291;font-size:12px}
</style>
</head>
<body>
<header>
  <div>
    <h1>${(receipt.businessName || 'PJ OWL').toUpperCase()}</h1>
    <p>${(receipt.providerName || '').toUpperCase()} · ${receipt.providerDocument ? formatDocument(receipt.providerDocument).toUpperCase() : 'SEM DOCUMENTO'}</p>
  </div>
  <strong>${receipt.id}</strong>
</header>
<h2>RECIBO DE PAGAMENTO</h2>
<p>RECEBI DE <strong>${receipt.clientName.toUpperCase()}</strong> — ${receipt.clientDocument ? formatDocument(receipt.clientDocument).toUpperCase() : 'SEM DOCUMENTO'} A IMPORTÂNCIA DE:</p>
<div class="amount">${money(receipt.amount, receipt.currency).toUpperCase()}</div>
<p class="amount-words">(${amountToWords(receipt.amount, receipt.currency).toUpperCase()})</p>
${receipt.originalCurrency === 'USD' && receipt.originalAmount !== undefined ? `<p class="conversion">VALOR INFORMADO: ${money(receipt.originalAmount, 'USD').toUpperCase()} (${amountToWords(receipt.originalAmount, 'USD').toUpperCase()}) · COTAÇÃO UTILIZADA: ${receipt.exchangeRate?.toFixed(4) ?? 'não registrada'} BRL/USD (${receipt.exchangeRateDate ? formatExchangeRateDate(receipt.exchangeRateDate).toUpperCase() : 'data não registrada'})</p>` : ''}
<div class="details">
  <div><span>REFERENTE A</span><strong>${(receipt.description || 'SERVICO OU PRODUTO').toUpperCase()}</strong></div>
  <div><span>FORMA DE PAGAMENTO</span><strong>${receipt.paymentMethod.toUpperCase()}${receipt.installment ? ` · ${receipt.installment.toUpperCase()}` : ''}</strong></div>
  <div><span>DATA</span><strong>${longDate(receipt.paymentDate).toUpperCase()}</strong></div>
  <div><span>CLIENTE</span><strong>${receipt.clientDocument ? formatDocument(receipt.clientDocument).toUpperCase() : 'NÃO INFORMADO'}</strong></div>
</div>
${receipt.notes ? `<p><strong>OBSERVAÇÕES:</strong> ${receipt.notes.toUpperCase()}</p>` : ''}
<div class="signatures">
  <div><img src="${receipt.providerSignature}" alt=""><span>PRESTADOR: ${receipt.providerName.toUpperCase()}</span></div>
  <div><img src="${receipt.clientSignature}" alt=""><span>CLIENTE: ${receipt.clientName.toUpperCase()}</span></div>
</div>
<p class="footer">DOCUMENTO GERADO PELO PJ OWL EM ${new Date(receipt.finalizedAt).toLocaleString('pt-BR')}. A ASSINATURA DESENHADA É ELETRÔNICA SIMPLES.</p>
</body>
</html>`;
}