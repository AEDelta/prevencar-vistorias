import React, { useState, useEffect } from 'react';
import { Inspection, PaymentMethod, Inspector, Indication, User, VehicleCategory, SelectedService } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, ArrowRight, DollarSign, Send, CheckSquare, Square, Trash2, FileText, Download, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { MOCK_INDICATIONS, MOCK_SERVICES } from './Management';
import { exportInspectionDetailToPDF } from '../utils/exportUtils';

interface InspectionFormProps {
  inspectionToEdit?: Inspection | null;
  onSave: (inspection: Inspection) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
  currentUser?: User;
  options?: { initialStep?: number; focusField?: string };
}

// Masks helpers
const maskCpfCnpj = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const length = cleaned.length;

  if (length <= 11) {
    // CPF mask: 000.000.000-00
    return cleaned
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14); // 11 digits + dots and dash
  } else {
    // CNPJ mask: 00.000.000/0000-00
    return cleaned
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  }
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

const validateNfe = (value: string): string | null => {
    if (!value.trim()) return null; // Allow empty
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 8) return 'NF-e deve ter pelo menos 8 dígitos numéricos';
    if (cleaned !== value.replace(/\D/g, '')) return 'Apenas números são permitidos';
    return null;
};

const validatePlate = (value: string): string | null => {
    if (!value.trim()) return 'Identificação do veículo é obrigatória';
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length < 7) return 'Identificação deve ter pelo menos 7 caracteres alfanuméricos';
    return null;
};

export const InspectionForm: React.FC<InspectionFormProps> = ({
    inspectionToEdit,
    onSave,
    onCancel,
    onDelete,
    readOnly = false,
    currentUser,
    options
}) => {
    const [step, setStep] = useState(1);
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [isStep1Complete, setIsStep1Complete] = useState(false);
    const [nfeError, setNfeError] = useState<string | null>(null);
    const [plateError, setPlateError] = useState<string | null>(null);
    const [serviceErrors, setServiceErrors] = useState<{ [serviceName: string]: string | null }>({});
    const canEditStep1 = !readOnly && (!(inspectionToEdit?.status === 'Concluída') || currentUser?.role === 'admin');
  const [formData, setFormData] = useState<Partial<Inspection>>({
    date: new Date().toISOString().split('T')[0],
    status: 'Iniciada',
    paymentStatus: 'A pagar',
    selectedServices: [],
    vehicleCategory: 'Automóveis',
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
      if (options?.initialStep) {
        setStep(options.initialStep);
      }
      if (inspectionToEdit.nfe) {
        setNfeError(validateNfe(inspectionToEdit.nfe));
      }
      if (inspectionToEdit.licensePlate) {
        setPlateError(validatePlate(inspectionToEdit.licensePlate));
      }
    } else if (currentUser) {
            const firstName = currentUser.name.split(' ')[0];
            setFormData(prev => ({ ...prev, inspector: firstName }));
    }
  }, [inspectionToEdit, currentUser, options]);

  // Update service base values when category changes
  useEffect(() => {
    if (formData.vehicleCategory) {
      setFormData(prev => ({
        ...prev,
        selectedServices: prev.selectedServices?.map(sel => {
          const service = MOCK_SERVICES.find(s => s.name === sel.name);
          if (service) {
            const indication = MOCK_INDICATIONS.find(i => i.id === prev.indicationId);
            const override = indication?.servicePrices ? indication.servicePrices[service.id] : undefined;
            const newBase = override !== undefined ? override : (service.prices[prev.vehicleCategory!] || 0);
            return { ...sel, baseValue: newBase };
          }
          return sel;
        }) || []
      }));
    }
  }, [formData.vehicleCategory]);

  useEffect(() => {
    const errors = validateStep1();
    setIsStep1Complete(errors.length === 0);
  }, [formData]);

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

  const handleNfeChange = (value: string) => {
    handleChange('nfe', value);
    setNfeError(validateNfe(value));
  };

  const handlePlateChange = (value: string) => {
    handleChange('licensePlate', value.toUpperCase());
    setPlateError(validatePlate(value));
  };

  const handleClientChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      client: { ...prev.client!, [field]: value }
    }));
  };

  const updateServiceValue = (index: number, field: 'baseValue' | 'chargedValue', value: number) => {
    setFormData(prev => {
      const newServices = [...prev.selectedServices];
      newServices[index] = { ...newServices[index], [field]: value };
      return { ...prev, selectedServices: newServices };
    });
    if (field === 'chargedValue') {
      const serviceName = formData.selectedServices[index].name;
      const error = value <= 0 ? 'Valor deve ser maior que 0' : null;
      setServiceErrors(prev => ({ ...prev, [serviceName]: error }));
    }
  };

  const handleIndicationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const indicationId = e.target.value;
    const indication = MOCK_INDICATIONS.find(i => i.id === indicationId);

    if (indication) {
        setFormData(prev => {
            const updatedServices = prev.selectedServices.map(sel => {
                const service = MOCK_SERVICES.find(s => s.name === sel.name);
                if (service) {
                    const newBase = indication.servicePrices ? indication.servicePrices[service.id] : (service.prices[prev.vehicleCategory!] || 0);
                    return { ...sel, baseValue: newBase };
                }
                return sel;
            });
            return {
                ...prev,
                indicationId: indication.id,
                indicationName: indication.name,
                selectedServices: updatedServices,
                // Auto fill client data if desired
                client: {
                    ...prev.client!,
                    name: indication.name,
                    cpf: indication.document.replace(/\D/g, ''),
                    cep: indication.cep || '',
                    address: indication.address || '',
                    number: indication.number || ''
                }
            };
        });
    } else {
        // Cliente Particular
        setFormData(prev => {
            const updatedServices = prev.selectedServices.map(sel => {
                const service = MOCK_SERVICES.find(s => s.name === sel.name);
                if (service) {
                    return { ...sel, baseValue: service.prices[prev.vehicleCategory!] || 0 };
                }
                return sel;
            });
            return {
                ...prev,
                indicationId: undefined,
                indicationName: undefined,
                selectedServices: updatedServices,
                client: { name: '', cpf: '', address: '', cep: '', number: '', complement: '' }
            };
        });
    }
  };

  const toggleService = (serviceName: string) => {
      setFormData(prev => {
          const current: SelectedService[] = prev.selectedServices || [];
          const existing = current.find(s => s.name === serviceName);
          if (existing) {
              return { ...prev, selectedServices: current.filter(s => s.name !== serviceName) };
          } else {
              const service = MOCK_SERVICES.find(s => s.name === serviceName);
              const baseValue = service?.prices[formData.vehicleCategory!] || 0;
              return { ...prev, selectedServices: [...current, { name: serviceName, baseValue, chargedValue: baseValue }] };
          }
      });
  };

  const calculateTotal = () => {
       return formData.selectedServices?.reduce((sum, sel) => sum + sel.chargedValue, 0) || 0;
   };

   const calculateBaseTotal = () => {
       return formData.selectedServices?.reduce((sum, sel) => sum + sel.baseValue, 0) || 0;
   };

  const calculateServiceDetails = () => {
       const details = formData.selectedServices?.map(sel => {
           const service = MOCK_SERVICES.find(s => s.name === sel.name);
           if (!service) return null;
           const chargedValue = sel.chargedValue;
           const baseValue = sel.baseValue;
           const difference = chargedValue - baseValue;
           return {
               name: sel.name,
               baseValue,
               chargedValue,
               difference,
               subtotal: chargedValue
           };
       }).filter(Boolean) as { name: string; baseValue: number; chargedValue: number; difference: number; subtotal: number }[] || [];
       const totalCharged = details.reduce((sum, d) => sum + d.subtotal, 0);
       const totalDifference = details.reduce((sum, d) => sum + d.difference, 0);
       return { details, totalCharged, totalDifference };
   };

  // Actions
  const handleSendToCashier = (e: React.FormEvent) => {
      e.preventDefault();
      const missing = validateStep1();
      if (missing.length > 0) {
          alert('Preencha os campos obrigatórios antes de enviar ao caixa:\n' + missing.join('\n'));
          return;
      }
      onSave({
          ...formData,
          id: formData.id || Math.random().toString(36).substr(2, 9),
          totalValue: formData.chargedValue || calculateTotal(),
          status: 'No Caixa',
          paymentStatus: formData.paymentStatus
      } as Inspection);
  };

  const handleFinishPayment = (e: React.FormEvent) => {
      e.preventDefault();
      const missing = validateStep1();
      if (missing.length > 0) {
          alert('Preencha os campos obrigatórios antes de finalizar o pagamento:\n' + missing.join('\n'));
          return;
      }
      setStep(2);
  };

  // Validate required fields from Step 1
  const validateStep1 = (): string[] => {
      const errs: string[] = [];
      if (!formData.vehicleModel || String(formData.vehicleModel).trim() === '') errs.push('- Modelo do veículo');
      if (!formData.licensePlate || String(formData.licensePlate).trim() === '') errs.push('- Placa');
      if (!formData.inspector || String(formData.inspector).trim() === '') errs.push('- Vistoriador responsável');
      if (!formData.vehicleCategory || String(formData.vehicleCategory).trim() === '') errs.push('- Categoria do veículo');
      const client = formData.client || {};
      if (!client.name || String(client.name).trim() === '') errs.push('- Nome do cliente');
      const cpfDigits = (client.cpf || '').toString().replace(/\D/g, '');
      if (!cpfDigits || cpfDigits.length < 11) errs.push('- CPF/CNPJ válido do cliente');
      if (!formData.selectedServices || formData.selectedServices.length === 0) errs.push('- Seleção de ao menos 1 serviço');
      return errs;
  };

    const handleFinalSave = (e: React.FormEvent) => {
              e.preventDefault();
              onSave({
                  ...formData,
                  id: formData.id || Math.random().toString(36).substr(2, 9),
                  totalValue: formData.chargedValue || calculateTotal(),
                  status: 'Concluída',
                  paymentStatus: formData.paymentStatus
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
                                    <div className="p-2 bg-gray-50 rounded"><strong>CPF/CNPJ:</strong> {maskCpfCnpj(formData.client?.cpf || '')}</div>
                                    <div className="p-2 bg-gray-50 rounded col-span-2"><strong>Serviços:</strong> {formData.selectedServices?.map(sel => sel.name).join(', ')}</div>
                                    <div className="p-2 bg-gray-50 rounded col-span-2"><strong>Observações:</strong> {formData.observations || '-'}</div>
                                    <div className="p-2 bg-gray-50 rounded"><strong>Status:</strong> {formData.status}</div>
                                    <div className="p-2 bg-gray-50 rounded"><strong>Total:</strong> R$ {formData.totalValue?.toFixed(2)}</div>
                                    <div className="p-2 bg-gray-50 rounded"><strong>Pagamento:</strong> {formData.paymentStatus}</div>
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
                         onChange={e => handleChange('vehicleModel', e.target.value.toUpperCase())}
                         required
                         disabled={!canEditStep1}
                     />
                    <div>
                        <Input
                            label="Identificação do Veículo (Placa/Chassi/Motor)"
                            value={formData.licensePlate || ''}
                            onChange={e => handlePlateChange(e.target.value)}
                            required
                            maxLength={17} // Chassi is 17 chars
                            placeholder="ABC-1234, ABC1D34, Chassi ou Motor"
                            className={formData.licensePlate ? (plateError ? 'border-red-500' : 'border-green-500') : ''}
                            disabled={!canEditStep1}
                        />
                        {formData.licensePlate && (
                            <div className="flex items-center mt-1">
                                {plateError ? (
                                    <>
                                        <XCircle size={16} className="text-red-500 mr-1" />
                                        <span className="text-red-500 text-xs">{plateError}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} className="text-green-500 mr-1" />
                                        <span className="text-green-500 text-xs">Placa válida</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
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
                                className={`${!canEditStep1 ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-brand-blue'} border-2 border-gray-300 rounded-lg px-3 py-2`}
                                value={formData.inspector || ''}
                                onChange={e => handleChange('inspector', e.target.value)}
                                required
                                disabled={!canEditStep1}
                            >
                                <option value="">Selecione...</option>
                                {Object.values(Inspector).map(insp => (
                                <option key={insp} value={insp}>{insp}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="externalInspection"
                            checked={formData.externalInspection || false}
                            onChange={e => handleChange('externalInspection', e.target.checked)}
                            disabled={!canEditStep1}
                            className="mr-2"
                        />
                        <label htmlFor="externalInspection" className="text-sm font-semibold text-brand-blue">Vistoria Externa</label>
                    </div>
                    <div className="flex flex-col mb-4">
                        <label className="text-sm font-semibold text-brand-blue mb-1">Categoria do Veículo *</label>
                        <select
                            className={`${!canEditStep1 ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-brand-blue'} border-2 border-gray-300 rounded-lg px-3 py-2`}
                            value={formData.vehicleCategory || ''}
                            onChange={e => handleChange('vehicleCategory', e.target.value)}
                            required
                            disabled={!canEditStep1}
                        >
                            <option value="">Selecione...</option>
                            {Object.values(VehicleCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Section: Serviços (Checkbox) */}
                <div className="mt-4">
                    <label className="text-sm font-semibold text-brand-blue mb-2 block">Selecione os Serviços</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {MOCK_SERVICES.map(service => (
                            <div
                                key={service.id}
                                onClick={() => canEditStep1 && toggleService(service.name)}
                                className={`${canEditStep1 ? 'cursor-pointer' : 'cursor-not-allowed'} p-3 border-2 rounded-lg flex items-center space-x-3 transition-all ${formData.selectedServices?.some(sel => sel.name === service.name) ? 'border-brand-blue bg-blue-50' : 'border-gray-200'}`}
                            >
                                {formData.selectedServices?.some(sel => sel.name === service.name) ? <CheckSquare className="text-brand-blue"/> : <Square className="text-gray-300"/>}
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">{service.name}</span>
                                    {(() => {
                                        const sel = formData.selectedServices.find(s => s.name === service.name);
                                        if (sel) {
                                            return (
                                                <div className="flex flex-col space-y-1">
                                                    <span className="text-xs text-gray-500">Base: R$ {sel.baseValue.toFixed(2)}</span>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-xs text-gray-500">Cobrado: R$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={sel.chargedValue}
                                                            onChange={(e) => updateServiceValue(formData.selectedServices.findIndex(s => s.name === service.name), 'chargedValue', parseFloat(e.target.value) || 0)}
                                                            className={`text-xs w-16 px-1 py-0.5 border rounded ${serviceErrors[service.name] ? 'border-red-500' : sel.chargedValue > 0 ? 'border-green-500' : 'border-gray-300'}`}
                                                            disabled={!canEditStep1}
                                                        />
                                                        <Edit2 size={12} className="text-gray-500" />
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            const indication = MOCK_INDICATIONS.find(i => i.id === formData.indicationId);
                                            const override = indication?.servicePrices ? indication.servicePrices[service.id] : undefined;
                                            const displayPrice = typeof override === 'number' ? override : (service.prices[formData.vehicleCategory || 'Automóveis'] || 0);
                                            return <span className="text-xs text-green-600 font-bold">R$ {displayPrice.toFixed(2)}</span>;
                                        }
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Serviços Selecionados */}
                {formData.selectedServices.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-bold text-brand-red mb-4">Serviços Selecionados</h3>
                        <div className="space-y-4">
                            {formData.selectedServices.map((sel, index) => (
                                <div key={sel.name} className="p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-semibold mb-2">{sel.name}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Valor Base"
                                            type="number"
                                            step="0.01"
                                            value={sel.baseValue}
                                            onChange={e => updateServiceValue(index, 'baseValue', parseFloat(e.target.value) || 0)}
                                            disabled={!canEditStep1}
                                        />
                                        <div>
                                            <label className="text-sm font-semibold text-brand-blue mb-1">Valor Cobrado</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={sel.chargedValue}
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                                readOnly
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Edite na caixa do serviço acima</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section: Indicação e Cliente */}
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-bold text-brand-red mb-4">Dados do Cliente</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex flex-col mb-4">
                            <label className="text-sm font-semibold text-brand-blue mb-1">Indicação (Opcional)</label>
                            <select
                                className={`${!canEditStep1 ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-brand-blue'} border-2 border-gray-300 rounded-lg px-3 py-2`}
                                value={formData.indicationId || ''}
                                onChange={handleIndicationChange}
                                disabled={!canEditStep1}
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
                            disabled={!canEditStep1}
                        />
                        <Input
                            label="CPF/CNPJ"
                            value={maskCpfCnpj(formData.client?.cpf || '')}
                            onChange={e => handleClientChange('cpf', e.target.value.replace(/\D/g, ''))}
                            required
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            maxLength={18}
                            disabled={!canEditStep1}
                        />
                     </div>
                </div>
                
                 {/* Observações */}
                 <div className="mt-4">
                      <label className="text-sm font-semibold text-brand-blue mb-1">Observações Gerais</label>
                      <textarea
                        className={`${!canEditStep1 ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-brand-blue'} w-full border-2 border-gray-300 rounded-lg px-3 py-2 h-24 resize-none`}
                        value={formData.observations || ''}
                        onChange={e => handleChange('observations', e.target.value)}
                        placeholder="Detalhes adicionais..."
                        disabled={!canEditStep1}
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
                        <Button type="button" onClick={handleSendToCashier} className={`bg-orange-500 hover:bg-orange-600 flex-1 md:flex-none ${!isStep1Complete ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!isStep1Complete}>
                            <Send size={18} className="mr-2" /> Enviar para Caixa
                        </Button>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'financeiro' || currentUser?.role === 'vistoriador') && (
                            <Button type="button" onClick={handleFinishPayment} className={`flex-1 md:flex-none ${!isStep1Complete ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!isStep1Complete}>
                                Finalizar Pagamento <ArrowRight size={18} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            {(() => {
                const { details, totalCharged, totalDifference } = calculateServiceDetails();
                return (
                    <form onSubmit={handleFinalSave}>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-sm">
                            <h4 className="font-bold text-gray-700 mb-2">Resumo da Etapa 01:</h4>
                            <p><span className="font-semibold">Cliente:</span> {formData.client?.name}</p>
                            <p><span className="font-semibold">Serviços:</span> {formData.selectedServices?.map(sel => sel.name).join(', ')}</p>
                             {formData.observations && <p><span className="font-semibold">Obs:</span> {formData.observations}</p>}
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-brand-red mb-4 border-b pb-2">Resumo Financeiro</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300">
                                            <th className="text-left p-2 font-semibold">Serviço</th>
                                            <th className="text-right p-2 font-semibold">Valor Base</th>
                                            <th className="text-right p-2 font-semibold">Valor Cobrado</th>
                                            <th className="text-right p-2 font-semibold">Diferença</th>
                                            <th className="text-right p-2 font-semibold">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.map((detail, idx) => (
                                            <tr key={idx} className="border-b border-gray-200">
                                                <td className="p-2">{detail.name}</td>
                                                <td className="p-2 text-right">R$ {detail.baseValue.toFixed(2)}</td>
                                                <td className="p-2 text-right">R$ {detail.chargedValue.toFixed(2)}</td>
                                                <td className="p-2 text-right">R$ {detail.difference.toFixed(2)}</td>
                                                <td className="p-2 text-right">R$ {detail.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                            <label className="text-sm font-semibold text-brand-blue mb-1">Pagamento</label>
                            <select
                                className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                value={formData.paymentStatus || ''}
                                onChange={e => handleChange('paymentStatus', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="A pagar">A pagar</option>
                                <option value="Pix">Pix</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Crédito">Crédito</option>
                                <option value="Débito">Débito</option>
                            </select>
                        </div>

                        <div>
                            <Input
                                label="Nota Fiscal Eletrônica (NFe)"
                                value={formData.nfe || ''}
                                onChange={e => handleNfeChange(e.target.value)}
                                placeholder="Número da nota"
                                className={formData.nfe ? (nfeError ? 'border-red-500' : 'border-green-500') : ''}
                            />
                            {formData.nfe && (
                                <div className="flex items-center mt-1">
                                    {nfeError ? (
                                        <>
                                            <XCircle size={16} className="text-red-500 mr-1" />
                                            <span className="text-red-500 text-xs">{nfeError}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} className="text-green-500 mr-1" />
                                            <span className="text-green-500 text-xs">NF-e válida</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <Input
                            label="Contato (Telefone/Celular)"
                            value={formData.contact || ''}
                            onChange={e => handleChange('contact', maskPhone(e.target.value))}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                        />
                    </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-green-800 font-medium">Soma dos Valores Cobrados:</span>
                        <span className="text-xl font-bold text-green-700">R$ {totalCharged.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-green-800 font-medium">Soma das Diferenças:</span>
                        <span className="text-xl font-bold text-green-700">R$ {totalDifference.toFixed(2)}</span>
                    </div>
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
                );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};