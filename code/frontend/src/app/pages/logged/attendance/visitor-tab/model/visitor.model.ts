export interface Visitor {
  id?: number;
  nomeCompleto: string;
  dataVisita: string; // ISO date string
  telefone?: string;
  jaFrequentaIgreja?: string;
  nomeIgreja?: string;
  procuraIgreja?: string;
  eDeSP?: boolean;
  estado?: string;
  fotoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitorStats {
  data: string; // ISO date string
  quantidade: number;
}

