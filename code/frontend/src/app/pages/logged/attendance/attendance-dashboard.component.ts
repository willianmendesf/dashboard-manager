import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { EventService, Event } from '../../../shared/service/event.service';
import { AttendanceService, MemberAttendance, AttendanceStats } from '../../../shared/service/attendance.service';
import { VisitorService } from '../../../shared/service/visitor.service';
import { MemberService } from '../../../shared/service/member.service';
import { ApiService } from '../../../shared/service/api.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { UserPreferenceService } from '../../../shared/service/user-preference.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { MessageIcons } from '../../../shared/lib/utils/icons';
import { buildProfileImageUrl } from '../../../shared/utils/image-url-builder';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { VisitorManagementComponent } from './visitor-tab/visitor-management.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/lib/utils/data-table.component';
import { VisitorStats } from './visitor-tab/model/visitor.model';

interface MemberWithAttendance {
  member: any;
  isPresent: boolean;
  isLoading?: boolean;
}

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  templateUrl: './attendance-dashboard.component.html',
  styleUrl: './attendance-dashboard.component.scss',
  imports: [
    CommonModule, 
    FormsModule, 
    PageTitleComponent, 
    BaseChartDirective,
    VisitorManagementComponent,
    DataTableComponent
  ]
})
export class AttendanceDashboardComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  public utilsService = inject(UtilsService);

  activeTab: 'attendance' | 'visitors' = 'attendance';

  // Attendance tab
  selectedDate: string = new Date().toISOString().split('T')[0];
  events: Event[] = [];
  selectedEventId: number | null = null;
  members: MemberWithAttendance[] = [];
  filteredMembers: MemberWithAttendance[] = [];
  tableData: any[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;

  tableColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'status', label: 'Status', sortable: false, width: '120px' },
    { key: 'whatsapp', label: '', width: '50px', align: 'center' },
    { key: 'presenca', label: 'Presença', sortable: false, width: '120px', align: 'center' }
  ];

  // Chart
  lineChartType = 'line' as const;
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Presenças por Evento',
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        data: [],
        label: 'Média de Presença',
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  };
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        },
        title: {
          display: true,
          text: 'Número de Presenças'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // Chart date range
  useCustomRange: boolean = false;
  chartStartDate: string | null = null;
  chartEndDate: string | null = null;
  periodType: 'weeks' | 'months' | 'years' = 'months';
  defaultIntervalMonths: number = 3;

  // Chart options
  includeVisitorsInPresence: boolean = false;
  showVisitorsSeparate: boolean = false;
  showAbsences: boolean = false;
  showAverage: boolean = true;

  // Data cache
  visitorStats: VisitorStats[] = [];
  totalMembers: number = 0;

  constructor(
    private eventService: EventService,
    private attendanceService: AttendanceService,
    private visitorService: VisitorService,
    private memberService: MemberService,
    private apiService: ApiService,
    private userPreferenceService: UserPreferenceService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadSavedPreferences();
    this.loadTotalMembers();
    this.loadEvents();
  }

  loadSavedPreferences(): void {
    this.userPreferenceService.getAttendanceChartPreference()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (preference) => {
          if (preference) {
            if (preference.useCustomRange !== undefined) {
              this.useCustomRange = preference.useCustomRange;
            }
            if (preference.chartStartDate) {
              this.chartStartDate = preference.chartStartDate;
            }
            if (preference.chartEndDate) {
              this.chartEndDate = preference.chartEndDate;
            }
            if (preference.includeVisitorsInPresence !== undefined) {
              this.includeVisitorsInPresence = preference.includeVisitorsInPresence;
            }
            if (preference.showVisitorsSeparate !== undefined) {
              this.showVisitorsSeparate = preference.showVisitorsSeparate;
            }
            if (preference.showAbsences !== undefined) {
              this.showAbsences = preference.showAbsences;
            }
            if (preference.showAverage !== undefined) {
              this.showAverage = preference.showAverage;
            }
            if (preference.defaultIntervalMonths) {
              this.defaultIntervalMonths = preference.defaultIntervalMonths;
            }
            if (preference.periodType) {
              this.periodType = preference.periodType;
            }
          }
          
          // Se não houver preferências salvas ou não usar intervalo customizado, calcular padrão
          if (!this.useCustomRange || !this.chartStartDate || !this.chartEndDate) {
            this.loadDefaultInterval();
          }
          
          this.loadChartData();
        },
        error: (err) => {
          console.error('Error loading saved preferences:', err);
          this.loadDefaultInterval();
          this.loadChartData();
        }
      });
  }

  loadTotalMembers() {
    this.memberService.getAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (members) => {
          this.totalMembers = members.length;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading total members:', err);
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadDefaultInterval() {
    // TODO: Load from database
    this.defaultIntervalMonths = 3;
    this.calculateDefaultDateRange();
  }

  calculateDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - this.defaultIntervalMonths);
    this.chartStartDate = startDate.toISOString().split('T')[0];
    this.chartEndDate = endDate.toISOString().split('T')[0];
  }

  loadChartData() {
    if (!this.chartStartDate || !this.chartEndDate) {
      this.calculateDefaultDateRange();
    }

    this.loading = true;
    
    // Prepare observables
    const observables: any[] = [
      this.attendanceService.getStats(this.chartStartDate!, this.chartEndDate!)
    ];

    // Load visitor stats if needed
    if (this.includeVisitorsInPresence || this.showVisitorsSeparate) {
      observables.push(
        this.visitorService.getStats(this.chartStartDate!, this.chartEndDate!)
      );
    }

    forkJoin(observables)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (results: any[]) => {
          const attendanceStats = results[0] as AttendanceStats;
          if ((this.includeVisitorsInPresence || this.showVisitorsSeparate) && results.length > 1) {
            this.visitorStats = (results[1] as VisitorStats[]) || [];
          } else {
            this.visitorStats = [];
          }
          this.updateChartData(attendanceStats);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading stats:', err);
          this.error = 'Erro ao carregar estatísticas';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  updateChartData(stats: AttendanceStats) {
    // Create maps for presence and visitor data
    const presenceMap = new Map<string, number>();
    stats.dailyCounts.forEach(d => {
      presenceMap.set(d.date, d.count);
    });

    const visitorMap = new Map<string, number>();
    if (this.visitorStats && this.visitorStats.length > 0) {
      this.visitorStats.forEach(vs => {
        const dateKey = new Date(vs.data).toISOString().split('T')[0];
        visitorMap.set(dateKey, vs.quantidade);
      });
    }

    // Collect all unique dates from both presence and visitors
    const allDates = new Set<string>();
    presenceMap.forEach((_, date) => allDates.add(date));
    visitorMap.forEach((_, date) => allDates.add(date));

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Create labels from sorted dates
    const labels = sortedDates.map(date => {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    // Build data arrays for each date
    let presenceData = sortedDates.map(date => {
      return presenceMap.get(date) || 0;
    });

    // Combine visitors with presence if option is enabled
    if (this.includeVisitorsInPresence) {
      presenceData = sortedDates.map(date => {
        const presence = presenceMap.get(date) || 0;
        const visitors = visitorMap.get(date) || 0;
        return presence + visitors;
      });
    }

    // Visitor separate line data
    const visitorData = this.showVisitorsSeparate 
      ? sortedDates.map(date => {
          return visitorMap.get(date) || 0;
        })
      : null;

    // Absence data
    const absenceData = this.showAbsences
      ? sortedDates.map(date => {
          const presence = presenceMap.get(date) || 0;
          return Math.max(0, this.totalMembers - presence);
        })
      : null;

    // Average data
    const averageData = this.showAverage 
      ? new Array(presenceData.length).fill(stats.periodAverage)
      : null;

    // Build datasets array
    const datasets: any[] = [
      {
        data: presenceData,
        label: this.includeVisitorsInPresence ? 'Presenças (com Visitantes)' : 'Presenças por Evento',
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ];

    // Add average line if enabled
    if (this.showAverage && averageData) {
      datasets.push({
        data: averageData,
        label: 'Média de Presença',
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0
      });
    }

    // Add visitors separate line if enabled
    if (this.showVisitorsSeparate && visitorData) {
      datasets.push({
        data: visitorData,
        label: 'Visitantes',
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    }

    // Add absences line if enabled
    if (this.showAbsences && absenceData) {
      datasets.push({
        data: absenceData,
        label: 'Ausências',
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    }

    this.lineChartData = {
      labels: labels,
      datasets: datasets
    };
    this.cdr.markForCheck();
  }

  onChartDateRangeChange() {
    if (this.useCustomRange && this.chartStartDate && this.chartEndDate) {
      this.loadChartData();
    } else if (!this.useCustomRange) {
      this.calculateDefaultDateRange();
      this.loadChartData();
    }
  }

  onChartOptionChange() {
    this.loadChartData();
  }

  resetChartToDefault() {
    this.useCustomRange = false;
    this.includeVisitorsInPresence = false;
    this.showVisitorsSeparate = false;
    this.showAbsences = false;
    this.showAverage = true;
    this.defaultIntervalMonths = 3;
    this.periodType = 'months';
    this.calculateDefaultDateRange();
    
    // Deletar preferências salvas
    this.userPreferenceService.deleteAttendanceChartPreference()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.loadChartData();
        },
        error: (err) => {
          console.error('Error deleting preferences:', err);
          this.loadChartData();
        }
      });
  }

  saveAsDefault() {
    const preference = {
      useCustomRange: this.useCustomRange,
      chartStartDate: this.chartStartDate,
      chartEndDate: this.chartEndDate,
      includeVisitorsInPresence: this.includeVisitorsInPresence,
      showVisitorsSeparate: this.showVisitorsSeparate,
      showAbsences: this.showAbsences,
      showAverage: this.showAverage,
      defaultIntervalMonths: this.defaultIntervalMonths,
      periodType: this.periodType
    };

    this.userPreferenceService.saveAttendanceChartPreference(preference)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Preferências salvas como padrão com sucesso!');
        },
        error: (err) => {
          console.error('Error saving preferences:', err);
          this.notificationService.showError('Erro ao salvar preferências.');
        }
      });
  }

  loadEvents() {
    this.loading = true;
    this.eventService.getAll(this.selectedDate)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (events) => {
          this.events = events;
          if (events.length > 0) {
            const defaultEvent = events.find(e => e.name === 'Culto') || events[0];
            if (!this.selectedEventId || !events.find(e => e.id === this.selectedEventId)) {
              this.selectedEventId = defaultEvent.id;
              this.loadMembers();
            }
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading events:', err);
          this.error = 'Erro ao carregar eventos';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onDateChange() {
    this.selectedEventId = null;
    this.members = [];
    this.filteredMembers = [];
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

  applyFilters() {
    let filtered = [...this.members];
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

  getTableActions(): TableAction[] {
    return [];
  }

  toggleAttendance(member: MemberWithAttendance) {
    if (!this.selectedEventId || member.isLoading) return;

    const previousState = member.isPresent;
    member.isPresent = !member.isPresent;
    member.isLoading = true;
    this.cdr.markForCheck();

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

  getSearchIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 14L11.1 11.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }
}

