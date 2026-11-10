import type { Appointment, BusinessProfile, Composition, CostItem, Currency, Expense, IconName, PaymentMethod, Receipt, Section, Unit } from './models';
import { parseMoneyToCents } from '../shared/validation/numeric';

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const today = () => new Date().toISOString().slice(0, 10);

export const defaultProfile: BusinessProfile = { ownerName: '', businessName: '', startDate: '', document: '', logo: '', signature: '' };

export const defaultReceiptForm = { clientName: '', clientDocument: '', description: '', amount: '', currency: 'BRL' as Currency, paymentMethod: 'Pix' as PaymentMethod, installment: '', notes: '', paymentDate: today() };

export const units: Unit[] = ['mm', 'cm', 'm', 'g', 'kg', 'ml', 'L', 'un'];

export const navItems: { id: Section; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Início', icon: 'home' },
  { id: 'costs', label: 'Custos', icon: 'calculator' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'history', label: 'Histórico', icon: 'history' },
  { id: 'expenses', label: 'Despesas', icon: 'wallet' },
  { id: 'receipt', label: 'Novo recibo', icon: 'receipt' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
];

export function parseMoney(value: string) {
  return parseMoneyToCents(value);
}

export function money(cents: number, currency: Currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format((cents || 0) / 100);
}

export function shortDate(value: string) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '');
}

export function longDate(value: string) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function initials(name: string) { return name ? name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'RF'; }

export function unitGroup(unit: Unit) { return ['mm', 'cm', 'm'].includes(unit) ? 'length' : ['g', 'kg'].includes(unit) ? 'weight' : ['ml', 'L'].includes(unit) ? 'volume' : 'count'; }

export function toBase(quantity: number, unit: Unit) {
  const factors: Record<Unit, number> = { mm: 0.001, cm: 0.01, m: 1, g: 1, kg: 1000, ml: 1, L: 1000, un: 1 };
  return quantity * factors[unit];
}

export function compatible(a: Unit, b: Unit) { return unitGroup(a) === unitGroup(b); }

export function proportionalCost(item: CostItem) {
  if (!item.referenceQuantity || !item.usedQuantity || !compatible(item.usedUnit, item.referenceUnit)) return 0;
  return Math.round(item.referencePrice * (toBase(item.usedQuantity, item.usedUnit) / toBase(item.referenceQuantity, item.referenceUnit)));
}


export function periodStart(period: 'week' | 'month' | 'year') {
  const date = new Date();
  if (period === 'week') date.setDate(date.getDate() - 6);
  if (period === 'month') date.setDate(1);
  if (period === 'year') date.setMonth(0, 1);
  return date.toISOString().slice(0, 10);
}
