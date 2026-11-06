import React, { useEffect, useState } from 'react';
import type { BusinessProfile, Currency, PaymentMethod, Receipt, Section } from '../../domain/models';
import { amountToWords } from '../../domain/moneyWords';
import { defaultReceiptForm, longDate, money, parseMoney, today } from '../../domain/utils';
import { Button, Field, Mascot, SignaturePad } from '../../shared/components/ui';
import { PageTitle } from '../../shared/layout/AppLayout';
import { convertUsdCentsToBrlCents, fetchUsdBrlRate, formatExchangeRateDate, getCachedExchangeRate, type ExchangeRate } from './exchangeRate';

export function ReceiptCreator({ profile, setReceipts, navigate, notify }: { profile: BusinessProfile; setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>; navigate: (section: Section) => void; notify: (message: string) => void }) {
  const [form, setForm] = useState(defaultReceiptForm);
  const [providerSignature, setProviderSignature] = useState(profile.signature);
  const [clientSignature, setClientSignature] = useState('');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(getCachedExchangeRate());
  const [rateLoading, setRateLoading] = useState(false);
  const [rateStale, setRateStale] = useState(false);
  const [rateError, setRateError] = useState('');

  useEffect(() => { setProviderSignature(profile.signature); }, [profile.signature]);
  useEffect(() => {
    if (form.currency !== 'USD') return;
    let active = true;
    setRateLoading(true);
    if (exchangeRate) setRateStale(true);
    setRateError('');
    fetchUsdBrlRate().then(({ rate, stale }) => {
      if (!active) return;
      setExchangeRate(rate);
      setRateStale(stale);
    }).catch((error: unknown) => {
      if (!active) return;
      setRateError(error instanceof Error ? error.message : 'Cotação do dólar indisponível.');
    }).finally(() => { if (active) setRateLoading(false); });
    return () => { active = false; };
  }, [form.currency]);

  const update = <K extends keyof typeof defaultReceiptForm>(key: K, value: typeof defaultReceiptForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const enteredAmount = parseMoney(form.amount);
  const convertedAmount = form.currency === 'USD' ? (exchangeRate ? convertUsdCentsToBrlCents(enteredAmount, exchangeRate.rate) : null) : enteredAmount;
  const previewWords = convertedAmount === null ? 'Aguardando cotação do dólar.' : amountToWords(convertedAmount, 'BRL');

  const finalize = () => {
    if (!form.clientName || enteredAmount <= 0 || !form.paymentDate) { notify('Preencha cliente, valor e data de pagamento.'); return; }
    if (!providerSignature || !clientSignature) { notify('As duas assinaturas são necessárias para finalizar.'); return; }
    if (form.currency === 'USD' && !exchangeRate) { notify('Não foi possível obter a cotação do dólar. Conecte-se à internet e tente novamente.'); return; }
    const receipt: Receipt = {
      id: `RF-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      clientName: form.clientName, clientDocument: form.clientDocument,
      providerName: profile.ownerName, providerDocument: profile.document, businessName: profile.businessName,
      description: form.description, amount: convertedAmount ?? 0, currency: 'BRL',
      ...(form.currency === 'USD' && exchangeRate ? { originalCurrency: 'USD' as const, originalAmount: enteredAmount, exchangeRate: exchangeRate.rate, exchangeRateDate: exchangeRate.quotedAt } : {}),
      paymentMethod: form.paymentMethod, installment: form.installment, notes: form.notes,
      paymentDate: form.paymentDate, providerSignature, clientSignature,
      finalizedAt: new Date().toISOString(), status: 'FINALIZADO',
    };
    setReceipts((current) => [receipt, ...current]);
    notify('Recibo finalizado e protegido no histórico.');
    navigate('history');
  };

  return <div className="page">
    <PageTitle eyebrow="Documento profissional" title="Criar novo recibo" description="Preencha os dados, colha as duas assinaturas e finalize com tranquilidade." />
    <div className="receipt-layout">
      <div className="receipt-form-column">
        <div className="card form-card">
          <div className="card-heading"><div><span className="section-kicker">Dados do pagamento</span><h2>Quem pagou e pelo quê?</h2></div><span className="step-chip">1 de 2</span></div>
          <div className="stack-form">
            <div className="two-fields">
              <Field label="Nome do cliente"><input value={form.clientName} onChange={(e) => update('clientName', e.target.value)} placeholder="Nome completo" /></Field>
              <Field label="CPF/CNPJ do cliente"><input value={form.clientDocument} onChange={(e) => update('clientDocument', e.target.value)} placeholder="Opcional" /></Field>
            </div>
            <Field label="Descrição do serviço ou produto"><input value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Ex.: 20 lembrancinhas personalizadas" /></Field>
            <div className="three-fields">
              <Field label="Valor informado"><div className="money-input"><span>{form.currency === 'BRL' ? 'R$' : 'US$'}</span><input value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0,00" inputMode="decimal" /></div></Field>
              <Field label="Moeda de entrada"><select value={form.currency} onChange={(e) => update('currency', e.target.value as Currency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option></select></Field>
              <Field label="Data de pagamento"><input type="date" value={form.paymentDate} onChange={(e) => update('paymentDate', e.target.value)} /></Field>
            </div>
            {form.currency === 'USD' && <div className="exchange-rate-note" role="status">
              {rateLoading && <span>Consultando cotação do dólar...</span>}
              {!rateLoading && exchangeRate && <><strong>Conversão estimada: {money(convertedAmount, 'BRL')}</strong><span>US$ 1,00 = {money(Math.round(exchangeRate.rate * 100), 'BRL')} · cotação de {formatExchangeRateDate(exchangeRate.quotedAt)}</span>{rateStale && <span className="warning-text">Sem conexão com a API. Usando a última cotação salva.</span>}</>}
              {rateError && !exchangeRate && <span className="warning-text">{rateError}</span>}
              <button type="button" onClick={() => { setForm((current) => ({ ...current })); setRateLoading(true); fetchUsdBrlRate().then(({ rate, stale }) => { setExchangeRate(rate); setRateStale(stale); setRateError(''); }).catch((error: unknown) => setRateError(error instanceof Error ? error.message : 'Falha ao atualizar cotação.')).finally(() => setRateLoading(false)); }}>Atualizar cotação</button>
            </div>}
            <div className="two-fields">
              <Field label="Método de pagamento"><select value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value as PaymentMethod)}>{['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito', 'Transferência bancária', 'Outro'].map((method) => <option key={method}>{method}</option>)}</select></Field>
              <Field label="Parcelamento (opcional)"><input value={form.installment} onChange={(e) => update('installment', e.target.value)} placeholder="Ex.: 1ª de 3" /></Field>
            </div>
            <Field label="Observações (opcional)"><textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Uma observação para acompanhar o documento" /></Field>
          </div>
        </div>
        <div className="card signature-card">
          <div className="card-heading"><div><span className="section-kicker">Assinaturas</span><h2>Confirme as duas partes</h2></div><span className="step-chip">2 de 2</span></div>
          <p className="muted">A assinatura desenhada aqui é eletrônica simples. Ela não equivale automaticamente a uma assinatura qualificada ICP-Brasil.</p>
          <div className="signature-grid"><SignaturePad label="Assinatura do prestador" value={providerSignature} onChange={setProviderSignature} /><SignaturePad label="Assinatura do cliente" value={clientSignature} onChange={setClientSignature} /></div>
          <Button onClick={finalize} icon="lock">Finalizar recibo</Button>
        </div>
      </div>
      <ReceiptPreview profile={profile} form={form} providerSignature={providerSignature} clientSignature={clientSignature} amountInBrl={convertedAmount} amountWords={previewWords} originalAmount={form.currency === 'USD' ? enteredAmount : undefined} exchangeRate={form.currency === 'USD' ? exchangeRate : null} />
    </div>
  </div>;
}

export function ReceiptPreview({ profile, form, providerSignature, clientSignature, amountInBrl, amountWords, originalAmount, exchangeRate }: { profile: BusinessProfile; form: typeof defaultReceiptForm; providerSignature: string; clientSignature: string; amountInBrl: number | null; amountWords: string; originalAmount?: number; exchangeRate: ExchangeRate | null }) {
  return <aside className="receipt-preview-wrap"><div className="preview-label"><span>Prévia do documento</span><span className="preview-live"><i /> ao vivo</span></div><div className="receipt-paper">
    <div className="paper-top"><div className="paper-brand"><div className="paper-logo">{profile.logo ? <img src={profile.logo} alt="Logo" /> : <Mascot size="small" />}</div><div><strong>{profile.businessName || 'Seu negócio'}</strong><span>{profile.ownerName || 'Nome do prestador'}</span></div></div><span className="paper-id">RASCUNHO</span></div>
    <div className="paper-divider" /><h3>Recibo de pagamento</h3><p className="paper-intro">Recebi de <strong>{form.clientName || 'Nome do cliente'}</strong> a importância de:</p>
    <strong className="paper-amount">{amountInBrl === null ? 'Cotação pendente' : money(amountInBrl, 'BRL')}</strong>
    {originalAmount !== undefined && <p className="paper-conversion">Valor informado: {money(originalAmount, 'USD')} ({amountToWords(originalAmount, 'USD')}){exchangeRate ? ` · cotação: ${exchangeRate.rate.toFixed(4)} BRL/USD` : ''}</p>}
    <p className="paper-amount-words">{amountInBrl === null ? amountWords : `(${amountWords})`}</p>
    <div className="paper-details"><div><span>Referente a</span><strong>{form.description || 'Serviço ou produto'}</strong></div><div><span>Forma de pagamento</span><strong>{form.paymentMethod}</strong></div><div><span>Data</span><strong>{longDate(form.paymentDate)}</strong></div></div>
    {form.notes && <div className="paper-note">{form.notes}</div>}
    <div className="paper-signatures"><div>{providerSignature ? <img src={providerSignature} alt="Assinatura do prestador" /> : <div className="signature-placeholder">Assinatura</div>}<span>{profile.ownerName || 'Prestador'}</span></div><div>{clientSignature ? <img src={clientSignature} alt="Assinatura do cliente" /> : <div className="signature-placeholder">Assinatura</div>}<span>{form.clientName || 'Cliente'}</span></div></div>
    <div className="paper-footer">Documento gerado pelo PJ OWL · assinatura eletrônica simples</div>
  </div></aside>;
}
