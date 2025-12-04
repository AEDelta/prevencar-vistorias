import React, { useState, useEffect } from 'react';
import { Inspection, PaymentMethod, Inspector, Indication, User } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, ArrowRight, DollarSign, Send, CheckSquare, Square, Trash2, FileText, Download } from 'lucide-react';
import { MOCK_INDICATIONS, MOCK_SERVICES } from './Management';
import { exportInspectionDetailToPDF } from '../utils/exportUtils';

interface InspectionFormProps {
  inspectionToEdit?: Inspection | null;
  onSave: (inspection: Inspection) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
  currentUser?: User;
}

// Masks helpers
const maskCpfCnpj = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
};

const maskCep = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .slice(0, 15);
};

export const InspectionForm: React.FC<InspectionFormProps> = ({ 
    inspectionToEdit, 
    onSave, 
    onCancel, 
    onDelete, 
    readOnly = false,
    currentUser 
}) => {
  const [step, setStep] = useState(1);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [formData, setFormData] = useState<Partial<Inspection>>({
    date: new Date().toISOString().split('T')[0],
    status: 'Pendente',
    selectedServices: [],
    client: {
        name: '',
        cpf: '',
        address: '',
        cep: '',
        number: '',
        complement: ''
    }
  });

  useEffect(() => {
    if (inspectionToEdit) {
      setFormData(inspectionToEdit);
    } else if (currentUser?.role === 'vistoriador') {
      const firstName = currentUser.name.split(' ')[0];
      setFormData(prev => ({ ...prev, inspector: firstName }));
    }
  }, [inspectionToEdit, currentUser]);

  // Logic to fetch address from CEP
  const handleCepBlur = async () => {
    const cep = formData.client?.cep?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
        setIsLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    client: {
                        ...prev.client!,
                        address: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
                        complement: data.complemento
                    }
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP", error);
        } finally {
            setIsLoadingCep(false);
        }
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      client: { ...prev.client!, [field]: value }
    }));
  };

  const handleIndicationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const indicationId = e.target.value;
    const indication = MOCK_INDICATIONS.find(i => i.id === indicationId);
    
    if (indication) {
        setFormData(prev => ({
            ...prev,
            indicationId: indication.id,
            indicationName: indication.name,
            // Auto fill client data if desired
            client: {
                ...prev.client!,
                name: indication.name,
                cpf: indication.document,
                cep: indication.cep || '',
                address: indication.address || '',
                number: indication.number || ''
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, indicationId: undefined, indicationName: undefined }));
    }
  };

  const toggleService = (serviceName: string) => {
      setFormData(prev => {
          const current = prev.selectedServices || [];
          if (current.includes(serviceName)) {
              return { ...prev, selectedServices: current.filter(s => s !== serviceName) };
          } else {
              return { ...prev, selectedServices: [...current, serviceName] };
          }
      });
  };

  const calculateTotal = () => {
      let total = 0;
      formData.selectedServices?.forEach(sName => {
          const service = MOCK_SERVICES.find(s => s.name === sName);
          if (service) total += service.price;
      });
      return total;
  };

  // Actions
  const handleSendToCashier = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
          ...formData,
          id: formData.id || Math.random().toString(36).substr(2, 9),
          totalValue: calculateTotal(),
          status: 'No Caixa'
      } as Inspection);
  };

  const handleFinishPayment = (e: React.FormEvent) => {
      e.preventDefault();
      setStep(2);
  };

  const handleFinalSave = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        id: formData.id || Math.random().toString(36).substr(2, 9),
        totalValue: calculateTotal(),
        status: 'Concluída'
      } as Inspection);
  };
  
  const handleDeleteClick = () => {
      if (onDelete && formData.id) {
          if (window.confirm("ATENÇÃO: Deseja realmente excluir esta ficha? Esta ação não pode ser desfeita.")) {
              onDelete(formData.id);
              onCancel(); // Go back to list
          }
      }
  };

  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'financeiro';

  if (readOnly) {
      // Simple Read Only View
      const handleExportDetail = async () => {
        try {
          if (formData && formData.id) {
            await exportInspectionDetailToPDF(formData as Inspection);
          }
        } catch (error) {
          console.error('Erro ao exportar:', error);
          alert('Erro ao exportar PDF');
        }
      };

      return (
          <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-brand-blue">Visualizar Ficha</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-2 bg-gray-50 rounded"><strong>Placa:</strong> {formData.licensePlate}</div>
                  <div className="p-2 bg-gray-50 rounded"><strong>Modelo:</strong> {formData.vehicleModel}</div>
                  <div className="p-2 bg-gray-50 rounded"><strong>Cliente:</strong> {formData.client?.name}</div>
                  <div className="p-2 bg-gray-50 rounded"><strong>CPF/CNPJ:</strong> {formData.client?.cpf}</div>
                  <div className="p-2 bg-gray-50 rounded col-span-2"><strong>Serviços:</strong> {formData.selectedServices?.join(', ')}</div>
                  <div className="p-2 bg-gray-50 rounded col-span-2"><strong>Observações:</strong> {formData.observations || '-'}</div>
                  <div className="p-2 bg-gray-50 rounded"><strong>Status:</strong> {formData.status}</div>
                  <div className="p-2 bg-gray-50 rounded"><strong>Total:</strong> R$ {formData.totalValue?.toFixed(2)}</div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleExportDetail} variant="outline" className="flex-1">
                  <FileText size={18} className="mr-2" /> Exportar PDF
                </Button>
                <Button onClick={onCancel} className="flex-1">
                  <ArrowLeft size={18} className="mr-2" /> Voltar
                </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with Progress */}
        <div className="bg-brand-blue p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">
                {inspectionToEdit ? 'Editar Ficha' : 'Nova Vistoria'}
            </h2>
            <div className="flex items-center space-x-4">
                <div className={`flex-1 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-brand-yellow' : 'bg-blue-800'}`}></div>
                <div className={`flex-1 h-2 rounded-full transition-colors ${step >= 2 ? 'bg-brand-yellow' : 'bg-blue-800'}`}></div>
            </div>
            <div className="flex justify-between text-xs mt-2 text-blue-200">
                <span>Etapa 01: Vistoria e Cliente</span>
                <span>Etapa 02: Financeiro e Finalização</span>
            </div>
        </div>

      <div className="p-6 md:p-8">
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <form id="step1-form">
                {/* Section: Dados Iniciais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input
                        label="Modelo do Veículo"
                        value={formData.vehicleModel || ''}
                        onChange={e => handleChange('vehicleModel', e.target.value)}
                        required
                    />
                    <Input
                        label="Placa"
                        value={formData.licensePlate || ''}
                        onChange={e => handleChange('licensePlate', e.target.value.toUpperCase())}
                        required
                        maxLength={8}
                        placeholder="ABC-1234"
                    />
                    <Input
                        label="Data"
                        type="date"
                        value={formData.date}
                        readOnly
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <div className="flex flex-col mb-4">
                        <label className="text-sm font-semibold text-brand-blue mb-1">Vistoriador Responsável</label>
                        {currentUser?.role === 'vistoriador' ? (
                            <input
                                type="text"
                                className="border-2 border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                                value={formData.inspector || ''}
                                readOnly
                            />
                        ) : (
                            <select
                                className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                value={formData.inspector || ''}
                                onChange={e => handleChange('inspector', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {Object.values(Inspector).map(insp => (
                                <option key={insp} value={insp}>{insp}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Section: Serviços (Checkbox) */}
                <div className="mt-4">
                    <label className="text-sm font-semibold text-brand-blue mb-2 block">Selecione os Serviços</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {MOCK_SERVICES.map(service => (
                            <div 
                                key={service.id} 
                                onClick={() => toggleService(service.name)}
                                className={`cursor-pointer p-3 border-2 rounded-lg flex items-center space-x-3 transition-all ${formData.selectedServices?.includes(service.name) ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                {formData.selectedServices?.includes(service.name) ? <CheckSquare className="text-brand-blue"/> : <Square className="text-gray-300"/>}
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">{service.name}</span>
                                    <span className="text-xs text-green-600 font-bold">R$ {service.price.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Indicação e Cliente */}
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-bold text-brand-red mb-4">Dados do Cliente</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex flex-col mb-4">
                            <label className="text-sm font-semibold text-brand-blue mb-1">Indicação (Opcional)</label>
                            <select
                                className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                value={formData.indicationId || ''}
                                onChange={handleIndicationChange}
                            >
                                <option value="">Cliente Particular (Sem indicação)</option>
                                {MOCK_INDICATIONS.map(ind => (
                                <option key={ind.id} value={ind.id}>{ind.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="hidden md:block"></div> {/* Spacer */}
                        
                        <Input
                            label="Nome Completo"
                            value={formData.client?.name || ''}
                            onChange={e => handleClientChange('name', e.target.value)}
                            required
                        />
                        <Input
                            label="CPF/CNPJ"
                            value={formData.client?.cpf || ''}
                            onChange={e => handleClientChange('cpf', maskCpfCnpj(e.target.value))}
                            required
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            maxLength={18}
                        />
                     </div>
                </div>
                
                 {/* Observações */}
                 <div className="mt-4">
                      <label className="text-sm font-semibold text-brand-blue mb-1">Observações Gerais</label>
                      <textarea
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                        value={formData.observations || ''}
                        onChange={e => handleChange('observations', e.target.value)}
                        placeholder="Detalhes adicionais..."
                      />
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-4 mt-8 pt-4 border-t items-center">
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 md:w-32">
                            Cancelar
                        </Button>
                        {/* DELETE BUTTON FOR EDIT MODE */}
                        {inspectionToEdit && canDelete && (
                            <Button type="button" variant="danger" onClick={handleDeleteClick} className="flex-1 md:w-32">
                                <Trash2 size={16} className="mr-2" /> Excluir
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <Button type="button" onClick={handleSendToCashier} className="bg-orange-500 hover:bg-orange-600 flex-1 md:flex-none">
                            <Send size={18} className="mr-2" /> Enviar para Caixa
                        </Button>
                        <Button type="button" onClick={handleFinishPayment} className="flex-1 md:flex-none">
                            Finalizar Pagamento <ArrowRight size={18} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <form onSubmit={handleFinalSave}>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-sm">
                    <h4 className="font-bold text-gray-700 mb-2">Resumo da Etapa 01:</h4>
                    <p><span className="font-semibold">Cliente:</span> {formData.client?.name}</p>
                    <p><span className="font-semibold">Serviços:</span> {formData.selectedServices?.join(', ')}</p>
                     {formData.observations && <p><span className="font-semibold">Obs:</span> {formData.observations}</p>}
                </div>

                <div>
                    <h3 className="text-lg font-bold text-brand-red mb-4 border-b pb-2">Endereço e Pagamento</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Input
                                label="CEP"
                                value={formData.client?.cep || ''}
                                onChange={e => handleClientChange('cep', maskCep(e.target.value))}
                                onBlur={handleCepBlur}
                                placeholder="00000-000"
                                required
                                maxLength={9}
                            />
                            {isLoadingCep && <span className="absolute right-3 top-9 text-xs text-brand-blue animate-pulse">Buscando...</span>}
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                label="Endereço"
                                value={formData.client?.address || ''}
                                onChange={e => handleClientChange('address', e.target.value)}
                                required
                            />
                        </div>
                        <Input
                            label="Número"
                            value={formData.client?.number || ''}
                            onChange={e => handleClientChange('number', e.target.value)}
                            required
                        />
                        <div className="md:col-span-2">
                            <Input
                                label="Complemento"
                                value={formData.client?.complement || ''}
                                onChange={e => handleClientChange('complement', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="flex flex-col mb-4">
                            <label className="text-sm font-semibold text-brand-blue mb-1">Forma de Pagamento</label>
                            <select
                                className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                value={formData.paymentMethod || ''}
                                onChange={e => handleChange('paymentMethod', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {Object.values(PaymentMethod).map(pm => (
                                <option key={pm} value={pm}>{pm}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Nota Fiscal Eletrônica (NFe)"
                            value={formData.nfe || ''}
                            onChange={e => handleChange('nfe', e.target.value)}
                            placeholder="Número da nota"
                        />
                        <Input
                            label="Contato (Telefone/Celular)"
                            value={formData.contact || ''}
                            onChange={e => handleChange('contact', maskPhone(e.target.value))}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                        />
                    </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center mt-6">
                    <span className="text-green-800 font-medium">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-green-700">R$ {calculateTotal().toFixed(2)}</span>
                </div>

                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft size={18} className="mr-2" /> Voltar
                </Button>
                <Button type="submit" className="w-40 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">
                    <Save size={18} className="mr-2" /> Concluir
                </Button>
                </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};