import React, { useState, useEffect } from 'react';
import { TestPage } from './views/TestPage';
import { ViewState, User, Indication, ServiceItem, Inspection, Role } from './types';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, setDoc, addDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
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
    { id: '1', name: 'Laudo de Transferência', prices: { Motocicletas: 80, Automóveis: 100, Utilitários: 120, Caminhões: 200, Carretas: 250, Outros: 100 }, description: 'Laudo obrigatório para transferência.' },
    { id: '2', name: 'Laudo Cautelar', prices: { Motocicletas: 200, Automóveis: 250, Utilitários: 300, Caminhões: 500, Carretas: 600, Outros: 250 }, description: 'Análise completa da estrutura.' },
    { id: '3', name: 'Vistoria Prévia', prices: { Motocicletas: 120, Automóveis: 150, Utilitários: 180, Caminhões: 300, Carretas: 350, Outros: 150 }, description: 'Para seguradoras.' },
    { id: '4', name: 'Pesquisa', prices: { Motocicletas: 40, Automóveis: 50, Utilitários: 60, Caminhões: 100, Carretas: 120, Outros: 50 }, description: 'Pesquisa de débitos e restrições.' },
    { id: '5', name: 'Prevenscan', prices: { Motocicletas: 240, Automóveis: 300, Utilitários: 360, Caminhões: 600, Carretas: 700, Outros: 300 }, description: 'Scanner completo.' }
];

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: '1',
    date: '2023-10-25',
    vehicleModel: 'Honda Civic',
    licensePlate: 'ABC-1234',
    selectedServices: [{ name: 'Laudo Cautelar', baseValue: 250.00, chargedValue: 250.00 }],
    client: {
      name: 'João da Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores',
      cep: '01001-000',
      number: '123'
    },
    status: 'Concluída',
    paymentStatus: 'Dinheiro',
    inspector: 'Pedro',
    totalValue: 250.00
  },
  {
    id: '2',
    date: '2023-10-26',
    vehicleModel: 'Fiat Toro',
    licensePlate: 'XYZ-9876',
    selectedServices: [{ name: 'Vistoria Prévia', baseValue: 150.00, chargedValue: 150.00 }],
    client: {
      name: 'Maria Oliveira',
      cpf: '987.654.321-99',
      address: 'Av Paulista',
      cep: '01311-000',
      number: '900'
    },
    status: 'No Caixa',
    paymentStatus: 'A pagar',
    totalValue: 150.00
  }
] as Inspection[];

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
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [indications, setIndications] = useLocalStorage<Indication[]>('prevencar_indications', INITIAL_INDICATIONS);
  const [services, setServices] = useLocalStorage<ServiceItem[]>('prevencar_services', INITIAL_SERVICES);

  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [editOptions, setEditOptions] = useState<{ initialStep?: number; focusField?: string } | undefined>(undefined);

  const useFirestore = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

  // Initialize admin user if none exists
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        // Try to create admin user
        const userCredential = await createUserWithEmailAndPassword(auth, 'admin@prevencar.com.br', 'admin123');
        const uid = userCredential.user.uid;
        // Create profile in Firestore
        await setDoc(doc(db, 'users', uid), {
          name: 'Admin Principal',
          email: 'admin@prevencar.com.br',
          role: 'admin'
        });
        console.log('Admin user created successfully');
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log('Admin user already exists');
        } else {
          console.error('Error creating admin user:', error);
        }
      }
    };

    if (useFirestore) {
      initializeAdmin();
    }
  }, [useFirestore]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, fetch profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setCurrentUser({ ...userData, id: user.uid });
            setCurrentView(ViewState.HOME);
          } else {
            console.error('Perfil do usuário não encontrado');
            await signOut(auth);
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
          await signOut(auth);
        }
      } else {
        // User is signed out
        setCurrentUser(undefined);
        setCurrentView(ViewState.LOGIN);
      }
    });
    return unsubscribe;
  }, []);

  // Subscribe to users collection for admin
  useEffect(() => {
    if (!useFirestore || !currentUser || currentUser.role !== 'admin') return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: User[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
      setUsers(usersList);
    }, (err) => {
      console.error('Erro ao sincronizar usuários do Firestore', err);
    });

    return () => unsubscribe();
  }, [useFirestore, currentUser]);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // --- Inspection Logic ---
  const handleStartNewInspection = () => {
    setEditingInspection(null);
    setCurrentView(ViewState.INSPECTION_FORM);
  };

  const handleEditInspection = (inspection: Inspection, options?: { initialStep?: number; focusField?: string }) => {
    setEditingInspection(inspection);
    setEditOptions(options);
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


  const atualizar_status_ficha = (ficha: Inspection) => {
    // Now based on status
    return ficha.status === 'Concluída' ? 'Concluída' : 'Incompleta';
  };

  const handleSaveInspection = (inspection: Inspection) => {
    // Ensure mes_referencia exists: derive from date if missing
    if (!inspection.mes_referencia && inspection.date) {
      const d = new Date(inspection.date);
      inspection.mes_referencia = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }

    // Update ficha completeness before save
    atualizar_status_ficha(inspection);

    // Automatically advance status: Iniciada → No Caixa
    if (inspection.status === 'Iniciada') {
      inspection.status = 'No Caixa';
    }

    // Ensure paymentStatus exists and defaults sensibly
    if (!inspection.paymentStatus) {
      inspection.paymentStatus = 'A pagar';
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
        setInspections(prev => prev.map(i => i.id === inspection.id ? inspection : i));
      } else {
        setInspections(prev => [inspection, ...prev]);
      }
    }
    setCurrentView(ViewState.INSPECTION_LIST);
  };

  // Bulk update inspections: set paymentStatus and status to 'Concluída' if paid, or 'No Caixa' if 'A pagar'
  const handleBulkUpdatePaymentStatus = (ids: string[], newPaymentStatus: string) => {
    // Validate month closure and ficha completeness for each
    const errors: string[] = [];
    const updatedInspections = inspections.map(inspection => {
      if (!ids.includes(inspection.id)) return inspection;



      const isPaid = newPaymentStatus && newPaymentStatus !== 'A pagar';
      // If marking as paid, ensure ficha is in 'No Caixa' or something? But summary allows bulk marking from 'A pagar' to paid.

      const before = { paymentStatus: inspection.paymentStatus, valor: inspection.valor, data_pagamento: inspection.data_pagamento };
      const updated = { ...inspection, paymentStatus: newPaymentStatus as any };
      // If marking as paid, set status to 'Concluída' and data_pagamento
      if (isPaid) {
        updated.status = 'Concluída';
        updated.data_pagamento = new Date().toISOString();
      } else {
        // If 'A pagar', set status to 'No Caixa'
        updated.status = 'No Caixa';
      }
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
      // Since users are now managed via Firebase Auth and Firestore, this is handled in Management.tsx
      // Just update local state for immediate UI update
      setUsers(prev => {
        const existing = prev.find(u => u.id === user.id);
        if (existing) {
          return prev.map(u => u.id === user.id ? user : u);
        } else {
          return [...prev, user];
        }
      });
  };
  const handleDeleteUser = async (id: string) => {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'users', id));
        // Also delete from Auth if possible, but Firebase doesn't allow deleting other users easily
        // For now, just remove from Firestore
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        alert('Erro ao deletar usuário');
      }
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
            <Home changeView={setCurrentView} startNewInspection={handleStartNewInspection} currentUser={currentUser} inspections={inspections} />
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
              options={editOptions}
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