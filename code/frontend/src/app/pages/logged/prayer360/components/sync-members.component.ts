import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ModalComponent } from '../../../../shared/modules/modal/modal.component';
import { Prayer360Service } from '../service/prayer360.service';
import { ApiService } from '../../../../shared/service/api.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DataTableComponent, TableColumn } from '../../../../shared/lib/utils/data-table.component';

interface Member {
  id: number;
  nome: string;
  celular?: string;
  intercessor: boolean;
  podeReceberOracao?: boolean;
  synced?: boolean; // Se já está sincronizado
}

@Component({
  selector: 'app-sync-members',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, DataTableComponent],
  template: `
    <app-modal
      title="Sincronizar Membros com Oração360"
      [isOpen]="isOpen"
      [size]="'large'"
      [footerButtons]="getModalButtons()"
      (close)="close()">
      
      <div class="sync-members-container">
        <div class="info-message">
          <p><strong>Como funciona:</strong></p>
          <ul>
            <li>Membros marcados como <strong>Intercessor</strong> serão sincronizados como intercessores</li>
            <li>Membros com <strong>Pode Receber Oração</strong> marcado serão sincronizados como candidatos</li>
            <li>Membros já sincronizados serão atualizados com os dados atuais</li>
          </ul>
        </div>

        <div class="filters-bar">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filterMembers()"
            placeholder="Buscar por nome..." 
            class="search-input"
          />
          <select [(ngModel)]="intercessorFilter" (change)="filterMembers()" class="filter-select">
            <option value="">Todos</option>
            <option value="true">Intercessor</option>
            <option value="false">Não Intercessor</option>
          </select>
          <select [(ngModel)]="podeReceberOracaoFilter" (change)="filterMembers()" class="filter-select">
            <option value="">Todos</option>
            <option value="true">Pode Receber Oração</option>
            <option value="false">Não Pode Receber Oração</option>
          </select>
        </div>

        <div class="selection-info" *ngIf="selectedCount > 0">
          <strong>{{ selectedCount }}</strong> membro(s) selecionado(s) para sincronização
        </div>

        <app-data-table
          [columns]="tableColumns"
          [data]="getTableData()"
          [loading]="loading"
          emptyMessage="Nenhum membro encontrado"
          [striped]="true"
          [hoverable]="true"
        >
          <ng-template #rowTemplate let-row let-column="column">
            @if (column.key === 'select') {
              <input 
                type="checkbox" 
                [checked]="row.selected"
                (change)="toggleSelection(row._original)"
                [disabled]="!row.canSync"
              />
            } @else if (column.key === 'intercessor') {
              <span class="badge" [class.active]="row.intercessor" [class.inactive]="!row.intercessor">
                {{ row.intercessor ? 'Sim' : 'Não' }}
              </span>
            } @else if (column.key === 'podeReceberOracao') {
              <span class="badge" [class.active]="row.podeReceberOracao" [class.inactive]="!row.podeReceberOracao">
                {{ row.podeReceberOracao ? 'Sim' : 'Não' }}
              </span>
            } @else if (column.key === 'status') {
              @if (row.synced) {
                <span class="badge synced">Sincronizado</span>
              } @else {
                <span class="badge not-synced">Não Sincronizado</span>
              }
            } @else {
              {{ row[column.key] || '-' }}
            }
          </ng-template>
        </app-data-table>
      </div>
    </app-modal>
  `,
  styles: [`
    .sync-members-container {
      padding: 1rem;
    }
    .info-message {
      background: #e3f2fd;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      border: 1px solid #90caf9;
    }
    .info-message ul {
      margin: 0.5rem 0 0 1.5rem;
      padding: 0;
    }
    .info-message li {
      margin: 0.25rem 0;
    }
    .filters-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .filter-select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      min-width: 150px;
    }
    .selection-info {
      padding: 0.75rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    .badge.active {
      background: #28a745;
      color: white;
    }
    .badge.inactive {
      background: #dc3545;
      color: white;
    }
    .badge.synced {
      background: #17a2b8;
      color: white;
    }
    .badge.not-synced {
      background: #6c757d;
      color: white;
    }
  `]
})
export class SyncMembersComponent implements OnInit, OnDestroy, OnChanges {
  private unsubscribe$ = new Subject<void>();
  private prayerService = inject(Prayer360Service);
  private api = inject(ApiService);
  private notificationService = inject(NotificationService);
  public cdr = inject(ChangeDetectorRef);

  @Input() isOpen = false;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() syncCompleteEvent = new EventEmitter<void>();

  ngOnInit(): void {
    if (this.isOpen) {
      this.loadMembers();
      this.loadSyncedMembers();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true && !changes['isOpen'].firstChange) {
      this.loadMembers();
      this.loadSyncedMembers();
    }
  }

  members: Member[] = [];
  filteredMembers: Member[] = [];
  selectedMemberIds: number[] = [];
  syncedMemberIds: Set<number> = new Set();
  loading = false;
  syncing = false;

  searchTerm = '';
  intercessorFilter = '';
  podeReceberOracaoFilter = '';

  tableColumns: TableColumn[] = [
    { key: 'select', label: '', width: '50px', align: 'center' },
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'celular', label: 'Celular', sortable: true },
    { key: 'intercessor', label: 'Intercessor', sortable: true, width: '100px', align: 'center' },
    { key: 'podeReceberOracao', label: 'Pode Receber Oração', sortable: true, width: '140px', align: 'center' },
    { key: 'status', label: 'Status', width: '120px', align: 'center' }
  ];

  get selectedCount(): number {
    return this.selectedMemberIds.length;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadMembers(): void {
    this.loading = true;
    this.api.get('members')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (members: any[]) => {
          this.members = (members || []).map(m => ({
            id: m.id,
            nome: m.nome,
            celular: m.celular,
            intercessor: m.intercessor === true,
            podeReceberOracao: m.podeReceberOracao !== false, // Default true
            synced: false
          }));
          this.filterMembers();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading members:', error);
          this.notificationService.showError('Erro ao carregar membros. Tente novamente.');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadSyncedMembers(): void {
    this.prayerService.getPersons()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (persons) => {
          this.syncedMemberIds = new Set(
            (persons || [])
              .filter(p => p.memberId)
              .map(p => p.memberId!)
          );
          this.updateMembersSyncedStatus();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading synced members:', error);
        }
      });
  }

  updateMembersSyncedStatus(): void {
    this.members.forEach(member => {
      member.synced = this.syncedMemberIds.has(member.id);
    });
    this.filterMembers();
  }

  filterMembers(): void {
    this.filteredMembers = this.members.filter(member => {
      // Filtro de busca
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        if (!member.nome?.toLowerCase().includes(search) &&
            !member.celular?.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Filtro de intercessor
      if (this.intercessorFilter !== '') {
        const isIntercessor = this.intercessorFilter === 'true';
        if (member.intercessor !== isIntercessor) {
          return false;
        }
      }

      // Filtro de pode receber oração
      if (this.podeReceberOracaoFilter !== '') {
        const podeReceber = this.podeReceberOracaoFilter === 'true';
        if (member.podeReceberOracao !== podeReceber) {
          return false;
        }
      }

      return true;
    });
  }

  getTableData(): any[] {
    return this.filteredMembers.map(member => ({
      ...member,
      _original: member,
      selected: this.selectedMemberIds.includes(member.id),
      canSync: member.intercessor || member.podeReceberOracao
    }));
  }

  toggleSelection(member: Member): void {
    const index = this.selectedMemberIds.indexOf(member.id);
    if (index === -1) {
      this.selectedMemberIds.push(member.id);
    } else {
      this.selectedMemberIds.splice(index, 1);
    }
    this.cdr.markForCheck();
  }

  syncSelected(): void {
    if (this.selectedMemberIds.length === 0) {
      this.notificationService.showError('Selecione pelo menos um membro para sincronizar');
      return;
    }

    this.syncing = true;
    this.prayerService.syncMembers(this.selectedMemberIds)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (syncedPersons) => {
          this.notificationService.showSuccess(`${syncedPersons.length} membro(s) sincronizado(s) com sucesso!`);
          this.selectedMemberIds = [];
          this.loadSyncedMembers();
          this.syncing = false;
          this.syncCompleteEvent.emit();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error syncing members:', error);
          this.notificationService.showError('Erro ao sincronizar membros. Tente novamente.');
          this.syncing = false;
          this.cdr.markForCheck();
        }
      });
  }

  close(): void {
    this.selectedMemberIds = [];
    this.closeEvent.emit();
  }

  getModalButtons() {
    return [
      {
        label: 'Cancelar',
        action: () => this.close(),
        class: 'btn-secondary'
      },
      {
        label: this.syncing ? 'Sincronizando...' : 'Sincronizar Selecionados',
        action: () => this.syncSelected(),
        class: 'btn-primary',
        disabled: this.syncing || this.selectedCount === 0
      }
    ];
  }
}

