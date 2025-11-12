import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';
import { NavigationIcons, ActionIcons } from '../../shared/lib/utils/icons';
import { DataTableComponent, TableColumn, TableAction } from '../../shared/lib/utils/data-table.component';
import { Visitor, VisitorStats } from './model/visitor.model';
import { VisitorService } from '../../shared/service/visitor.service';
import { NotificationService } from '../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-visitor-management',
  standalone: true,
  templateUrl: './visitor-management.component.html',
  styleUrl: './visitor-management.component.scss',
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DataTableComponent, NgxMaskDirective],
  providers: [provideNgxMask()]
})
export class VisitorManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);

  visitors: Visitor[] = [];
  filteredVisitors: Visitor[] = [];
  tableData: any[] = [];
  searchTerm = '';
  dateFilter = '';
  isLoading = false;

  // Graph data
  sundayStats: VisitorStats[] = [];
  chartData: number[] = [];
  chartLabels: string[] = [];
  maxChartValue: number = 1;

  // Estados BR
  estadosBR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  tableColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'nomeCompleto', label: 'Nome Completo', sortable: true },
    { key: 'dataVisita', label: 'Data Visita', sortable: true },
    { key: 'telefone', label: 'Telefone', sortable: false },
    { key: 'jaFrequentaIgreja', label: 'Frequenta?', sortable: false },
    { key: 'procuraIgreja', label: 'Procura Igreja?', sortable: false },
    { key: 'eDeSP', label: 'É de SP?', sortable: false },
    { key: 'estado', label: 'Estado', sortable: false }
  ];

  getTableActions(): TableAction[] {
    return [
      {
        label: 'Editar',
        icon: 'edit',
        action: (row) => {
          if (row._original) this.editVisitor(row._original);
        }
      },
      {
        label: 'Excluir',
        icon: 'delete',
        action: (row) => {
          if (row._original) this.deleteVisitor(row._original);
        }
      }
    ];
  }

  showVisitorModal = false;
  showImportModal = false;
  isEditing = false;
  currentVisitor: Partial<Visitor> = {};
  
  selectedImportFile: File | null = null;
  importProgress = '';
  importResult: any = null;
  isImporting = false;

  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  uploadingPhoto = false;

  constructor(
    private visitorService: VisitorService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSundayStats();
    this.loadVisitors();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadSundayStats(): void {
    this.visitorService.getSundayStats()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (stats) => {
          console.log('Sunday stats received:', stats);
          
          if (!stats || stats.length === 0) {
            this.chartData = [];
            this.chartLabels = [];
            this.maxChartValue = 1;
            this.cdr.detectChanges();
            return;
          }
          
          this.sundayStats = stats;
          
          // Mapear quantidades garantindo que sejam números
          this.chartData = stats.map(s => {
            const qty = typeof s.quantidade === 'number' ? s.quantidade : Number(s.quantidade) || 0;
            return qty;
          });
          
          // Mapear labels formatando datas
          this.chartLabels = stats.map(s => {
            try {
              // Converter para Date (aceita string ISO ou Date)
              const date = new Date(s.data as any);
              
              if (isNaN(date.getTime())) {
                console.warn('Invalid date:', s.data);
                return 'Data inválida';
              }
              
              return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            } catch (e) {
              console.error('Error parsing date:', s.data, e);
              return 'Data inválida';
            }
          });
          
          // Calcular valor máximo garantindo pelo menos 1
          if (this.chartData.length > 0) {
            const maxValue = Math.max(...this.chartData);
            this.maxChartValue = maxValue > 0 ? maxValue : 1;
          } else {
            this.maxChartValue = 1;
          }
          
          console.log('Chart data:', this.chartData);
          console.log('Chart labels:', this.chartLabels);
          console.log('Max chart value:', this.maxChartValue);
          
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading Sunday stats:', err);
          this.chartData = [];
          this.chartLabels = [];
          this.maxChartValue = 1;
          this.cdr.detectChanges();
        }
      });
  }

  loadVisitors(): void {
    this.isLoading = true;
    const date = this.dateFilter ? this.dateFilter : undefined;
    const nome = this.searchTerm ? this.searchTerm : undefined;
    
    this.visitorService.getAll(date, nome)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (visitors) => {
          this.visitors = visitors;
          this.filteredVisitors = [...visitors];
          this.updateTableData();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading visitors:', err);
          this.notificationService.showError('Erro ao carregar visitantes.');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  updateTableData(): void {
    this.tableData = this.filteredVisitors.map(visitor => ({
      ...visitor,
      _original: visitor,
      foto: visitor.fotoUrl || null,
      eDeSP: visitor.eDeSP ? 'Sim' : 'Não'
    }));
  }

  onSearchTermChange(): void {
    this.loadVisitors();
  }

  onDateFilterChange(): void {
    this.loadVisitors();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentVisitor = {
      nomeCompleto: '',
      dataVisita: new Date().toISOString().split('T')[0],
      telefone: '',
      jaFrequentaIgreja: '',
      procuraIgreja: '',
      eDeSP: true,
      estado: 'SP'
    };
    this.selectedPhotoFile = null;
    this.photoPreview = null;
    this.showVisitorModal = true;
  }

  editVisitor(visitor: Visitor): void {
    this.isEditing = true;
    this.visitorService.getById(visitor.id!)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (fullVisitor) => {
          this.currentVisitor = { ...fullVisitor };
          if (this.currentVisitor.eDeSP === true) {
            this.currentVisitor.estado = 'SP';
          }
          this.photoPreview = fullVisitor.fotoUrl || null;
          this.selectedPhotoFile = null;
          this.showVisitorModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading visitor:', err);
          this.notificationService.showError('Erro ao carregar visitante.');
        }
      });
  }

  closeVisitorModal(): void {
    this.showVisitorModal = false;
    this.currentVisitor = {};
    this.selectedPhotoFile = null;
    this.photoPreview = null;
  }

  saveVisitor(): void {
    if (!this.currentVisitor.nomeCompleto || this.currentVisitor.nomeCompleto.trim() === '') {
      this.notificationService.showError('Nome completo é obrigatório.');
      return;
    }

    // Garantir que eDeSP sempre tenha valor (default true se undefined)
    const eDeSPValue = this.currentVisitor.eDeSP !== undefined ? this.currentVisitor.eDeSP : true;
    
    const estadoValue = eDeSPValue === true 
      ? 'SP' 
      : (this.currentVisitor.estado && this.currentVisitor.estado.trim() !== '' 
          ? this.currentVisitor.estado.trim().toUpperCase() 
          : undefined);
    
    const visitorData: Partial<Visitor> = {
      nomeCompleto: this.currentVisitor.nomeCompleto.trim(),
      dataVisita: this.currentVisitor.dataVisita,
      telefone: this.currentVisitor.telefone || undefined,
      jaFrequentaIgreja: this.currentVisitor.jaFrequentaIgreja || undefined,
      procuraIgreja: this.currentVisitor.procuraIgreja || undefined,
      eDeSP: eDeSPValue,
      estado: estadoValue
    };
    
    console.log('Sending update data:', JSON.stringify(visitorData, null, 2));

    if (this.isEditing && this.currentVisitor.id) {
      this.visitorService.update(this.currentVisitor.id, visitorData)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            // Upload photo if selected
            if (this.selectedPhotoFile && this.currentVisitor.id) {
              this.uploadPhoto(this.currentVisitor.id);
            } else {
              this.notificationService.showSuccess('Visitante atualizado com sucesso!');
              this.loadVisitors();
              this.closeVisitorModal();
            }
          },
          error: (err) => {
            console.error('Error updating visitor:', err);
            this.notificationService.showError('Erro ao atualizar visitante.');
          }
        });
    } else {
      this.visitorService.create(visitorData)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: (created) => {
            // Upload photo if selected
            if (this.selectedPhotoFile && created.id) {
              this.uploadPhoto(created.id);
            } else {
              this.notificationService.showSuccess('Visitante criado com sucesso!');
              this.loadVisitors();
              this.closeVisitorModal();
            }
          },
          error: (err) => {
            console.error('Error creating visitor:', err);
            this.notificationService.showError('Erro ao criar visitante.');
          }
        });
    }
  }

  deleteVisitor(visitor: Visitor): void {
    if (!visitor.id) return;
    
    if (confirm(`Tem certeza que deseja deletar o visitante "${visitor.nomeCompleto}"?`)) {
      this.visitorService.delete(visitor.id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Visitante deletado com sucesso!');
            this.loadVisitors();
            this.loadSundayStats();
          },
          error: (err) => {
            console.error('Error deleting visitor:', err);
            this.notificationService.showError('Erro ao deletar visitante.');
          }
        });
    }
  }

  onPhotoSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('Por favor, selecione um arquivo de imagem.');
        return;
      }
      this.selectedPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto(visitorId: number): void {
    if (!this.selectedPhotoFile) return;

    this.uploadingPhoto = true;
    this.visitorService.uploadPhoto(visitorId, this.selectedPhotoFile)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (result: any) => {
          // Extrair fotoUrl da resposta (backend retorna { "fotoUrl": "...", "visitor": {...} })
          const fotoUrl = result?.fotoUrl || result?.visitor?.fotoUrl;
          
          if (!fotoUrl) {
            this.uploadingPhoto = false;
            this.notificationService.showError('Resposta inválida do servidor.');
            return;
          }
          
          // Adicionar timestamp para forçar atualização da imagem (cache busting)
          const fotoUrlWithTimestamp = fotoUrl + (fotoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
          
          // Atualizar currentVisitor no modal
          this.currentVisitor.fotoUrl = fotoUrlWithTimestamp;
          
          // Atualizar visitor na lista local imediatamente
          const visitorIndex = this.visitors.findIndex(v => v.id === visitorId);
          if (visitorIndex !== -1) {
            this.visitors[visitorIndex] = {
              ...this.visitors[visitorIndex],
              fotoUrl: fotoUrlWithTimestamp
            };
          }
          
          // Atualizar filteredVisitors
          const filteredIndex = this.filteredVisitors.findIndex(v => v.id === visitorId);
          if (filteredIndex !== -1) {
            this.filteredVisitors[filteredIndex] = {
              ...this.filteredVisitors[filteredIndex],
              fotoUrl: fotoUrlWithTimestamp
            };
          }
          
          this.uploadingPhoto = false;
          this.notificationService.showSuccess('Foto enviada com sucesso!');
          
          // Se estava criando (não editando), fechar modal após upload
          if (!this.isEditing) {
            this.loadVisitors();
            this.closeVisitorModal();
          }
          
          // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.photoPreview = fotoUrlWithTimestamp;
            this.updateTableData();
            this.cdr.detectChanges();
          }, 0);
        },
        error: (err) => {
          console.error('Error uploading photo:', err);
          this.uploadingPhoto = false;
          this.notificationService.showError('Erro ao enviar foto.');
        }
      });
  }

  openImportModal(): void {
    this.showImportModal = true;
    this.selectedImportFile = null;
    this.importProgress = '';
    this.importResult = null;
    this.isImporting = false;
  }

  closeImportModal(): void {
    this.showImportModal = false;
    this.selectedImportFile = null;
    this.importProgress = '';
    this.importResult = null;
    this.isImporting = false;
  }

  onImportFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        this.notificationService.showError('Formato de arquivo inválido. Use .xlsx, .xls ou .csv');
        return;
      }
      
      this.selectedImportFile = file;
      this.importProgress = `Arquivo selecionado: ${file.name}`;
    }
  }

  onImportFileDropped(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        this.notificationService.showError('Formato de arquivo inválido. Use .xlsx, .xls ou .csv');
        return;
      }
      
      this.selectedImportFile = file;
      this.importProgress = `Arquivo selecionado: ${file.name}`;
    }
  }

  onImportDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  downloadTemplate(): void {
    this.visitorService.downloadTemplate()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'modelo_importacao_visitantes.xlsx';
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.showSuccess('Modelo baixado com sucesso!');
        },
        error: (err) => {
          console.error('Error downloading template:', err);
          this.notificationService.showError('Erro ao baixar modelo.');
        }
      });
  }

  processImport(): void {
    if (!this.selectedImportFile) {
      this.notificationService.showError('Por favor, selecione um arquivo.');
      return;
    }

    this.isImporting = true;
    this.importProgress = 'Processando arquivo...';

    this.visitorService.import(this.selectedImportFile)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (result) => {
          this.importResult = result;
          this.importProgress = `Importação concluída: ${result.successCount} sucesso(s), ${result.errorCount} erro(s)`;
          this.isImporting = false;
          
          if (result.errorCount === 0) {
            this.notificationService.showSuccess(`Importação concluída: ${result.successCount} visitante(s) importado(s).`);
            this.loadVisitors();
            this.loadSundayStats();
            setTimeout(() => this.closeImportModal(), 2000);
          } else {
            this.notificationService.showWarning(`Importação concluída com erros: ${result.successCount} sucesso(s), ${result.errorCount} erro(s).`);
          }
        },
        error: (err) => {
          console.error('Error importing visitors:', err);
          this.importProgress = 'Erro ao importar visitantes.';
          this.isImporting = false;
          this.notificationService.showError('Erro ao importar visitantes.');
        }
      });
  }

  getModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeVisitorModal()
      },
      {
        label: this.isEditing ? 'Salvar Alterações' : 'Criar Visitante',
        type: 'primary',
        action: () => this.saveVisitor()
      }
    ];
  }

  getImportModalButtons(): ModalButton[] {
    return [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.closeImportModal()
      },
      {
        label: 'Importar',
        type: 'primary',
        action: () => this.processImport(),
        disabled: !this.selectedImportFile || this.isImporting
      }
    ];
  }

  getAddIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ActionIcons.add({ size: 18, color: 'currentColor' }));
  }

  getSearchIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(NavigationIcons.search({ size: 20, color: 'currentColor' }));
  }

  get eDeSP(): boolean {
    return this.currentVisitor.eDeSP === true;
  }

  onEDeSPChange(value: any): void {
    const boolValue = value === true || value === 'true' || value === 1;
    this.currentVisitor.eDeSP = boolValue;
    
    if (boolValue === true) {
      this.currentVisitor.estado = 'SP';
    } else {
      this.currentVisitor.estado = '';
    }
    this.cdr.detectChanges();
  }
}

