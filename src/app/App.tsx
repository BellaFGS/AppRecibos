import React, { useEffect, useRef, useState } from 'react';
import type { Appointment, BusinessProfile, CalculationRecord, Composition, Expense, Receipt, Section } from '../domain/models';
import { defaultProfile } from '../domain/utils';
import { initializeStorage } from '../shared/storage/storageProvider';
import { createRepositories, loadAllRepositories, type AppRepositories } from '../shared/storage/repositories';
import { createBackup, downloadBackupFile, getStorageUsageBytes, restoreBackup } from '../shared/storage/backup';
import type { KeyValueStorage } from '../shared/storage/types';
import { Button, ConfirmDialog, Mascot, Toast } from '../shared/components/ui';
import { Sidebar, MobileHeader } from '../shared/layout/AppLayout';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Costs } from '../features/costs/Costs';
import { Agenda } from '../features/agenda/Agenda';
import { ReceiptCreator } from '../features/receipts/Receipts';
import { History } from '../features/history/History';
import { Profile } from '../features/profile/Profile';

export function App() {
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
      {active === 'costs' && <Costs calculations={calculations} setCalculations={setCalculations} notify={notify} />}
      {active === 'agenda' && <Agenda appointments={appointments} setAppointments={setAppointments} expenses={expenses} setExpenses={setExpenses} setDeleteTarget={setDeleteTarget} notify={notify} />}
      {active === 'receipt' && <ReceiptCreator profile={profile} setReceipts={setReceipts} navigate={navigate} notify={notify} />}
      {active === 'history' && <History receipts={finalizedReceipts} setDeleteTarget={setDeleteTarget} notify={notify} />}
      {active === 'profile' && <Profile profile={profile} setProfile={setProfile} receipts={finalizedReceipts} notify={notify} storageUsageBytes={storageUsage} onExportBackup={exportBackup} onImportBackup={importBackup} />}
    </main>
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
    {deleteTarget && <ConfirmDialog title={deleteTarget.type === 'all' ? 'Limpar todo o histórico?' : 'Excluir este registro?'} text="Essa ação não poderá ser desfeita dentro do aplicativo. Seus dados de perfil, logo e assinatura padrão serão preservados." onCancel={() => setDeleteTarget(null)} onConfirm={removeItem} />}
  </div>;
}