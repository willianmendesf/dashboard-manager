import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Prayer360Service } from '../service/prayer360.service';
import { PrayerPerson } from '../model/prayer-person.model';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/lib/utils/data-table.component';
import { ModalComponent } from '../../../../shared/modules/modal/modal.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ActionIcons } from '../../../../shared/lib/utils/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-persons-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, DatePipe],
  template: `
    <div class="persons-list-container">
      <!-- Barra de ações e filtros -->
      <div class="action-bar">
        <div class="filters">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filterPersons()"
            placeholder="Buscar por nome..." 
            class="search-input"
          />
          <select [(ngModel)]="tipoFilter" (change)="filterPersons()" class="filter-select">
            <option value="">Todos os tipos</option>
            <option value="CRIANCA">Criança</option>
            <option value="ADULTO">Adulto</option>
          </select>
          <select [(ngModel)]="intercessorFilter" (change)="filterPersons()" class="filter-select">
            <option value="">Todos</option>
            <option value="true">Intercessor</option>
            <option value="false">Não Intercessor</option>
          </select>
          <select [(ngModel)]="externoFilter" (change)="filterPersons()" class="filter-select">
            <option value="">Todos</option>
            <option value="true">Externo</option>
            <option value="false">Membro</option>
          </select>
          <select [(ngModel)]="ativoFilter" (change)="filterPersons()" class="filter-select">
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
        <div class="actions">
          <button class="btn-secondary" (click)="openSyncModal()">
            Sincronizar Membros
          </button>
          <button class="btn-primary" (click)="openPersonForm()">
            + Nova Pessoa Externa
          </button>
        </div>
      </div>

      <!-- Tabela de pessoas -->
      <app-data-table
        [columns]="tableColumns"
        [data]="getTableData()"
        [actions]="getTableActions()"
        [loading]="loading"
        emptyMessage="Nenhuma pessoa encontrada"
        [striped]="true"
        [hoverable]="true"
      >
        <ng-template #rowTemplate let-row let-column="column">
          @if (column.key === 'tipo') {
            <span class="badge" [class]="'badge-' + row.tipo.toLowerCase()">
              {{ row.tipo === 'CRIANCA' ? 'Criança' : 'Adulto' }}
            </span>
          } @else if (column.key === 'isIntercessor') {
            <span class="badge" [class.active]="row.isIntercessor" [class.inactive]="!row.isIntercessor">
              {{ row.isIntercessor ? 'Sim' : 'Não' }}
            </span>
          } @else if (column.key === 'isExternal') {
            <span class="badge" [class.active]="row.isExternal" [class.inactive]="!row.isExternal">
              {{ row.isExternal ? 'Sim' : 'Não' }}
            </span>
          } @else if (column.key === 'active') {
            <span class="badge" [class.active]="row.active" [class.inactive]="!row.active">
              {{ row.active ? 'Ativo' : 'Inativo' }}
            </span>
          } @else {
            {{ row[column.key] || '-' }}
          }
        </ng-template>
      </app-data-table>
    </div>
  `,
  styles: [`
    .persons-list-container {
      padding: 1rem;
    }
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      flex: 1;
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
      min-width: 120px;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-primary, .btn-secondary {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-primary {
      background: #007bff;
      color: white;
    }
    .btn-secondary {
      background: #6c757d;
      color: white;
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
    .badge-crianca {
      background: #ffc107;
      color: #000;
    }
    .badge-adulto {
      background: #17a2b8;
      color: white;
    }
  `]
})
export class PersonsListComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private prayerService = inject(Prayer360Service);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  public cdr = inject(ChangeDetectorRef);

  persons: PrayerPerson[] = [];
  filteredPersons: PrayerPerson[] = [];
  loading = false;

  // Filtros
  searchTerm = '';
  tipoFilter = '';
  intercessorFilter = '';
  externoFilter = '';
  ativoFilter = '';

  // Colunas da tabela
  tableColumns: TableColumn[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'celular', label: 'Celular', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true, width: '100px', align: 'center' },
    { key: 'isIntercessor', label: 'Intercessor', sortable: true, width: '100px', align: 'center' },
    { key: 'isExternal', label: 'Externo', sortable: true, width: '100px', align: 'center' },
    { key: 'active', label: 'Status', sortable: true, width: '100px', align: 'center' }
  ];

  // Eventos para o componente pai
  @Output() syncClick = new EventEmitter<void>();
  @Output() newPersonClick = new EventEmitter<void>();
  @Output() viewClick = new EventEmitter<PrayerPerson>();
  @Output() editClick = new EventEmitter<PrayerPerson>();
  @Output() deleteClick = new EventEmitter<PrayerPerson>();

  ngOnInit(): void {
    this.loadPersons();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadPersons(): void {
    this.loading = true;
    this.prayerService.getPersons()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (persons) => {
          this.persons = persons || [];
          this.filterPersons();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading persons:', error);
          this.notificationService.showError('Erro ao carregar pessoas. Tente novamente.');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  filterPersons(): void {
    this.filteredPersons = this.persons.filter(person => {
      // Filtro de busca
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        if (!person.nome?.toLowerCase().includes(search) &&
            !person.celular?.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Filtro de tipo
      if (this.tipoFilter && person.tipo !== this.tipoFilter) {
        return false;
      }

      // Filtro de intercessor
      if (this.intercessorFilter !== '') {
        const isIntercessor = this.intercessorFilter === 'true';
        if (person.isIntercessor !== isIntercessor) {
          return false;
        }
      }

      // Filtro de externo
      if (this.externoFilter !== '') {
        const isExternal = this.externoFilter === 'true';
        if (person.isExternal !== isExternal) {
          return false;
        }
      }

      // Filtro de ativo
      if (this.ativoFilter !== '') {
        const isActive = this.ativoFilter === 'true';
        if (person.active !== isActive) {
          return false;
        }
      }

      return true;
    });
  }

  getTableData(): any[] {
    return this.filteredPersons.map(person => ({
      ...person,
      _original: person
    }));
  }

  getTableActions(): TableAction[] {
    return [
      {
        label: 'Visualizar',
        icon: 'view',
        action: (row) => {
          if (row._original) {
            this.viewClick.emit(row._original);
          }
        }
      },
      {
        label: 'Editar',
        icon: 'edit',
        action: (row) => {
          if (row._original) {
            this.editClick.emit(row._original);
          }
        }
      },
      {
        label: 'Excluir',
        icon: 'delete',
        action: (row) => {
          if (row._original) {
            this.deleteClick.emit(row._original);
          }
        }
      }
    ];
  }

  openSyncModal(): void {
    this.syncClick.emit();
  }

  openPersonForm(): void {
    this.newPersonClick.emit();
  }

  getIcon(iconName: string): SafeHtml {
    const icons: any = {
      view: ActionIcons.view({ size: 16, color: 'currentColor' }),
      edit: ActionIcons.edit({ size: 16, color: 'currentColor' }),
      delete: ActionIcons.delete({ size: 16, color: 'currentColor' })
    };
    const html = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

