import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../shared/service/api.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Appointment } from './model/appointment.model';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { FormsModule } from '@angular/forms';
import { CronSelectorComponent } from '../../shared/modules/cron-selector/cron-selector.component';
import { ImageUploadComponent } from "../../shared/modules/image-upload/image-upload.component";
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';
import { environment } from '../../../environments/environment';
export interface ChecklistItem {
  id: number;
  nome: string;
  selecionado: boolean;
}
@Component({
  selector: 'appointments',
  standalone: true,
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
  imports: [CommonModule, FormsModule, PageTitleComponent, CronSelectorComponent, ImageUploadComponent, ModalComponent, DatePipe]
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  public appointments : Appointment[] = [];
  public groups: Group[] = []
  public contacts: Contact[] = []
  public env = environment.apiUrl;

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

  constructor(
    private api : ApiService,
    private cdr: ChangeDetectorRef
  ) { }
  
  ngOnDestroy(): void { }

  ngOnInit(): void {
    this.getAll();
    this.getContacts();
    this.getGroups();
  }

  onImageUploaded(path: string) {
    this.currentAppointment.imageToSend = path;
  }

  public getStatus(status: boolean): string {
    return status == true ? 'Ativo' : 'Pausado';
  }

  public getDevelopment(status: boolean): string {
    return status == true ? 'Dev' : '';
  }

  public getContacts() {
    this.api.get("whatsapp/contacts")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.contacts = res
        this.contacts.forEach(item => item.selected = false)
        this.cdr.markForCheck()
      },
      error: error => console.error(error),
      complete: () => {}
    })
  }

  public getGroups() {
    this.api.get("whatsapp/groups")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.groups = res
        this.groups.forEach(item => item.selected = false)
        this.cdr.markForCheck()
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
        this.cdr.markForCheck()
      },
      error: error => console.error(error),
      complete: () => console.log("Get all suscess!")
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
      development: true,
      monitoring: false,
      monitoringNumbers: [],
      monitoringGroups: false,
      monitoringGroupsIds: [],
      endpoint: '',
      retries: 3,
      timeout: 30000,
      startDate: '',
      endDate: '',
      taskType: '',
      message: '',
      sendTo: [],
      sendToGroups: [],
      recipientType: "INDIVIDUAL",
      sendImage: false,
      imageToSend: ''
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

  getViewModalButtons(): ModalButton[] {
    if (!this.viewingAppointment) {
      return [
        {
          label: 'Fechar',
          type: 'secondary',
          action: () => this.closeViewModal()
        }
      ];
    }
    return [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.closeViewModal()
      },
      {
        label: 'Editar Agendamento',
        type: 'primary',
        action: () => {
          if (this.viewingAppointment) {
            this.edit(this.viewingAppointment);
          }
        }
      }
    ];
  }

  getEditModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeModal()
      },
      {
        label: 'Salvar Alterações',
        type: 'primary',
        action: () => this.save()
      }
    ];
  }

  view(appointment: Appointment) {
    this.viewingAppointment = { ...appointment };
    this.showViewModal = true;
    this.cdr.markForCheck();
  }

  toString(value: any): string {
    return String(value);
  }

  compareIds(id1: any, id2: any): boolean {
    return String(id1) === String(id2);
  }

  edit(appointment: Appointment) {
    this.closeViewModal();
    // Garantir que o schedule existe antes de abrir o modal
    if (!appointment.schedule) {
      appointment.schedule = '0 0 * * *';
    }
    this.openAppointmentModal(appointment);
    // Forçar detecção de mudanças após abrir o modal
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 0);
  }

  deleteItem(appointment: Appointment) {
    if (confirm(`Tem certeza que deseja excluir o membro "${appointment.name}"?`)) {
      this.delete(appointment.id);
      this.appointments = this.appointments.filter(m => m.id !== appointment.id);
    }
  }

  public save() {
    if (this.isEditing) {
      const index = this.appointments.findIndex(u => u.id === this.currentAppointment.id);
      if (index !== -1) this.appointments[index] = { ...this.currentAppointment };
      this.update(this.appointments[index])
    } else {
      const newAppointment: Appointment = {
        ...this.currentAppointment,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      this.create(newAppointment);
    }
    this.closeModal();
  }

  private create(appointment : Appointment) {
    this.api.post("appointments", appointment)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getAll(),
      error: error => console.error(error),
      complete: () => {
        console.log('Created!')
        this.getAll()
      }
    })
  }

  private update(appointment : Appointment) {
    this.api.post(`appointments/${appointment.id}` , appointment)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: () => this.getAll(),
      complete: () => this.getAll(),
      error: error => {
        console.log('Updated')
        console.error(error)
      }
    })
  }

  private delete(id: number) {
    this.api.delete("appointments/" + id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getAll(),
        error: error => console.error(error),
        complete: () => {
          console.log('Deleted!')
          this.getAll()
        }
      });
  }
}
