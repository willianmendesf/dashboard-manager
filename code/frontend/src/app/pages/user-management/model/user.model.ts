interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  status: 'active' | 'inactive';
  role: string;
  password: string
  //created: string;
  //avatar?: string;
  //lastLogin?: string;
  //phone: string;
}
