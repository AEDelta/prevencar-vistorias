export enum ViewState {
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  HOME = 'HOME',
  INSPECTION_LIST = 'INSPECTION_LIST',
  INSPECTION_FORM = 'INSPECTION_FORM',
  MANAGEMENT = 'MANAGEMENT',
  REPORTS = 'REPORTS'
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

// Ficha workflow status: Iniciada or No Caixa or Concluída or Pagamento pendente
export type InspectionStatus = 'Iniciada' | 'No Caixa' | 'Concluída' | 'Pagamento pendente';

// Payment method: a pagar or paid methods
export type PaymentMethod = 'A pagar' | 'Pix' | 'Crédito' | 'Débito' | 'Dinheiro';

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

export enum VehicleCategory {
   MOTOCICLETAS = 'Motocicletas',
   AUTOMOVEIS = 'Automóveis',
   UTILITARIOS = 'Utilitários',
   CAMINHOES = 'Caminhões',
   CARRETAS = 'Carretas',
   OUTROS = 'Outros'
}

export interface Inspection {
  id: string;
  date: string; // ISO String
  vehicleModel: string;
  licensePlate: string;
  // Step 1 Data
  selectedServices: SelectedService[]; // Array of selected services with values
  customServiceDetail?: string;
  client: Client;
  inspector?: string;
  indicationId?: string; // Link to Indication (Provider)
  indicationName?: string;
  observations?: string;
  externalInspection?: boolean; // Vistoria Externa
  vehicleCategory?: VehicleCategory; // Categoria do Veículo
  chargedValue?: number; // Total Valor Cobrado (calculated)

  // Step 2 Data
  paymentStatus?: PaymentMethod; // 'A pagar' or paid method
  nfe?: string;
  contact?: string; // Contact phone number
  totalValue: number;

  // Ficha workflow status
  status: InspectionStatus;

  // Financial: payment date tracking
  data_pagamento?: string; // ISO date string when payment registered

  // Financial audit fields
  mes_referencia?: string; // 'YYYY-MM' for monthly reconciliation
  valor?: number; // explicit financial value (can override totalValue)
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

export interface SelectedService {
  name: string;
  baseValue: number;
  chargedValue: number;
}

export interface ServiceItem {
   id: string;
   name: string;
   prices: Record<VehicleCategory, number>;
   description: string;
}

export interface Notification {
   id: string;
   type: 'inspection_created' | 'inspection_updated' | 'user_created' | 'user_updated' | 'indication_created' | 'indication_updated' | 'service_created' | 'service_updated';
   message: string;
   userId: string;
   userName: string;
   timestamp: string; // ISO string
   read: boolean;
   relatedId?: string; // ID of the related item (inspection, user, etc.)
}

// Props for Navigation
export interface NavProps {
  currentView: ViewState;
  changeView: (view: ViewState) => void;
  logout: () => void;
  currentUser?: User; // Pass current user to layout
}