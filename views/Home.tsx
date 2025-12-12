import React from 'react';
import { ViewState, User, Inspection, ServiceItem } from '../types';
import { FilePlus, FileSearch, Users, Settings, FileText, TrendingUp, Calendar, AlertCircle, Check, BarChart3 } from 'lucide-react';

interface HomeProps {
  changeView: (view: ViewState) => void;
  startNewInspection: () => void;
  currentUser?: User;
  inspections: Inspection[];
  services: ServiceItem[];
}

export const Home: React.FC<HomeProps> = ({ changeView, startNewInspection, currentUser, inspections, services }) => {
  const isVistoriador = currentUser?.role === 'vistoriador';

  // Count completed inspections today
  const completedToday = inspections.filter(i => {
    const inspectionDate = new Date(i.date);
    const today = new Date();
    return i.status === 'Concluída' &&
           inspectionDate.getFullYear() === today.getFullYear() &&
           inspectionDate.getMonth() === today.getMonth() &&
           inspectionDate.getDate() === today.getDate();
  }).length;

  // Count pending inspections in caixa
  const pendingInCaixa = inspections.filter(i => i.status === 'No Caixa').length;

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Olá, <span className="text-brand-blue">{currentUser?.name?.split(' ')[0] || 'Usuário'}</span>
            </h1>
            <p className="text-gray-500 mt-1">Aqui está o resumo das atividades de hoje.</p>
        </div>
        <div className="mt-4 md:mt-0 text-right hidden md:block">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Data de Hoje</p>
            <p className="text-lg font-bold text-gray-700 capitalize">
                {new Date().toLocaleDateString('pt-BR')}
            </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isVistoriador ? '' : 'lg:grid-cols-4'} gap-6`}>
        <div 
          onClick={startNewInspection}
          className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-brand-red relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-red-200 group-hover:scale-105 transition-transform">
              <FilePlus size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-brand-red transition-colors">Nova Ficha</h3>
            <p className="text-sm text-gray-500 mt-1">Iniciar nova vistoria</p>
          </div>
        </div>

        <div 
          onClick={() => changeView(ViewState.INSPECTION_LIST)}
          className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-brand-blue relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <FileSearch size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-brand-blue transition-colors">Consultar</h3>
            <p className="text-sm text-gray-500 mt-1">Histórico de fichas</p>
          </div>
        </div>

        {/* Hide these cards for Vistoriador */}
        {!isVistoriador && <div
                onClick={() => changeView(ViewState.MANAGEMENT)}
                className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-brand-mauve relative overflow-hidden"
                >
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-brand-mauve rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-200 group-hover:scale-105 transition-transform">
                    <Users size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-brand-mauve transition-colors">Cadastros</h3>
                    <p className="text-sm text-gray-500 mt-1">Equipe e Indicações</p>
                </div>
                </div> }
        {!isVistoriador && <div
                onClick={() => changeView(ViewState.MANAGEMENT)}
                className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-brand-yellow relative overflow-hidden"
                >
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-yellow-200 group-hover:scale-105 transition-transform">
                    <Settings size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-brand-yellow transition-colors">Serviços</h3>
                    <p className="text-sm text-gray-500 mt-1">Tabela de preços</p>
                </div>
                </div> }
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                    <TrendingUp size={20} />
                    Resumo Operacional
                </h3>
                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-medium">Geral</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Inspections */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Vistorias</p>
                    <p className="text-2xl font-bold text-gray-900">{inspections.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Completed Inspections */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vistorias Concluídas</p>
                    <p className="text-2xl font-bold text-green-600">{inspections.filter(i => i.status === 'Concluída').length}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              {!isVistoriador && <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {inspections.reduce((sum, i) => sum + (i.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-yellow-600" />
                  </div>
                </div> }
            </div>
         </div>

         {/* Services Summary for Admin/Finance */}
         {!isVistoriador && (
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo por Serviço</h3>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50 border-b border-gray-100">
                     <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Serviço</th>
                     <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Quantidade</th>
                     <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Receita</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {services.map(service => {
                     const serviceInspections = inspections.filter(i =>
                       i.selectedServices.some(s => s.name === service.name)
                     );
                     const serviceRevenue = serviceInspections.reduce((sum, i) => {
                       const serviceInInspection = i.selectedServices.find(s => s.name === service.name);
                       return sum + (serviceInInspection?.chargedValue || 0);
                     }, 0);

                     return (
                       <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                         <td className="p-4 font-medium text-gray-800">{service.name}</td>
                         <td className="p-4 text-gray-600">{serviceInspections.length}</td>
                         <td className="p-4 text-gray-600">
                           R$ {serviceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
         )}
      </div>
         
         <div className="bg-gradient-to-br from-brand-blue to-blue-800 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-yellow opacity-10 rounded-full -ml-8 -mb-8"></div>
            
            <div>
                <div className="w-12 h-12 bg-white opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                    <FileText size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold">Continuar Trabalho</h3>
                <p className="text-blue-200 mt-2 text-sm leading-relaxed">
                    Você tem fichas pendentes no caixa.
                </p>
            </div>
            
            <button 
                onClick={() => changeView(ViewState.INSPECTION_LIST)}
                className="mt-6 w-full bg-white text-brand-blue py-3 rounded-xl font-bold hover:bg-brand-yellow hover:text-white transition-all shadow-lg active:scale-95"
            >
                Ir para Fichas
            </button>
         </div>
      </div>
  );
};
