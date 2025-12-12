import React from 'react';
import { Check, FileText, BarChart3 } from 'lucide-react';
import { Inspection, ServiceItem } from '../types';

interface ReportsProps {
  inspections: Inspection[];
  services: ServiceItem[];
}

export const Reports: React.FC<ReportsProps> = ({ inspections, services }) => {
  return (
    <div className="space-y-6">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">Relatório Operacional</h2>
        <p className="text-gray-500 text-sm">Dados resumidos sobre serviços realizados</p>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {inspections.reduce((sum, i) => sum + (i.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Services Summary */}
      <div className="mt-8">
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
    </div>
  );
};