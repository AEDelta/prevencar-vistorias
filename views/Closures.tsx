import React, { useEffect, useState } from 'react';
import { Closure } from '../types';
import closureService, { canManageClosures } from '../services/closureService';

interface Props {
  currentUser?: { id: string; name: string; role?: string };
}

export const Closures: React.FC<Props> = ({ currentUser }) => {
  const [items, setItems] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canManageClosures(currentUser?.role as any)) return;
    setLoading(true);
    closureService.listClosures()
      .then((r: any) => setItems(r))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!canManageClosures(currentUser?.role as any)) {
    return <div className="p-6 bg-white rounded-lg shadow">Acesso negado.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Fechamentos Mensais</h3>
        <div className="text-sm text-gray-500">Apenas Admin e Financeiro</div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full table-auto">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Mês</th>
              <th className="p-3 text-left">Vistoriador</th>
              <th className="p-3 text-right">Valor Total</th>
              <th className="p-3 text-left">Data do Fechamento</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="p-6 text-center">Carregando...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center">Nenhum fechamento encontrado.</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{it.mes}</td>
                <td className="p-3">{it.vistoriadorName}</td>
                <td className="p-3 text-right">R$ {Number(it.valorTotal || 0).toFixed(2)}</td>
                <td className="p-3">{it.dataFechamento ? new Date(it.dataFechamento).toLocaleString() : '-'}</td>
                <td className="p-3">{it.status}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    {it.status !== 'Aprovado' && (
                      <button onClick={() => closureService.approveClosure(it.id!, currentUser!).then(() => window.location.reload())}
                        className="px-3 py-1 rounded bg-green-500 text-white text-sm">Aprovar</button>
                    )}
                    {it.status !== 'Reprovado' && (
                      <button onClick={() => closureService.rejectClosure(it.id!, currentUser!, 'Reprovado via UI').then(() => window.location.reload())}
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm">Reprovar</button>
                    )}
                    {it.status !== 'Reaberto' && (
                      <button onClick={() => closureService.reopenClosure(it.id!, currentUser!).then(() => window.location.reload())}
                        className="px-3 py-1 rounded bg-yellow-500 text-white text-sm">Reabrir</button>
                    )}
                    <button onClick={async () => {
                      const url = await closureService.exportClosurePdf(it.id!);
                      window.open(url, '_blank');
                    }} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">PDF</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Closures;
