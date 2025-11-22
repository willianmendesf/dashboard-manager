import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
    this.searchTerm = '';
    this.loadMembers();
  }

  loadMembers() {
    if (!this.selectedEventId) {
      this.members = [];
      this.filteredMembers = [];
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
        },
        error: (err) => {
          console.error('Error loading members:', err);
          this.error = 'Erro ao carregar membros';
          this.loading = false;
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
}

