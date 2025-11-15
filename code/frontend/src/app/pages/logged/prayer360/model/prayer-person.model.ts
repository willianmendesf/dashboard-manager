export interface PrayerPerson {
  id?: number;
  nome: string;
  celular?: string;
  tipo: 'CRIANCA' | 'ADULTO';
  isIntercessor: boolean;
  isExternal: boolean;
  memberId?: number;
  nomePai?: string;
  telefonePai?: string;
  nomeMae?: string;
  telefoneMae?: string;
  responsaveis?: Responsavel[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  memberData?: any; // MemberDTO se vinculado
}

export interface Responsavel {
  nome: string;
  telefone: string;
  tipo: 'PAI' | 'MAE' | 'OUTRO';
}

