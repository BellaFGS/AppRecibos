export type Section = 'dashboard' | 'costs' | 'agenda' | 'receipt' | 'history' | 'profile';

export type Currency = 'BRL' | 'USD';

export type Unit = 'mm' | 'cm' | 'm' | 'g' | 'kg' | 'ml' | 'L' | 'un';

export type PricingMode = 'markup' | 'margin';

export type PaymentMethod = 'Dinheiro' | 'Pix' | 'Cartão de crédito' | 'Cartão de débito' | 'Transferência bancária' | 'Outro';

export interface BusinessProfile {
  ownerName: string;
  businessName: string;
  startDate: string;
  document: string;
  logo: string;
  signature: string;
}

export interface CostItem {
  id: string;
  name: string;
  usedQuantity: number;
  usedUnit: Unit;
  referenceQuantity: number;
  referenceUnit: Unit;
  referencePrice: number;
}

export interface Composition {
  id: string;
  name: string;
  items: CostItem[];
  createdAt: string;
  billingMode?: 'materials' | 'time';
  timeName?: string;
  timeUnit?: string;
  timeQuantity?: number;
  timePrice?: number;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  description: string;
  address: string;
  reminder: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
}

export interface Receipt {
  id: string;
  clientName: string;
  clientDocument: string;
  providerName: string;
  providerDocument: string;
  businessName: string;
  description: string;
  amount: number;
  currency: Currency;
  /** Valor digitado originalmente, quando houve conversão cambial. */
  originalCurrency?: Currency;
  originalAmount?: number;
  exchangeRate?: number;
  exchangeRateDate?: string;
  paymentMethod: PaymentMethod;
  installment: string;
  notes: string;
  paymentDate: string;
  providerSignature: string;
  clientSignature: string;
  finalizedAt: string;
  status: 'FINALIZADO';
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export type IconName = 'home' | 'calculator' | 'calendar' | 'receipt' | 'history' | 'user' | 'plus' | 'arrow' | 'trend' | 'wallet' | 'clock' | 'check' | 'trash' | 'edit' | 'download' | 'share' | 'search' | 'info' | 'dollar' | 'spark' | 'menu' | 'close' | 'chevron' | 'upload' | 'signature' | 'target' | 'bell' | 'package' | 'copy' | 'filter' | 'back' | 'more' | 'lock';
