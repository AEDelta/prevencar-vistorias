import React, { useState } from 'react';
import { Inspection, ViewState, User, PaymentMethod } from '../types';
import { Button } from '../components/ui/Button';
import { Edit2, Trash2, Search, Plus, Eye, FileText, Download, Filter, X } from 'lucide-react';
import { InspectionForm } from './InspectionForm';
import { MOCK_INDICATIONS, MOCK_SERVICES } from './Management';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface InspectionListProps {
    inspections: Inspection[];
    onEdit: (inspection: Inspection, options?: { initialStep?: number; focusField?: string }) => void;
    onDelete: (id: string) => void;
    changeView: (view: ViewState) => void;
    onCreate: () => void;
    currentUser?: User;
    onBulkUpdate: (ids: string[], newStatus: string) => void;
     onBulkPaymentUpdate?: (ids: string[], newPaymentStatus: string) => void;
}

export const InspectionList: React.FC<InspectionListProps> = ({ inspections, onEdit, onDelete, onCreate, currentUser, onBulkUpdate, onBulkPaymentUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Iniciada' | 'No Caixa' | 'Concluída'>('Todos');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [filterIndication, setFilterIndication] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'All' | PaymentMethod>('All');
  
  // Value Range
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [viewOnlyItem, setViewOnlyItem] = useState<Inspection | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const filtered = inspections.filter(i => {
    // Text Search
    const matchesSearch = 
        i.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status
    const matchesStatus = filterStatus === 'Todos' || i.status === filterStatus;
    
    // Date Range
    const iDate = new Date(i.date);
    const start = dateStart ? new Date(dateStart) : null;
    const end = dateEnd ? new Date(dateEnd) : null;
    const matchesDate = (!start || iDate >= start) && (!end || iDate <= end);
    
    // Indication Filter
    const matchesIndication = !filterIndication || i.indicationId === filterIndication;

    // Service Filter
    const matchesService = !filterService || i.selectedServices.some(sel => sel.name === filterService);

    // Payment Status Filter
    const matchesPaymentStatus = filterPaymentStatus === 'All' || i.paymentStatus === filterPaymentStatus;

    // Value Range
    const val = i.totalValue || 0;
    const min = minValue ? parseFloat(minValue) : 0;
    const max = maxValue ? parseFloat(maxValue) : Infinity;
    const matchesValue = val >= min && val <= max;
    
    return matchesSearch && matchesStatus && matchesDate && matchesIndication && matchesService && matchesValue && matchesPaymentStatus;
  });

  // Totals Calculation
   const totalValue = inspections.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
     const totalPaid = inspections.filter(i => i.paymentStatus && i.paymentStatus !== 'A pagar' && i.status === 'Concluída').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
     const totalPendingAtCashier = inspections.filter(i => i.status === 'No Caixa' && i.paymentStatus === 'A pagar').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
     const totalPendingOther = inspections.filter(i => i.status !== 'No Caixa' && i.paymentStatus === 'A pagar').length;

  // Counts
  const totalCount = inspections.length;
  const completedCount = inspections.filter(i => i.status === 'Concluída').length;
  const pendingPaymentCount = inspections.filter(i => i.paymentStatus === 'A pagar').length;
  const awaitingCount = inspections.filter(i => i.status === 'No Caixa').length;

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      if (filtered.length === 0) {
        alert('Nenhum registro para exportar');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (type === 'excel') {
        exportToExcel(filtered, `vistorias_${timestamp}.xlsx`);
      } else {
        await exportToPDF(filtered, `vistorias_${timestamp}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar. Verifique o console para mais detalhes.');
    }
  };


  const clearFilters = () => {
      setFilterStatus('Todos');
      setDateStart('');
      setDateEnd('');
      setFilterIndication('');
      setFilterService('');
      setMinValue('');
      setMaxValue('');
  };

  if (viewOnlyItem) {
      return <InspectionForm inspectionToEdit={viewOnlyItem} onSave={() => {}} onCancel={() => setViewOnlyItem(null)} readOnly={true} />;
  }

  const isVistoriador = currentUser?.role === 'vistoriador';

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                 <h1 className="text-2xl font-bold text-gray-800">Fichas de Vistoria</h1>
                 <p className="text-gray-500 text-sm">Consulte e gerencie os registros</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                 <Button onClick={() => handleExport('excel')} variant="outline" className="flex-1 md:flex-none">
                    <Download size={18} className="mr-2" /> Excel
                 </Button>
                 <Button onClick={() => handleExport('pdf')} variant="outline" className="flex-1 md:flex-none">
                    <FileText size={18} className="mr-2" /> PDF
                 </Button>
                <Button onClick={onCreate} className="flex-1 md:flex-none shadow-lg shadow-red-200">
                    <Plus size={20} className="mr-2" /> Nova Vistoria
                </Button>
            </div>
        </div>

        {/* Operational Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
                <p className="text-blue-600 text-xs uppercase font-bold">Total de Vistorias</p>
                <p className="text-3xl font-bold text-blue-700">{totalCount}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100">
                <p className="text-green-600 text-xs uppercase font-bold">Completas</p>
                <p className="text-3xl font-bold text-green-700">{completedCount}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-100">
                <p className="text-yellow-600 text-xs uppercase font-bold">No Caixa</p>
                <p className="text-3xl font-bold text-yellow-700">{awaitingCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                <p className="text-red-600 text-xs uppercase font-bold">Pagamentos Pendentes</p>
                <p className="text-3xl font-bold text-red-700">{pendingPaymentCount}</p>
            </div>
        </div>

        {/* Financial Summary Cards - HIDDEN FOR VISTORIADOR */}
        {!isVistoriador && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs uppercase font-bold">Total Geral</p>
                    <p className="text-2xl font-bold text-brand-blue">{formatCurrency(totalValue)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100">
                    <p className="text-green-600 text-xs uppercase font-bold">Total Pago (Concluído)</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-green-600">Formas: Débito, Crédito, Dinheiro, Pix</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-100">
                    <p className="text-orange-600 text-xs uppercase font-bold">No Caixa (Pendente)</p>
                    <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalPendingAtCashier)}</p>
                    <p className="text-xs text-orange-600">Forma: Não selecionada</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                    <p className="text-red-600 text-xs uppercase font-bold">Outros Pendentes</p>
                    <p className="text-2xl font-bold text-red-700">{totalPendingOther}</p>
                    <p className="text-xs text-red-600">Forma: A pagar</p>
                </div>
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Buscar por placa, modelo ou cliente..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`${showFilters ? 'bg-blue-50 border-brand-blue text-brand-blue' : ''}`}>
                        <Filter size={18} className="mr-2"/> Filtros Avançados
                    </Button>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                         {/* Date Range */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Data Inicial</label>
                            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Data Final</label>
                            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                        </div>

                        {/* Status */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Status</label>
                            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)}>
                                <option value="Todos">Todos</option>
                                <option value="Iniciada">Pagamentos Pendentes</option>
                                <option value="No Caixa">No Caixa</option>
                                <option value="Concluída">Concluída</option>
                            </select>
                        </div>
                        
                         {/* Indication */}
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500">Indicação</label>
                             <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterIndication} onChange={(e) => setFilterIndication(e.target.value)}>
                                <option value="">Todas</option>
                                {MOCK_INDICATIONS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                        </div>

                         {/* Service */}
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500">Serviço</label>
                             <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                                <option value="">Todos</option>
                                {MOCK_SERVICES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        

                                {/* Payment Status */}
                                <div className="space-y-1">
                                      <label className="text-xs font-bold text-gray-500">Status do Pagamento</label>
                                      <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value as any)}>
                                          <option value="All">Todos</option>
                                             <option value="A pagar">A pagar</option>
                                             <option value="Pix">Pix</option>
                                             <option value="Dinheiro">Dinheiro</option>
                                             <option value="Crédito">Crédito</option>
                                             <option value="Débito">Débito</option>
                                      </select>
                                </div>

                        {/* Value Range */}
                        <div className="space-y-1 md:col-span-2">
                             <label className="text-xs font-bold text-gray-500">Faixa de Valor (R$)</label>
                             <div className="flex gap-2">
                                <input type="number" placeholder="Min" className="w-full px-3 py-2 border rounded-lg text-sm" value={minValue} onChange={(e) => setMinValue(e.target.value)} />
                                <input type="number" placeholder="Max" className="w-full px-3 py-2 border rounded-lg text-sm" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
                             </div>
                        </div>

                        <div className="md:col-span-4 flex justify-end">
                            <button onClick={clearFilters} className="text-xs text-brand-red flex items-center hover:underline">
                                <X size={12} className="mr-1"/> Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}

                {/* Bulk Actions: mostrar para admin/financeiro sempre (permissão) */}
                {(currentUser?.role === 'admin' || currentUser?.role === 'financeiro') && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="text-sm text-green-700">
                            <strong>{selectedIds.length}</strong> item(s) selecionado(s)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    if (selectedIds.length === 0) {
                                        alert('Nenhum item selecionado');
                                        return;
                                    }
                                    const statuses = ['Iniciada', 'No Caixa', 'Concluída'];
                                    const newStatus = window.prompt(`Novo status:\n${statuses.join('\n')}`, 'Concluída');
                                    if (!newStatus || !statuses.includes(newStatus)) return;
                                    if (!window.confirm(`Deseja alterar ${selectedIds.length} item(s) para status "${newStatus}"?`)) return;
                                    onBulkUpdate(selectedIds, newStatus);
                                    setSelectedIds([]);
                                }}
                                className={`bg-blue-600 hover:bg-blue-700 ${selectedIds.length === 0 ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                                Alterar Status
                            </Button>
                            <Button
                                onClick={() => {
                                    if (selectedIds.length === 0) {
                                        alert('Nenhum item selecionado');
                                        return;
                                    }
                                    const methods = ['Pix', 'Dinheiro', 'Crédito', 'Débito', 'Pago'];
                                    const paymentMethod = window.prompt(`Qual foi a forma de pagamento?\n${methods.join('\n')}`, 'Dinheiro');
                                    if (!paymentMethod || !methods.includes(paymentMethod)) return;
                                    if (!window.confirm(`Deseja marcar ${selectedIds.length} item(s) como pago via ${paymentMethod}?`)) return;
                                    onBulkPaymentUpdate(selectedIds, paymentMethod);
                                    setSelectedIds([]);
                                }}
                                className={`bg-green-600 hover:bg-green-700 ${selectedIds.length === 0 ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                                Marcar como Pagos
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="p-4">Data</th>
                            <th className="p-4">Veículo</th>
                            <th className="p-4">Cliente / Indicação</th>
                            <th className="p-4">Vistoriador</th>
                            <th className="p-4">Pagamento</th>
                            <th className="p-4">Valor</th>
                            <th className="p-4">NF-e</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedIds(filtered.map(i => i.id));
                                        } else {
                                            setSelectedIds([]);
                                        }
                                    }}
                                    className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                                />
                            </th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length > 0 ? filtered.map((item) => (
                            <tr key={item.id} className={`hover:bg-blue-50/30 transition-colors group ${item.paymentStatus === 'A pagar' ? 'bg-orange-50' : ''}`}>
                                <td className="p-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                                    {new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800">{item.licensePlate}</span>
                                        <span className="text-xs text-gray-500">{item.vehicleModel}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-700">
                                    <div className="font-medium">{item.client.name}</div>
                                    {item.indicationName && <div className="text-xs text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">Ind: {item.indicationName}</div>}
                                </td>
                                <td className="p-4 text-sm text-gray-600">{item.inspector || '-'}</td>
                                <td className="p-4 text-sm text-gray-600">
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'financeiro') && item.paymentStatus === 'A pagar' ? (
                                        editingPaymentId === item.id ? (
                                            <select
                                                className="w-full px-2 py-1 border rounded text-xs"
                                                value=""
                                                onChange={(e) => {
                                                    const method = e.target.value;
                                                    const newStatus = method;
                                                    onBulkPaymentUpdate([item.id], newStatus);
                                                    setEditingPaymentId(null);
                                                }}
                                                onBlur={() => setEditingPaymentId(null)}
                                                autoFocus
                                            >
                                                <option value="">Selecione método...</option>
                                                <option value="Pix">Pix</option>
                                                <option value="Dinheiro">Dinheiro</option>
                                                <option value="Crédito">Crédito</option>
                                                <option value="Débito">Débito</option>
                                            </select>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="text-xs px-2 py-1"
                                                onClick={() => setEditingPaymentId(item.id)}
                                            >
                                                A pagar (pendente)
                                            </Button>
                                        )
                                    ) : (
                                        <span className={item.paymentStatus === 'A pagar' ? 'text-red-600 font-semibold' : ''}>
                                            {item.paymentStatus === 'A pagar' ? 'A pagar (pendente)' : item.paymentStatus || '-'}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-sm font-bold text-gray-700">
                                    {isVistoriador ? 'R$ ***' : formatCurrency(item.totalValue)}
                                </td>
                                <td className="p-4">
                                    {item.nfe ? (
                                        <span className="text-green-600 font-semibold">Emitida</span>
                                    ) : (
                                        <Button onClick={() => onEdit(item, { initialStep: 2, focusField: 'nfe' })} variant="outline" className="text-xs px-2 py-1">
                                            Não emitida
                                        </Button>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                        item.paymentStatus === 'A pagar'
                                            ? 'bg-red-50 text-red-700 border-red-100'
                                            : item.status === 'Concluída'
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : item.status === 'No Caixa'
                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            : item.status === 'Iniciada'
                                            ? 'bg-red-50 text-red-700 border-red-100'
                                            : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                            item.paymentStatus === 'A pagar' ? 'bg-red-500' :
                                            item.status === 'Concluída' ? 'bg-green-500' :
                                            item.status === 'No Caixa' ? 'bg-yellow-500' :
                                            item.status === 'Iniciada' ? 'bg-red-500' :
                                            'bg-gray-500'
                                        }`}></span>
                                        {item.status === 'No Caixa' ? 'No Caixa' : item.paymentStatus === 'A pagar' ? 'Pagamento Pendente' : item.status === 'Iniciada' ? 'Pagamentos Pendentes' : item.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'financeiro') && (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds([...selectedIds, item.id]);
                                                } else {
                                                    setSelectedIds(selectedIds.filter(id => id !== item.id));
                                                }
                                            }}
                                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                                        />
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                         <button 
                                            type="button"
                                            onClick={() => setViewOnlyItem(item)} 
                                            className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors" 
                                            title="Visualizar"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {(currentUser?.role === 'admin' || currentUser?.role === 'financeiro' || (currentUser?.role === 'vistoriador' && (item.inspector === currentUser.name || item.status === 'Iniciada'))) && (
                                            <button 
                                                type="button"
                                                onClick={() => onEdit(item)} 
                                                className="p-2 text-gray-400 hover:text-brand-yellow hover:bg-yellow-50 rounded-lg transition-colors" 
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        )}
                                        {/* HIDE DELETE BUTTON FOR VISTORIADOR */}
                                        {!isVistoriador && (
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm("Deseja excluir esta ficha permanentemente?")) {
                                                        onDelete(item.id);
                                                    }
                                                }} 
                                                className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors" 
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={10} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Search size={48} className="mb-4 opacity-20" />
                                        <p className="text-lg font-medium text-gray-500">Nenhum resultado encontrado</p>
                                        <p className="text-sm mt-1">Tente ajustar os filtros ou busque por outro termo.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                <span>Mostrando {filtered.length} registros</span>
                <div className="space-x-2">
                    <button className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50" disabled>Anterior</button>
                    <button className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50" disabled>Próximo</button>
                </div>
            </div>
        </div>
    </div>
  );
};