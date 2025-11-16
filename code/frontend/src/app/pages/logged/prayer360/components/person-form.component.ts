import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrayerPerson } from '../model/prayer-person.model';
import { ModalComponent } from '../../../../shared/modules/modal/modal.component';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [title]="isEditing ? 'Editar Pessoa' : 'Nova Pessoa Externa'"
      [isOpen]="isOpen"
      [size]="'medium'"
      [footerButtons]="getModalButtons()"
      (close)="close()">
      
      <div class="person-form">
        <div class="form-group">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="person.nome" name="nome" required class="form-input" />
        </div>

        <div class="form-group">
          <label>Celular</label>
          <input type="text" [(ngModel)]="person.celular" name="celular" class="form-input" />
        </div>

        <div class="form-group">
          <label>Tipo *</label>
          <select [(ngModel)]="person.tipo" name="tipo" required class="form-select">
            <option value="ADULTO">Adulto</option>
            <option value="CRIANCA">Criança</option>
          </select>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" [(ngModel)]="person.isIntercessor" name="isIntercessor" />
            É Intercessor
          </label>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" [(ngModel)]="person.isExternal" name="isExternal" [checked]="true" />
            Pessoa Externa (não vinculada a membro)
          </label>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" [(ngModel)]="person.active" name="active" [checked]="true" />
            Ativo
          </label>
        </div>

        @if (person.tipo === 'CRIANCA') {
          <div class="section-title">Dados dos Responsáveis</div>
          
          <div class="form-group">
            <label>Nome do Pai</label>
            <input type="text" [(ngModel)]="person.nomePai" name="nomePai" class="form-input" />
          </div>

          <div class="form-group">
            <label>Telefone do Pai</label>
            <input type="text" [(ngModel)]="person.telefonePai" name="telefonePai" class="form-input" />
          </div>

          <div class="form-group">
            <label>Nome da Mãe</label>
            <input type="text" [(ngModel)]="person.nomeMae" name="nomeMae" class="form-input" />
          </div>

          <div class="form-group">
            <label>Telefone da Mãe</label>
            <input type="text" [(ngModel)]="person.telefoneMae" name="telefoneMae" class="form-input" />
          </div>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .person-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .form-group label {
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .form-group label input[type="checkbox"] {
      width: auto;
    }
    .form-input, .form-select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .section-title {
      font-weight: 600;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #ddd;
    }
  `]
})
export class PersonFormComponent implements OnInit, OnChanges {
  private notificationService = inject(NotificationService);

  @Input() isOpen = false;
  @Input() person: PrayerPerson | null = null;
  @Input() isEditing = false;
  
  @Output() closeEvent = new EventEmitter<void>();
  @Output() saveEvent = new EventEmitter<PrayerPerson>();

  ngOnInit(): void {
    this.initPerson();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person'] || (changes['isOpen'] && changes['isOpen'].currentValue === true)) {
      this.initPerson();
    }
  }

  private initPerson(): void {
    if (!this.person) {
      this.person = {
        nome: '',
        celular: '',
        tipo: 'ADULTO',
        isIntercessor: false,
        isExternal: true,
        active: true
      };
    } else {
      // Criar cópia para não modificar o original
      this.person = { ...this.person };
    }
  }

  close(): void {
    this.closeEvent.emit();
  }

  save(): void {
    if (!this.person) {
      return;
    }

    if (!this.person.nome || this.person.nome.trim() === '') {
      this.notificationService.showError('Nome é obrigatório');
      return;
    }

    if (!this.person.tipo) {
      this.notificationService.showError('Tipo é obrigatório');
      return;
    }

    this.saveEvent.emit(this.person);
  }

  getModalButtons() {
    return [
      {
        label: 'Cancelar',
        action: () => this.close(),
        class: 'btn-secondary'
      },
      {
        label: this.isEditing ? 'Salvar' : 'Criar',
        action: () => this.save(),
        class: 'btn-primary'
      }
    ];
  }
}

