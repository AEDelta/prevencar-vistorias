import React, { useState, useEffect } from 'react';
import { TestPage } from './views/TestPage';
import { ViewState, User, Indication, ServiceItem, Inspection, Role, PaymentMethod } from './types';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Login } from './views/Login';
import { ForgotPassword } from './views/ForgotPassword';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { InspectionList } from './views/InspectionList';
import { InspectionForm } from './views/InspectionForm';
import { Management } from './views/Management';

console.log('✅ App.tsx carregado');

// --- MOCK DATA CONSTANTS ---
const INITIAL_USERS: User[] = [
    { id: '1', name: 'Admin Principal', email: 'admin@prevencar.com.br', role: 'admin', password: 'admin123' }
];

const INITIAL_INDICATIONS: Indication[] = [
    { id: '1', name: 'Peças AutoSul', document: '12.345.678/0001-90', phone: '(11) 98888-7777', email: 'contato@autosul.com', cep: '01001-000', address: 'Rua Principal', number: '100' },
    { id: '2', name: 'Mecânica Rápida', document: '98.765.432/0001-10', phone: '(11) 97777-6666', email: 'contato@mecanica.com', cep: '02002-000', address: 'Av Secundaria', number: '200' }
];

const INITIAL_SERVICES: ServiceItem[] = [
    { id: '1', name: 'Laudo de Transferência', price: 100.00, description: 'Laudo obrigatório para transferência.' },
    { id: '2', name: 'Laudo Cautelar', price: 250.00, description: 'Análise completa da estrutura.' },
    { id: '3', name: 'Vistoria Prévia', price: 150.00, description: 'Para seguradoras.' },
    { id: '4', name: 'Pesquisa', price: 50.00, description: 'Pesquisa de débitos e restrições.' },
    { id: '5', name: 'Prevenscan', price: 300.00, description: 'Scanner completo.' }
];

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: '1',
    date: '2023-10-25',
    vehicleModel: 'Honda Civic',
    licensePlate: 'ABC-1234',
    selectedServices: ['Laudo Cautelar'],
    client: {
      name: 'João da Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores',
      cep: '01001-000',
      number: '123'
    },
    status: 'Concluída',
    paymentStatus: 'Recebido',
    inspector: 'Pedro',
    paymentMethod: 'Pix',
    totalValue: 250.00
  },
  {
    id: '2',
    date: '2023-10-26',
    vehicleModel: 'Fiat Toro',
    licensePlate: 'XYZ-9876',
    selectedServices: ['Vistoria de Seguro'],
    client: {
      name: 'Maria Oliveira',
      cpf: '987.654.321-99',
      address: 'Av Paulista',
      cep: '01311-000',
      number: '900'
    },
    status: 'Pendente',
    paymentStatus: 'Pendente',
    totalValue: 150.00
  }
] as any[]; 

// --- HOOK FOR PERSISTENCE ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  
  // Global State with Persistence
  const [inspections, setInspections] = useLocalStorage<Inspection[]>('prevencar_inspections', MOCK_INSPECTIONS);
  const [users, setUsers] = useLocalStorage<User[]>('prevencar_users', INITIAL_USERS);
  const [indications, setIndications] = useLocalStorage<Indication[]>('prevencar_indications', INITIAL_INDICATIONS);
  const [services, setServices] = useLocalStorage<ServiceItem[]>('prevencar_services', INITIAL_SERVICES);

  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);

  const useFirestore = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

  // Fechamentos mensais and financial logs persisted locally (or via Firestore if configured)
  const [fechamentosMensais, setFechamentosMensais] = useLocalStorage<any[]>('prevencar_fechamentos_mensais', []);
  const [financialLogs, setFinancialLogs] = useLocalStorage<any[]>('prevencar_financial_logs', []);

  const addFinancialLog = (entry: any) => {
    const log = { id: Math.random().toString(36).substr(2,9), timestamp: new Date().toISOString(), ...entry };
    setFinancialLogs(prev => [log, ...prev]);
  };

  // If Firestore is configured, subscribe to real-time updates and use Firestore as source of truth.
  useEffect(() => {
    if (!useFirestore) return;

    const q = query(collection(db, 'inspections'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Inspection[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setInspections(items);
    }, (err) => {
      console.error('Erro ao sincronizar inspeções do Firestore', err);
    });

    return () => unsubscribe();
  }, []);

  // Authentication Handlers
  const handleLogin = (email: string, password: string) => {
    // Find user by email and validate password
    const user = users.find(u => u.email === email);
    if (!user || user.password !== password) {
      alert('Email ou senha inválidos.');
      return;
    }

    setCurrentUser(user);
    setCurrentView(ViewState.HOME);
  };

  const handleLogout = () => {
    setCurrentUser(undefined);
    setCurrentView(ViewState.LOGIN);
  };

  // --- Inspection Logic ---
  const handleStartNewInspection = () => {
    setEditingInspection(null);
    setCurrentView(ViewState.INSPECTION_FORM);
  };

  const handleEditInspection = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setCurrentView(ViewState.INSPECTION_FORM);
  };

  const handleDeleteInspection = (id: string) => {
    if (currentUser?.role === 'vistoriador') {
        return; // Protection check
    }
    if (useFirestore) {
      // delete from firestore
      deleteDoc(doc(db, 'inspections', id)).catch(err => console.error('Erro ao deletar no Firestore', err));
    } else {
      setInspections(prev => prev.filter(i => i.id !== id));
    }
  };

  const mes_fechado = (mes: string) => {
    if (!mes) return false;
    const f = fechamentosMensais.find(x => x.mes === mes);
    return !!(f && f.fechado);
  };

  const atualizar_status_ficha = (ficha: Inspection) => {
    // Define required fields for a ficha to be considered 'Completa'
    const requiredClient = ficha.client && ficha.client.name && ficha.client.cpf && ficha.client.address && ficha.client.cep;
    const requiredBasic = ficha.licensePlate && ficha.vehicleModel && (ficha.selectedServices && ficha.selectedServices.length > 0);
    const requiredFinancial = (typeof (ficha.valor ?? ficha.totalValue) === 'number');
    const completa = !!(requiredClient && requiredBasic && requiredFinancial);
    ficha.status_ficha = completa ? 'Completa' : 'Incompleta';
    return ficha.status_ficha;
  };

  const handleSaveInspection = (inspection: Inspection) => {
    // Ensure paymentStatus exists and defaults sensibly
    if (!inspection.paymentStatus) {
      inspection.paymentStatus = inspection.paymentMethod === PaymentMethod.A_PAGAR ? 'Pendente' : 'Recebido';
    }
    // Ensure mes_referencia exists: derive from date if missing
    if (!inspection.mes_referencia && inspection.date) {
      const d = new Date(inspection.date);
      inspection.mes_referencia = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }

    // Update ficha completeness before save
    atualizar_status_ficha(inspection);

    // If attempting to change financial fields for a closed month, reject
    if (mes_fechado(inspection.mes_referencia || '')) {
      // Do not allow saving any financial write operations
      // We'll allow saving non-financial edits but reject changes that touch payment fields
      // For simplicity, reject save if payment-related fields are present/changed
      // (Client code should catch and show message)
      alert('O mês está fechado. Alterações financeiras não permitidas.');
      return;
    }
    // Ensure paymentStatus exists and defaults sensibly
    if (!inspection.paymentStatus) {
      inspection.paymentStatus = inspection.paymentMethod === PaymentMethod.A_PAGAR ? 'Pendente' : 'Recebido';
    }
    if (useFirestore) {
      const inspectionsCol = collection(db, 'inspections');
      if (inspection.id) {
        // update existing (ensure doc id preserved)
        setDoc(doc(db, 'inspections', inspection.id), { ...inspection }).catch(err => console.error('Erro ao salvar no Firestore', err));
      } else {
        // add new (firestore will generate id)
        addDoc(inspectionsCol, { ...inspection }).catch(err => console.error('Erro ao adicionar no Firestore', err));
      }
    } else {
      if (editingInspection) {
        const prevIns = inspections.find(i => i.id === inspection.id);
        if (prevIns) {
          const before = { paymentStatus: prevIns.paymentStatus, status_pagamento: prevIns.status_pagamento, forma_pagamento: prevIns.forma_pagamento, valor: prevIns.valor };
          const after = { paymentStatus: inspection.paymentStatus, status_pagamento: inspection.status_pagamento, forma_pagamento: inspection.forma_pagamento, valor: inspection.valor };
          if (JSON.stringify(before) !== JSON.stringify(after)) {
            addFinancialLog({ who: currentUser?.id || currentUser?.name, action: 'update_inspection', ficheId: inspection.id, before, after });
          }
        }
        setInspections(prev => prev.map(i => i.id === inspection.id ? inspection : i));
      } else {
        setInspections(prev => [inspection, ...prev]);
        addFinancialLog({ who: currentUser?.id || currentUser?.name, action: 'create_inspection', ficheId: inspection.id, after: { paymentStatus: inspection.paymentStatus, status_pagamento: inspection.status_pagamento, forma_pagamento: inspection.forma_pagamento, valor: inspection.valor } });
      }
    }
    setCurrentView(ViewState.INSPECTION_LIST);
  };

  // Bulk update payment status (only paymentStatus, not inspection status)
  const handleBulkUpdatePaymentStatus = (ids: string[], newPaymentStatus: string) => {
    // Validate month closure and ficha completeness for each
    const errors: string[] = [];
    const updatedInspections = inspections.map(inspection => {
      if (!ids.includes(inspection.id)) return inspection;

      // If month closed, reject
      if (mes_fechado(inspection.mes_referencia || '')) {
        errors.push(`Mês fechado para ficha ${inspection.id}`);
        return inspection;
      }

      // If marking as 'Pago' (or 'Recebido'), ensure ficha completa
      if (newPaymentStatus === 'Recebido' && inspection.status_ficha !== 'Completa') {
        errors.push(`A ficha ${inspection.id} deve estar completa para registrar pagamento.`);
        return inspection;
      }

      const before = { paymentStatus: inspection.paymentStatus, status_pagamento: inspection.status_pagamento, forma_pagamento: inspection.forma_pagamento, valor: inspection.valor };
      const updated = { ...inspection, paymentStatus: newPaymentStatus as any };
      // If marking as received, set status_pagamento and data_pagamento
      if (newPaymentStatus === 'Recebido') {
        updated.status_pagamento = 'Pago';
        updated.data_pagamento = new Date().toISOString();
      }
      // log
      addFinancialLog({ who: currentUser?.id || currentUser?.name, action: 'bulk_update_payment_status', ficheId: inspection.id, before, after: { paymentStatus: updated.paymentStatus, status_pagamento: updated.status_pagamento } });
      return updated;
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (useFirestore) {
      ids.forEach(id => {
        const ins = updatedInspections.find(i => i.id === id);
        if (ins) setDoc(doc(db, 'inspections', id), { ...ins }).catch(err => console.error('Erro ao atualizar paymentStatus no Firestore', err));
      });
    } else {
      setInspections(updatedInspections);
    }
  };

  // Close month (administrative action) - sets fechado=true, records who and when, optionally generate snapshot
  const handleCloseMonth = async (mes: string, options?: { checkPendencias?: boolean }) => {
    if (!currentUser) {
      alert('Usuário não autenticado');
      return;
    }
    if (!(currentUser.role === 'admin' || currentUser.role === 'financeiro')) {
      alert('Permissão negada');
      return;
    }

    // Optional: check pendências (fichas com status_ficha != Completa or payments pending)
    if (options?.checkPendencias) {
      const pend = inspections.filter(i => (i.mes_referencia === mes) && (i.status_ficha !== 'Completa' || (i.status_pagamento === 'A pagar' || (i.paymentStatus === 'Pendente'))));
      if (pend.length > 0) {
        if (!window.confirm(`Existem ${pend.length} pendências. Deseja prosseguir com o fechamento?`)) return;
      }
    }

    // Mark fechamento
    const updated = [...fechamentosMensais];
    const idx = updated.findIndex(f => f.mes === mes);
    const now = new Date().toISOString();
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], fechado: true, data_fechamento: now, usuario_fechou: currentUser.name || currentUser.id };
    } else {
      updated.push({ mes, fechado: true, data_fechamento: now, usuario_fechou: currentUser.name || currentUser.id });
    }
    setFechamentosMensais(updated);

    // Create snapshot/relatório (Excel) for that month
    try {
      const items = inspections.filter(i => i.mes_referencia === mes);
      if (items.length > 0) {
        // Use existing export util to generate excel report
        // exportToExcel(items, `fechamento_${mes}.xlsx`); // optional download
      }
    } catch (err) {
      console.error('Erro ao gerar snapshot do mês', err);
    }

    addFinancialLog({ who: currentUser.id || currentUser.name, action: 'fechar_mes', mes, data_fechamento: now });
    alert(`Mês ${mes} marcado como fechado.`);
  };

  const handleBulkUpdatePaymentStatus = (ids: string[], newPaymentStatus: string) => {
    const updatedInspections = inspections.map(inspection =>
      ids.includes(inspection.id) ? { ...inspection, paymentStatus: newPaymentStatus as any } : inspection
    );

    if (useFirestore) {
      ids.forEach(id => {
        const inspection = inspections.find(i => i.id === id);
        if (inspection) {
          setDoc(doc(db, 'inspections', id), { ...inspection, paymentStatus: newPaymentStatus }).catch(err => console.error('Erro ao atualizar paymentStatus no Firestore', err));
        }
      });
    } else {
      setInspections(updatedInspections);
    }
  };

  const handleBulkUpdateStatus = (ids: string[], newStatus: string) => {
    const updatedInspections = inspections.map(inspection =>
      ids.includes(inspection.id) ? { ...inspection, status: newStatus as any } : inspection
    );

    if (useFirestore) {
      // Update each doc in firestore
      ids.forEach(id => {
        const inspection = inspections.find(i => i.id === id);
        if (inspection) {
          setDoc(doc(db, 'inspections', id), { ...inspection, status: newStatus }).catch(err => console.error('Erro ao atualizar no Firestore', err));
        }
      });
    } else {
      setInspections(updatedInspections);
    }
  };

  // --- Management Logic (Global Handlers) ---
  
  // Users
  const handleSaveUser = (user: User) => {
      if (users.find(u => u.id === user.id)) {
          setUsers(users.map(u => u.id === user.id ? user : u));
      } else {
          setUsers([...users, { ...user, id: Math.random().toString(36).substr(2, 9) }]);
      }
  };
  const handleDeleteUser = (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Indications
  const handleSaveIndication = (indication: Indication) => {
      if (indications.find(i => i.id === indication.id)) {
          setIndications(indications.map(i => i.id === indication.id ? indication : i));
      } else {
          setIndications([...indications, { ...indication, id: Math.random().toString(36).substr(2, 9) }]);
      }
  };
  const handleDeleteIndication = (id: string) => {
      setIndications(prev => prev.filter(i => i.id !== id));
  };

  // Services
  const handleSaveService = (service: ServiceItem) => {
      if (services.find(s => s.id === service.id)) {
          setServices(services.map(s => s.id === service.id ? service : s));
      } else {
          setServices([...services, { ...service, id: Math.random().toString(36).substr(2, 9) }]);
      }
  };
  const handleDeleteService = (id: string) => {
      setServices(prev => prev.filter(s => s.id !== id));
  };


  // View Router
  const renderView = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} changeView={setCurrentView} />;
      case ViewState.FORGOT_PASSWORD:
        return <ForgotPassword changeView={setCurrentView} />;
      case ViewState.HOME:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <Home changeView={setCurrentView} startNewInspection={handleStartNewInspection} currentUser={currentUser} />
          </Layout>
        );
      case ViewState.INSPECTION_LIST:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <InspectionList
              inspections={inspections}
              onEdit={handleEditInspection}
              onDelete={handleDeleteInspection}
              changeView={setCurrentView}
              onCreate={handleStartNewInspection}
              currentUser={currentUser}
              onBulkUpdate={handleBulkUpdateStatus}
              onBulkPaymentUpdate={handleBulkUpdatePaymentStatus}
              fechamentosMensais={fechamentosMensais}
            />
          </Layout>
        );
      case ViewState.INSPECTION_FORM:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <InspectionForm 
              inspectionToEdit={editingInspection}
              onSave={handleSaveInspection}
              onCancel={() => setCurrentView(ViewState.INSPECTION_LIST)} 
              onDelete={handleDeleteInspection}
              currentUser={currentUser}
            />
          </Layout>
        );
      case ViewState.MANAGEMENT:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <Management 
                currentUser={currentUser}
                // Pass Data
                users={users}
                indications={indications}
                services={services}
                // Pass Handlers
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onSaveIndication={handleSaveIndication}
                onDeleteIndication={handleDeleteIndication}
                onSaveService={handleSaveService}
                onDeleteService={handleDeleteService}
              onCloseMonth={handleCloseMonth}
              fechamentosMensais={fechamentosMensais}
              onGetFechamentos={( ) => fechamentosMensais}
            />
          </Layout>
        );
      default:
        return <Login onLogin={handleLogin} changeView={setCurrentView} />;
    }
  };

  return (
    <>
      {renderView()}
    </>
  );
};

export default App;