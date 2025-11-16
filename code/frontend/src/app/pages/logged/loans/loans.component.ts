import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { ModalComponent, ModalButton } from '../../../shared/modules/modal/modal.component';
import { ActionIcons, MessageIcons } from '../../../shared/lib/utils/icons';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/lib/utils/data-table.component';
import { BookService, BookDTO } from '../../../shared/service/book.service';
import { LoanService, LoanDTO } from '../../../shared/service/loan.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { buildProfileImageUrl, buildBookImageUrl } from '../../../shared/utils/image-url-builder';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DataTableComponent],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss'
})
export class LoansComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  public utilsService = inject(UtilsService);

  // Tabs
  activeTab: 'books' | 'loans' = 'books';

  // Books
  books: BookDTO[] = [];
  bookTableData: any[] = [];
  bookColumns: TableColumn[] = [
    { key: 'fotoUrl', label: '', width: '80px', align: 'center' },
    { key: 'titulo', label: 'Título', sortable: true },
    { key: 'quantidade', label: 'Quantidade', width: '150px', align: 'center', sortable: true }
  ];

  // Loans
  loans: LoanDTO[] = [];
  loanTableData: any[] = [];
  loanColumns: TableColumn[] = [
    { key: 'memberFoto', label: '', width: '80px', align: 'center' },
    { key: 'memberNome', label: 'Nome', sortable: true },
    { key: 'whatsapp', label: 'WhatsApp', width: '100px', align: 'center' },
    { key: 'bookTitulo', label: 'Livro', sortable: true },
    { key: 'dataEmprestimo', label: 'Data Empréstimo', sortable: true },
    { key: 'dataDevolucao', label: 'Data Devolução', sortable: true },
    { key: 'status', label: 'Status', width: '120px', align: 'center', sortable: true }
  ];

  // Modals
  showBookModal = false;
  showLoanViewModal = false;
  isEditingBook = false;
  currentBook: BookDTO = {};
  viewingLoan: LoanDTO | null = null;

  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  uploadingPhoto = false;

  constructor(
    private bookService: BookService,
    private loanService: LoanService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadBooks();
    this.loadLoans();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  switchTab(tab: 'books' | 'loans'): void {
    this.activeTab = tab;
    if (tab === 'books') {
      this.loadBooks();
    } else {
      this.loadLoans();
    }
    this.cdr.markForCheck();
  }

  loadBooks(): void {
    this.bookService.getAll().pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (books) => {
        this.books = books;
        this.updateBookTableData();
      },
      error: (err) => {
        console.error('Error loading books:', err);
        this.notificationService.showError('Erro ao carregar livros.');
      }
    });
  }

  loadLoans(): void {
    this.loanService.getAll().pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (loans) => {
        this.loans = loans;
        this.updateLoanTableData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading loans:', err);
        this.notificationService.showError('Erro ao carregar empréstimos.');
      }
    });
  }

  updateBookTableData(): void {
    this.bookTableData = this.books.map(book => {
      const row = {
        ...book,
        fotoUrl: book.fotoUrl, // Garantir que fotoUrl está presente
        _original: book
      };
      // Debug: verificar se fotoUrl está presente
      if (book.fotoUrl) {
        console.log('Book in table data:', book.titulo, 'fotoUrl:', book.fotoUrl);
      }
      return row;
    });
    console.log('Book table data updated:', this.bookTableData.length, 'books');
    this.cdr.detectChanges();
  }

  updateLoanTableData(): void {
    this.loanTableData = this.loans.map(loan => {
      const row = {
        ...loan,
        memberFotoUrl: loan.memberFotoUrl,
        status: loan.status || (loan.devolvido ? 'devolvido' : (this.isOverdue(loan.dataDevolucao) ? 'vencido' : 'ativo')),
        _original: loan
      };
      // Debug: log para verificar se memberFotoUrl está presente
      if (loan.memberFotoUrl) {
        console.log('Loan with memberFotoUrl:', loan.memberNome, loan.memberFotoUrl);
      }
      return row;
    });
    this.cdr.detectChanges();
  }

  private isOverdue(dataDevolucao?: string | Date): boolean {
    if (!dataDevolucao) return false;
    const devolucao = new Date(dataDevolucao);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    devolucao.setHours(0, 0, 0, 0);
    return devolucao < hoje;
  }

  getBookTableActions(): TableAction[] {
    return [
      {
        label: 'Editar',
        icon: 'edit',
        action: (row) => {
          if (row._original) this.editBook(row._original);
        }
      },
      {
        label: 'Excluir',
        icon: 'delete',
        action: (row) => {
          if (row._original) this.deleteBook(row._original);
        }
      }
    ];
  }

  getLoanTableActions(): TableAction[] {
    return [
      {
        label: 'Visualizar',
        icon: 'view',
        action: (row) => {
          if (row._original) this.viewLoan(row._original);
        }
      },
      {
        label: 'Marcar como Devolvido',
        icon: 'check',
        action: (row) => {
          if (row._original && !row._original.devolvido) {
            this.markAsReturned(row._original);
          }
        },
        condition: (row) => !row._original?.devolvido
      }
    ];
  }

  openBookModal(): void {
    this.isEditingBook = false;
    this.currentBook = {};
    this.selectedPhotoFile = null;
    this.photoPreview = null;
    this.showBookModal = true;
  }

  closeBookModal(): void {
    this.showBookModal = false;
    this.currentBook = {};
    this.selectedPhotoFile = null;
    this.photoPreview = null;
  }

  onPhotoSelected(event: any): void {
    const file: File = event.target?.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('Por favor, selecione apenas arquivos de imagem.');
        event.target.value = ''; // Limpar input
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.showError('A imagem deve ter no máximo 5MB.');
        event.target.value = ''; // Limpar input
        return;
      }
      
      this.selectedPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.onerror = () => {
        console.error('Error reading file');
        this.notificationService.showError('Erro ao ler o arquivo selecionado.');
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedPhotoFile = null;
      this.photoPreview = null;
    }
  }

  saveBook(): void {
    // Validar campos obrigatórios
    const titulo = this.currentBook.titulo?.trim();
    const quantidadeTotal = this.currentBook.quantidadeTotal;
    
    if (!titulo || titulo === '') {
      this.notificationService.showError('O título é obrigatório.');
      return;
    }
    
    if (!quantidadeTotal || quantidadeTotal <= 0) {
      this.notificationService.showError('A quantidade total deve ser maior que zero.');
      return;
    }

    if (this.isEditingBook && this.currentBook.id) {
      // Editar livro existente
      const bookData: BookDTO = {
        titulo: titulo,
        quantidadeTotal: quantidadeTotal
      };
      
      // Atualizar dados do livro
      this.bookService.update(this.currentBook.id, bookData).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: (updatedBook) => {
          // Se tem foto nova, fazer upload
          if (this.selectedPhotoFile) {
            this.uploadBookPhoto(this.currentBook.id!);
          } else {
            this.notificationService.showSuccess('Livro atualizado com sucesso!');
            this.loadBooks();
            this.closeBookModal();
          }
        },
        error: (err) => {
          console.error('Error updating book:', err);
          this.notificationService.showError('Erro ao atualizar livro.');
        }
      });
    } else {
      // Criar novo livro
      const bookData: BookDTO = {
        titulo: titulo,
        quantidadeTotal: quantidadeTotal
      };

      this.bookService.create(bookData).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: (book) => {
          if (this.selectedPhotoFile && book.id) {
            this.uploadBookPhoto(book.id);
          } else {
            this.notificationService.showSuccess('Livro criado com sucesso!');
            this.loadBooks();
            this.closeBookModal();
          }
        },
        error: (err) => {
          console.error('Error creating book:', err);
          this.notificationService.showError('Erro ao criar livro.');
        }
      });
    }
  }

  uploadBookPhoto(bookId: number): void {
    if (!this.selectedPhotoFile) {
      console.warn('No photo file selected for upload');
      this.uploadingPhoto = false;
      return;
    }

    this.uploadingPhoto = true;
    console.log('Uploading photo for book ID:', bookId);
    console.log('File details:', {
      name: this.selectedPhotoFile.name,
      size: this.selectedPhotoFile.size,
      type: this.selectedPhotoFile.type
    });
    
    this.bookService.uploadPhoto(bookId, this.selectedPhotoFile).pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (result) => {
        console.log('Photo uploaded successfully:', result);
        this.uploadingPhoto = false;
        const message = this.isEditingBook ? 'Livro atualizado com sucesso!' : 'Livro criado com sucesso!';
        this.notificationService.showSuccess(message);
        // Limpar arquivo selecionado após sucesso
        this.selectedPhotoFile = null;
        this.photoPreview = null;
        // Recarregar livros para atualizar a tabela com a nova foto
        this.loadBooks();
        // Aguardar um pouco para garantir que a imagem foi processada
        setTimeout(() => {
          this.closeBookModal();
        }, 500);
      },
      error: (err) => {
        console.error('Error uploading photo:', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          error: err?.error,
          message: err?.message
        });
        this.uploadingPhoto = false;
        let errorMessage = 'Erro ao fazer upload da foto.';
        if (err?.error?.message) {
          errorMessage = err.error.message;
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (err?.status === 401 || err?.status === 403) {
          errorMessage = 'Você não tem permissão para fazer upload de fotos.';
        } else if (err?.status === 400) {
          errorMessage = 'Arquivo inválido ou muito grande.';
        } else if (err?.status === 404) {
          errorMessage = 'Livro não encontrado.';
        }
        this.notificationService.showError(errorMessage);
      }
    });
  }

  deleteBook(book: BookDTO): void {
    if (!book.id) return;
    if (confirm(`Tem certeza que deseja excluir o livro "${book.titulo}"?`)) {
      this.bookService.delete(book.id).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: () => {
          this.notificationService.showSuccess('Livro excluído com sucesso!');
          this.loadBooks();
        },
        error: (err) => {
          console.error('Error deleting book:', err);
          const errorMsg = err.error?.message || 'Erro ao excluir livro.';
          this.notificationService.showError(errorMsg);
        }
      });
    }
  }

  viewLoan(loan: LoanDTO): void {
    this.viewingLoan = loan;
    this.showLoanViewModal = true;
  }

  closeLoanViewModal(): void {
    this.showLoanViewModal = false;
    this.viewingLoan = null;
  }

  markAsReturned(loan: LoanDTO): void {
    if (!loan.id) return;
    if (confirm(`Confirmar devolução do livro "${loan.bookTitulo}"?`)) {
      this.loanService.markAsReturned(loan.id).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: (updatedLoan) => {
          console.log('Loan marked as returned:', updatedLoan);
          this.notificationService.showSuccess('Empréstimo marcado como devolvido!');
          this.loadLoans();
          // Se estava visualizando, atualiza o loan sendo visualizado
          if (this.viewingLoan && this.viewingLoan.id === updatedLoan.id) {
            this.viewingLoan = {
              ...updatedLoan,
              status: updatedLoan.status || 'devolvido',
              devolvido: true
            };
          }
        },
        error: (err) => {
          console.error('Error marking loan as returned:', err);
          this.notificationService.showError('Erro ao marcar empréstimo como devolvido.');
        }
      });
    }
  }

  editBook(book: BookDTO): void {
    this.isEditingBook = true;
    this.currentBook = { ...book };
    this.selectedPhotoFile = null;
    this.photoPreview = null;
    // Se já tem foto, carregar preview
    if (book.fotoUrl) {
      this.photoPreview = this.getBookImageUrl(book);
    }
    this.showBookModal = true;
  }

  getBookImageUrl(book: BookDTO): string {
    if (!book) {
      return './img/avatar-default.png';
    }
    
    if (book.fotoUrl && book.fotoUrl.trim() !== '') {
      const imageUrl = buildBookImageUrl(book.fotoUrl);
      console.log('Building book image URL for table:', book.titulo, 'fotoUrl:', book.fotoUrl, '->', imageUrl);
      return imageUrl;
    }
    
    console.log('No fotoUrl for book:', book.titulo);
    return './img/avatar-default.png';
  }

  getLoanImageUrl(loan: LoanDTO): string {
    if (loan?.bookFotoUrl) {
      return buildBookImageUrl(loan.bookFotoUrl);
    }
    return './img/avatar-default.png';
  }

  getMemberImageUrl(loan: LoanDTO): string {
    if (loan?.memberFotoUrl) {
      const imageUrl = buildProfileImageUrl(loan.memberFotoUrl);
      console.log('Building member image URL:', loan.memberNome, loan.memberFotoUrl, '->', imageUrl);
      return imageUrl;
    }
    console.log('No memberFotoUrl for loan:', loan?.memberNome);
    return './img/avatar-default.png';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ativo':
        return 'badge active';
      case 'vencido':
        return 'badge inactive';
      case 'devolvido':
        return 'badge';
      default:
        return 'badge';
    }
  }

  getStatusLabel(status: string | null | undefined): string {
    if (!status) return '-';
    const statusMap: { [key: string]: string } = {
      'ativo': 'Ativo',
      'vencido': 'Vencido',
      'devolvido': 'Devolvido'
    };
    return statusMap[status] || status || '-';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  getWhatsAppIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(MessageIcons.whatsapp({ size: 20, color: 'currentColor' }));
  }

  getBookModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeBookModal()
      },
      {
        label: this.uploadingPhoto ? 'Salvando...' : 'Salvar',
        type: 'primary',
        action: () => this.saveBook(),
        disabled: this.uploadingPhoto
      }
    ];
  }

  getLoanViewModalButtons(): ModalButton[] {
    const buttons: ModalButton[] = [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.closeLoanViewModal()
      }
    ];
    
    if (this.viewingLoan && !this.viewingLoan.devolvido) {
      buttons.push({
        label: 'Marcar como Devolvido',
        type: 'primary',
        action: () => this.markAsReturned(this.viewingLoan!)
      });
    }
    
    return buttons;
  }
}

