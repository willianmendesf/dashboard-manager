import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../shared/service/api.service';
import { CommonModule } from '@angular/common';
import { Appointment } from './model/appointment.model';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { FormsModule } from '@angular/forms';

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

  showUserModal = false;
  showViewModal = false;
  isEditing = false;
  currentUser: any = {};
  viewingUser: Appointment | null = null;

  constructor(private api : ApiService) { }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    this.getAll();
    console.log(this.appointments)
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

  public createUser(user : Appointment) {
    let newUser = {

    };

    this.api.post("/users", newUser)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getAll(),
      error: error => console.error(error),
      complete: () => this.getAll()
    })
  }

  public updateUser(user : Appointment) {
    let newUser = {

    };

    this.api.update(`/users/${user.id}` , newUser)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getAll(),
      error: error => console.error(error),
      complete: () => this.getAll()
    })
  }

  saveUser() {
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
      this.createUser(newUser);
    }
    this.closeUserModal();
  }
}
