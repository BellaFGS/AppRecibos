import React, { useState } from 'react';
import type { Expense } from '../../domain/models';
import { money, parseMoney, shortDate, today, uid } from '../../domain/utils';
import { Button, EmptyState, Field, Icon } from '../../shared/components/ui';
import { formatCentsForInput, formatMoneyInput } from '../../shared/validation/numeric';
import { PageTitle } from '../../shared/layout/AppLayout';

type Props = {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setDeleteTarget: (target: { type: 'expense'; id: string }) => void;
  notify: (message: string) => void;
};

export function Expenses({ expenses, setExpenses, setDeleteTarget, notify }: Props) {
  const emptyForm = () => ({ description: '', category: 'Materiais', amount: '', date: today(), notes: '' });
  const [expenseForm, setExpenseForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addExpense = (event: React.FormEvent) => {
    event.preventDefault();
    if (!expenseForm.description.trim() || parseMoney(expenseForm.amount) <= 0) {
      notify('Preencha descrição e valor da despesa.');
      return;
    }
    if (editingId) {
      setExpenses((current) => current.map((item) => item.id === editingId
        ? { ...item, ...expenseForm, amount: parseMoney(expenseForm.amount) }
        : item));
      notify('Despesa atualizada com sucesso.');
    } else {
      setExpenses((current) => [{ id: uid('expense'), ...expenseForm, amount: parseMoney(expenseForm.amount) }, ...current]);
      notify('Despesa registrada com sucesso.');
    }
    setExpenseForm(emptyForm());
    setEditingId(null);
  };

  return (
    <div className="page">
      <PageTitle eyebrow="Controle financeiro" title="Despesas" description="Registre os gastos do seu negócio e acompanhe para onde o dinheiro está indo." />
      <section className="agenda-layout">
        <div className="card form-card">
          <div className="card-heading">
            <div><span className="section-kicker">{editingId ? 'Editar despesa' : 'Nova despesa'}</span><h2>Registre o que saiu</h2></div>
            <span className="heading-icon coral-bg"><Icon name="wallet" /></span>
          </div>
          <form onSubmit={addExpense} className="stack-form">
            <Field label="Descrição"><input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex.: compra de embalagens" /></Field>
            <div className="two-fields">
              <Field label="Categoria"><select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}><option>Materiais</option><option>Transporte</option><option>Ferramentas</option><option>Divulgação</option><option>Outros</option></select></Field>
              <Field label="Valor"><div className="money-input"><span>R$</span><input value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: formatMoneyInput(e.target.value) })} placeholder="0,00" inputMode="decimal" /></div></Field>
            </div>
            <Field label="Data"><input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /></Field>
            <Field label="Observações (opcional)"><textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Algum detalhe para lembrar?" /></Field>
            <div className="expense-form-actions">
              <Button type="submit" icon="check">{editingId ? 'Salvar alterações' : 'Registrar despesa'}</Button>
              {editingId && <Button type="button" variant="ghost" onClick={() => { setExpenseForm(emptyForm()); setEditingId(null); }}>Cancelar edição</Button>}
            </div>
          </form>
        </div>
        <div className="card list-card">
          <div className="card-heading"><div><span className="section-kicker">Histórico de saídas</span><h2>Despesas registradas</h2></div><span className="soft-count">{expenses.length}</span></div>
          {expenses.length ? <div className="expense-list">{expenses.map((item) => (
            <div className="expense-item" key={item.id}>
              <span className="expense-icon"><Icon name="wallet" size={17} /></span>
              <div><strong>{item.description}</strong><span>{item.category} · {shortDate(item.date)}</span></div>
              <strong className="expense-amount">{money(item.amount)}</strong>
              <button className="mini-action" type="button" aria-label={`Editar ${item.description}`} onClick={() => { setEditingId(item.id); setExpenseForm({ description: item.description, category: item.category, amount: formatCentsForInput(item.amount), date: item.date, notes: item.notes || '' }); document.querySelector<HTMLInputElement>('input[placeholder^="Ex."]')?.focus(); }}><Icon name="edit" size={15} /></button>
              <button className="mini-delete" type="button" aria-label={`Excluir ${item.description}`} onClick={() => setDeleteTarget({ type: 'expense', id: item.id })}><Icon name="trash" size={15} /></button>
            </div>
          ))}</div> : <EmptyState title="Nenhuma despesa registrada" text="Anote os gastos reais para enxergar seu resultado líquido." action="Registrar despesa" onAction={() => document.querySelector<HTMLInputElement>('input[placeholder^="Ex."]')?.focus()} mood="thinking" />}
        </div>
      </section>
    </div>
  );
}
