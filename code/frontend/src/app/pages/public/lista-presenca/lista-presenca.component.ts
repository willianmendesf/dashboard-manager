import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged, interval, Subscription, of } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { EventService, Event } from '../../../shared/service/event.service';
import { AttendanceService, MemberAttendance } from '../../../shared/service/attendance.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { MessageIcons } from '../../../shared/lib/utils/icons';
import { buildProfileImageUrl } from '../../../shared/utils/image-url-builder';
import { DataTableComponent, TableColumn } from '../../../shared/lib/utils/data-table.component';

interface MemberWithAttendance {
  member: any;
  isPresent: boolean;
  isLoading?: boolean;
}

@Component({
  selector: 'app-lista-presenca',
  standalone: true,
  templateUrl: './lista-presenca.component.html',
  styleUrl: './lista-presenca.component.scss',
  imports: [CommonModule, FormsModule, DataTableComponent]
})
export class ListaPresencaComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  public utilsService = inject(UtilsService);
  private pollingSubscription?: Subscription;

  selectedDate: string = new Date().toISOString().split('T')[0];
  events: Event[] = [];
  selectedEventId: number | null = null;
  members: MemberWithAttendance[] = [];
  filteredMembers: MemberWithAttendance[] = [];
  tableData: any[] = [];
  searchTerm: string = '';
  memberTypeFilter: 'adultos' | 'criancas' = 'adultos';
  loading: boolean = false;
  error: string | null = null;

  tableColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'presenca', label: 'Presença', sortable: false, width: '120px', align: 'center' },
    { key: 'status', label: 'Status', sortable: false, width: '120px', align: 'center' },
    { key: 'whatsapp', label: 'Whatsapp', width: '50px', align: 'center' },
  ];

  constructor(
    private eventService: EventService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadEvents() {
    this.loading = true;
    this.error = null;
    // Garante que sempre passa uma data (hoje se não selecionada)
    const dateToUse = this.selectedDate || new Date().toISOString().split('T')[0];
    this.eventService.getAll(dateToUse)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (events) => {
          this.events = events;
          // Sempre seleciona o primeiro evento (que será o padrão "Culto" se não houver outros)
          if (events.length > 0) {
            // Prioriza evento "Culto" se existir, senão pega o primeiro
            const defaultEvent = events.find(e => e.name === 'Culto') || events[0];
            this.selectedEventId = defaultEvent.id;
            this.loadMembers();
          } else {
            // Se não houver eventos mesmo após tentar criar o padrão, mostra erro
            this.members = [];
            this.filteredMembers = [];
            this.selectedEventId = null;
            this.error = 'Nenhum evento encontrado para esta data. Tente novamente.';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading events:', err);
          this.error = 'Erro ao carregar eventos. Tente novamente.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onDateChange() {
    this.stopPolling();
    this.selectedEventId = null;
    this.members = [];
    this.filteredMembers = [];
    this.searchTerm = '';
    // Garante que a data está definida antes de carregar
    if (!this.selectedDate) {
      this.selectedDate = new Date().toISOString().split('T')[0];
    }
    this.loadEvents();
  }

  onEventChange() {
    this.stopPolling();
    this.searchTerm = '';
    this.loadMembers();
  }

  loadMembers() {
    if (!this.selectedEventId) {
      this.members = [];
      this.filteredMembers = [];
      this.stopPolling();
      return;
    }

    this.loading = true;
    this.error = null;
    this.attendanceService.getMembersByEvent(this.selectedEventId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (memberAttendances) => {
          this.members = memberAttendances.map(ma => ({
            member: ma.member,
            isPresent: ma.isPresent,
            isLoading: false
          }));
          this.applyFilters();
          this.updateTableData();
          this.loading = false;
          this.cdr.markForCheck();
          this.startPolling();
        },
        error: (err) => {
          console.error('Error loading members:', err);
          this.error = 'Erro ao carregar membros';
          this.loading = false;
          this.stopPolling();
          this.cdr.markForCheck();
        }
      });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onMemberTypeChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.members];

    // Filtro por tipo (adultos/crianças)
    if (this.memberTypeFilter === 'adultos') {
      filtered = filtered.filter(m => !m.member.child);
    } else {
      filtered = filtered.filter(m => m.member.child);
    }

    // Filtro por busca
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(m => 
        m.member.nome?.toLowerCase().includes(search)
      );
    }

    this.filteredMembers = filtered;
    this.updateTableData();
    this.cdr.markForCheck();
  }

  updateTableData() {
    this.tableData = this.filteredMembers.map(memberItem => ({
      _original: memberItem,
      foto: memberItem.member.fotoUrl || null,
      nome: memberItem.member.nome || '-',
      status: memberItem.isPresent ? '✅' : '❌',
      whatsapp: this.utilsService.getWhatsAppLink(memberItem.member.celular || memberItem.member.telefone),
      presenca: memberItem.isPresent,
      isLoading: memberItem.isLoading || false
    }));
  }

  toggleAttendance(member: MemberWithAttendance) {
    if (!this.selectedEventId || member.isLoading) return;

    // Optimistic UI update
    const previousState = member.isPresent;
    member.isPresent = !member.isPresent;
    member.isLoading = true;
    this.cdr.markForCheck();

    // Debounce toggle
    this.attendanceService.toggleAttendance(member.member.id, this.selectedEventId)
      .pipe(
        debounceTime(300),
        takeUntil(this.unsubscribe$)
      )
      .subscribe({
        next: (response) => {
          member.isPresent = response.isPresent;
          member.isLoading = false;
          this.updateTableData();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error toggling attendance:', err);
          // Revert optimistic update
          member.isPresent = previousState;
          member.isLoading = false;
          this.error = 'Erro ao atualizar presença. Tente novamente.';
          this.updateTableData();
          this.cdr.markForCheck();
        }
      });
  }

  getWhatsAppIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      MessageIcons.whatsapp({ size: 20, color: '#25D366' })
    );
  }

  getNormalizedPhotoUrl(fotoUrl: string | null | undefined): string {
    return buildProfileImageUrl(fotoUrl);
  }

  getInitials(nome: string | null | undefined): string {
    if (!nome) return '?';
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getSelectedEvent(): Event | null {
    return this.events.find(e => e.id === this.selectedEventId) || null;
  }

  trackByMemberId(index: number, item: MemberWithAttendance): any {
    return item.member.id;
  }

  getSearchIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 14L11.1 11.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }

  goToLanding(): void {
    this.router.navigate(['/landing']);
  }

  /**
   * Inicia o polling periódico para atualizar os status de presença em tempo real
   * Polling silencioso em background que não interfere com a UI
   */
  private startPolling(): void {
    // Para qualquer polling existente antes de iniciar um novo
    this.stopPolling();

    // Só inicia polling se houver um evento selecionado
    if (!this.selectedEventId) {
      return;
    }

    // Polling a cada 4 segundos (balance entre responsividade e carga no servidor)
    this.pollingSubscription = interval(4000)
      .pipe(
        switchMap(() => {
          if (!this.selectedEventId) {
            return of(null);
          }
          // Faz requisição em background sem mostrar loading
          return this.attendanceService.getMembersByEvent(this.selectedEventId)
            .pipe(
              catchError(err => {
                // Erro silencioso - não interrompe o polling
                console.warn('Erro no polling de presença:', err);
                return of(null);
              })
            );
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe({
        next: (memberAttendances) => {
          if (memberAttendances && memberAttendances.length > 0) {
            this.updateMembersStatus(memberAttendances);
          }
        }
      });
  }

  /**
   * Para o polling periódico
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  /**
   * Atualiza apenas os status de presença dos membros existentes
   * Preserva estados de loading e outras propriedades para não perder estado da UI
   */
  private updateMembersStatus(memberAttendances: MemberAttendance[]): void {
    // Cria um mapa dos novos status para busca rápida
    const statusMap = new Map<number, boolean>();
    memberAttendances.forEach(ma => {
      statusMap.set(ma.member.id, ma.isPresent);
    });

    // Atualiza apenas o campo isPresent dos membros existentes
    let hasChanges = false;
    this.members.forEach(member => {
      const newStatus = statusMap.get(member.member.id);
      if (newStatus !== undefined && member.isPresent !== newStatus) {
        // Só atualiza se o membro não estiver em estado de loading
        // para não interferir com ações do usuário
        if (!member.isLoading) {
          member.isPresent = newStatus;
          hasChanges = true;
        }
      }
    });

    // Atualiza a tabela apenas se houver mudanças
    if (hasChanges) {
      this.applyFilters();
      this.updateTableData();
      this.cdr.markForCheck();
    }
  }
}

