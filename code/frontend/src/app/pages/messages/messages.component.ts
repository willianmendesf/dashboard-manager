import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Agendamento de Mensagens</h1>
        <p>Crie e agende mensagens para envio automático</p>
      </div>

      <div class="messages-layout">
        <div class="compose-section">
          <div class="compose-card">
            <h2>Nova Mensagem</h2>
            
            <form class="compose-form" (ngSubmit)="scheduleMessage()">
              <div class="form-group">
                <label>Destinatários</label>
                <div class="recipients-input">
                  <input 
                    type="text" 
                    [(ngModel)]="newMessage.recipients" 
                    name="recipients"
                    placeholder="Digite emails separados por vírgula"
                    class="form-control"
                  />
                  <button type="button" class="btn-contacts">📋</button>
                </div>
              </div>

              <div class="form-group">
                <label>Assunto</label>
                <input 
                  type="text" 
                  [(ngModel)]="newMessage.subject" 
                  name="subject"
                  placeholder="Assunto da mensagem"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>Tipo de Mensagem</label>
                <select [(ngModel)]="newMessage.type" name="type" class="form-control">
                  <option value="email">📧 Email</option>
                  <option value="sms">📱 SMS</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="push">🔔 Push Notification</option>
                </select>
              </div>

              <div class="form-group">
                <label>Mensagem</label>
                <textarea 
                  [(ngModel)]="newMessage.content" 
                  name="content"
                  placeholder="Digite sua mensagem aqui..."
                  class="form-control message-textarea"
                  rows="6"
                ></textarea>
                <div class="character-count">
                  {{ newMessage.content.length }}/{{ getMaxLength() }} caracteres
                </div>
              </div>

              <div class="scheduling-options">
                <div class="form-group">
                  <label>Opções de Envio</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input 
                        type="radio" 
                        [(ngModel)]="newMessage.sendOption" 
                        name="sendOption"
                        value="now"
                      />
                      <span class="radio-custom"></span>
                      Enviar Agora
                    </label>
                    <label class="radio-option">
                      <input 
                        type="radio" 
                        [(ngModel)]="newMessage.sendOption" 
                        name="sendOption"
                        value="schedule"
                      />
                      <span class="radio-custom"></span>
                      Agendar Envio
                    </label>
                    <label class="radio-option">
                      <input 
                        type="radio" 
                        [(ngModel)]="newMessage.sendOption" 
                        name="sendOption"
                        value="recurring"
                      />
                      <span class="radio-custom"></span>
                      Envio Recorrente
                    </label>
                  </div>
                </div>

                <div class="form-group" *ngIf="newMessage.sendOption === 'schedule'">
                  <label>Data e Hora do Envio</label>
                  <div class="datetime-inputs">
                    <input 
                      type="date" 
                      [(ngModel)]="newMessage.scheduleDate" 
                      name="scheduleDate"
                      class="form-control"
                    />
                    <input 
                      type="time" 
                      [(ngModel)]="newMessage.scheduleTime" 
                      name="scheduleTime"
                      class="form-control"
                    />
                  </div>
                </div>

                <div class="form-group" *ngIf="newMessage.sendOption === 'recurring'">
                  <label>Frequência</label>
                  <select [(ngModel)]="newMessage.frequency" name="frequency" class="form-control">
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-secondary" (click)="saveDraft()">
                  💾 Salvar Rascunho
                </button>
                <button type="button" class="btn-secondary" (click)="previewMessage()">
                  👁️ Visualizar
                </button>
                <button type="submit" class="btn-primary">
                  {{ getSubmitButtonText() }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="messages-list-section">
          <div class="messages-card">
            <div class="messages-header">
              <h2>Mensagens Agendadas</h2>
              <div class="filter-tabs">
                <button 
                  class="tab-button" 
                  [class.active]="activeTab === 'scheduled'"
                  (click)="activeTab = 'scheduled'"
                >
                  Agendadas ({{ getScheduledCount() }})
                </button>
                <button 
                  class="tab-button" 
                  [class.active]="activeTab === 'sent'"
                  (click)="activeTab = 'sent'"
                >
                  Enviadas ({{ getSentCount() }})
                </button>
                <button 
                  class="tab-button" 
                  [class.active]="activeTab === 'drafts'"
                  (click)="activeTab = 'drafts'"
                >
                  Rascunhos ({{ getDraftsCount() }})
                </button>
              </div>
            </div>

            <div class="messages-list">
              <div 
                class="message-item" 
                *ngFor="let message of getFilteredMessages()"
                [class.sent]="message.status === 'sent'"
                [class.scheduled]="message.status === 'scheduled'"
                [class.draft]="message.status === 'draft'"
              >
                <div class="message-icon">
                  {{ getMessageIcon(message.type) }}
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <h4>{{ message.subject }}</h4>
                    <div class="message-status" [class]="message.status">
                      {{ getStatusText(message.status) }}
                    </div>
                  </div>
                  <p class="message-preview">{{ message.content | slice:0:100 }}...</p>
                  <div class="message-meta">
                    <span class="recipients">Para: {{ message.recipients }}</span>
                    <span class="schedule-time">
                      {{ message.status === 'sent' ? 'Enviado em:' : 'Agendado para:' }} 
                      {{ formatDateTime(message.scheduleDateTime) }}
                    </span>
                  </div>
                </div>
                <div class="message-actions">
                  <button class="btn-action edit" (click)="editMessage(message)" *ngIf="message.status !== 'sent'">
                    ✏️
                  </button>
                  <button class="btn-action duplicate" (click)="duplicateMessage(message)">
                    📋
                  </button>
                  <button class="btn-action delete" (click)="deleteMessage(message.id)">
                    🗑️
                  </button>
                </div>
              </div>

              <div class="empty-state" *ngIf="getFilteredMessages().length === 0">
                <div class="empty-icon">📭</div>
                <h3>Nenhuma mensagem encontrada</h3>
                <p>{{ getEmptyStateText() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div class="modal-overlay" *ngIf="showPreview" (click)="closePreview()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Visualização da Mensagem</h3>
            <button class="btn-close" (click)="closePreview()">×</button>
          </div>
          <div class="modal-body">
            <div class="preview-message">
              <div class="preview-field">
                <strong>Tipo:</strong> {{ getMessageTypeText(newMessage.type) }}
              </div>
              <div class="preview-field">
                <strong>Para:</strong> {{ newMessage.recipients }}
              </div>
              <div class="preview-field" *ngIf="newMessage.subject">
                <strong>Assunto:</strong> {{ newMessage.subject }}
              </div>
              <div class="preview-field">
                <strong>Mensagem:</strong>
                <div class="preview-content">{{ newMessage.content }}</div>
              </div>
              <div class="preview-field" *ngIf="newMessage.sendOption !== 'now'">
                <strong>Agendamento:</strong> {{ getSchedulingText() }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closePreview()">Fechar</button>
            <button class="btn-primary" (click)="confirmSchedule()">Confirmar Agendamento</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1F2937;
      font-size: 32px;
      font-weight: bold;
    }

    .page-header p {
      margin: 0;
      color: #6B7280;
      font-size: 16px;
    }

    .messages-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }

    .compose-card,
    .messages-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      height: fit-content;
    }

    .compose-card h2,
    .messages-card h2 {
      margin: 0 0 24px 0;
      color: #1F2937;
      font-size: 20px;
      font-weight: bold;
    }

    .compose-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }

    .form-control {
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .recipients-input {
      display: flex;
      gap: 8px;
    }

    .recipients-input .form-control {
      flex: 1;
    }

    .btn-contacts {
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-contacts:hover {
      background: #E5E7EB;
    }

    .message-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .character-count {
      text-align: right;
      font-size: 12px;
      color: #6B7280;
      margin-top: 4px;
    }

    .scheduling-options {
      background: #F9FAFB;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .radio-option {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
    }

    .radio-option input[type="radio"] {
      display: none;
    }

    .radio-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #D1D5DB;
      border-radius: 50%;
      margin-right: 12px;
      position: relative;
      transition: all 0.3s ease;
    }

    .radio-option input:checked + .radio-custom {
      border-color: #3B82F6;
      background: #3B82F6;
    }

    .radio-option input:checked + .radio-custom::after {
      content: '';
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .datetime-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
    }

    .btn-primary,
    .btn-secondary {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563EB;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #F3F4F6;
      color: #374151;
      border: 1px solid #D1D5DB;
    }

    .btn-secondary:hover {
      background: #E5E7EB;
    }

    .messages-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
    }

    .tab-button {
      padding: 8px 16px;
      border: none;
      background: #F3F4F6;
      color: #6B7280;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tab-button.active {
      background: #3B82F6;
      color: white;
    }

    .tab-button:hover:not(.active) {
      background: #E5E7EB;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 600px;
      overflow-y: auto;
    }

    .message-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .message-item:hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .message-item.scheduled {
      border-left: 4px solid #F59E0B;
    }

    .message-item.sent {
      border-left: 4px solid #10B981;
    }

    .message-item.draft {
      border-left: 4px solid #6B7280;
    }

    .message-icon {
      font-size: 24px;
      margin-top: 4px;
    }

    .message-content {
      flex: 1;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .message-header h4 {
      margin: 0;
      color: #1F2937;
      font-size: 16px;
      font-weight: 600;
    }

    .message-status {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .message-status.scheduled {
      background: #FEF3C7;
      color: #B45309;
    }

    .message-status.sent {
      background: #DEF7EC;
      color: #047857;
    }

    .message-status.draft {
      background: #F3F4F6;
      color: #6B7280;
    }

    .message-preview {
      color: #6B7280;
      font-size: 14px;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }

    .message-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: #9CA3AF;
    }

    .message-actions {
      display: flex;
      gap: 8px;
    }

    .btn-action {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .btn-action.edit {
      background: #EEF2FF;
      color: #3730A3;
    }

    .btn-action.duplicate {
      background: #F0FDF4;
      color: #166534;
    }

    .btn-action.delete {
      background: #FEF2F2;
      color: #B91C1C;
    }

    .btn-action:hover {
      transform: scale(1.1);
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #6B7280;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 24px;
    }

    .modal-header h3 {
      margin: 0;
      color: #1F2937;
      font-size: 20px;
      font-weight: bold;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6B7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-body {
      padding: 0 24px;
    }

    .preview-message {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .preview-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .preview-field strong {
      color: #374151;
      font-size: 14px;
    }

    .preview-content {
      background: #F9FAFB;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #E5E7EB;
      white-space: pre-wrap;
      font-size: 14px;
      color: #1F2937;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 24px;
      border-top: 1px solid #E5E7EB;
      margin-top: 24px;
    }

    @media (max-width: 1024px) {
      .messages-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .datetime-inputs {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .messages-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .filter-tabs {
        justify-content: center;
      }
    }
  `]
})
export class MessagesComponent {
  activeTab: 'scheduled' | 'sent' | 'drafts' = 'scheduled';
  showPreview = false;

  newMessage = {
    recipients: '',
    subject: '',
    type: 'email',
    content: '',
    sendOption: 'now',
    scheduleDate: '',
    scheduleTime: '',
    frequency: 'daily'
  };

  messages = [
    {
      id: 1,
      subject: 'Relatório Mensal de Vendas',
      content: 'Prezados, segue em anexo o relatório mensal de vendas com todas as métricas importantes...',
      recipients: 'equipe@empresa.com, gerencia@empresa.com',
      type: 'email',
      status: 'scheduled',
      scheduleDateTime: '2024-01-15T09:00:00'
    },
    {
      id: 2,
      subject: 'Lembrete de Reunião',
      content: 'Não se esqueçam da reunião de planejamento hoje às 14h na sala de conferências.',
      recipients: 'time@empresa.com',
      type: 'email',
      status: 'sent',
      scheduleDateTime: '2024-01-10T08:30:00'
    },
    {
      id: 3,
      subject: 'Promoção Especial',
      content: 'Aproveite nossa promoção especial com 30% de desconto em todos os produtos!',
      recipients: 'clientes@empresa.com',
      type: 'whatsapp',
      status: 'draft',
      scheduleDateTime: '2024-01-20T10:00:00'
    },
    {
      id: 4,
      subject: 'Backup Concluído',
      content: 'O backup automático do sistema foi concluído com sucesso.',
      recipients: 'admin@empresa.com',
      type: 'push',
      status: 'sent',
      scheduleDateTime: '2024-01-12T02:00:00'
    }
  ];

  getMaxLength(): number {
    const limits = {
      'email': 5000,
      'sms': 160,
      'whatsapp': 4096,
      'push': 256
    };
    return limits[this.newMessage.type as keyof typeof limits] || 5000;
  }

  getSubmitButtonText(): string {
    switch (this.newMessage.sendOption) {
      case 'now': return '📤 Enviar Agora';
      case 'schedule': return '⏰ Agendar Envio';
      case 'recurring': return '🔄 Configurar Recorrência';
      default: return 'Enviar';
    }
  }

  getScheduledCount(): number {
    return this.messages.filter(m => m.status === 'scheduled').length;
  }

  getSentCount(): number {
    return this.messages.filter(m => m.status === 'sent').length;
  }

  getDraftsCount(): number {
    return this.messages.filter(m => m.status === 'draft').length;
  }

  getFilteredMessages() {
    return this.messages.filter(m => m.status === this.activeTab);
  }

  getMessageIcon(type: string): string {
    const icons = {
      'email': '📧',
      'sms': '📱',
      'whatsapp': '💬',
      'push': '🔔'
    };
    return icons[type as keyof typeof icons] || '📧';
  }

  getStatusText(status: string): string {
    const statusMap = {
      'scheduled': 'Agendada',
      'sent': 'Enviada',
      'draft': 'Rascunho'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  getMessageTypeText(type: string): string {
    const typeMap = {
      'email': 'Email',
      'sms': 'SMS',
      'whatsapp': 'WhatsApp',
      'push': 'Push Notification'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  }

  getEmptyStateText(): string {
    switch (this.activeTab) {
      case 'scheduled': return 'Nenhuma mensagem agendada no momento.';
      case 'sent': return 'Nenhuma mensagem foi enviada ainda.';
      case 'drafts': return 'Nenhum rascunho salvo.';
      default: return '';
    }
  }

  getSchedulingText(): string {
    if (this.newMessage.sendOption === 'schedule') {
      return `${this.newMessage.scheduleDate} às ${this.newMessage.scheduleTime}`;
    } else if (this.newMessage.sendOption === 'recurring') {
      return `Envio ${this.newMessage.frequency}`;
    }
    return '';
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString('pt-BR');
  }

  scheduleMessage() {
    if (this.newMessage.sendOption === 'now') {
      // Enviar imediatamente
      console.log('Enviando mensagem imediatamente:', this.newMessage);
    } else {
      // Agendar mensagem
      console.log('Agendando mensagem:', this.newMessage);
    }
    
    // Resetar formulário
    this.resetForm();
  }

  saveDraft() {
    console.log('Salvando rascunho:', this.newMessage);
    // Adicionar à lista de rascunhos
    const draft = {
      id: Date.now(),
      subject: this.newMessage.subject || 'Sem assunto',
      content: this.newMessage.content,
      recipients: this.newMessage.recipients,
      type: this.newMessage.type,
      status: 'draft',
      scheduleDateTime: new Date().toISOString()
    };
    this.messages.push(draft);
    this.resetForm();
  }

  previewMessage() {
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  confirmSchedule() {
    this.scheduleMessage();
    this.closePreview();
  }

  editMessage(message: any) {
    this.newMessage = {
      recipients: message.recipients,
      subject: message.subject,
      type: message.type,
      content: message.content,
      sendOption: 'schedule',
      scheduleDate: message.scheduleDateTime.split('T')[0],
      scheduleTime: message.scheduleDateTime.split('T')[1].substring(0, 5),
      frequency: 'daily'
    };
  }

  duplicateMessage(message: any) {
    this.newMessage = {
      recipients: message.recipients,
      subject: `Cópia - ${message.subject}`,
      type: message.type,
      content: message.content,
      sendOption: 'now',
      scheduleDate: '',
      scheduleTime: '',
      frequency: 'daily'
    };
  }

  deleteMessage(id: number) {
    if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
      this.messages = this.messages.filter(m => m.id !== id);
    }
  }

  private resetForm() {
    this.newMessage = {
      recipients: '',
      subject: '',
      type: 'email',
      content: '',
      sendOption: 'now',
      scheduleDate: '',
      scheduleTime: '',
      frequency: 'daily'
    };
  }
}