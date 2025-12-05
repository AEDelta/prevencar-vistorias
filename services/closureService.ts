import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { Closure, ClosureLog, Role } from '../types';

// Helper to check role (client-side guard)
export function canManageClosures(role?: Role) {
  return role === 'admin' || role === 'financeiro';
}

const closuresCol = collection(db, 'closures');
const logsCol = collection(db, 'closureLogs');

export async function listClosures() {
  const q = query(closuresCol, orderBy('mes', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getClosure(id: string) {
  const d = await getDoc(doc(closuresCol, id));
  return d.exists() ? ({ id: d.id, ...(d.data() as any) } as Closure) : null;
}

export async function createClosure(closure: Closure, currentUser: { id: string; name: string; role?: Role }) {
  if (!canManageClosures(currentUser.role)) throw new Error('Permissão negada');
  const now = new Date().toISOString();
  const payload = {
    ...closure,
    mes: closure.mes,
    status: 'Em aberto' as const,
    dataFechamento: closure.dataFechamento || null,
    createdAt: serverTimestamp(),
  };
  // Use month as document ID so rules can reference closures/{mes}
  const ref = doc(db, 'closures', closure.mes);
  await setDoc(ref, payload as any);
  await logAction(closure.mes, 'fechamento', currentUser.id, `${currentUser.name} criou fechamento`);
  return closure.mes;
}

export async function approveClosure(id: string, currentUser: { id: string; name: string; role?: Role }) {
  if (!canManageClosures(currentUser.role)) throw new Error('Permissão negada');
  const ref = doc(closuresCol, id);
  await updateDoc(ref, {
    status: 'Aprovado',
    aprovadoPor: currentUser.name,
    dataAprovacao: new Date().toISOString(),
  } as any);
  await logAction(id, 'aprovacao', currentUser.id, `${currentUser.name} aprovou`);
}

export async function rejectClosure(id: string, currentUser: { id: string; name: string; role?: Role }, reason?: string) {
  if (!canManageClosures(currentUser.role)) throw new Error('Permissão negada');
  const ref = doc(closuresCol, id);
  await updateDoc(ref, {
    status: 'Reprovado' as any,
    aprovadoPor: currentUser.name,
    dataAprovacao: new Date().toISOString(),
  } as any);
  await logAction(id, 'reprovacao', currentUser.id, reason || `${currentUser.name} reprovou`);
}

export async function reopenClosure(id: string, currentUser: { id: string; name: string; role?: Role }) {
  if (!canManageClosures(currentUser.role)) throw new Error('Permissão negada');
  const ref = doc(closuresCol, id);
  await updateDoc(ref, {
    status: 'Reaberto',
    reabertoPor: currentUser.name,
    dataReabertura: new Date().toISOString(),
  } as any);
  await logAction(id, 'reabertura', currentUser.id, `${currentUser.name} reabriu`);
}

export async function logAction(closureId: string, action: ClosureLog['action'], performedBy: string, note?: string) {
  const payload: ClosureLog = {
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    note,
  };
  await addDoc(collection(db, `closures/${closureId}/logs`), payload as any);
  // Also add to a top-level logs collection for audit
  await addDoc(logsCol, { closureId, ...payload, createdAt: serverTimestamp() } as any);
}

// Export to PDF placeholder: actual PDF generation should be done server-side or using a client library.
export async function exportClosurePdf(id: string) {
  const closure = await getClosure(id);
  if (!closure) throw new Error('Fechamento não encontrado');
  // For now, return a simple JSON blob URL as placeholder
  const blob = new Blob([JSON.stringify(closure, null, 2)], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

export default {
  listClosures,
  getClosure,
  createClosure,
  approveClosure,
  rejectClosure,
  reopenClosure,
  exportClosurePdf,
  canManageClosures,
};
