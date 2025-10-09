import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/service/api.service';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";

@Component({
  selector: 'member-management',
  standalone: true,
  templateUrl: './member-management.html',
  styleUrl: './member-management.scss',
  imports: [CommonModule, FormsModule, PageTitleComponent]
})
export class MemberManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();

  members: Member[] = [];
  filteredMembers: Member[] = [...this.members];
  searchTerm = '';
  estadoCivilFilter: boolean | '' = '';
  tipoCadastroFilter = '';

  showMemberModal = false;
  showViewModal = false;
  isEditing = false;
  currentMember: any = {};
  viewingMember: Member | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = Math.ceil(this.members.length / this.itemsPerPage);

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.getMembers();
  }

  public getMembers() {
    this.api.get("members")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: res => {
          this.filterMembers();
          this.members = res;
        },
        error: error => console.error(error),
        complete: () => this.filterMembers()
      });
  }

  public createMember(member: Member) {
    this.api.post("members", member)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getMembers(),
        error: error => console.error(error),
        complete: () => this.getMembers()
      });
  }

  public updateMember(member: Member) {
    this.api.update(`members/${member.id}`, member)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getMembers(),
        error: error => console.error(error),
        complete: () => this.getMembers()
      });
  }

  public delete(id: number) {
    this.api.delete("members/" + id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getMembers(),
        error: error => console.error(error),
        complete: () => this.getMembers()
      });
  }

  filterMembers() {
    this.filteredMembers = this.members.filter(member => {
      const matchesSearch = member.nome?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            member.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            member.cpf?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesEstadoCivil = this.estadoCivilFilter === '' || member.estadoCivil === this.estadoCivilFilter;
      const matchesTipoCadastro = !this.tipoCadastroFilter || member.tipoCadastro === this.tipoCadastroFilter;

      return matchesSearch && matchesEstadoCivil && matchesTipoCadastro;
    });

    this.totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  openMemberModal(member?: Member) {
    this.showMemberModal = true;
    this.isEditing = !!member;
    this.currentMember = member ? { ...member } : {
      nome: '',
      cpf: '',
      rg: '',
      conjugueCPF: '',
      comungante: false,
      intercessor: false,
      tipoCadastro: '',
      nascimento: null,
      idade: null,
      estadoCivil: false,
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      telefone: '',
      comercial: '',
      celular: '',
      operadora: '',
      contato: '',
      email: '',
      grupos: '',
      lgpd: '',
      lgpdAceitoEm: null,
      rede: '',
      version: null
    };
  }

  closeMemberModal() {
    this.showMemberModal = false;
    this.currentMember = {};
  }

  viewMember(member: Member) {
    this.viewingMember = member;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingMember = null;
  }

  editMember(member: Member) {
    this.closeViewModal();
    this.openMemberModal(member);
  }

  saveMember() {
    if (this.isEditing) {
      const index = this.members.findIndex(m => m.id === this.currentMember.id);
      if (index !== -1) this.members[index] = { ...this.currentMember };
      this.updateMember(this.members[index]);
    } else {
      const newMember = {
        ...this.currentMember
      };
      this.createMember(newMember);
    }
    this.closeMemberModal();
  }

  deleteMember(member: Member) {
    if (confirm(`Tem certeza que deseja excluir o membro "${member.nome}"?`)) {
      this.delete(member.id);
      this.members = this.members.filter(m => m.id !== member.id);
      this.filterMembers();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
function provideAnimations(): readonly any[] | import("@angular/core").Type<any> {
  throw new Error('Function not implemented.');
}

