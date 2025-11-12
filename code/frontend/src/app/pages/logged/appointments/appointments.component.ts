import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ApiService } from '../../../shared/service/api.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Appointment } from './model/appointment.model';
import { AppointmentExecutionLog } from './model/appointment-execution-log.model';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../../shared/modules/pagetitle/pagetitle.component";
import { FormsModule } from '@angular/forms';
import { CronSelectorComponent } from '../../../shared/modules/cron-selector/cron-selector.component';
import { ImageUploadComponent } from "../../../shared/modules/image-upload/image-upload.component";
import { ModalComponent, ModalButton } from '../../../shared/modules/modal/modal.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/lib/utils/data-table.component';
import { environment } from '../../../../environments/environment';
import { ActionIcons, NavigationIcons } from '../../../shared/lib/utils/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  imports: [CommonModule, FormsModule, PageTitleComponent, CronSelectorComponent, ImageUploadComponent, ModalComponent, DatePipe, DataTableComponent]
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  public appointments : Appointment[] = [];
  public filteredAppointments: Appointment[] = [];
  public groups: Group[] = []
  public contacts: Contact[] = []
  public env = environment.apiUrl;

  // Tabs
  activeTab: 'list' | 'logs' = 'list';

  // Logs
  public executionLogs: AppointmentExecutionLog[] = [];
  public logColumns: TableColumn[] = [];
  public logActions: TableAction[] = [];

  // Filtros
  searchTerm = '';
  statusFilter = '';

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
    this.initializeLogColumns();
    this.getExecutionLogs();
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

  public getTaskTypeLabel(taskType: string): string {
    if (taskType === 'API_CALL') {
      return 'API';
    } else if (taskType === 'WHATSAPP_MESSAGE') {
      return 'WhatsApp';
    }
    return taskType || 'N/A';
  }

  public getGroupName(groupId: string): string {
    const group = this.groups.find(g => this.compareIds(g.id, groupId));
    return group ? group.name : groupId;
  }

  public getDestinationText(appointment: Appointment): string {
    if (appointment.taskType !== 'WHATSAPP_MESSAGE') {
      return '';
    }

    const destinations: string[] = [];

    // Adicionar grupos
    if (appointment.sendToGroups && appointment.sendToGroups.length > 0) {
      const groupNames = appointment.sendToGroups.map(id => this.getGroupName(id));
      destinations.push(...groupNames);
    }

    // Adicionar contatos individuais
    if (appointment.sendTo && appointment.sendTo.length > 0) {
      destinations.push(...appointment.sendTo);
    }

    if (destinations.length === 0) {
      return 'Sem destino definido';
    }

    // Limitar a exibição a 2 itens, mostrando "e mais X" se houver mais
    if (destinations.length <= 2) {
      return destinations.join(', ');
    } else {
      return destinations.slice(0, 2).join(', ') + ` e mais ${destinations.length - 2}`;
    }
  }

  getSearchIcon(): SafeHtml {
    const html = NavigationIcons.search({ size: 20, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  filterAppointments() {
    if (!this.appointments || this.appointments.length === 0) {
      this.filteredAppointments = [];
      this.cdr.markForCheck();
      return;
    }

    this.filteredAppointments = this.appointments.filter(appointment => {
      if (!appointment) return false;
      
      // Filtro de busca por palavra-chave
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm || 
                            (appointment.name && appointment.name.toLowerCase().includes(searchLower)) ||
                            (appointment.description && appointment.description.toLowerCase().includes(searchLower)) ||
                            (appointment.schedule && appointment.schedule.toLowerCase().includes(searchLower));
      
      // Filtro por status (Ativo/Pausado)
      let matchesStatus = true;
      if (this.statusFilter !== '') {
        if (this.statusFilter === 'active') {
          matchesStatus = appointment.enabled === true;
        } else if (this.statusFilter === 'paused') {
          matchesStatus = appointment.enabled === false;
        }
      }

      return matchesSearch && matchesStatus;
    });
    
    this.cdr.markForCheck();
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
        // Ordenar: ativos primeiro (enabled = true), depois pausados (enabled = false)
        this.appointments = (appointments || []).sort((a: Appointment, b: Appointment) => {
          // Se ambos são ativos ou ambos são pausados, manter ordem original
          if (a.enabled === b.enabled) {
            return 0;
          }
          // Ativos (true) vêm antes de pausados (false)
          return a.enabled ? -1 : 1;
        });
        this.filterAppointments(); // Aplicar filtros após carregar
        this.cdr.markForCheck()
      },
      error: error => console.error(error),
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

  getIcon(iconName: 'view' | 'edit' | 'delete'): SafeHtml {
    const icons = {
      view: ActionIcons.view({ size: 16, color: 'currentColor' }),
      edit: ActionIcons.edit({ size: 16, color: 'currentColor' }),
      delete: ActionIcons.delete({ size: 16, color: 'currentColor' })
    };
    const html = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
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
    if (confirm(`Tem certeza que deseja excluir o agendamento "${appointment.name}"?`)) {
      this.delete(appointment.id);
      this.appointments = this.appointments.filter(m => m.id !== appointment.id);
      this.filterAppointments(); // Reaplicar filtros após deletar
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

  // Métodos para logs
  initializeLogColumns() {
    this.logColumns = [
      { key: 'appointmentName', label: 'Agendamento', sortable: true },
      { key: 'scheduledTime', label: 'Data/Hora Agendada', sortable: true },
      { key: 'executionTime', label: 'Data/Hora Execução', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'errorMessage', label: 'Erro', sortable: false }
    ];
  }

  getExecutionLogs() {
    this.api.get("appointments/executions/logs")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (logs: AppointmentExecutionLog[]) => {
          this.executionLogs = logs || [];
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Error fetching execution logs:', error);
          this.executionLogs = [];
          this.cdr.markForCheck();
        }
      });
  }

  getLogTableData(): any[] {
    return this.executionLogs.map(log => ({
      ...log,
      scheduledTime: this.formatDateTime(log.scheduledTime),
      executionTime: this.formatDateTime(log.executionTime),
      status: this.getStatusLabel(log.status),
      errorMessage: log.errorMessage || '-',
      _original: log
    }));
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'SUCCESS': 'Sucesso',
      'FAILURE': 'Erro',
      'PENDING': 'Pendente'
    };
    return statusMap[status] || status;
  }

  switchTab(tab: 'list' | 'logs') {
    this.activeTab = tab;
    if (tab === 'logs') {
      this.getExecutionLogs();
    }
    this.cdr.markForCheck();
  }
}
