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
  inspector?: Inspector;
  indicationId?: string; // Link to Indication (Provider)
  indicationName?: string;
  observations?: string;
  
  // Step 2 Data
  paymentMethod?: PaymentMethod;
  nfe?: string;
  totalValue: number;

  status: 'Pendente' | 'No Caixa' | 'Concluída';
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