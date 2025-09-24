import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/service/api.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent implements OnInit {
  users : User[] = [];
  filteredUsers: User[] = [...this.users];
  searchTerm = '';
  statusFilter = '';
  roleFilter = '';

  showUserModal = false;
  showViewModal = false;
  isEditing = false;
  currentUser: any = {};
  viewingUser: User | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = Math.ceil(this.users.length / this.itemsPerPage);

  constructor(
    private api : ApiService
  ) {}

  ngOnInit() {
    this.getUsers();
    this.filterUsers();
  }

  private getUsers() {
    this.api.get("/users").subscribe({
      next: res => this.users = res,
      error: error => console.error(error),
      complete: () => console.log()
    })
  }

  public createUser(user : User) {
    let newUser = {
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      roles: user.role,
      status: user.status == 'active' ? 1 : 0,
    };

    this.api.post("/users", newUser).subscribe({
      next: res => console.log(res),
      error: error => console.error(error),
      complete: () => console.log("New user created!")
    })
  }

  public updateUser(user : User) {
    let newUser = {
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      roles: user.role,
      status: user.status == 'active' ? 1 : 0,
    };

    this.api.update(`/users/${user.id}` , newUser).subscribe({
      next: res => console.log(res),
      error: error => console.error(error),
      complete: () => console.log("User updated!")
    })
  }

  public delete(id: number) {
    this.api.delete("/users/" + id).subscribe({
      next: res => console.log(res),
      error: error => console.error(error),
      complete: () => console.log("Deleted!")
    })
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getRoleText(role: string): string {
    const roleMap = {
      // 'root': 'Super Admin',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  }

  openUserModal(user?: User) {
    this.showUserModal = true;
    this.isEditing = !!user;
    this.currentUser = user ? { ...user } : {
      name: '',
      email: '',
      phone: '',
      role: '',
      status: 'active',
      password: ''
    };
  }

  closeUserModal() {
    this.showUserModal = false;
    this.currentUser = {};
  }

  viewUser(user: User) {
    this.viewingUser = user;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingUser = null;
  }

  editUser(user: User) {
    this.closeViewModal();
    this.openUserModal(user);
  }

  saveUser() {
    if (this.isEditing) {
      const index = this.users.findIndex(u => u.id === this.currentUser.id);
      if (index !== -1) this.users[index] = { ...this.currentUser };
      this.updateUser(this.users[index])
    } else {
      const newUser: User = {
        ...this.currentUser,
        id: Math.max(...this.users.map(u => u.id)) + 1,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      this.createUser(newUser);
      this.getUsers();
    }

    this.filterUsers();
    this.closeUserModal();
  }

  deleteUser(user: User) {
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      this.delete(user.id)
      this.users = this.users.filter(u => u.id !== user.id);
      this.filterUsers();
      this.getUsers()
    }
  }

  getPermissionsForRole(role: string): string[] {
    const permissions = {
      'admin': [
        'Gerenciar usuários',
        'Configurações do sistema',
        'Relatórios avançados',
        'Backup e restauração',
        'Logs do sistema'
      ],
      'manager': [
        'Visualizar relatórios',
        'Gerenciar projetos',
        'Aprovar solicitações',
        'Exportar dados'
      ],
      'user': [
        'Visualizar dashboard',
        'Criar projetos',
        'Editar perfil'
      ]
    };
    return permissions[role as keyof typeof permissions] || [];
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
