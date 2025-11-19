import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { EventService, Event } from '../../../shared/service/event.service';
import { AttendanceService, MemberAttendance } from '../../../shared/service/attendance.service';
import { ApiService } from '../../../shared/service/api.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { MessageIcons } from '../../../shared/lib/utils/icons';
import { buildProfileImageUrl } from '../../../shared/utils/image-url-builder';

interface MemberWithAttendance {
  member: any;
  isPresent: boolean;
  isLoading?: boolean;
}

@Component({
  selector: 'app-attendance-checkin',
  standalone: true,
  templateUrl: './attendance-checkin.component.html',
  styleUrl: './attendance-checkin.component.scss',
  imports: [CommonModule, FormsModule, ScrollingModule]
})
export class AttendanceCheckinComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  public utilsService = inject(UtilsService);

  selectedDate: string = new Date().toISOString().split('T')[0];
  events: Event[] = [];
  selectedEventId: number | null = null;
  members: MemberWithAttendance[] = [];
  filteredMembers: MemberWithAttendance[] = [];
  searchTerm: string = '';
  memberTypeFilter: 'adultos' | 'criancas' = 'adultos';
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private eventService: EventService,
    private attendanceService: AttendanceService,
    private apiService: ApiService
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
    this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error toggling attendance:', err);
          // Revert optimistic update
          member.isPresent = previousState;
          member.isLoading = false;
          this.error = 'Erro ao atualizar presença. Tente novamente.';
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
}

