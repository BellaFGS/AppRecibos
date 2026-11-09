import React, { useState } from 'react';
import type { Receipt } from '../../domain/models';
import { longDate, money, shortDate } from '../../domain/utils';
import { amountToWords } from '../../domain/moneyWords';
import { filterReceipts } from '../../domain/receipts';
import { formatExchangeRateDate } from '../receipts/exchangeRate';
import { Button, EmptyState, Icon } from '../../shared/components/ui';
import { PageTitle } from '../../shared/layout/AppLayout';
import { shareFile, shareText } from '../../shared/native/shareFile';

export function History({ receipts, setDeleteTarget, notify }: { receipts: Receipt[]; setDeleteTarget: (target: { type: 'receipt' | 'all'; id?: string }) => void; notify: (message: string) => void }) {
  const [query, setQuery] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const filtered = filterReceipts(receipts, { query, from, to });
  return <div className="page"><PageTitle eyebrow="Tudo que já foi entregue" title="Histórico de recibos" description="Documentos finalizados ficam aqui, sempre em modo somente leitura." action={receipts.length ? 'Limpar histórico' : undefined} onAction={() => setDeleteTarget({ type: 'all' })} icon="history" /><div className="history-tools card"><div className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente" /></div><div className="date-filter"><Icon name="filter" size={16} /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Data inicial" /><span>até</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Data final" /></div></div>{filtered.length ? <div className="history-list">{filtered.map((receipt) => <ReceiptRow key={receipt.id} receipt={receipt} onDelete={() => setDeleteTarget({ type: 'receipt', id: receipt.id })} notify={notify} />)}</div> : <div className="card"><EmptyState title={receipts.length ? 'Nada encontrado por aqui' : 'Seu histórico está esperando o primeiro recibo'} text={receipts.length ? 'Tente mudar a busca ou o período selecionado.' : 'Quando você finalizar um recibo, ele aparecerá aqui protegido contra alterações.'} mood="thinking" /></div>}<p className="privacy-note"><Icon name="lock" size={14} /> Um recibo finalizado não pode ser editado. Se precisar corrigir algo, crie um novo documento.</p></div>;
}

export function ReceiptRow({ receipt, onDelete, notify }: { receipt: Receipt; onDelete: () => void; notify: (message: string) => void }) {
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

  const exportJpg = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 1300;
    const context = canvas.getContext('2d');
    if (!context) {
      notify('Não foi possível preparar a imagem do recibo.');
      return;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#2f2642';
    context.font = '800 46px Arial';
    context.fillText(receipt.businessName || 'PJ OWL', 80, 100);
    context.font = '700 32px Arial';
    context.fillText('RECIBO DE PAGAMENTO', 80, 190);
    context.font = '500 25px Arial';
    context.fillStyle = '#655d70';

    const lines = [
      `Cliente: ${receipt.clientName}`,
      `Valor: ${money(receipt.amount, receipt.currency)}`,
      `Por extenso: ${amountToWords(receipt.amount, receipt.currency)}`,
      ...(receipt.originalCurrency === 'USD' && receipt.originalAmount !== undefined
        ? [
            `Valor informado: ${money(receipt.originalAmount, 'USD')} (${amountToWords(receipt.originalAmount, 'USD')})`,
            `Cotação utilizada: ${receipt.exchangeRate?.toFixed(4) ?? 'N/D'} BRL/USD`,
          ]
        : []),
      `Referente a: ${receipt.description || 'Serviço ou produto'}`,
      `Pagamento: ${receipt.paymentMethod}`,
      `Data: ${longDate(receipt.paymentDate)}`,
      `ID: ${receipt.id}`,
    ];

    let textY = 270;
    lines.forEach((entry) => {
      const parts = entry.split(' ');
      let current = '';
      for (const part of parts) {
        const candidate = current ? `${current} ${part}` : part;
        if (context.measureText(candidate).width > 1240 && current) {
          context.fillText(current, 80, textY);
          textY += 43;
          current = part;
        } else {
          current = candidate;
        }
      }
      if (current) {
        context.fillText(current, 80, textY);
        textY += 48;
      }
    });

    const signatureY = Math.max(860, textY + 90);
    context.strokeStyle = '#ded7ea';
    context.beginPath();
    context.moveTo(80, signatureY - 110);
    context.lineTo(1320, signatureY - 110);
    context.stroke();
    context.font = '500 21px Arial';
    context.fillText('Prestador', 210, signatureY);
    context.fillText('Cliente', 920, signatureY);
    context.fillStyle = '#8f849d';
    context.font = '400 17px Arial';
    context.fillText('Assinatura eletrônica simples', 80, signatureY + 170);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', .92));
    if (!blob) {
      notify('Não foi possível gerar o JPG.');
      return;
    }

    try {
      await shareFile(blob, `${receipt.id}.jpg`, `Recibo ${receipt.id}`, `Recibo de ${receipt.clientName} · ${money(receipt.amount, receipt.currency)}`);
      notify('Arquivo JPG preparado para compartilhamento.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      notify('Não foi possível exportar o JPG.');
    }
  };

  const share = async () => {
    try {
      await shareText(`Recibo ${receipt.id}`, `${receipt.id} — ${receipt.clientName} — ${money(receipt.amount, receipt.currency)}`);
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
        <span>{receipt.description || 'Serviço ou produto'} · {shortDate(receipt.paymentDate)} · {receipt.paymentMethod}</span>
        <small>{receipt.id}</small>
      </div>
    </div>
    <strong className="receipt-row-amount">{money(receipt.amount, receipt.currency)}</strong>
    <div className="receipt-row-actions">
      <button onClick={exportPdf} title="Exportar PDF"><Icon name="download" size={16} /><span>PDF</span></button>
      <button onClick={() => void exportJpg()} title="Exportar e compartilhar JPG"><Icon name="download" size={16} /><span>JPG</span></button>
      <button onClick={() => void share()} title="Compartilhar"><Icon name="share" size={16} /></button>
      <button className="danger-action" onClick={onDelete} title="Excluir"><Icon name="trash" size={16} /></button>
    </div>
  </div>;
}

export function receiptPrintHtml(receipt: Receipt) { return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${receipt.id}</title><style>body{font-family:Arial,sans-serif;color:#2f2642;max-width:760px;margin:40px auto;padding:0 32px}header{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:28px}h1{font-size:30px}h2{margin-top:48px}.amount{font-size:40px;font-weight:800;color:#7150b2}.amount-words{font-size:15px;line-height:1.5;margin-top:8px;color:#51475f}.conversion{font-size:12px;color:#8a8291}.details{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:36px 0}.details span{display:block;color:#8a8291;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}.details strong{font-size:17px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:70px;margin-top:90px}.signatures div{border-top:1px solid #bdb6c8;padding-top:10px;text-align:center;color:#62596e}.signatures img{width:100%;height:80px;object-fit:contain;display:block;margin-bottom:-4px}.footer{margin-top:70px;color:#8a8291;font-size:12px}</style></head><body><header><div><h1>${receipt.businessName || 'PJ OWL'}</h1><p>${receipt.providerName || ''} · ${receipt.providerDocument || ''}</p></div><strong>${receipt.id}</strong></header><h2>Recibo de pagamento</h2><p>Recebi de <strong>${receipt.clientName}</strong> a importância de:</p><div class="amount">${money(receipt.amount, receipt.currency)}</div><p class="amount-words">(${amountToWords(receipt.amount, receipt.currency)})</p>${receipt.originalCurrency === 'USD' && receipt.originalAmount !== undefined ? `<p class="conversion">Valor informado: ${money(receipt.originalAmount, 'USD')} (${amountToWords(receipt.originalAmount, 'USD')}) · cotação utilizada: ${receipt.exchangeRate?.toFixed(4) ?? 'não registrada'} BRL/USD (${receipt.exchangeRateDate ? formatExchangeRateDate(receipt.exchangeRateDate) : 'data não registrada'})</p>` : ''}<div class="details"><div><span>Referente a</span><strong>${receipt.description || 'Serviço ou produto'}</strong></div><div><span>Forma de pagamento</span><strong>${receipt.paymentMethod}</strong></div><div><span>Data</span><strong>${longDate(receipt.paymentDate)}</strong></div><div><span>Cliente</span><strong>${receipt.clientDocument || 'Documento não informado'}</strong></div></div>${receipt.notes ? `<p><strong>Observações:</strong> ${receipt.notes}</p>` : ''}<div class="signatures"><div><img src="${receipt.providerSignature}" alt=""><span>Prestador: ${receipt.providerName || '—'}</span></div><div><img src="${receipt.clientSignature}" alt=""><span>Cliente: ${receipt.clientName}</span></div></div><p class="footer">Documento gerado pelo PJ OWL em ${new Date(receipt.finalizedAt).toLocaleString('pt-BR')}. A assinatura desenhada é eletrônica simples.</p></body></html>`; }

