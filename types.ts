export enum ViewState {
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  HOME = 'HOME',
  INSPECTION_LIST = 'INSPECTION_LIST',
  INSPECTION_FORM = 'INSPECTION_FORM',
  MANAGEMENT = 'MANAGEMENT'
}

export type Role = 'admin' | 'financeiro' | 'vistoriador';

export enum ServiceType {
  LAUDO_TRANSFERENCIA = 'Laudo de Transferência',
  LAUDO_CAUTELAR = 'Laudo Cautelar',
  VISTORIA_SEGURO = 'Vistoria de Seguro',
  PESQUISA = 'Pesquisa',
  LAUDO_REVISTORIA = 'Laudo de Revistoria',
  PREVENSCAN = 'Prevenscan',
  OUTROS = 'Outros'
}

export enum PaymentMethod {
   CREDITO = 'Crédito',
   DEBITO = 'Débito',
   DINHEIRO = 'Dinheiro',
   PIX = 'Pix',
   A_PAGAR = 'A Pagar'
}

// Ficha workflow status: Iniciada (no caixa) or A Finalizar (concluída)
export type InspectionStatus = 'Iniciada' | 'A Finalizar';

// Payment status: a pagar or pago
export type PaymentStatus = 'A pagar' | 'Pago';

export enum Inspector {
  CRIS = 'Cris',
  PEDRO = 'Pedro',
  GUILHERME = 'Guilherme',
  THIAGO = 'Thiago',
  AGATHA = 'Agatha'
}

export interface Client {
  name: string;
  cpf: string;
  address: string;
  cep: string;
  number: string;
  complement?: string;
}

export interface Inspection {
  id: string;
  date: string; // ISO String
  vehicleModel: string;
  licensePlate: string;
  // Step 1 Data
  selectedServices: string[]; // Changed to array for checkboxes
  customServiceDetail?: string;
  client: Client;
  inspector?: string;
  indicationId?: string; // Link to Indication (Provider)
  indicationName?: string;
  observations?: string;

  // Step 2 Data
  paymentMethod?: PaymentMethod;
  nfe?: string;
  contact?: string; // Contact phone number
  totalValue: number;
  
  // Ficha workflow status: 'Iniciada' (in progress/no caixa) or 'A Finalizar' (completed/concluída)
  status: InspectionStatus;
  
  // Ficha completeness (all required fields filled)
  status_ficha?: 'Incompleta' | 'Completa';
  
  // Financial: payment and date tracking
  paymentStatus?: PaymentStatus; // 'A pagar' or 'Pago'
  data_pagamento?: string; // ISO date string when payment registered
  
  // Financial audit fields
  mes_referencia?: string; // 'YYYY-MM' for monthly reconciliation
  valor?: number; // explicit financial value (can override totalValue)
}

export interface FechamentoMensal {
  mes: string; // 'YYYY-MM'
  fechado: boolean;
  data_fechamento?: string; // ISO date
  usuario_fechou?: string; // user id or name
  report?: {
    byIndication: Array<{
      indicationId: string;
      indicationName: string;
      totalCount: number;
      paidCount: number;
      toPayCount: number;
      paidValue: number;
      toPayValue: number;
      totalValue: number;
    }>;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string; // Mock password for edits
}

export interface Indication { // Renamed from Provider
  id: string;
  name: string; // Razão Social / Fantasia
  document: string; // CPF/CNPJ
  phone: string;
  email: string;
  address?: string;
  cep?: string;
  number?: string;
  // Optional per-service price overrides: key = service id, value = price
  servicePrices?: { [serviceId: string]: number };
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

// Props for Navigation
export interface NavProps {
  currentView: ViewState;
  changeView: (view: ViewState) => void;
  logout: () => void;
  currentUser?: User; // Pass current user to layout
}