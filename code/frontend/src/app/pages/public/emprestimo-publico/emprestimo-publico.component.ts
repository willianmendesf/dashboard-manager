import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BookService, BookDTO } from '../../../shared/service/book.service';
import { LoanService, CreateLoanDTO } from '../../../shared/service/loan.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { buildBookImageUrl } from '../../../shared/utils/image-url-builder';
import { environment } from '../../../../environments/environment';

function cpfValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const value = control.value.toString().trim();
  const cpfNumbers = value.replace(/\D/g, '');
  
  if (cpfNumbers.length !== 11) {
    return { invalidCpf: true };
  }

  const formattedPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  const numbersOnlyPattern = /^\d{11}$/;
  
  if (formattedPattern.test(value) || numbersOnlyPattern.test(cpfNumbers)) {
    return null;
  }

  return { invalidCpf: true };
}

@Component({
  selector: 'app-emprestimo-publico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './emprestimo-publico.component.html',
  styleUrl: './emprestimo-publico.component.scss'
})
export class EmprestimoPublicoComponent implements OnInit {
  loanForm: FormGroup;
  availableBooks: BookDTO[] = [];
  selectedBook: BookDTO | null = null;
  isLoading = false;
  isLoadingBooks = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private loanService: LoanService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loanForm = this.fb.group({
      cpf: ['', [Validators.required, cpfValidator]],
      bookId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAvailableBooks();
  }

  loadAvailableBooks(): void {
    this.isLoadingBooks = true;
    this.bookService.getAvailableBooks().subscribe({
      next: (books) => {
        this.availableBooks = books;
        this.isLoadingBooks = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading books:', err);
        this.notificationService.showError('Erro ao carregar livros disponíveis.');
        this.isLoadingBooks = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectBook(book: BookDTO): void {
    this.selectedBook = book;
    this.loanForm.patchValue({ bookId: book.id });
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.loanForm.invalid) {
      this.notificationService.showError('Por favor, preencha todos os campos corretamente.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.loanForm.getRawValue();
    const createLoanDTO: CreateLoanDTO = {
      bookId: formData.bookId,
      memberCpf: formData.cpf
    };

    this.loanService.create(createLoanDTO).subscribe({
      next: (loan) => {
        const dataDevolucao = new Date(loan.dataDevolucao!);
        const dataFormatada = dataDevolucao.toLocaleDateString('pt-BR');
        this.successMessage = `Empréstimo registrado com sucesso! Data de devolução: ${dataFormatada}`;
        this.notificationService.showSuccess(this.successMessage);
        this.isLoading = false;
        this.loanForm.reset();
        this.selectedBook = null;
        this.cdr.detectChanges();
        this.loadAvailableBooks();
      },
      error: (err) => {
        console.error('Error creating loan:', err);
        if (err.status === 404) {
          this.errorMessage = 'CPF não encontrado na base de membros. É necessário falar com um diácono para se cadastrar antes de realizar empréstimos.';
          this.notificationService.showError(this.errorMessage);
        } else {
          const errorMsg = err.error?.message || 'Erro ao criar empréstimo. Tente novamente.';
          this.errorMessage = errorMsg;
          this.notificationService.showError(errorMsg);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getBookImageUrl(book: BookDTO): string {
    if (book?.fotoUrl) {
      return buildBookImageUrl(book.fotoUrl);
    }
    return './img/avatar-default.png';
  }

  goToLanding(): void {
    this.router.navigate(['/landing']);
  }
}

