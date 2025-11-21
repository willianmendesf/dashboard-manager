interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  status: 'active' | 'inactive';
  role: string;
  password?: string;
  profileName?: string;
  permissions?: string[];
  fotoUrl?: string;
  enabled?: boolean;
  profileId?: number;
  telefone?: string;
  novaSenha?: string;
  confirmarSenha?: string;
  //created: string;
  //avatar?: string;
  //lastLogin?: string;
}
