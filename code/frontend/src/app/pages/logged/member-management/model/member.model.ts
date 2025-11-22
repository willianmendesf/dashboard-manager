import { GroupEnrollmentDTO } from '../../../../shared/service/enrollment.service';

export interface Member {
  id: number;
  nome: string;
  conjugueTelefone?: string;
  telefonePai?: string;
  telefoneMae?: string;
  comungante?: boolean;
  intercessor: boolean;
  child?: boolean;
  tipoCadastro?: string;
  nascimento?: string | Date;
  idade?: number;
  estadoCivil: boolean;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  comercial?: string;
  celular?: string;
  operadora?: string;
  contato?: string;
  email: string;
  groupEnrollments?: GroupEnrollmentDTO[];
  lgpd?: string;
  lgpdAceitoEm?: string | Date;
  rede?: string;
  version?: number;
  fotoUrl?: string;
  hasChildren?: boolean;
}
