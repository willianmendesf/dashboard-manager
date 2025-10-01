import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  public groups: Group[] = []

  showAppointmentModal = false;
  showViewModal = false;
  isEditing = false;
  currentAppointment: any = {};
  viewingAppointment: Appointment | null = null;

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

  constructor(
    private api : ApiService,
    private cdr: ChangeDetectorRef
  ) { }
  
  ngOnDestroy(): void { }

  ngOnInit(): void {
    this.getAll();
    this.getGroups();
    console.log(this.groups)
  }

  toggleMonitoring() {
    console.log(this.currentAppointment.monitoringNumbers)
    //this.currentAppointment.monitoringGroups = !this.currentAppointment.monitoringGroups;
  }

  handleChangeGroupsNumber(item: any) {
    console.log('antes', this.currentAppointment)
    this.currentAppointment.monitoringNumbers.push(this.currentAppointment.monitoringNumbers)
    console.log('depois', this.currentAppointment)
  }

  public getGroups() {
    console.log('getGroups')
    this.api.get("whatsapp/groups")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        console.log(res)
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

  openAppointmentModal(appointment?: Appointment) {
    this.cdr.markForCheck()
    this.showAppointmentModal = true;
    this.isEditing = !!appointment;
    this.currentAppointment = appointment ? { ...appointment } : {
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
      retries: 3,
      timeout: 30000,
      startDate: '',
      endDate: '',
      message: '',
      sendTo: [],
      sendToGroups: []
    };
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingAppointment = null;
  }

  closeModal() {
    this.showAppointmentModal = false;
    this.currentAppointment = {};
  }

  view(appointment: Appointment) {
    this.viewingAppointment = appointment;
    this.showViewModal = true;
  }

  edit(appointment: Appointment) {
    this.closeViewModal();
    this.openAppointmentModal(appointment);
  }

  deleteItem(appointment: Appointment) {
    if (confirm(`Tem certeza que deseja excluir o membro "${appointment.name}"?`)) {
      this.delete(appointment.id);
      this.appointments = this.appointments.filter(m => m.id !== appointment.id);
    }
  }

  save() {
    if (this.isEditing) {
      const index = this.appointments.findIndex(u => u.id === this.currentAppointment.id);
      if (index !== -1) this.appointments[index] = { ...this.currentAppointment };
      console.log(this.appointments[index])
      this.update(this.appointments[index])
    } else {
      const newAppointment: Appointment = {
        ...this.currentAppointment,
        id: Math.max(...this.appointments.map(u => u.id)) + 1,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      this.create(newAppointment);
    }
    this.closeModal();
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

    this.api.post("appointments", newAppointment)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getAll(),
      error: error => console.error(error),
      complete: () => this.getAll()
    })
  }

  public update(appointment : Appointment) {
    this.api.post(`appointments/${appointment.id}` , appointment)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: () => this.getAll(),
      complete: () => this.getAll(),
      error: error => console.error(error)
    })
  }

  public delete(id: number) {
    this.api.delete("appointments/" + id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getAll(),
        error: error => console.error(error),
        complete: () => this.getAll()
      });
  }
}
