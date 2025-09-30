import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../shared/service/api.service';
import { CommonModule } from '@angular/common';
import { Appointment } from './model/appointment.model';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { FormsModule } from '@angular/forms';
export interface ChecklistItem {
  id: number;
  nome: string;
  selecionado: boolean; // Esta propriedade controlará se o checkbox está marcado
}
@Component({
  selector: 'appointments',
  standalone: true,
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
  imports: [CommonModule, FormsModule, PageTitleComponent]
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  public appointments : Appointment[] = [];

  users: Appointment[] = [];
  groups: Group[] = []

  showUserModal = false;
  showViewModal = false;
  isEditing = false;
  currentUser: any = {};
  viewingUser: Appointment | null = null;

  itensChecklist: ChecklistItem[] = [
    { id: 1, nome: 'Comprar Leite', selecionado: false },
    { id: 2, nome: 'Pagar Contas', selecionado: false },
    { id: 3, nome: 'Estudar Angular', selecionado: false },
    { id: 4, nome: 'Fazer Exercício', selecionado: false },
  ];

  handleCheckboxChange(item: Group) {
    console.log(`Status de ${item.name}: ${item.selected}`);
    
    this.groups.forEach(group => {
      if (group.id == item.id) group.selected = item.selected
    })
  }

  constructor(private api : ApiService) { }
  
  ngOnDestroy(): void { }

  ngOnInit(): void {
    this.getAll();
    this.getGroups();
    console.log(this.groups)
  }

  public getGroups() {
    console.log('getGroups')
    this.api.get("whatsapp/groups")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.groups = res
        this.groups.forEach(item => item.selected = false)
      },
      error: error => console.error(error),
      complete: () => {}
    })
  }

  public getAll() {
    this.api.get("appointments")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: appointments => {
        this.appointments = appointments
        console.log(this.appointments)
      },
      error: error => console.log(error),
      complete: () => console.log('Complete')
  });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Ativo',
      'paused': 'Pausado',
      'completed': 'Concluído'
    };
    return statusMap[status] || status;
  }

  openUserModal(user?: Appointment) {
    this.showUserModal = true;
    this.isEditing = !!user;
    this.currentUser = user ? { ...user } : {
      id: '',
      name: '',
      description: '',
      schedule: '',
      enabled: false,
      development: false,
      monitoringNumbers: [],
      monitoringGroups: false,
      monitoringGroupsIds: [],
      enpoint: '',
      retries: '',
      timeout: '',
      startDate: '',
      endDate: '',
      message: ''
    };
  }

  closeUserModal() {
    this.showUserModal = false;
    this.currentUser = {};
  }

  viewUser(user: Appointment) {
    this.viewingUser = user;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingUser = null;
  }

  editUser(user: Appointment) {
    this.closeViewModal();
    this.openUserModal(user);
  }

  public create(appointment : Appointment) {
    let newAppointment = {
      "name": appointment.name,
      "description": appointment.description,
      "schedule": appointment.schedule,
      "enabled": appointment.enabled,
      "development": appointment.development,
      "monitoringNumbers": appointment.monitoringNumbers,
      "monitoringGroups": appointment.monitoringGroups,
      "monitoringGroupsIds": appointment.monitoringGroupsIds,
      "enpoint": appointment.enpoint,
      "retries": appointment.retries,
      "timeout": appointment.retries,
      "startDate": appointment.startDate,
      "endDate": appointment.endDate,
      "message": appointment.message
    };

    this.api.post("/appointments", newAppointment)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getAll(),
      error: error => console.error(error),
      complete: () => this.getAll()
    })
  }

  public updateUser(appointment : Appointment) {
    this.api.update(`/appointments/${appointment.id}` , appointment)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getAll(),
      error: error => console.error(error),
      complete: () => this.getAll()
    })
  }

  save() {
    console.log("save activated")
    if (this.isEditing) {
      const index = this.users.findIndex(u => u.id === this.currentUser.id);
      if (index !== -1) this.users[index] = { ...this.currentUser };
      this.updateUser(this.users[index])
    } else {
      const newUser: Appointment = {
        ...this.currentUser,
        id: Math.max(...this.users.map(u => u.id)) + 1,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      this.create(newUser);
    }
    this.closeUserModal();
  }
}
