import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { initializeStorage } from './shared/storage/storageProvider';
import { createRepositories, loadAllRepositories, type AppRepositories } from './shared/storage/repositories';
import { createBackup, downloadBackupFile, getStorageUsageBytes, restoreBackup } from './shared/storage/backup';
import type { KeyValueStorage, Repository } from './shared/storage/types';
import { formatDocument, getOptionalDocumentError, normalizeDocument, sanitizeDocumentInput } from './shared/validation/document';
import { formatCentsForInput, formatMoneyInput, parseDecimalInput, sanitizeDecimalInput } from './shared/validation/numeric';
import { amountToWords } from './domain/moneyWords';
import { calculatePricing } from './domain/financial';
import { compatible as unitsAreCompatible, parseMoney as parseMoneyValue, proportionalCost as calculateProportionalCost } from './domain/utils';
import { filterReceipts, finalizeReceipt } from './domain/receipts';
import { convertUsdCentsToBrlCents, fetchUsdBrlRate, formatExchangeRateDate, getCachedExchangeRate, type ExchangeRate } from './features/receipts/exchangeRate';
import { Costs as UnifiedCosts } from './features/costs/Costs';
import type { CalculationRecord, Composition as DomainComposition } from './domain/models';

type Section = 'dashboard' | 'costs' | 'agenda' | 'receipt' | 'history' | 'profile';
type Currency = 'BRL' | 'USD';
type Unit = 'mm' | 'cm' | 'm' | 'g' | 'kg' | 'ml' | 'L' | 'un';
type PricingMode = 'markup' | 'margin';
type PaymentMethod = 'Dinheiro' | 'Pix' | 'Cartão de crédito' | 'Cartão de débito' | 'Transferência bancária' | 'Outro';

interface BusinessProfile {
  ownerName: string;
  businessName: string;
  startDate: string;
  document: string;
  logo: string;
  signature: string;
}
interface CostItem {
  id: string;
  name: string;
  usedQuantity: number;
  usedUnit: Unit;
  referenceQuantity: number;
  referenceUnit: Unit;
  referencePrice: number;
}
type Composition = DomainComposition;
interface Appointment {
  id: string;
  date: string;
  time: string;
  description: string;
  address: string;
  reminder: string;
}
interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
}
interface Receipt {
  id: string;
  clientName: string;
  clientDocument: string;
  providerName: string;
  providerDocument: string;
  businessName: string;
  description: string;
  amount: number;
  currency: Currency;
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
const today = () => new Date().toISOString().slice(0, 10);
const defaultProfile: BusinessProfile = { ownerName: '', businessName: '', startDate: '', document: '', logo: '', signature: '' };
const defaultReceiptForm = { clientName: '', clientDocument: '', description: '', amount: '', currency: 'BRL' as Currency, paymentMethod: 'Pix' as PaymentMethod, installment: '', notes: '', paymentDate: today() };
const units: Unit[] = ['mm', 'cm', 'm', 'g', 'kg', 'ml', 'L', 'un'];
const navItems: { id: Section; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Início', icon: 'home' },
  { id: 'costs', label: 'Custos', icon: 'calculator' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'receipt', label: 'Novo recibo', icon: 'receipt' },
  { id: 'history', label: 'Histórico', icon: 'history' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
];

function parseMoney(value: string) { return parseMoneyValue(value); }
function money(cents: number, currency: Currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format((cents || 0) / 100);
}
function shortDate(value: string) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '');
}
function longDate(value: string) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}
function initials(name: string) { return name ? name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'RF'; }
function compatible(a: Unit, b: Unit) { return unitsAreCompatible(a, b); }
function proportionalCost(item: CostItem) { return calculateProportionalCost(item); }


type IconName = 'home' | 'calculator' | 'calendar' | 'receipt' | 'history' | 'user' | 'plus' | 'arrow' | 'trend' | 'wallet' | 'clock' | 'check' | 'trash' | 'edit' | 'download' | 'share' | 'search' | 'info' | 'dollar' | 'spark' | 'menu' | 'close' | 'chevron' | 'upload' | 'signature' | 'target' | 'bell' | 'package' | 'copy' | 'filter' | 'back' | 'more' | 'lock';
function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    calculator: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h2m4 0h2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l3 2"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-3.2 3.3-5 7.5-5s6.7 1.8 7.5 5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M16 6h5v5"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6Z"/><path d="M4 6V4h14M16 13h5"/><circle cx="16" cy="13" r=".5" fill="currentColor"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
    edit: <><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z"/><path d="m13 6 4 4"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></>,
    share: <><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    dollar: <><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.8-.7-1.7-1-3-1-1.6 0-2.7.8-2.7 2 0 3.1 5.7 1.4 5.7 4.5 0 1.3-1.2 2.2-3 2.2-1.4 0-2.5-.4-3.2-1.2M12 5.5v13"/></>,
    spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></>,
    signature: <><path d="M4 17c3.2-4.2 5-8.6 7.1-8.6 2.2 0 .2 6.2 2.2 6.2 1.7 0 3.1-3.6 4.4-3.6 1.1 0 1.1 2 2.3 2"/><path d="M4 20h16"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 5-5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    package: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    filter: <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z"/></>,
    back: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Mascot({ size = 'normal', mood = 'happy' }: { size?: 'small' | 'normal' | 'large'; mood?: 'happy' | 'success' | 'empty' | 'thinking' }) {
  return <div className={`mascot mascot-${size} mascot-${mood}`} aria-label="Coruja mascote do PJ OWL">
    <img src="/assets/pj-owl-logo.png" alt="Coruja do PJ OWL" />
  </div>;
}

function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false, className = '' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'; icon?: IconName; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; className?: string }) {
  return <button type={type} disabled={disabled} className={`button button-${variant} ${className}`} onClick={onClick}>{icon && <Icon name={icon} size={17} />}{children}</button>;
}
function Field({ label, children, hint, className = '' }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return <label className={`field ${className}`}><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
function EmptyState({ title, text, action, onAction, mood = 'empty' }: { title: string; text: string; action?: string; onAction?: () => void; mood?: 'empty' | 'thinking' }) {
  return <div className="empty-state"><Mascot size="normal" mood={mood} /><div><h3>{title}</h3><p>{text}</p>{action && <Button variant="soft" icon="plus" onClick={onAction}>{action}</Button>}</div></div>;
}
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="toast"><span className="toast-icon"><Icon name="check" size={15} /></span><span>{message}</span><button onClick={onClose} aria-label="Fechar"><Icon name="close" size={15} /></button></div>;
}

function SignaturePad({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (value) { const image = new Image(); image.onload = () => context.drawImage(image, 0, 0); image.src = value; }
  }, [value]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; if (!canvas) return null; const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; const p = point(event); if (!canvas || !p) return; drawing.current = true; canvas.setPointerCapture(event.pointerId); const context = canvas.getContext('2d'); if (context) { context.beginPath(); context.moveTo(p.x, p.y); } };
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const p = point(event); const context = canvasRef.current?.getContext('2d'); if (!p || !context) return; context.lineWidth = 3; context.lineCap = 'round'; context.strokeStyle = '#3b3150'; context.lineTo(p.x, p.y); context.stroke(); };
  const stop = () => { if (!drawing.current) return; drawing.current = false; const canvas = canvasRef.current; if (canvas) onChange(canvas.toDataURL('image/png')); };
  const clear = () => { const canvas = canvasRef.current; const context = canvas?.getContext('2d'); if (canvas && context) { context.clearRect(0, 0, canvas.width, canvas.height); onChange(''); } };
  return <div className="signature-field"><div className="signature-label"><span>{label}</span><button type="button" onClick={clear}>Limpar</button></div><canvas ref={canvasRef} width={640} height={190} onPointerDown={start} onPointerMove={draw} onPointerUp={stop} onPointerLeave={stop} /><p>Desenhe com o dedo ou mouse dentro da área.</p></div>;
}

function App() {
  const [active, setActive] = useState<Section>('dashboard');
  const [profile, setProfileState] = useState<BusinessProfile>(defaultProfile);
  const [compositions, setCompositionsState] = useState<Composition[]>([]);
  const [calculations, setCalculationsState] = useState<CalculationRecord[]>([]);
  const [appointments, setAppointmentsState] = useState<Appointment[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [toast, setToast] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [storageUsage, setStorageUsage] = useState(0);
  const repositoriesRef = useRef<AppRepositories | null>(null);
  const storageRef = useRef<KeyValueStorage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'receipt' | 'appointment' | 'expense' | 'all'; id?: string } | null>(null);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3200); };
  const navigate = (section: Section) => setActive(section);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const initialized = await initializeStorage();
      const repositories = createRepositories(initialized.storage);
      const data = await loadAllRepositories(repositories);
      if (!mounted) return;
      storageRef.current = initialized.storage;
      repositoriesRef.current = repositories;
      setProfileState(data.profile as BusinessProfile);
      setCompositionsState(data.compositions as Composition[]);
      setCalculationsState((data.calculations || []) as CalculationRecord[]);
      setAppointmentsState(data.appointments as Appointment[]);
      setExpensesState(data.expenses as Expense[]);
      setReceiptsState(data.receipts as Receipt[]);
      setStorageUsage(await getStorageUsageBytes(initialized.storage));
      setStorageReady(true);
    })().catch((error: unknown) => {
      if (!mounted) return;
      setStorageError(error instanceof Error ? error.message : 'Não foi possível inicializar o armazenamento local.');
    });
    return () => { mounted = false; };
  }, []);

  const setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>> = setProfileState;
  const setCompositions: React.Dispatch<React.SetStateAction<Composition[]>> = setCompositionsState;
  const setCalculations: React.Dispatch<React.SetStateAction<CalculationRecord[]>> = setCalculationsState;
  const setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>> = setAppointmentsState;
  const setExpenses: React.Dispatch<React.SetStateAction<Expense[]>> = setExpensesState;
  const setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>> = setReceiptsState;

  useEffect(() => {
    if (!storageReady || !repositoriesRef.current) return;
    const repositories = repositoriesRef.current;
    void Promise.all([
      repositories.profile.save(profile), repositories.compositions.save(compositions), repositories.calculations.save(calculations),
      repositories.appointments.save(appointments), repositories.expenses.save(expenses),
      repositories.receipts.save(receipts),
    ]).then(async () => {
      if (storageRef.current) setStorageUsage(await getStorageUsageBytes(storageRef.current));
    }).catch(() => notify('Não foi possível gravar os dados. Verifique o espaço disponível e tente novamente.'));
  }, [profile, compositions, calculations, appointments, expenses, receipts, storageReady]);

  const exportBackup = async () => {
    try {
      if (!storageRef.current) throw new Error('O armazenamento ainda não está pronto.');
      downloadBackupFile(await createBackup(storageRef.current));
      notify('Backup exportado com sucesso. Guarde o arquivo em outro local.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível exportar o backup.'); }
  };
  const importBackup = async (file: File) => {
    try {
      if (!storageRef.current) throw new Error('O armazenamento ainda não está pronto.');
      if (file.size > 25 * 1024 * 1024) throw new Error('O arquivo excede o limite de 25 MB.');
      const raw: unknown = JSON.parse(await file.text());
      await restoreBackup(storageRef.current, raw);
      const data = await loadAllRepositories(repositoriesRef.current!);
      setProfileState(data.profile as BusinessProfile);
      setCompositionsState(data.compositions as Composition[]);
      setCalculationsState((data.calculations || []) as CalculationRecord[]);
      setAppointmentsState(data.appointments as Appointment[]);
      setExpensesState(data.expenses as Expense[]);
      setReceiptsState(data.receipts as Receipt[]);
      setStorageUsage(await getStorageUsageBytes(storageRef.current));
      notify('Backup restaurado. Seus dados foram atualizados.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível restaurar o backup.'); }
  };

  if (storageError) return <div className="app-shell"><main className="main-content"><div className="card form-card"><h1>Não foi possível abrir seus dados</h1><p>{storageError}</p><p>Seus dados antigos não foram apagados. Recarregue o aplicativo ou tente novamente em outro navegador.</p><Button onClick={() => window.location.reload()}>Tentar novamente</Button></div></main></div>;
  if (!storageReady) return <div className="app-shell"><main className="main-content"><div className="card form-card"><Mascot mood="thinking" /><h2>Preparando seu espaço...</h2><p className="muted">Júlio está organizando seus dados com segurança.</p></div></main></div>;

  const finalizedReceipts = receipts.filter((receipt) => receipt.status === 'FINALIZADO');
  const removeItem = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'receipt' && deleteTarget.id) setReceipts((items) => items.filter((item) => item.id !== deleteTarget.id));
    if (deleteTarget.type === 'appointment' && deleteTarget.id) setAppointments((items) => items.filter((item) => item.id !== deleteTarget.id));
    if (deleteTarget.type === 'expense' && deleteTarget.id) setExpenses((items) => items.filter((item) => item.id !== deleteTarget.id));
    if (deleteTarget.type === 'all') setReceipts([]);
    setDeleteTarget(null); notify('O registro foi removido deste dispositivo.');
  };
  return <div className="app-shell">
    <Sidebar active={active} navigate={navigate} profile={profile} />
    <main className="main-content">
      <MobileHeader active={active} navigate={navigate} />
      {active === 'dashboard' && <Dashboard profile={profile} receipts={finalizedReceipts} expenses={expenses} appointments={appointments} navigate={navigate} />}
      {active === 'costs' && ( <UnifiedCosts calculations={calculations} setCalculations={setCalculations} notify={notify} />
)}
      {active === 'agenda' && <Agenda appointments={appointments} setAppointments={setAppointments} expenses={expenses} setExpenses={setExpenses} setDeleteTarget={setDeleteTarget} notify={notify} />}
      {active === 'receipt' && <ReceiptCreator profile={profile} setReceipts={setReceipts} navigate={navigate} notify={notify} />}
      {active === 'history' && <History receipts={finalizedReceipts} setDeleteTarget={setDeleteTarget} notify={notify} />}
      {active === 'profile' && <Profile profile={profile} setProfile={setProfile} receipts={finalizedReceipts} notify={notify} storageUsageBytes={storageUsage} onExportBackup={exportBackup} onImportBackup={importBackup} />}
    </main>
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
    {deleteTarget && <ConfirmDialog title={deleteTarget.type === 'all' ? 'Limpar todo o histórico?' : 'Excluir este registro?'} text="Essa ação não poderá ser desfeita dentro do aplicativo. Seus dados de perfil, logo e assinatura padrão serão preservados." onCancel={() => setDeleteTarget(null)} onConfirm={removeItem} />}
  </div>;
}

function Sidebar({ active, navigate, profile }: { active: Section; navigate: (section: Section) => void; profile: BusinessProfile }) {
  return <aside className="sidebar"><div className="brand"><div className="brand-mark"><Mascot size="small" /></div><div><strong>PJ <span>OWL</span></strong><small>organize seu corre</small></div></div><div className="nav-label">Seu espaço</div><nav>{navItems.map((item) => <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'receipt' && <b>+</b>}</button>)}</nav><div className="sidebar-bottom"><div className="julio-tip"><Mascot size="small" mood="thinking" /><p>Pequenos passos, negócio mais leve.</p></div><button className="profile-shortcut" onClick={() => navigate('profile')}><div className="avatar">{initials(profile.businessName || profile.ownerName)}</div><div><strong>{profile.businessName || 'Meu negócio'}</strong><small>{profile.ownerName || 'Configure seu perfil'}</small></div><Icon name="chevron" size={16} /></button></div></aside>;
}
function MobileHeader({ active, navigate }: { active: Section; navigate: (section: Section) => void }) {
  const label = navItems.find((item) => item.id === active)?.label || 'Início';
  return <><header className="mobile-header"><button className="mobile-brand" onClick={() => navigate('dashboard')}><span className="brand-mark"><Mascot size="small" /></span><strong>PJ <span>OWL</span></strong></button><button className="mobile-action" onClick={() => navigate('profile')}><Icon name="user" /></button></header><div className="mobile-page-title"><span>{label}</span><div className="mobile-line" /></div><nav className="mobile-nav">{navItems.map((item) => <button key={item.id} className={active === item.id ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => navigate(item.id)}><Icon name={item.icon} size={18} /><span>{item.label === 'Novo recibo' ? 'Novo' : item.label}</span></button>)}</nav></>;
}
function PageTitle({ eyebrow, title, description, action, onAction, icon = 'spark' }: { eyebrow?: string; title: string; description?: string; action?: string; onAction?: () => void; icon?: IconName }) {
  return <div className="page-title"><div><div className="eyebrow"><span className="eyebrow-dot"><Icon name={icon} size={13} /></span>{eyebrow || 'PJ OWL'}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <Button icon="plus" onClick={onAction}>{action}</Button>}</div>;
}


function Dashboard({
  profile,
  receipts,
  expenses,
  appointments,
  navigate,
}: {
  profile: BusinessProfile;
  receipts: Receipt[];
  expenses: Expense[];
  appointments: Appointment[];
  navigate: (section: Section) => void;
}) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  type ChartBucket = {
    key: string;
    label: string;
    revenue: number;
    expense: number;
  };

  // Usa datas locais para evitar diferenças causadas pelo fuso horário.
  const getLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    if (!year || !month || !day) return null;

    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const todayKey = getLocalDateKey(todayDate);

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  const finalizedReceipts = receipts.filter(
    (receipt) => receipt.status === 'FINALIZADO'
  );

  let buckets: ChartBucket[] = [];

  // SEMANA: sete dias, incluindo hoje.
  if (period === 'week') {
    buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() - (6 - index));

      const key = getLocalDateKey(date);

      return {
        key,
        label: new Intl.DateTimeFormat('pt-BR', {
          weekday: 'short',
        }).format(date).replace('.', ''),
        revenue: 0,
        expense: 0,
      };
    });
  }

  // MÊS: últimos 12 meses, agrupados por mês.
  if (period === 'month') {
    buckets = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth() - 11 + index,
        1
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      return {
        key,
        label: `${monthNames[date.getMonth()]}/${String(
          date.getFullYear()
        ).slice(-2)}`,
        revenue: 0,
        expense: 0,
      };
    });
  }

  // ANO: somente anos que possuem receitas ou despesas registradas.
  if (period === 'year') {
    const registeredYears = new Set<number>();

    finalizedReceipts.forEach((receipt) => {
      const date = parseLocalDate(receipt.paymentDate);
      if (date) registeredYears.add(date.getFullYear());
    });

    expenses.forEach((expense) => {
      const date = parseLocalDate(expense.date);
      if (date) registeredYears.add(date.getFullYear());
    });

    buckets = Array.from(registeredYears)
      .sort((a, b) => a - b)
      .map((year) => ({
        key: String(year),
        label: String(year),
        revenue: 0,
        expense: 0,
      }));
  }

  // Distribui as receitas nos respectivos períodos.
  finalizedReceipts.forEach((receipt) => {
    const date = parseLocalDate(receipt.paymentDate);
    if (!date) return;

    let key = '';

    if (period === 'week') {
      key = getLocalDateKey(date);
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;
    } else {
      key = String(date.getFullYear());
    }

    const bucket = buckets.find((item) => item.key === key);

    if (bucket) {
      bucket.revenue += receipt.amount;
    }
  });

  // Distribui as despesas nos respectivos períodos.
  expenses.forEach((expense) => {
    const date = parseLocalDate(expense.date);
    if (!date) return;

    let key = '';

    if (period === 'week') {
      key = getLocalDateKey(date);
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;
    } else {
      key = String(date.getFullYear());
    }

    const bucket = buckets.find((item) => item.key === key);

    if (bucket) {
      bucket.expense += expense.amount;
    }
  });

  // Totais calculados a partir dos mesmos dados apresentados no gráfico.
  const revenue = buckets.reduce(
    (sum, bucket) => sum + bucket.revenue,
    0
  );

  const spent = buckets.reduce(
    (sum, bucket) => sum + bucket.expense,
    0
  );

  const visibleKeys = new Set(buckets.map((bucket) => bucket.key));

  const receiptCount = finalizedReceipts.filter((receipt) => {
    const date = parseLocalDate(receipt.paymentDate);
    if (!date) return false;

    const key =
      period === 'week'
        ? getLocalDateKey(date)
        : period === 'month'
          ? `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, '0')}`
          : String(date.getFullYear());

    return visibleKeys.has(key);
  }).length;

  // Escala automática do gráfico.
  const highestValue = Math.max(
    0,
    ...buckets.map((bucket) =>
      Math.max(bucket.revenue, bucket.expense)
    )
  );

  const chartScale = highestValue > 0 ? highestValue * 1.15 : 100;

  const axisValues = [
    chartScale,
    chartScale * 0.75,
    chartScale * 0.5,
    chartScale * 0.25,
    0,
  ];

  const upcoming = appointments
    .filter((item) => item.date >= todayKey)
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    )
    .slice(0, 3);

  const user = profile.ownerName
    ? profile.ownerName.split(' ')[0]
    : 'por aqui';

  const periodLabels = {
    week: 'Últimos 7 dias',
    month: 'Últimos 12 meses',
    year: 'Anos com registro',
  };

  return (
    <div className="page">
      <PageTitle
        eyebrow="Resumo do seu negócio"
        title={`Tudo certo, ${user}.`}
        description="Uma visão tranquila do que está acontecendo hoje."
        action="Novo recibo"
        onAction={() => navigate('receipt')}
      />

      <div className="period-switch">
        <span>Visão financeira</span>

        {(['week', 'month', 'year'] as const).map((value) => (
          <button
            key={value}
            className={period === value ? 'active' : ''}
            onClick={() => setPeriod(value)}
          >
            {value === 'week'
              ? 'Semana'
              : value === 'month'
                ? 'Mês'
                : 'Ano'}
          </button>
        ))}
      </div>

      <section className="metric-grid">
        <MetricCard
          icon="wallet"
          label="Receitas"
          value={money(revenue)}
          tone="lavender"
          note={revenue ? 'recibos finalizados' : 'ainda sem receitas'}
        />

        <MetricCard
          icon="trend"
          label="Despesas"
          value={money(spent)}
          tone="coral"
          note={spent ? 'valores registrados' : 'nenhuma despesa'}
        />

        <MetricCard
          icon="target"
          label="Resultado líquido"
          value={money(revenue - spent)}
          tone="mint"
          note="receitas menos despesas"
        />

        <MetricCard
          icon="receipt"
          label="Recibos emitidos"
          value={String(receiptCount)}
          tone="yellow"
          note="documentos finalizados"
        />
      </section>

      <section className="dashboard-grid">
        <div className="card chart-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Movimento</span>
              <h2>Seu dinheiro em perspectiva</h2>
              <small>{periodLabels[period]}</small>
            </div>

            <span className="trend-badge">
              <Icon name="trend" size={14} />
              {revenue - spent >= 0
                ? 'saldo positivo'
                : 'revisar saldo'}
            </span>
          </div>

          <div className="chart-area">
            <div className="chart-y">
              {axisValues.map((value, index) => (
                <span key={index}>
                  {money(value)}
                </span>
              ))}
            </div>

            <div className="chart-bars">
              {buckets.map((bucket) => {
                const revenueHeight =
                  (bucket.revenue / chartScale) * 100;

                const expenseHeight =
                  (bucket.expense / chartScale) * 100;

                return (
                  <div className="bar-group" key={bucket.key}>
                    <div
                      className="bar-track"
                      title={`${bucket.label} | Entradas: ${money(
                        bucket.revenue
                      )} | Saídas: ${money(bucket.expense)}`}
                    >
                      <div
                        className="bar revenue"
                        style={{
                          height: `${revenueHeight}%`,
                        }}
                      />

                      <div
                        className="bar expense"
                        style={{
                          height: `${expenseHeight}%`,
                        }}
                      />
                    </div>

                    <span>{bucket.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {!buckets.some(
            (bucket) => bucket.revenue > 0 || bucket.expense > 0
          ) && (
            <p className="chart-empty-note">
              Ainda não existem movimentações neste período.
              Seus registros aparecerão aqui automaticamente.
            </p>
          )}

          <div className="chart-legend">
            <span>
              <i className="legend-dot purple" />
              Entradas
            </span>

            <span>
              <i className="legend-dot coral" />
              Saídas
            </span>

            <button
              className="text-button"
              onClick={() => navigate('history')}
            >
              Ver histórico <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-grid lower-grid">
        <div className="card upcoming-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Agenda</span>
              <h2>Próximos compromissos</h2>
            </div>

            <button
              className="icon-button"
              onClick={() => navigate('agenda')}
              aria-label="Abrir agenda"
            >
              <Icon name="arrow" />
            </button>
          </div>

          {upcoming.length ? (
            <div className="upcoming-list">
              {upcoming.map((item) => (
                <div className="upcoming-item" key={item.id}>
                  <div className="date-tile">
                    <strong>
                      {new Date(`${item.date}T12:00:00`).getDate()}
                    </strong>

                    <span>
                      {new Intl.DateTimeFormat('pt-BR', {
                        month: 'short',
                      })
                        .format(new Date(`${item.date}T12:00:00`))
                        .replace('.', '')}
                    </span>
                  </div>

                  <div>
                    <strong>{item.description}</strong>
                    <span>
                      <Icon name="clock" size={13} />
                      {item.time}
                      {item.address ? ` · ${item.address}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Agenda livre por enquanto"
              text="Adicione um compromisso para Júlio lembrar você."
              action="Criar agendamento"
              onAction={() => navigate('agenda')}
              mood="thinking"
            />
          )}
        </div>

        <div className="card quick-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Atalhos</span>
              <h2>O que você precisa?</h2>
            </div>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate('costs')}>
              <span className="quick-icon lilac">
                <Icon name="calculator" />
              </span>
              <span>Calcular um preço</span>
              <Icon name="chevron" size={16} />
            </button>

            <button onClick={() => navigate('agenda')}>
              <span className="quick-icon blue">
                <Icon name="calendar" />
              </span>
              <span>Marcar compromisso</span>
              <Icon name="chevron" size={16} />
            </button>

            <button onClick={() => navigate('profile')}>
              <span className="quick-icon yellow">
                <Icon name="user" />
              </span>
              <span>Completar meu perfil</span>
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      </section>

      <p className="privacy-note">
        <Icon name="lock" size={14} />
        Seus dados ficam neste dispositivo. PJ OWL funciona sem depender de internet.
      </p>
    </div>
  );
}

function MetricCard({ icon, label, value, note, tone }: { icon: IconName; label: string; value: string; note: string; tone: string }) { return <div className={`metric-card tone-${tone}`}><div className="metric-icon"><Icon name={icon} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function Costs({ compositions, setCompositions, notify }: { compositions: Composition[]; setCompositions: React.Dispatch<React.SetStateAction<Composition[]>>; notify: (message: string) => void }) {
  const [billingMode, setBillingMode] = useState<'materials' | 'time'>('materials');
  const [items, setItems] = useState<CostItem[]>([]);
  const [name, setName] = useState(''); const [usedQuantity, setUsedQuantity] = useState(''); const [usedUnit, setUsedUnit] = useState<Unit>('un'); const [referenceQuantity, setReferenceQuantity] = useState(''); const [referenceUnit, setReferenceUnit] = useState<Unit>('un'); const [referencePrice, setReferencePrice] = useState('');
  const [timeName, setTimeName] = useState(''); const [timeUnit, setTimeUnit] = useState('monthly'); const [timeQuantity, setTimeQuantity] = useState('1'); const [timePrice, setTimePrice] = useState('');
  const [pricingMode, setPricingMode] = useState<PricingMode>('markup'); const [percentage, setPercentage] = useState('30'); const [manualPrice, setManualPrice] = useState(''); const [compositionName, setCompositionName] = useState('');
  const materialTotal = items.reduce((sum, item) => sum + proportionalCost(item), 0);
  const timeTotal = billingMode === 'time' ? parseMoney(timePrice) * Math.max(1, parseDecimalInput(timeQuantity)) : 0;
  const total = billingMode === 'materials' ? materialTotal : timeTotal;
  const percent = Math.max(0, Number(percentage.replace(',', '.')) || 0) / 100;
  const pricing = calculatePricing(total, percent * 100, pricingMode, manualPrice ? parseMoney(manualPrice) : undefined);
  const { suggestedPrice: suggested, finalPrice, profit } = pricing;
  const billingLabels: Record<string, string> = { monthly: 'mensal', weekly: 'semanal', daily: 'diária', hourly: 'por hora', request: 'por requisição',  };
  const addItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || parseDecimalInput(usedQuantity) <= 0 || parseDecimalInput(referenceQuantity) <= 0 || parseMoney(referencePrice) <= 0) { notify('Preencha nome, quantidades e preço de referência.'); return; }
    if (!compatible(usedUnit, referenceUnit)) { notify('Essas unidades não são compatíveis entre si.'); return; }
    setItems((current) => [...current, { id: uid('cost'), name, usedQuantity: parseDecimalInput(usedQuantity), usedUnit, referenceQuantity: parseDecimalInput(referenceQuantity), referenceUnit, referencePrice: parseMoney(referencePrice) }]);
    setName(''); setUsedQuantity(''); setReferenceQuantity(''); setReferencePrice(''); notify('Item adicionado à composição.');
  };
  const saveComposition = () => { if (billingMode === 'materials' && !items.length) { notify('Adicione ao menos um item antes de guardar.'); return; } if (billingMode === 'time' && (!timeName || parseMoney(timePrice) <= 0)) { notify('Preencha o nome e o preço da cobrança.'); return; } const label = compositionName.trim() || (billingMode === 'time' ? timeName : `Composição de ${new Date().toLocaleDateString('pt-BR')}`); setCompositions((current) => [{ id: uid('composition'), name: label, items, createdAt: new Date().toISOString(), billingMode, timeName: billingMode === 'time' ? timeName : undefined, timeUnit: billingMode === 'time' ? timeUnit : undefined, timeQuantity: billingMode === 'time' ? parseDecimalInput(timeQuantity) || 1 : undefined, timePrice: billingMode === 'time' ? parseMoney(timePrice) : undefined }, ...current]); setCompositionName(''); notify('Composição guardada para reutilizar depois.'); };
  const loadComposition = (composition: Composition) => { const savedMode = composition.billingMode || 'materials'; setBillingMode(savedMode); setItems(composition.items); if (savedMode === 'time') { setTimeName(composition.timeName || composition.name); setTimeUnit(composition.timeUnit || 'monthly'); setTimeQuantity(String(composition.timeQuantity || 1)); setTimePrice(formatCentsForInput(composition.timePrice ?? 0)); } notify(`“${composition.name}” carregada na calculadora.`); };
  return <div className="page"><PageTitle eyebrow="Custo que faz sentido" title="Quanto custa criar?" description="Calcule materiais ou cobranças por tempo, período e requisição, sem perder a visão do custo original." /><div className="billing-tabs"><button className={billingMode === 'materials' ? 'active' : ''} onClick={() => { setBillingMode('materials'); setManualPrice(''); }}><Icon name="package" size={17} /> Materiais e insumos</button><button className={billingMode === 'time' ? 'active' : ''} onClick={() => { setBillingMode('time'); setManualPrice(''); }}><Icon name="clock" size={17} /> Tempo e recorrência</button></div><div className="cost-layout"><div className="cost-main"><div className="card calculator-card"><div className="card-heading"><div><span className="section-kicker">1. {billingMode === 'materials' ? 'Materiais e insumos' : 'Produto ou serviço por período'}</span><h2>{billingMode === 'materials' ? 'Adicione os itens do seu produto' : 'Defina como você cobra'}</h2></div><span className="soft-count">{billingMode === 'materials' ? `${items.length} ${items.length === 1 ? 'item' : 'itens'}` : 'cobrança flexível'}</span></div>{billingMode === 'materials' ? <><form className="cost-form" onSubmit={addItem}><Field label="O que você usa?"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: papel kraft" /></Field><Field label="Quantidade usada"><div className="inline-input"><input type="text" inputMode="decimal" min="0" value={usedQuantity} onChange={(e) => setUsedQuantity(sanitizeDecimalInput(e.target.value, 3))} placeholder="0" /><select value={usedUnit} onChange={(e) => setUsedUnit(e.target.value as Unit)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></div></Field><Field label="Compra de referência"><div className="inline-input"><input type="text" inputMode="decimal" min="0" value={referenceQuantity} onChange={(e) => setReferenceQuantity(sanitizeDecimalInput(e.target.value, 3))} placeholder="0" /><select value={referenceUnit} onChange={(e) => setReferenceUnit(e.target.value as Unit)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></div></Field><Field label="Preço pago"><div className="money-input"><span>R$</span><input value={referencePrice} onChange={(e) => setReferencePrice(formatMoneyInput(e.target.value))} placeholder="0,00" inputMode="decimal" /></div></Field><Button type="submit" variant="secondary" icon="plus">Adicionar item</Button></form>{items.length ? <div className="items-list">{items.map((item) => <div className="cost-item" key={item.id}><span className="cost-item-icon"><Icon name="package" size={17} /></span><div><strong>{item.name}</strong><span>{item.usedQuantity} {item.usedUnit} de uma compra de {item.referenceQuantity} {item.referenceUnit} · custo original {money(item.referencePrice)}</span></div><strong className="item-total">{money(proportionalCost(item))}</strong><button className="mini-delete" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label={`Excluir ${item.name}`}><Icon name="trash" size={15} /></button></div>)}</div> : <div className="hint-box"><Icon name="info" size={16} /><span>Exemplo: 35 cm de um adesivo comprado por metro. O cálculo proporcional acontece sozinho.</span></div>}</> : <div className="time-billing-form"><Field label="Nome do produto, ferramenta ou serviço"><input value={timeName} onChange={(e) => setTimeName(e.target.value)} placeholder="Ex.: plataforma de automação" /></Field><div className="three-fields"><Field label="Forma de cobrança"><select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}><option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="daily">Diária</option><option value="hourly">Por hora</option><option value="request">Por requisição</option></select></Field><Field label="Quantidade"><input type="text" inputMode="numeric" value={timeQuantity} onChange={(e) => setTimeQuantity(e.target.value.replace(/\D/g, '').slice(0, 6))} /></Field><Field label="Preço unitário"><div className="money-input"><span>R$</span><input value={timePrice} onChange={(e) => { setTimePrice(formatMoneyInput(e.target.value)); setManualPrice(''); }} placeholder="0,00" inputMode="decimal" /></div></Field></div><div className="hint-box"><Icon name="clock" size={16} /><span>Use “por requisição” para APIs, automações e ferramentas de cobrança esporádica; use “mensal” para assinaturas e SaaS.</span></div></div>}</div><div className="card saved-card"><div className="card-heading"><div><span className="section-kicker">Composições salvas</span><h2>Reutilize o que já funciona</h2></div></div>{compositions.length ? <div className="saved-list">{compositions.map((composition) => <button key={composition.id} className="saved-item" onClick={() => loadComposition(composition)}><span className="saved-item-icon"><Icon name="copy" size={17} /></span><span><strong>{composition.name}</strong><small>{composition.billingMode === 'time' ? `Cobrança ${composition.timeUnit || 'por período'}` : `${composition.items.length} itens`} · {shortDate(composition.createdAt.slice(0, 10))}</small></span><Icon name="chevron" size={17} /></button>)}</div> : <p className="muted">Suas composições aparecem aqui depois que você guardar a primeira.</p>}</div></div><aside className="cost-summary"><div className="card summary-card"><div className="summary-orb"><Icon name={billingMode === 'materials' ? 'calculator' : 'clock'} size={24} /></div><span className="section-kicker">Resumo da calculadora</span><h2>O preço começa no custo real.</h2><div className="summary-total"><span>Custo original</span><strong>{money(total)}</strong></div>{billingMode === 'time' && <div className="original-cost-detail"><span>{timeQuantity || 0} × {money(parseMoney(timePrice))}</span><strong>{billingLabels[timeUnit]}</strong></div>}<div className="pricing-toggle"><button className={pricingMode === 'markup' ? 'active' : ''} onClick={() => setPricingMode('markup')}>Acréscimo</button><button className={pricingMode === 'margin' ? 'active' : ''} onClick={() => setPricingMode('margin')}>Margem</button></div><Field label={pricingMode === 'markup' ? 'Percentual de acréscimo' : 'Margem desejada'} hint="Você pode mudar quando quiser."><div className="percent-input"><input value={percentage} onChange={(e) => { setPercentage(e.target.value); setManualPrice(''); }} inputMode="decimal" /><span>%</span></div></Field><div className="suggested-price"><span>Preço sugerido</span><strong>{money(suggested)}</strong><small>{pricingMode === 'margin' ? 'margem sobre a venda' : 'acréscimo sobre o custo'}</small></div><Field label="Preço final (opcional)"><div className="money-input"><span>R$</span><input value={manualPrice || formatCentsForInput(suggested)} onChange={(e) => setManualPrice(formatMoneyInput(e.target.value))} inputMode="decimal" /></div></Field><div className="profit-row"><span>Restante após custo</span><strong>{money(profit)}</strong></div><div className="save-composition"><input value={compositionName} onChange={(e) => setCompositionName(e.target.value)} placeholder="Nome da composição" /><Button onClick={saveComposition} icon="check">Guardar</Button></div></div><div className="card formula-card"><div className="formula-icon"><Icon name="spark" /></div><div><strong>Júlio explica</strong><p>O custo original é separado do preço final. Assim você enxerga o que sobra depois de pagar materiais, ferramentas ou períodos contratados.</p></div></div></aside></div></div>;
}

function Agenda({ appointments, setAppointments, expenses, setExpenses, setDeleteTarget, notify }: { appointments: Appointment[]; setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>; expenses: Expense[]; setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>; setDeleteTarget: (target: { type: 'appointment' | 'expense'; id: string }) => void; notify: (message: string) => void }) {
  const [appointmentForm, setAppointmentForm] = useState({ date: today(), time: '09:00', description: '', address: '', reminder: '30' });
  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'Materiais', amount: '', date: today(), notes: '' });
  const [tab, setTab] = useState<'appointments' | 'expenses'>('appointments');
  const addAppointment = (event: React.FormEvent) => { event.preventDefault(); if (!appointmentForm.description) { notify('Dê um nome para o compromisso.'); return; } setAppointments((current) => [{ id: uid('appointment'), ...appointmentForm }, ...current].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))); setAppointmentForm({ date: today(), time: '09:00', description: '', address: '', reminder: '30' }); notify('Compromisso guardado na agenda.'); };
  const addExpense = (event: React.FormEvent) => { event.preventDefault(); if (!expenseForm.description || parseMoney(expenseForm.amount) <= 0) { notify('Preencha descrição e valor da despesa.'); return; } setExpenses((current) => [{ id: uid('expense'), ...expenseForm, amount: parseMoney(expenseForm.amount) }, ...current]); setExpenseForm({ description: '', category: 'Materiais', amount: '', date: today(), notes: '' }); notify('Despesa registrada no seu painel.'); };
  const sorted = [...appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return <div className="page"><PageTitle eyebrow="Organize seus dias" title="Agenda e despesas" description="Seu trabalho fica mais leve quando cada compromisso e gasto tem lugar." /><div className="subnav"><button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}><Icon name="calendar" size={17} /> Compromissos <b>{appointments.length}</b></button><button className={tab === 'expenses' ? 'active' : ''} onClick={() => setTab('expenses')}><Icon name="wallet" size={17} /> Despesas <b>{expenses.length}</b></button></div>{tab === 'appointments' ? <section className="agenda-layout"><div className="card form-card"><div className="card-heading"><div><span className="section-kicker">Novo compromisso</span><h2>O que vem pela frente?</h2></div><span className="heading-icon blue-bg"><Icon name="calendar" /></span></div><form onSubmit={addAppointment} className="stack-form"><div className="two-fields"><Field label="Data"><input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} /></Field><Field label="Horário"><input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} /></Field></div><Field label="Descrição"><input value={appointmentForm.description} onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })} placeholder="Ex.: Entrega para a Ana" /></Field><Field label="Endereço (opcional)"><input value={appointmentForm.address} onChange={(e) => setAppointmentForm({ ...appointmentForm, address: e.target.value })} placeholder="Rua, número ou ponto de encontro" /></Field><Field label="Lembrar com antecedência"><select value={appointmentForm.reminder} onChange={(e) => setAppointmentForm({ ...appointmentForm, reminder: e.target.value })}><option value="0">No horário</option><option value="15">15 minutos antes</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option><option value="1440">1 dia antes</option></select></Field><Button type="submit" icon="check">Guardar compromisso</Button></form></div><div className="card list-card"><div className="card-heading"><div><span className="section-kicker">Sua agenda</span><h2>Compromissos</h2></div><span className="soft-count">{appointments.length}</span></div>{sorted.length ? <div className="appointment-list">{sorted.map((item) => <div className="appointment-item" key={item.id}><div className="date-tile large"><strong>{new Date(`${item.date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${item.date}T12:00:00`)).replace('.', '')}</span></div><div className="appointment-content"><div className="appointment-top"><strong>{item.description}</strong><button className="mini-delete" onClick={() => setDeleteTarget({ type: 'appointment', id: item.id })}><Icon name="trash" size={15} /></button></div><span><Icon name="clock" size={13} /> {item.time} · lembrete {item.reminder === '0' ? 'no horário' : `${item.reminder} min antes`}</span>{item.address && <span><Icon name="target" size={13} /> {item.address}</span>}</div></div>)}</div> : <EmptyState title="Sua agenda está tranquila" text="Adicione o próximo compromisso para não deixar nada escapar." action="Preencher agora" onAction={() => document.querySelector<HTMLInputElement>('input[placeholder^="Ex."]')?.focus()} />}</div></section> : <section className="agenda-layout"><div className="card form-card"><div className="card-heading"><div><span className="section-kicker">Nova despesa</span><h2>Registre o que saiu</h2></div><span className="heading-icon coral-bg"><Icon name="wallet" /></span></div><form onSubmit={addExpense} className="stack-form"><Field label="Descrição"><input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex.: compra de embalagens" /></Field><div className="two-fields"><Field label="Categoria"><select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}><option>Materiais</option><option>Transporte</option><option>Ferramentas</option><option>Divulgação</option><option>Outros</option></select></Field><Field label="Valor"><div className="money-input"><span>R$</span><input value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: formatMoneyInput(e.target.value) })} placeholder="0,00" inputMode="decimal" /></div></Field></div><Field label="Data"><input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /></Field><Field label="Observações (opcional)"><textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Algum detalhe para lembrar?" /></Field><Button type="submit" icon="check">Registrar despesa</Button></form></div><div className="card list-card"><div className="card-heading"><div><span className="section-kicker">Histórico de saídas</span><h2>Despesas registradas</h2></div><span className="soft-count">{expenses.length}</span></div>{expenses.length ? <div className="expense-list">{expenses.map((item) => <div className="expense-item" key={item.id}><span className="expense-icon"><Icon name="wallet" size={17} /></span><div><strong>{item.description}</strong><span>{item.category} · {shortDate(item.date)}</span></div><strong className="expense-amount">{money(item.amount)}</strong><button className="mini-delete" onClick={() => setDeleteTarget({ type: 'expense', id: item.id })}><Icon name="trash" size={15} /></button></div>)}</div> : <EmptyState title="Nenhuma despesa registrada" text="Anote os gastos reais para enxergar seu resultado líquido." action="Registrar despesa" onAction={() => document.querySelector<HTMLInputElement>('input[placeholder^="Ex."]')?.focus()} mood="thinking" />}</div></section>}</div>;
}

function ReceiptCreator({ profile, setReceipts, navigate, notify }: { profile: BusinessProfile; setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>; navigate: (section: Section) => void; notify: (message: string) => void }) {
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
  const refreshRate = () => {
    setRateLoading(true);
    fetchUsdBrlRate().then(({ rate, stale }) => { setExchangeRate(rate); setRateStale(stale); setRateError(''); })
      .catch((error: unknown) => setRateError(error instanceof Error ? error.message : 'Falha ao atualizar cotação.'))
      .finally(() => setRateLoading(false));
  };
  const finalize = () => {
    const clientDocumentError = getOptionalDocumentError(form.clientDocument);
    const providerDocumentError = getOptionalDocumentError(profile.document);
    if (clientDocumentError) { notify(`Documento do cliente: ${clientDocumentError}`); return; }
    if (providerDocumentError) { notify(`Documento do prestador: ${providerDocumentError}`); return; }
    if (!form.clientName || enteredAmount <= 0 || !form.paymentDate) { notify('Preencha cliente, valor e data de pagamento.'); return; }
    if (!providerSignature || !clientSignature) { notify('As duas assinaturas são necessárias para finalizar.'); return; }
    if (form.currency === 'USD' && !exchangeRate) { notify('Não foi possível obter a cotação do dólar. Conecte-se à internet e tente novamente.'); return; }
    const receipt: Receipt = finalizeReceipt({
      id: `RF-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      clientName: form.clientName, clientDocument: normalizeDocument(form.clientDocument),
      providerName: profile.ownerName, providerDocument: normalizeDocument(profile.document),
      businessName: profile.businessName, description: form.description,
      amount: convertedAmount ?? 0, currency: 'BRL',
      ...(form.currency === 'USD' && exchangeRate ? { originalCurrency: 'USD' as const, originalAmount: enteredAmount, exchangeRate: exchangeRate.rate, exchangeRateDate: exchangeRate.quotedAt } : {}),
      paymentMethod: form.paymentMethod, installment: form.installment, notes: form.notes,
      paymentDate: form.paymentDate, providerSignature, clientSignature,
      finalizedAt: new Date().toISOString(),
    });
    setReceipts((current) => [receipt, ...current]);
    notify('Recibo finalizado e protegido no histórico.');
    navigate('history');
  };
  return <div className="page">
    <PageTitle eyebrow="Documento profissional" title="Criar novo recibo" description="Preencha os dados, colha as duas assinaturas e finalize com tranquilidade." />
    <div className="receipt-layout"><div className="receipt-form-column">
      <div className="card form-card"><div className="card-heading"><div><span className="section-kicker">Dados do pagamento</span><h2>Quem pagou e pelo quê?</h2></div><span className="step-chip">1 de 2</span></div>
        <div className="stack-form"><div className="two-fields">
          <Field label="Nome do cliente"><input value={form.clientName} onChange={(e) => update('clientName', e.target.value)} placeholder="Nome completo" /></Field>
          <Field label="CPF/CNPJ do cliente"><input value={formatDocument(form.clientDocument)} onChange={(e) => update('clientDocument', sanitizeDocumentInput(e.target.value))} placeholder="CPF ou CNPJ (opcional)" inputMode="text" autoCapitalize="characters" maxLength={18} /></Field>
        </div>
        <Field label="Descrição do serviço ou produto"><input value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Ex.: 20 lembrancinhas personalizadas" /></Field>
        <div className="three-fields">
          <Field label="Valor informado"><div className="money-input"><span>{form.currency === 'BRL' ? 'R$' : 'US$'}</span><input value={form.amount} onChange={(e) => update('amount', formatMoneyInput(e.target.value))} placeholder="0,00" inputMode="decimal" /></div></Field>
          <Field label="Moeda de entrada"><select value={form.currency} onChange={(e) => update('currency', e.target.value as Currency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option></select></Field>
          <Field label="Data de pagamento"><input type="date" value={form.paymentDate} onChange={(e) => update('paymentDate', e.target.value)} /></Field>
        </div>
        {form.currency === 'USD' && <div className="exchange-rate-note" role="status">
          {rateLoading && <span>Consultando cotação do dólar...</span>}
          {!rateLoading && exchangeRate && <><strong>Conversão estimada: {money(convertedAmount ?? 0, 'BRL')}</strong><span>US$ 1,00 = {money(Math.round(exchangeRate.rate * 100), 'BRL')} · cotação de {formatExchangeRateDate(exchangeRate.quotedAt)}</span>{rateStale && <span className="warning-text">Sem conexão com a API. Usando a última cotação salva.</span>}</>}
          {rateError && !exchangeRate && <span className="warning-text">{rateError}</span>}
          <button type="button" onClick={refreshRate}>Atualizar cotação</button>
        </div>}
        <div className="two-fields"><Field label="Método de pagamento"><select value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value as PaymentMethod)}>{['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito', 'Transferência bancária', 'Outro'].map((method) => <option key={method}>{method}</option>)}</select></Field><Field label="Parcelamento (opcional)"><input value={form.installment} onChange={(e) => update('installment', e.target.value)} placeholder="Ex.: 1ª de 3" /></Field></div>
        <Field label="Observações (opcional)"><textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Uma observação para acompanhar o documento" /></Field></div>
      </div>
      <div className="card signature-card"><div className="card-heading"><div><span className="section-kicker">Assinaturas</span><h2>Confirme as duas partes</h2></div><span className="step-chip">2 de 2</span></div><p className="muted">A assinatura desenhada aqui é eletrônica simples. Ela não equivale automaticamente a uma assinatura qualificada ICP-Brasil.</p><div className="signature-grid"><SignaturePad label="Assinatura do prestador" value={providerSignature} onChange={setProviderSignature} /><SignaturePad label="Assinatura do cliente" value={clientSignature} onChange={setClientSignature} /></div><Button onClick={finalize} icon="lock">Finalizar recibo</Button></div>
    </div>
    <ReceiptPreview profile={profile} form={form} providerSignature={providerSignature} clientSignature={clientSignature} amountInBrl={convertedAmount} amountWords={previewWords} originalAmount={form.currency === 'USD' ? enteredAmount : undefined} exchangeRate={form.currency === 'USD' ? exchangeRate : null} />
    </div>
  </div>;
}
function ReceiptPreview({ profile, form, providerSignature, clientSignature, amountInBrl, amountWords, originalAmount, exchangeRate }: { profile: BusinessProfile; form: typeof defaultReceiptForm; providerSignature: string; clientSignature: string; amountInBrl: number | null; amountWords: string; originalAmount?: number; exchangeRate: ExchangeRate | null }) {
  return <aside className="receipt-preview-wrap"><div className="preview-label"><span>Prévia do documento</span><span className="preview-live"><i /> ao vivo</span></div><div className="receipt-paper"><div className="paper-top"><div className="paper-brand"><div className="paper-logo">{profile.logo ? <img src={profile.logo} alt="Logo" /> : <Mascot size="small" />}</div><div><strong>{profile.businessName || 'Seu negócio'}</strong><span>{profile.ownerName || 'Nome do prestador'}</span></div></div><span className="paper-id">RASCUNHO</span></div><div className="paper-divider" /><h3>Recibo de pagamento</h3><p className="paper-intro">Recebi de <strong>{form.clientName || 'Nome do cliente'}</strong> a importância de:</p><strong className="paper-amount">{amountInBrl === null ? 'Cotação pendente' : money(amountInBrl, 'BRL')}</strong>
    {originalAmount !== undefined && <p className="paper-conversion">Valor informado: {money(originalAmount, 'USD')} ({amountToWords(originalAmount, 'USD')}){exchangeRate ? ` · cotação: ${exchangeRate.rate.toFixed(4)} BRL/USD` : ''}</p>}
    <p className="paper-amount-words">{amountInBrl === null ? amountWords : `(${amountWords})`}</p>
    <div className="paper-details"><div><span>Referente a</span><strong>{form.description || 'Serviço ou produto'}</strong></div><div><span>Forma de pagamento</span><strong>{form.paymentMethod}</strong></div><div><span>Data</span><strong>{longDate(form.paymentDate)}</strong></div></div>{form.notes && <div className="paper-note">{form.notes}</div>}<div className="paper-signatures"><div>{providerSignature ? <img src={providerSignature} alt="Assinatura do prestador" /> : <div className="signature-placeholder">Assinatura</div>}<span>{profile.ownerName || 'Prestador'}</span></div><div>{clientSignature ? <img src={clientSignature} alt="Assinatura do cliente" /> : <div className="signature-placeholder">Assinatura</div>}<span>{form.clientName || 'Cliente'}</span></div></div><div className="paper-footer">Documento gerado pelo PJ OWL · assinatura eletrônica simples</div></div></aside>;
}

function History({ receipts, setDeleteTarget, notify }: { receipts: Receipt[]; setDeleteTarget: (target: { type: 'receipt' | 'all'; id?: string }) => void; notify: (message: string) => void }) {
  const [query, setQuery] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const filtered = filterReceipts(receipts, { query, from, to });
  return <div className="page"><PageTitle eyebrow="Tudo que já foi entregue" title="Histórico de recibos" description="Documentos finalizados ficam aqui, sempre em modo somente leitura." action={receipts.length ? 'Limpar histórico' : undefined} onAction={() => setDeleteTarget({ type: 'all' })} icon="history" /><div className="history-tools card"><div className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente" /></div><div className="date-filter"><Icon name="filter" size={16} /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Data inicial" /><span>até</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Data final" /></div></div>{filtered.length ? <div className="history-list">{filtered.map((receipt) => <ReceiptRow key={receipt.id} receipt={receipt} onDelete={() => setDeleteTarget({ type: 'receipt', id: receipt.id })} notify={notify} />)}</div> : <div className="card"><EmptyState title={receipts.length ? 'Nada encontrado por aqui' : 'Seu histórico está esperando o primeiro recibo'} text={receipts.length ? 'Tente mudar a busca ou o período selecionado.' : 'Quando você finalizar um recibo, ele aparecerá aqui protegido contra alterações.'} mood="thinking" /></div>}<p className="privacy-note"><Icon name="lock" size={14} /> Um recibo finalizado não pode ser editado. Se precisar corrigir algo, crie um novo documento.</p></div>;
}
function ReceiptRow({ receipt, onDelete, notify }: { receipt: Receipt; onDelete: () => void; notify: (message: string) => void }) {
  const exportPdf = () => { const popup = window.open('', '_blank', 'width=760,height=900'); if (!popup) { notify('Permita pop-ups para exportar o PDF.'); return; } popup.document.write(receiptPrintHtml(receipt)); popup.document.close(); popup.focus(); window.setTimeout(() => popup.print(), 300); };
  const exportJpg = () => { const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 1300; const context = canvas.getContext('2d'); if (!context) return; context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#2f2642'; context.font = '800 46px Arial'; context.fillText(receipt.businessName || 'PJ OWL', 80, 100); context.font = '700 32px Arial'; context.fillText('RECIBO DE PAGAMENTO', 80, 190); context.font = '500 25px Arial'; context.fillStyle = '#655d70'; const lines = [`Cliente: ${receipt.clientName}`, `Valor: ${money(receipt.amount, receipt.currency)}`, `Por extenso: ${amountToWords(receipt.amount, receipt.currency)}`, ...(receipt.originalCurrency === 'USD' && receipt.originalAmount !== undefined ? [`Valor informado: ${money(receipt.originalAmount, 'USD')} (${amountToWords(receipt.originalAmount, 'USD')})`, `Cotação utilizada: ${receipt.exchangeRate?.toFixed(4) ?? 'N/D'} BRL/USD`] : []), `Referente a: ${receipt.description || 'Serviço ou produto'}`, `Pagamento: ${receipt.paymentMethod}`, `Data: ${longDate(receipt.paymentDate)}`, `ID: ${receipt.id}`]; let textY = 270; lines.forEach((entry) => { const parts = entry.split(' '); let current = ''; for (const part of parts) { const candidate = current ? `${current} ${part}` : part; if (context.measureText(candidate).width > 1240 && current) { context.fillText(current, 80, textY); textY += 43; current = part; } else current = candidate; } if (current) { context.fillText(current, 80, textY); textY += 48; } }); const signatureY = Math.max(860, textY + 90); context.strokeStyle = '#ded7ea'; context.beginPath(); context.moveTo(80, signatureY - 110); context.lineTo(1320, signatureY - 110); context.stroke(); context.font = '500 21px Arial'; context.fillText('Prestador', 210, signatureY); context.fillText('Cliente', 920, signatureY); context.fillStyle = '#8f849d'; context.font = '400 17px Arial'; context.fillText('Assinatura eletrônica simples', 80, signatureY + 170); const download = document.createElement('a'); download.download = `${receipt.id}.jpg`; download.href = canvas.toDataURL('image/jpeg', .92); download.click(); notify('JPG preparado para download.'); };
  const share = async () => { if (navigator.share) { await navigator.share({ title: `Recibo ${receipt.id}`, text: `${receipt.clientName} · ${money(receipt.amount, receipt.currency)}` }).catch(() => undefined); } else { await navigator.clipboard?.writeText(`${receipt.id} — ${receipt.clientName} — ${money(receipt.amount, receipt.currency)}`); notify('Resumo copiado para compartilhar.'); } };
  return <div className="card receipt-row"><div className="receipt-row-main"><span className="receipt-file-icon"><Icon name="receipt" /></span><div><div className="receipt-row-title"><strong>{receipt.clientName}</strong><span className="status-chip"><Icon name="check" size={12} /> finalizado</span></div><span>{receipt.description || 'Serviço ou produto'} · {shortDate(receipt.paymentDate)} · {receipt.paymentMethod}</span><small>{receipt.id}</small></div></div><strong className="receipt-row-amount">{money(receipt.amount, receipt.currency)}</strong><div className="receipt-row-actions"><button onClick={exportPdf} title="Exportar PDF"><Icon name="download" size={16} /><span>PDF</span></button><button onClick={exportJpg} title="Exportar JPG"><Icon name="download" size={16} /><span>JPG</span></button><button onClick={share} title="Compartilhar"><Icon name="share" size={16} /></button><button className="danger-action" onClick={onDelete} title="Excluir"><Icon name="trash" size={16} /></button></div></div>;
}
function receiptPrintHtml(receipt: Receipt) { return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${receipt.id}</title><style>body{font-family:Arial,sans-serif;color:#2f2642;max-width:760px;margin:40px auto;padding:0 32px}header{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:28px}h1{font-size:30px}h2{margin-top:48px}.amount{font-size:40px;font-weight:800;color:#7150b2}.amount-words{font-size:15px;line-height:1.5;margin-top:8px;color:#51475f}.conversion{font-size:12px;color:#8a8291}.details{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:36px 0}.details span{display:block;color:#8a8291;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}.details strong{font-size:17px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:70px;margin-top:90px}.signatures div{border-top:1px solid #bdb6c8;padding-top:10px;text-align:center;color:#62596e}.signatures img{width:100%;height:80px;object-fit:contain;display:block;margin-bottom:-4px}.footer{margin-top:70px;color:#8a8291;font-size:12px}</style></head><body><header><div><h1>${receipt.businessName || 'PJ OWL'}</h1><p>${receipt.providerName || ''} · ${receipt.providerDocument ? formatDocument(receipt.providerDocument) : ''}</p></div><strong>${receipt.id}</strong></header><h2>Recibo de pagamento</h2><p>Recebi de <strong>${receipt.clientName}</strong> a importância de:</p><div class="amount">${money(receipt.amount, receipt.currency)}</div><p class="amount-words">(${amountToWords(receipt.amount, receipt.currency)})</p>${receipt.originalCurrency === 'USD' && receipt.originalAmount !== undefined ? `<p class="conversion">Valor informado: ${money(receipt.originalAmount, 'USD')} (${amountToWords(receipt.originalAmount, 'USD')}) · cotação utilizada: ${receipt.exchangeRate?.toFixed(4) ?? 'não registrada'} BRL/USD (${receipt.exchangeRateDate ? formatExchangeRateDate(receipt.exchangeRateDate) : 'data não registrada'})</p>` : ''}<div class="details"><div><span>Referente a</span><strong>${receipt.description || 'Serviço ou produto'}</strong></div><div><span>Forma de pagamento</span><strong>${receipt.paymentMethod}</strong></div><div><span>Data</span><strong>${longDate(receipt.paymentDate)}</strong></div><div><span>Cliente</span><strong>${receipt.clientDocument ? formatDocument(receipt.clientDocument) : 'Documento não informado'}</strong></div></div>${receipt.notes ? `<p><strong>Observações:</strong> ${receipt.notes}</p>` : ''}<div class="signatures"><div><img src="${receipt.providerSignature}" alt=""><span>Prestador: ${receipt.providerName || '—'}</span></div><div><img src="${receipt.clientSignature}" alt=""><span>Cliente: ${receipt.clientName}</span></div></div><p class="footer">Documento gerado pelo PJ OWL em ${new Date(receipt.finalizedAt).toLocaleString('pt-BR')}. A assinatura desenhada é eletrônica simples.</p></body></html>`; }

function Profile({ profile, setProfile, receipts, notify, storageUsageBytes, onExportBackup, onImportBackup }: { profile: BusinessProfile; setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>; receipts: Receipt[]; notify: (message: string) => void; storageUsageBytes: number; onExportBackup: () => void; onImportBackup: (file: File) => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null); const backupRef = useRef<HTMLInputElement>(null); const [draft, setDraft] = useState(profile); useEffect(() => setDraft(profile), [profile]);
  const save = () => { const documentError = getOptionalDocumentError(draft.document); if (documentError) { notify(documentError); return; } setProfile({ ...draft, document: normalizeDocument(draft.document) }); notify('Perfil salvo neste dispositivo.'); };
  const handleLogo = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setDraft((current) => ({ ...current, logo: String(reader.result) })); reader.readAsDataURL(file); };
  const used = storageUsageBytes;
  return <div className="page"><PageTitle eyebrow="Seu negócio, do seu jeito" title="Perfil e preferências" description="Esses dados ficam só neste dispositivo e deixam cada recibo mais completo." /><div className="profile-layout"><div className="profile-main"><div className="card form-card"><div className="card-heading"><div><span className="section-kicker">Identidade do negócio</span><h2>Como devemos chamar seu trabalho?</h2></div><span className="heading-icon lilac-bg"><Icon name="user" /></span></div><div className="stack-form"><div className="two-fields"><Field label="Seu nome"><input value={draft.ownerName} onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })} placeholder="Nome completo" /></Field><Field label="Nome fantasia"><input value={draft.businessName} onChange={(e) => setDraft({ ...draft, businessName: e.target.value })} placeholder="Como seus clientes conhecem você" /></Field></div><div className="two-fields"><Field label="CPF/CNPJ"><input value={formatDocument(draft.document)} onChange={(e) => setDraft({ ...draft, document: sanitizeDocumentInput(e.target.value) })} placeholder="CPF ou CNPJ (opcional)" inputMode="text" autoCapitalize="characters" maxLength={18} /></Field><Field label="Início da atividade"><input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field></div><div className="logo-upload"><div className="logo-preview">{draft.logo ? <img src={draft.logo} alt="Logo do negócio" /> : <Mascot size="small" />}</div><div><strong>Logo do negócio</strong><p>PNG ou JPG para aparecer nos seus recibos.</p><input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleLogo} hidden /><Button variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>Importar imagem</Button>{draft.logo && <button className="text-button danger-text" onClick={() => setDraft({ ...draft, logo: '' })}>Remover logo</button>}</div></div><Button onClick={save} icon="check">Salvar dados do negócio</Button></div></div><div className="card signature-card"><div className="card-heading"><div><span className="section-kicker">Sua assinatura padrão</span><h2>Uma vez desenhada, sempre à mão</h2></div><span className="heading-icon yellow-bg"><Icon name="signature" /></span></div><p className="muted">Ela será carregada automaticamente ao criar um recibo. Você pode mudar a assinatura em um documento específico sem alterar esta versão.</p><SignaturePad label="Assinatura do prestador" value={draft.signature} onChange={(signature) => setDraft({ ...draft, signature })} /><Button onClick={save} icon="check">Salvar assinatura</Button></div></div><aside className="profile-side"><div className="card profile-card"><div className="profile-avatar">{draft.logo ? <img src={draft.logo} alt="Logo" /> : <span>{initials(draft.businessName || draft.ownerName)}</span>}</div><h2>{draft.businessName || 'Seu negócio'}</h2><p>{draft.ownerName || 'Complete seu perfil para personalizar os recibos.'}</p><div className="profile-stat"><span>Recibos finalizados</span><strong>{receipts.length}</strong></div></div><div className="card storage-card"><div className="card-heading"><div><span className="section-kicker">Armazenamento local</span><h2>Seus dados ficam aqui</h2></div><Icon name="lock" size={18} /></div><div className="storage-meter"><span style={{ width: `${Math.min(95, Math.max(5, used / 6000 * 100))}%` }} /></div><p>Este dispositivo está usando aproximadamente <strong>{Math.max(1, Math.round(used / 1024))} KB</strong> para o PJ OWL.</p><small>Ao limpar os dados do navegador, essas informações podem ser perdidas. Exporte recibos importantes antes de trocar de dispositivo.</small></div><div className="card storage-card"><div className="card-heading"><div><span className="section-kicker">Proteção dos seus dados</span><h2>Backup e restauração</h2></div><Icon name="download" size={18} /></div><p>Exporte uma cópia dos seus dados ou restaure um arquivo de backup do PJ OWL.</p><div className="stack-form"><Button variant="secondary" icon="download" onClick={onExportBackup}>Exportar backup</Button><input ref={backupRef} type="file" accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file && window.confirm('A restauração substituirá os dados atuais do PJ OWL. Deseja continuar?')) void onImportBackup(file); event.currentTarget.value = ''; }} /><Button variant="ghost" icon="upload" onClick={() => backupRef.current?.click()}>Restaurar backup</Button></div><small>A restauração substitui os dados atuais. Faça um backup antes de importar outro arquivo.</small></div><div className="card julio-profile"><Mascot size="small" mood="success" /><div><strong>Júlio cuida da leveza.</strong><p>Você cuida do trabalho. O PJ OWL ajuda a deixar tudo organizado.</p></div></div></aside></div></div>;
}
function ConfirmDialog({ title, text, onCancel, onConfirm }: { title: string; text: string; onCancel: () => void; onConfirm: () => void }) { return <div className="modal-backdrop"><div className="modal"><div className="modal-icon"><Icon name="trash" /></div><h2>{title}</h2><p>{text}</p><div className="modal-actions"><Button variant="ghost" onClick={onCancel}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>Excluir</Button></div></div></div>; }

createRoot(document.getElementById('root')!).render(<App />);
