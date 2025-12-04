import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, Truck, Briefcase, Plus, ArrowLeft, Trash2, Edit2, User as UserIcon, Lock, Check, AlertTriangle } from 'lucide-react';
import { User, Indication, ServiceItem, Role } from '../types';

// Export mock fallback data for InspectionForm dropdowns if needed
export const MOCK_INDICATIONS_FALLBACK: Indication[] = [
    { id: '1', name: 'Peças AutoSul', document: '12.345.678/0001-90', phone: '(11) 98888-7777', email: 'contato@autosul.com', cep: '01001-000', address: 'Rua Principal', number: '100' },
    { id: '2', name: 'Mecânica Rápida', document: '98.765.432/0001-10', phone: '(11) 97777-6666', email: 'contato@mecanica.com', cep: '02002-000', address: 'Av Secundaria', number: '200' }
];

export const MOCK_SERVICES_FALLBACK: ServiceItem[] = [
    { id: '1', name: 'Laudo de Transferência', price: 100.00, description: 'Laudo obrigatório para transferência.' },
    { id: '2', name: 'Laudo Cautelar', price: 250.00, description: 'Análise completa da estrutura.' },
    { id: '3', name: 'Vistoria Prévia', price: 150.00, description: 'Para seguradoras.' },
    { id: '4', name: 'Pesquisa', price: 50.00, description: 'Pesquisa de débitos e restrições.' },
    { id: '5', name: 'Prevenscan', price: 300.00, description: 'Scanner completo.' }
];

export { MOCK_INDICATIONS_FALLBACK as MOCK_INDICATIONS, MOCK_SERVICES_FALLBACK as MOCK_SERVICES };

interface ManagementProps {
    currentUser?: User;
    // Data Props
    users: User[];
    indications: Indication[];
    services: ServiceItem[];
    // Handlers
    onSaveUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
    onSaveIndication: (indication: Indication) => void;
    onDeleteIndication: (id: string) => void;
    onSaveService: (service: ServiceItem) => void;
    onDeleteService: (id: string) => void;
}

// Helper for masks
const maskDocument = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .slice(0, 15);
};

export const Management: React.FC<ManagementProps> = ({ 
    currentUser,
    users, indications, services,
    onSaveUser, onDeleteUser,
    onSaveIndication, onDeleteIndication,
    onSaveService, onDeleteService
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'indications' | 'services' | 'profile'>('profile');
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});
  const [indicationForm, setIndicationForm] = useState<Partial<Indication>>({});
  const [serviceForm, setServiceForm] = useState<Partial<ServiceItem>>({});

  // Profile Form
  const [profileForm, setProfileForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (currentUser && currentUser.role === 'vistoriador') {
        setActiveTab('profile');
    }
  }, [currentUser]);

  useEffect(() => {
      if(currentUser) {
          setProfileForm({ ...currentUser, password: '' });
      }
  }, [currentUser]);

  const handleTabChange = (tab: any) => {
      setActiveTab(tab);
      setViewMode('list');
      setEditingId(null);
  };

  // --- CRUD Handlers ---

  const prepareCreate = (type: 'user' | 'indication' | 'service') => {
      setEditingId(null);
      if(type === 'user') setUserForm({});
      if(type === 'indication') setIndicationForm({});
      if(type === 'service') setServiceForm({});
      setViewMode('form');
  };

  const prepareEdit = (id: string, type: 'user' | 'indication' | 'service') => {
      setEditingId(id);
      if(type === 'user') {
          const item = users.find(u => u.id === id);
          if(item) setUserForm(item);
      }
      if(type === 'indication') {
          const item = indications.find(i => i.id === id);
          if(item) setIndicationForm(item);
      }
      if(type === 'service') {
          const item = services.find(s => s.id === id);
          if(item) setServiceForm(item);
      }
      setViewMode('form');
  };

  const submitUser = (e: React.FormEvent) => {
      e.preventDefault();
      let userToSave = { ...userForm, role: userForm.role || 'vistoriador' } as User;
      if (editingId && !userToSave.password) {
          const existing = users.find(u => u.id === editingId);
          if (existing) userToSave.password = existing.password;
      }
      onSaveUser(userToSave);
      setViewMode('list');
  };

  const submitIndication = (e: React.FormEvent) => {
      e.preventDefault();
      onSaveIndication(indicationForm as Indication);
      setViewMode('list');
  };

  const submitService = (e: React.FormEvent) => {
      e.preventDefault();
      onSaveService(serviceForm as ServiceItem);
      setViewMode('list');
  };

  // Profile Update (Mock)
  const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Dados atualizados com sucesso!");
  };

  const isAdmin = currentUser?.role === 'admin';
  const isFinance = currentUser?.role === 'financeiro';
  
  const isProfileReadOnly = currentUser?.role !== 'admin';

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl shadow-sm inline-flex flex-wrap gap-2 border border-gray-100">
        <button
            onClick={() => handleTabChange('profile')}
            className={`py-2 px-6 rounded-lg font-medium flex items-center gap-2 transition-all duration-200
                ${activeTab === 'profile' 
                ? 'bg-brand-blue text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-brand-blue'}`}
        >
            <UserIcon size={18} /> Meus Dados
        </button>
        
        {(isAdmin || isFinance) && (
            <>
                <button
                    onClick={() => handleTabChange('users')}
                    className={`py-2 px-6 rounded-lg font-medium flex items-center gap-2 transition-all duration-200
                    ${activeTab === 'users' 
                        ? 'bg-brand-blue text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-brand-blue'}`}
                >
                    <Users size={18} /> Equipe
                </button>
                <button
                    onClick={() => handleTabChange('indications')}
                    className={`py-2 px-6 rounded-lg font-medium flex items-center gap-2 transition-all duration-200
                    ${activeTab === 'indications' 
                        ? 'bg-brand-blue text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-brand-blue'}`}
                >
                    <Truck size={18} /> Indicações
                </button>
                <button
                    onClick={() => handleTabChange('services')}
                    className={`py-2 px-6 rounded-lg font-medium flex items-center gap-2 transition-all duration-200
                    ${activeTab === 'services' 
                        ? 'bg-brand-blue text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-brand-blue'}`}
                >
                    <Briefcase size={18} /> Serviços
                </button>
            </>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
        
        {/* ================= PROFILE TAB ================= */}
        {activeTab === 'profile' && (
             <div className="animate-fade-in max-w-2xl">
                 <div className="mb-6 border-b pb-4 flex justify-between items-start">
                     <div>
                        <h2 className="text-xl font-bold text-gray-800">Minha Conta</h2>
                        <p className="text-gray-500 text-sm">Informações de cadastro</p>
                     </div>
                     {isProfileReadOnly && (
                         <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2 border border-blue-100">
                             <Lock size={14} /> <span>Modo Leitura</span>
                         </div>
                     )}
                 </div>
                 
                 <form onSubmit={handleUpdateProfile} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Input 
                            label="Nome" 
                            value={profileForm.name || ''} 
                            onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                            className="bg-gray-50" 
                            disabled={isProfileReadOnly}
                        />
                         <Input 
                            label="Email" 
                            value={profileForm.email || ''} 
                            readOnly 
                            className="bg-gray-100 text-gray-500 cursor-not-allowed" 
                            disabled
                        />
                         <div className="md:col-span-2">
                             <Input 
                                label="Nova Senha (Opcional)" 
                                type="password" 
                                placeholder={isProfileReadOnly ? "Alteração restrita ao administrador" : "Deixe em branco para manter a atual"} 
                                value={profileForm.password || ''} 
                                onChange={e => setProfileForm({...profileForm, password: e.target.value})} 
                                className="bg-gray-50"
                                disabled={isProfileReadOnly}
                            />
                         </div>
                     </div>
                     
                     {!isProfileReadOnly ? (
                        <div className="flex justify-end pt-4">
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                <Check size={18} className="mr-2" /> Salvar Alterações
                            </Button>
                        </div>
                     ) : (
                         <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3 text-yellow-700 text-sm border border-yellow-100">
                             <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                             <p>Para atualizar suas informações de cadastro ou senha, entre em contato com o administrador do sistema.</p>
                         </div>
                     )}
                 </form>
             </div>
        )}

        {/* ================= USERS TAB ================= */}
        {activeTab === 'users' && (isAdmin || isFinance) && (
          <div className="animate-fade-in">
            {viewMode === 'list' ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Equipe</h2>
                            <p className="text-gray-500 text-sm">Gerencie o acesso ao sistema</p>
                        </div>
                        <Button onClick={() => prepareCreate('user')} className="w-full md:w-auto bg-brand-mauve hover:bg-pink-900 shadow-md shadow-pink-100">
                            <Plus size={18} className="mr-2"/> Novo Usuário
                        </Button>
                    </div>
                    
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Nome</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Email</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Função</th>
                                    <th className="p-4 text-right font-semibold text-gray-600 text-sm uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{user.name}</td>
                                        <td className="p-4 text-gray-600">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider 
                                                ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 
                                                  user.role === 'financeiro' ? 'bg-green-100 text-green-700' : 
                                                  'bg-gray-100 text-gray-600'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end items-center gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => prepareEdit(user.id, 'user')} 
                                                className="text-gray-400 hover:text-brand-blue p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm("Confirmar exclusão deste usuário?")) {
                                                        onDeleteUser(user.id);
                                                    }
                                                }} 
                                                className="text-gray-400 hover:text-brand-red p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Excluir Usuário"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="max-w-2xl mx-auto animate-fade-in">
                    <div className="flex items-center mb-8 pb-4 border-b">
                        <button onClick={() => setViewMode('list')} className="mr-4 text-gray-400 hover:text-brand-blue transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                            <p className="text-gray-500">Dados de acesso</p>
                        </div>
                    </div>
                    <form onSubmit={submitUser} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <Input 
                                label="Nome Completo" 
                                value={userForm.name || ''}
                                onChange={e => setUserForm({...userForm, name: e.target.value})}
                                required
                                className="bg-gray-50"
                            />
                            <Input 
                                label="Email Corporativo" 
                                type="email" 
                                value={userForm.email || ''}
                                onChange={e => setUserForm({...userForm, email: e.target.value})}
                                required 
                                className="bg-gray-50"
                            />
                             <div className="flex flex-col">
                                <label className="text-sm font-semibold text-brand-blue mb-2">Nível de Acesso</label>
                                <select
                                    className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all"
                                    value={userForm.role || 'vistoriador'}
                                    onChange={e => setUserForm({...userForm, role: e.target.value as Role})}
                                >
                                    <option value="vistoriador">Vistoriador</option>
                                    <option value="financeiro">Financeiro</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <Input
                                label="Senha"
                                type="password"
                                value={userForm.password || ''}
                                onChange={e => setUserForm({...userForm, password: e.target.value})}
                                required={!editingId}
                                className="bg-gray-50"
                                placeholder={editingId ? "Deixe em branco para manter a atual" : ""}
                            />
                        </div>
                        
                        <div className="flex justify-between items-center pt-6">
                            {editingId ? (
                                <Button 
                                    type="button" 
                                    variant="danger" 
                                    onClick={() => {
                                        if (window.confirm("Deseja realmente excluir este usuário?")) {
                                            onDeleteUser(editingId);
                                            setViewMode('list');
                                        }
                                    }} 
                                    className="h-12 px-6"
                                >
                                    <Trash2 size={18} className="mr-2"/> Excluir
                                </Button>
                            ) : <div></div>}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setViewMode('list')} className="h-12 px-6">Cancelar</Button>
                                <Button type="submit" className="bg-brand-mauve hover:bg-pink-900 h-12 px-8 text-lg shadow-lg shadow-pink-100">Salvar</Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
          </div>
        )}

        {/* ================= INDICATIONS TAB ================= */}
        {activeTab === 'indications' && (isAdmin || isFinance) && (
          <div className="animate-fade-in">
             {viewMode === 'list' ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Indicações</h2>
                            <p className="text-gray-500 text-sm">Parceiros e Lojistas</p>
                        </div>
                        <Button onClick={() => prepareCreate('indication')} className="w-full md:w-auto bg-brand-blue shadow-md shadow-blue-100">
                            <Truck size={18} className="mr-2"/> Nova Indicação
                        </Button>
                    </div>
                     <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Nome</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Documento</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Contato</th>
                                    <th className="p-4 text-right font-semibold text-gray-600 text-sm uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {indications.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{p.name}</td>
                                        <td className="p-4 text-gray-600 font-mono text-sm">{p.document}</td>
                                        <td className="p-4 text-gray-600 text-sm">{p.phone}</td>
                                        <td className="p-4 text-right flex justify-end items-center gap-2">
                                            <button type="button" onClick={() => prepareEdit(p.id, 'indication')} className="text-gray-400 hover:text-brand-blue p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm("Confirmar exclusão desta indicação?")) {
                                                        onDeleteIndication(p.id);
                                                    }
                                                }}
                                                className="text-gray-400 hover:text-brand-red p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Excluir Indicação"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
             ) : (
                <div className="max-w-2xl mx-auto animate-fade-in">
                    <div className="flex items-center mb-8 pb-4 border-b">
                         <button onClick={() => setViewMode('list')} className="mr-4 text-gray-400 hover:text-brand-blue transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Editar Indicação' : 'Nova Indicação'}</h2>
                        </div>
                    </div>
                    <form onSubmit={submitIndication} className="space-y-6">
                        <Input 
                            label="Razão Social / Nome" 
                            value={indicationForm.name || ''} 
                            onChange={e => setIndicationForm({...indicationForm, name: e.target.value})} 
                            required 
                            className="bg-gray-50" 
                        />
                        <Input 
                            label="CNPJ / CPF" 
                            value={indicationForm.document || ''} 
                            onChange={e => setIndicationForm({...indicationForm, document: maskDocument(e.target.value)})} 
                            required 
                            className="bg-gray-50" 
                            maxLength={18}
                            placeholder="00.000.000/0000-00"
                        />
                        <Input 
                            label="Telefone" 
                            value={indicationForm.phone || ''} 
                            onChange={e => setIndicationForm({...indicationForm, phone: maskPhone(e.target.value)})} 
                            className="bg-gray-50" 
                            maxLength={15}
                            placeholder="(00) 00000-0000"
                        />
                        <Input label="Email" value={indicationForm.email || ''} onChange={e => setIndicationForm({...indicationForm, email: e.target.value})} className="bg-gray-50" />
                        
                        <div className="flex justify-between items-center pt-6">
                            {editingId ? (
                                <Button 
                                    type="button" 
                                    variant="danger" 
                                    onClick={() => {
                                        if (window.confirm("Deseja realmente excluir esta indicação?")) {
                                            onDeleteIndication(editingId);
                                            setViewMode('list');
                                        }
                                    }} 
                                    className="h-12 px-6"
                                >
                                    <Trash2 size={18} className="mr-2"/> Excluir
                                </Button>
                            ) : <div></div>}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setViewMode('list')} className="h-12 px-6">Cancelar</Button>
                                <Button type="submit" className="bg-brand-blue h-12 px-8 text-lg shadow-lg shadow-blue-100">Salvar</Button>
                            </div>
                        </div>
                    </form>
                </div>
             )}
          </div>
        )}

        {/* ================= SERVICES TAB ================= */}
        {activeTab === 'services' && (isAdmin || isFinance) && (
          <div className="animate-fade-in">
            {viewMode === 'list' ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Serviços</h2>
                            <p className="text-gray-500 text-sm">Catálogo de preços</p>
                        </div>
                        <Button onClick={() => prepareCreate('service')} className="w-full md:w-auto bg-brand-yellow text-gray-900 hover:bg-yellow-500 hover:text-white shadow-md shadow-yellow-100">
                            <Briefcase size={18} className="mr-2"/> Novo Serviço
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Serviço</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Valor</th>
                                    <th className="p-4 text-right font-semibold text-gray-600 text-sm uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {services.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-800">{s.name}</td>
                                        <td className="p-4 font-medium text-green-700">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)}
                                        </td>
                                        <td className="p-4 text-right flex justify-end items-center gap-2">
                                             <button type="button" onClick={() => prepareEdit(s.id, 'service')} className="text-gray-400 hover:text-brand-blue p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm("Confirmar exclusão deste serviço?")) {
                                                        onDeleteService(s.id);
                                                    }
                                                }} 
                                                className="text-gray-400 hover:text-brand-red p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Excluir Serviço"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                 <div className="max-w-2xl mx-auto animate-fade-in">
                    <div className="flex items-center mb-8 pb-4 border-b">
                         <button onClick={() => setViewMode('list')} className="mr-4 text-gray-400 hover:text-brand-blue transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                        </div>
                    </div>
                    <form onSubmit={submitService} className="space-y-6">
                        <Input label="Nome do Serviço" value={serviceForm.name || ''} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} required className="bg-gray-50" />
                        <Input label="Preço (R$)" type="number" step="0.01" value={serviceForm.price || ''} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})} required className="bg-gray-50" />
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-brand-blue mb-2">Descrição</label>
                            <textarea
                                className="border-2 border-gray-200 rounded-lg px-4 py-3 h-32 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all resize-none"
                                value={serviceForm.description || ''}
                                onChange={e => setServiceForm({...serviceForm, description: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-6">
                             {editingId ? (
                                <Button 
                                    type="button" 
                                    variant="danger" 
                                    onClick={() => {
                                        if (window.confirm("Deseja realmente excluir este serviço?")) {
                                            onDeleteService(editingId);
                                            setViewMode('list');
                                        }
                                    }} 
                                    className="h-12 px-6"
                                >
                                    <Trash2 size={18} className="mr-2"/> Excluir
                                </Button>
                            ) : <div></div>}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setViewMode('list')} className="h-12 px-6">Cancelar</Button>
                                <Button type="submit" className="bg-brand-yellow text-gray-900 hover:bg-yellow-500 hover:text-white h-12 px-8 text-lg shadow-lg shadow-yellow-100">Salvar</Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};