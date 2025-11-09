import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionIcons } from './icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction {
  label: string;
  icon: 'view' | 'edit' | 'delete' | 'duplicate' | 'save' | 'copy';
  action: (row: any) => void;
  condition?: (row: any) => boolean;
  class?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading: boolean = false;
  @Input() emptyMessage: string = 'Nenhum dado encontrado';
  @Input() rowTemplate?: TemplateRef<any>;
  @Input() showHeader: boolean = true;
  @Input() striped: boolean = true;
  @Input() hoverable: boolean = true;
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  
  private sanitizer = inject(DomSanitizer);
  currentSort: { column: string; direction: 'asc' | 'desc' } | null = null;

  getActionIcon(iconName: TableAction['icon']): SafeHtml {
    const icons = {
      view: ActionIcons.view({ size: 16, color: 'currentColor' }),
      edit: ActionIcons.edit({ size: 16, color: 'currentColor' }),
      delete: ActionIcons.delete({ size: 16, color: 'currentColor' }),
      duplicate: ActionIcons.duplicate({ size: 16, color: 'currentColor' }),
      save: ActionIcons.save({ size: 16, color: 'currentColor' }),
      copy: ActionIcons.duplicate({ size: 16, color: 'currentColor' })
    };
    const html = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onSort(column: TableColumn): void {
    if (!column.sortable) return;
    
    if (this.currentSort?.column === column.key) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = { column: column.key, direction: 'asc' };
    }
    
    this.sortChange.emit(this.currentSort);
  }

  getSortIcon(column: TableColumn): string {
    if (!column.sortable || this.currentSort?.column !== column.key) {
      return '';
    }
    return this.currentSort.direction === 'asc' ? '↑' : '↓';
  }

  onRowClick(row: any, event: MouseEvent): void {
    // Não emitir se o clique foi em um botão de ação
    if ((event.target as HTMLElement).closest('.action-buttons')) {
      return;
    }
    this.rowClick.emit(row);
  }

  shouldShowAction(action: TableAction, row: any): boolean {
    if (action.condition) {
      return action.condition(row);
    }
    return true;
  }

  onActionClick(action: TableAction, row: any, event: MouseEvent): void {
    event.stopPropagation();
    action.action(row);
  }
}

