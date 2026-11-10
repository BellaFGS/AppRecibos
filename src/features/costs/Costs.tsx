import React, { useMemo, useState } from 'react';
import type {
  CalculationRecord,
  CalculatorResource,
  Currency,
  ResourceKind,
  Unit,
} from '../../domain/models';
import { calculatePricing } from '../../domain/financial';
import { calculateResourceCostCents } from '../../domain/calculator';
import { money, uid } from '../../domain/utils';
import { Button, Field, Icon } from '../../shared/components/ui';
import { Modal } from '../../shared/components/Modal';
import {
  formatCentsForInput,
  formatMoneyInput,
  parseMoneyToCents,
  parseDecimalInput,
  sanitizeDecimalInput,
} from '../../shared/validation/numeric';
import { PageTitle } from '../../shared/layout/AppLayout';
import {
  fetchUsdBrlRate,
  getCachedExchangeRate,
  formatExchangeRateDate,
} from '../receipts/exchangeRate';

type Props = {
  calculations: CalculationRecord[];
  setCalculations: React.Dispatch<React.SetStateAction<CalculationRecord[]>>;
  notify: (message: string) => void;
};

type ResourceCategory = 'material' | 'labor' | 'service';
type MaterialSubcategory = 'measure' | 'weight' | 'volume' | 'unit';

const materialSubcategories: {
  value: MaterialSubcategory;
  label: string;
  units: Unit[];
}[] = [
  { value: 'measure', label: 'Medida', units: ['mm', 'cm', 'm'] },
  { value: 'weight', label: 'Peso', units: ['g', 'kg'] },
  { value: 'volume', label: 'Volume', units: ['ml', 'L'] },
  { value: 'unit', label: 'Unidade', units: ['un'] },
];
type ModalState =
  | { kind: 'alert'; title: string; message: string }
  | {
      kind: 'confirm';
      title: string;
      message: string;
      confirmLabel: string;
      onConfirm: () => void;
    }
  | { kind: 'details'; record: CalculationRecord };

const categoryLabels: Record<ResourceCategory, string> = {
  material: 'Materiais e insumos',
  labor: 'Mão de obra',
  service: 'Serviços e assinaturas',
};

const subcategories: Record<ResourceCategory, { value: ResourceKind; label: string }[]> = {
  material: [],
  labor: [
    { value: 'fixed', label: 'Mão de obra fixa' },
    { value: 'hourly', label: 'Por hora' },
    { value: 'daily', label: 'Por diária' },
  ],
  service: [
    { value: 'monthly', label: 'Assinatura ou serviço mensal' },
    { value: 'weekly', label: 'Serviço semanal' },
    { value: 'annual', label: 'Serviço anual' },
    { value: 'request', label: 'Por requisição' },
  ],
};

const kindLabels: Record<ResourceKind, string> = {
  material: 'Material / insumo',
  fixed: 'Mão de obra fixa',
  hourly: 'Mão de obra por hora',
  daily: 'Mão de obra por diária',
  monthly: 'Assinatura ou serviço mensal',
  weekly: 'Serviço semanal',
  annual: 'Serviço anual',
  request: 'Por requisição',
  project: 'Projeto (registro antigo)',
};

const parseQty = (value: string) => Math.max(0, parseDecimalInput(value));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function categoryForKind(kind: ResourceKind): ResourceCategory {
  if (kind === 'material') return 'material';
  if (kind === 'fixed' || kind === 'hourly' || kind === 'daily') return 'labor';
  return 'service';
}

function materialSubcategoryForUnit(unit: Unit): MaterialSubcategory {
  if (['mm', 'cm', 'm'].includes(unit)) return 'measure';
  if (['g', 'kg'].includes(unit)) return 'weight';
  if (['ml', 'L'].includes(unit)) return 'volume';
  return 'unit';
}

function unitForKind(kind: ResourceKind, materialUnit: Unit): CalculatorResource['unit'] {
  if (kind === 'material') return materialUnit;
  if (kind === 'hourly') return 'hora';
  if (kind === 'daily') return 'diaria';
  if (kind === 'monthly') return 'mensal';
  if (kind === 'weekly') return 'semanal';
  if (kind === 'annual') return 'anual';
  if (kind === 'request' || kind === 'project') return 'requisição';
  return 'un';
}

function normalizeResource(resource: CalculatorResource): CalculatorResource {
  if (resource.kind !== 'project') return resource;
  return {
    ...resource,
    kind: 'request',
    unit: 'requisição',
    referenceUnit: 'requisição',
  };
}

function formattedDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

export function Costs({
  calculations,
  setCalculations,
  notify,
}: Props) {
  const [resources, setResources] = useState<CalculatorResource[]>([]);
  const [resourceName, setResourceName] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('material');
  const [kind, setKind] = useState<ResourceKind>('material');
  const [quantity, setQuantity] = useState('1');
  const [materialSubcategory, setMaterialSubcategory] = useState<MaterialSubcategory>('unit');
  const [unit, setUnit] = useState<Unit>('un');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [rate, setRate] = useState(getCachedExchangeRate());
  const [rateStale, setRateStale] = useState(false);
  const [percentage, setPercentage] = useState('30');
  const [manualPrice, setManualPrice] = useState('');
  const [editingCalculation, setEditingCalculation] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<ModalState | null>(null);

  const showAlert = (title: string, message: string) => {
    setActiveModal({ kind: 'alert', title, message });
  };

  const askConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Confirmar',
  ) => {
    setActiveModal({ kind: 'confirm', title, message, onConfirm, confirmLabel });
  };

  const addResource = async (event: React.FormEvent) => {
    event.preventDefault();
    const q = parseQty(quantity);
    const cents = parseMoneyToCents(price);

    if (!resourceName.trim() || q <= 0 || cents <= 0) {
      showAlert('Confira os dados do recurso', 'Informe o nome, uma quantidade maior que zero e um valor válido.');
      return;
    }


    let exchangeRate: number | undefined;
    let exchangeRateDate: string | undefined;
    if (currency === 'USD') {
      try {
        const result = await fetchUsdBrlRate();
        setRate(result.rate);
        setRateStale(result.stale);
        exchangeRate = result.rate.rate;
        exchangeRateDate = result.rate.quotedAt;
      } catch {
        if (!rate) {
          showAlert(
            'Cotação indisponível',
            'Não há uma cotação salva para usar offline. Conecte-se à internet para cadastrar este valor em dólar pela primeira vez.',
          );
          return;
        }
        exchangeRate = rate.rate;
        exchangeRateDate = rate.quotedAt;
        setRateStale(true);
      }
    }

    const resourceUnit = unitForKind(kind, unit);
    const next: CalculatorResource = {
      id: uid('resource'),
      name: resourceName.trim(),
      kind,
      quantity: q,
      unit: resourceUnit,
      referenceQuantity: 1,
      referenceUnit: resourceUnit,
      unitPrice: cents,
      currency,
      exchangeRate,
      exchangeRateDate,
    };

    setResources((old) => [...old, next]);
    setResourceName('');
    setQuantity('1');
    setPrice('');
    setManualPrice('');
    notify('Recurso adicionado ao cálculo.');
  };

  const itemCost = (item: CalculatorResource) => calculateResourceCostCents(item);
  const cost = resources.reduce((sum, item) => sum + itemCost(item), 0);
  const percent = Math.max(0, parseDecimalInput(percentage));
  const pricing = calculatePricing(
    cost,
    percent,
    'markup',
    manualPrice.trim() ? parseMoneyToCents(manualPrice) : undefined,
  );

  const currencyLabel = (item: CalculatorResource) => item.currency === 'USD' ? 'US$' : 'R$';

  const editResource = (original: CalculatorResource) => {
    const item = normalizeResource(original);
    setResourceName(item.name);
    setCategory(categoryForKind(item.kind));
    setKind(item.kind);
    setQuantity(item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }));
    setUnit((item.unit as Unit) || 'un');
    if (item.kind === 'material') {
      setMaterialSubcategory(materialSubcategoryForUnit(item.unit as Unit));
    }
    setPrice(formatCentsForInput(item.unitPrice));
    setCurrency(item.currency);
    setResources((old) => old.filter((resource) => resource.id !== original.id));
    setManualPrice('');
    notify('Recurso carregado no formulário. Salve novamente para aplicar as alterações.');
  };

  const saveCalculation = () => {
    if (!resources.length) {
      showAlert('Sacola vazia', 'Adicione pelo menos um item à sacola antes de salvar o cálculo.');
      return;
    }

    const record: CalculationRecord = {
      id: editingCalculation || uid('calculation'),
      createdAt: new Date().toISOString(),
      description: resources.map((item) => item.name).slice(0, 3).join(', '),
      resources: clone(resources),
      costCents: cost,
      pricingMode: 'markup',
      percentage: percent,
      suggestedPriceCents: pricing.suggestedPrice,
      finalPriceCents: pricing.finalPrice,
      profitCents: pricing.profit,
      actualMargin: pricing.actualMargin,
    };

    setCalculations((old) => editingCalculation
      ? old.map((calculation) => calculation.id === editingCalculation ? record : calculation)
      : [record, ...old]);
    setEditingCalculation(null);
    notify(editingCalculation ? 'Cálculo atualizado no histórico.' : 'Cálculo salvo no histórico.');
  };

  const loadCalculation = (record: CalculationRecord, edit = false) => {
    setResources(clone(record.resources.map(normalizeResource)));
    setPercentage(String(record.percentage));
    setManualPrice(formatCentsForInput(record.finalPriceCents));
    setEditingCalculation(edit ? record.id : null);
    notify(edit ? 'Cálculo carregado para edição.' : 'Cálculo carregado como nova simulação.');
  };

  const removeSelected = () => {
    if (!selectedHistory.length) return;
    askConfirmation(
      'Excluir cálculos selecionados?',
      `Você está prestes a excluir ${selectedHistory.length} cálculo(s) do histórico. Essa ação não poderá ser desfeita.`,
      () => {
        setCalculations((old) => old.filter((calculation) => !selectedHistory.includes(calculation.id)));
        setSelectedHistory([]);
        notify('Registros selecionados excluídos.');
      },
      'Excluir cálculos',
    );
  };

  const clearHistory = () => {
    if (!calculations.length) return;
    askConfirmation(
      'Limpar histórico de cálculos?',
      'Todos os cálculos salvos serão removidos. Perfil, recibos, despesas e agenda serão preservados.',
      () => {
        setCalculations([]);
        setSelectedHistory([]);
        notify('Histórico de cálculos limpo.');
      },
      'Limpar histórico',
    );
  };

  const detailRecord = activeModal?.kind === 'details' ? activeModal.record : null;
  const detailItems = useMemo(
    () => detailRecord?.resources.map(normalizeResource) ?? [],
    [detailRecord],
  );

  return (
    <div className="page">
      <PageTitle
        eyebrow="Formação de preço"
        title="Calculadora de custos"
        description="Combine materiais, mão de obra e serviços digitais em um único cálculo."
      />

      <div className="cost-layout">
        <div className="cost-main">
          <section className="card calculator-card">
            <div className="card-heading">
              <div>
                <span className="section-kicker">1. Adicione recursos</span>
                <h2>Adicione os recursos necessários</h2>
              </div>
              <span className="soft-count">{resources.length} itens</span>
            </div>

            <form className="cost-form" onSubmit={addResource}>
              <Field label="Nome do recurso">
                <input
                  value={resourceName}
                  onChange={(event) => setResourceName(event.target.value)}
                  placeholder="Ex.: papel..."
                  required
                />
              </Field>

              <Field label="Modalidade">
                <select
                  value={category}
                  onChange={(event) => {
                    const nextCategory = event.target.value as ResourceCategory;
                    setCategory(nextCategory);
                    setKind(nextCategory === 'material' ? 'material' : subcategories[nextCategory][0].value);
                  }}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </Field>

              {category === 'material' ? (
                <>
                  <Field label="Subcategoria">
                    <select
                      value={materialSubcategory}
                      onChange={(event) => {
                        const nextSubcategory = event.target.value as MaterialSubcategory;
                        const selected = materialSubcategories.find(
                          (option) => option.value === nextSubcategory
                        );

                        setMaterialSubcategory(nextSubcategory);

                        if (selected) {
                          setUnit(selected.units[0]);
                        }
                      }}
                    >
                      {materialSubcategories.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tipo de unidade">
                    <select
                      value={unit}
                      onChange={(event) => setUnit(event.target.value as Unit)}
                    >
                      {materialSubcategories
                        .find((option) => option.value === materialSubcategory)!
                        .units.map((value) => (
                          <option value={value} key={value}>
                            {value}
                          </option>
                        ))}
                    </select>
                  </Field>
                </>
              ) : (
                <Field label="Subcategoria">
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value as ResourceKind)}
                  >
                    {subcategories[category].map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field
                label={kind === 'hourly' ? 'Horas de trabalho' : 'Quantidade utilizada'}
                
              >
                <input
                  type="text"
                  value={quantity}
                  onChange={(event) => setQuantity(sanitizeDecimalInput(event.target.value, 3))}
                  inputMode="decimal"
                  placeholder="0,00"
                />
              </Field>



              <Field label="Moeda">
                <select value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
                  <option value="BRL">Real (BRL)</option>
                  <option value="USD">Dólar (USD)</option>
                </select>
              </Field>

              <Field
                label="Preço"
                hint={kind === 'material' ? `Informe o preço por ${unit}. O custo será calculado pela quantidade informada.` : 'Informe o valor por período ou unidade de cobrança.'}
              >
                <div className="money-input">
                  <span>{currency === 'USD' ? 'US$' : 'R$'}</span>
                  <input
                    value={price}
                    onChange={(event) => setPrice(formatMoneyInput(event.target.value))}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
              </Field>

              <Button type="submit" icon="plus">Adicionar recurso</Button>
            </form>

            {currency === 'USD' && (
              <p className="field-hint">
                A conversão será registrada usando a cotação disponível.{' '}
                {rate && `Cotação em cache: R$ ${rate.rate.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} (${rateStale ? 'offline/cache' : formatExchangeRateDate(rate.quotedAt)}).`}
              </p>
            )}

            {resources.length > 0 ? (
              <>
                <div className="material-bag-heading">
                  <div>
                    <span className="section-kicker">Sacola de materiais</span>
                    <h3>Itens deste cálculo</h3>
                  </div>
                  <span className="soft-count">{resources.length} {resources.length === 1 ? 'item' : 'itens'}</span>
                </div>
                <div className="items-list">
                  {resources.map((item) => (
                    <article className="cost-item" key={item.id}>
                      <span className="cost-item-icon">
                        <Icon name={item.kind === 'material' ? 'package' : 'clock'} size={17} />
                      </span>
                      <div className="resource-detail">
                        <strong>{item.name}</strong>
                        <span>
                          {item.kind === 'material'
                            ? `${materialSubcategories.find((option) => option.units.includes(item.unit as Unit))?.label ?? 'Material'} · ${item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ${item.unit}`
                            : `${kindLabels[item.kind]} · ${item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ${item.unit}`}
                          {' · '}{currencyLabel(item)} {money(item.unitPrice, item.currency)}
                        </span>
                        <small>
                          Custo calculado em BRL: <b>{money(itemCost(item))}</b>
                          {item.currency === 'USD' && item.exchangeRate ? ` · câmbio R$ ${item.exchangeRate.toFixed(4)}` : ''}
                        </small>
                      </div>
                      <strong className="item-total">{money(itemCost(item))}</strong>
                      <button className="mini-delete" type="button" aria-label={`Editar ${item.name}`} onClick={() => editResource(item)}>
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        className="mini-delete"
                        type="button"
                        aria-label={`Excluir ${item.name}`}
                        onClick={() => setResources((old) => old.filter((resource) => resource.id !== item.id))}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="material-bag-empty">
                <Icon name="package" size={24} />
                <strong>Sua sacola está vazia</strong>
                <p>Adicione materiais, insumos ou outros recursos para montar o cálculo.</p>
              </div>
            )}
          </section>

          <section className="card saved-card">
            <div className="card-heading">
              <div><span className="section-kicker">Histórico independente</span><h2>Cálculos salvos</h2></div>
              <div className="saved-actions">
                <Button variant="ghost" onClick={clearHistory} disabled={!calculations.length}>Limpar tudo</Button>
                <Button variant="danger" onClick={removeSelected} disabled={!selectedHistory.length}>Excluir selecionados</Button>
              </div>
            </div>
            {calculations.length ? calculations.map((record) => (
              <div className="saved-item calculation-saved-item" key={record.id}>
                <input
                  type="checkbox"
                  aria-label={`Selecionar ${record.description}`}
                  checked={selectedHistory.includes(record.id)}
                  onChange={(event) => setSelectedHistory((old) => event.target.checked
                    ? [...old, record.id]
                    : old.filter((id) => id !== record.id))}
                />
                <span>
                  <strong>{record.description}</strong>
                  <small>
                    {formattedDate(record.createdAt)} · custo {money(record.costCents)} · preço {money(record.finalPriceCents)} · lucro {money(record.profitCents)}
                  </small>
                </span>
                <div className="saved-actions">
                  <button type="button" onClick={() => setActiveModal({ kind: 'details', record })} title="Ver resumo completo" aria-label={`Ver resumo de ${record.description}`}>
                    <Icon name="info" />
                  </button>
                  <button type="button" onClick={() => loadCalculation(record)} title="Reutilizar" aria-label={`Reutilizar ${record.description}`}>
                    <Icon name="copy" />
                  </button>
                  <button type="button" onClick={() => loadCalculation(record, true)} title="Editar" aria-label={`Editar ${record.description}`}>
                    <Icon name="edit" />
                  </button>
                  <button
                    type="button"
                    onClick={() => askConfirmation(
                      'Excluir cálculo?',
                      `O cálculo “${record.description}” será removido permanentemente do histórico.`,
                      () => setCalculations((old) => old.filter((item) => item.id !== record.id)),
                      'Excluir cálculo',
                    )}
                    title="Excluir"
                    aria-label={`Excluir ${record.description}`}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            )) : (
              <p className="muted">Nenhum cálculo salvo. Use “Salvar cálculo no histórico” no resumo.</p>
            )}
          </section>
        </div>

        <aside className="cost-summary">
          <div className="card summary-card">
            <div className="summary-orb"><Icon name="calculator" size={24} /></div>
            <span className="section-kicker">Resumo financeiro</span>
            <h2>Seu custo completo</h2>
            <div className="summary-total">
              <span>Custo original</span>
              <strong>{money(cost)}</strong>
            </div>

            <Field label="Acréscimo sobre o custo">
              <div className="percent-input">
                <input
                  value={percentage}
                  onChange={(event) => {
                    setPercentage(event.target.value);
                    setManualPrice('');
                  }}
                  inputMode="decimal"
                />
                <span>%</span>
              </div>
            </Field>

            <div className="suggested-price">
              <span>Preço sugerido</span>
              <strong>{money(pricing.suggestedPrice)}</strong>
            </div>

            <Field label="Preço final aplicado (editável)">
              <div className="money-input">
                <span>R$</span>
                <input
                  value={manualPrice || formatCentsForInput(pricing.suggestedPrice)}
                  onChange={(event) => setManualPrice(formatMoneyInput(event.target.value))}
                  inputMode="decimal"
                />
              </div>
            </Field>

            <div className="profit-row">
              <span>{pricing.profit >= 0 ? 'Lucro acrescentado' : 'Prejuízo'}</span>
              <strong className={pricing.profit < 0 ? 'negative-value' : ''}>{money(pricing.profit)}</strong>
            </div>
            <div className="profit-row">
              <span>Margem efetiva sobre a venda</span>
              <strong>{formatPercent(pricing.actualMargin)}</strong>
            </div>

            {percent > 150 && (
              <div className="hint-box warning-box">Atenção: o acréscimo está acima de 150% sobre o custo.</div>
            )}
            {pricing.profit < 0 && (
              <div className="hint-box warning-box">O preço final está abaixo do custo. Você terá prejuízo.</div>
            )}

            <Button onClick={saveCalculation} disabled={!resources.length} icon="check">
              {editingCalculation ? 'Atualizar cálculo no histórico' : 'Salvar cálculo no histórico'}
            </Button>
          </div>

          <div className="card formula-card">
            <div className="formula-icon"><Icon name="spark" /></div>
            <div>
              <strong>Júlio explica</strong>
              <p>O acréscimo é aplicado diretamente sobre o custo. O histórico guarda os recursos, quantidades, valores e cotação usados nesta simulação.</p>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={activeModal !== null}
        onOpenChange={(open) => { if (!open) setActiveModal(null); }}
        title={activeModal?.kind === 'details'
          ? `Resumo: ${activeModal.record.description}`
          : activeModal?.title ?? ''}
        description={activeModal?.kind === 'details'
          ? `Salvo em ${formattedDate(activeModal.record.createdAt)}. Confira os recursos e os valores registrados.`
          : activeModal?.kind === 'confirm'
            ? 'Confirme se deseja continuar.'
            : undefined}
        size={activeModal?.kind === 'details' ? 'wide' : 'regular'}
        footer={activeModal?.kind === 'confirm' ? (
          <>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                const action = activeModal.onConfirm;
                setActiveModal(null);
                action();
              }}
            >
              {activeModal.confirmLabel}
            </Button>
          </>
        ) : activeModal?.kind === 'alert' ? (
          <Button onClick={() => setActiveModal(null)}>Entendi</Button>
        ) : activeModal?.kind === 'details' ? (
          <Button variant="ghost" onClick={() => setActiveModal(null)}>Fechar resumo</Button>
        ) : undefined}
      >
        {activeModal?.kind === 'alert' && <p className="app-modal-message">{activeModal.message}</p>}
        {activeModal?.kind === 'confirm' && <p className="app-modal-message">{activeModal.message}</p>}
        {activeModal?.kind === 'details' && (
          <div className="calculation-detail">
            <div className="calculation-detail-items">
              <div className="calculation-detail-heading">
                <h3>Itens do cálculo</h3>
                <span>{detailItems.length} {detailItems.length === 1 ? 'item' : 'itens'}</span>
              </div>
              {detailItems.map((item, index) => (
                <article className="calculation-detail-item" key={`${item.id}-${index}`}>
                  <div className="calculation-detail-item-main">
                    <strong>{item.name}</strong>
                    <span>{kindLabels[item.kind]} · {item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} {item.unit}</span>
                    <small>
                      {item.kind === 'material'
                        ? `${materialSubcategories.find((option) => option.units.includes(item.unit as Unit))?.label ?? 'Material'} · preço por ${item.unit}: ${money(item.unitPrice, item.currency)}`
                        : `Valor por período/unidade: ${money(item.unitPrice, item.currency)}`}
                    </small>
                    {item.currency === 'USD' && item.exchangeRate && (
                      <small>Cotação salva: R$ {item.exchangeRate.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} · {item.exchangeRateDate ? formatExchangeRateDate(item.exchangeRateDate) : 'data não informada'}</small>
                    )}
                  </div>
                  <strong>{money(calculateResourceCostCents(item))}</strong>
                </article>
              ))}
            </div>

            <div className="calculation-detail-totals">
              <h3>Resumo financeiro</h3>
              <div><span>Valor de custo</span><strong>{money(activeModal.record.costCents)}</strong></div>
              <div><span>{activeModal.record.pricingMode === 'margin' ? 'Margem registrada no cálculo original' : 'Acréscimo aplicado'}</span><strong>{formatPercent(activeModal.record.percentage)}</strong></div>
              <div><span>Preço sugerido</span><strong>{money(activeModal.record.suggestedPriceCents)}</strong></div>
              <div><span>Valor de lucro acrescentado</span><strong className={activeModal.record.profitCents < 0 ? 'negative-value' : ''}>{money(activeModal.record.profitCents)}</strong></div>
              <div><span>Margem efetiva</span><strong>{formatPercent(activeModal.record.actualMargin)}</strong></div>
              <div className="calculation-detail-final"><span>Valor final aplicado</span><strong>{money(activeModal.record.finalPriceCents)}</strong></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
