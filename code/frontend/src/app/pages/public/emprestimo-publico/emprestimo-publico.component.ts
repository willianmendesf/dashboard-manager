import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService, BookDTO } from '../../../shared/service/book.service';
import { LoanService, CreateLoanDTO } from '../../../shared/service/loan.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { OtpService } from '../../../shared/service/otp.service';
import { PublicMemberService } from '../../../shared/service/public-member.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { buildBookImageUrl } from '../../../shared/utils/image-url-builder';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-emprestimo-publico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, NgxMaskDirective],
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
  
  // OTP Flow
  step = 1; // 1 = telefone, 2 = código, 3 = seleção de livro
  phone = '';
  code = '';
  memberName = '';
  memberPhone = '';

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private loanService: LoanService,
    private notificationService: NotificationService,
    private otpService: OtpService,
    private memberService: PublicMemberService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loanForm = this.fb.group({
      bookId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Não carrega livros até validar OTP
  }

  isPhoneValid(): boolean {
    if (!this.phone) return false;
    const cleanPhone = this.phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  }

  requestCode(): void {
    if (!this.isPhoneValid()) {
      this.notificationService.showError('Por favor, informe um telefone válido.');
      return;
    }

    this.isLoading = true;
    const cleanPhone = this.phone.replace(/\D/g, '');

    this.otpService.requestOtp(cleanPhone, 'LOAN_PORTAL').subscribe({
      next: () => {
        this.notificationService.showSuccess('Código enviado com sucesso! Verifique seu WhatsApp.');
        this.step = 2;
        this.code = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error requesting OTP:', err);
        const errorMessage = err?.error?.message || err?.error || 'Erro ao enviar código. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  validateCode(): void {
    if (!this.code || this.code.length !== 6) {
      this.notificationService.showError('Por favor, informe o código de 6 dígitos.');
      return;
    }

    this.isLoading = true;
    const cleanPhone = this.phone.replace(/\D/g, '');

    this.otpService.validateOtp(cleanPhone, this.code, 'LOAN_PORTAL').subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Código validado com sucesso!');
        this.isLoading = false;
        this.loadMemberByPhone(cleanPhone);
      },
      error: (err) => {
        console.error('Error validating OTP:', err);
        let errorMessage = 'Código inválido ou expirado. Tente novamente.';
        
        if (err?.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.error) {
            errorMessage = err.error.error;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
        this.code = '';
        this.cdr.detectChanges();
      }
    });
  }

  private loadMemberByPhone(phone: string): void {
    this.isLoading = true;
    this.memberService.getMemberByPhone(phone).subscribe({
      next: (member) => {
        if (!member.nome) {
          this.notificationService.showError('Cadastro não encontrado. É necessário falar com um diácono para se cadastrar antes de realizar empréstimos.');
          this.isLoading = false;
          this.step = 1;
          this.cdr.detectChanges();
          return;
        }

        // Armazenar nome e telefone para exibição e envio
        this.memberName = member.nome;
        this.memberPhone = phone;
        this.step = 3;
        this.loadAvailableBooks();
      },
      error: (err) => {
        console.error('Error finding member by phone:', err);
        this.notificationService.showError('Cadastro não encontrado. É necessário falar com um diácono para se cadastrar antes de realizar empréstimos.');
        this.isLoading = false;
        this.step = 1;
        this.cdr.detectChanges();
      }
    });
  }

  loadAvailableBooks(): void {
    this.isLoadingBooks = true;
    this.bookService.getAvailableBooks().subscribe({
      next: (books) => {
        this.availableBooks = books;
        this.isLoadingBooks = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading books:', err);
        this.notificationService.showError('Erro ao carregar livros disponíveis.');
        this.isLoadingBooks = false;
        this.isLoading = false;
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
      this.notificationService.showError('Por favor, selecione um livro.');
      return;
    }

    if (!this.memberPhone) {
      this.notificationService.showError('Erro: Telefone não encontrado. Por favor, tente novamente.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.loanForm.getRawValue();
    const createLoanDTO: CreateLoanDTO = {
      bookId: formData.bookId,
      memberPhone: this.memberPhone
    };

    this.loanService.create(createLoanDTO).subscribe({
      next: (loan) => {
        const dataDevolucao = new Date(loan.dataDevolucao!);
        const dataFormatada = dataDevolucao.toLocaleDateString('pt-BR');
        this.successMessage = `Empréstimo registrado com sucesso! Data de devolução: ${dataFormatada}`;
        this.notificationService.showSuccess(this.successMessage);
        this.isLoading = false;
        this.resetForm();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error creating loan:', err);
        if (err.status === 404) {
          this.errorMessage = 'Telefone não encontrado na base de membros. É necessário falar com um diácono para se cadastrar antes de realizar empréstimos.';
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

  resetForm(): void {
    this.loanForm.reset();
    this.selectedBook = null;
    this.step = 1;
    this.phone = '';
    this.code = '';
    this.memberName = '';
    this.memberPhone = '';
    this.availableBooks = [];
    this.errorMessage = '';
    this.successMessage = '';
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

