import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModalComponent, ModalButton } from '../../../shared/modules/modal/modal.component';
import { MessageIcons, ActionIcons } from '../../../shared/lib/utils/icons';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent {
  private sanitizer = inject(DomSanitizer);
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

  getMessageIcon(type: string): SafeHtml {
    const icons: { [key: string]: (options?: any) => string } = {
      'email': MessageIcons.email,
      'sms': MessageIcons.sms,
      'whatsapp': MessageIcons.whatsapp,
      'push': MessageIcons.push,
      'empty': MessageIcons.empty
    };
    const iconFunction = icons[type] || icons['email'];
    const html = iconFunction({ size: 24, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getActionIcon(iconName: 'edit' | 'duplicate' | 'delete' | 'save' | 'view' | 'copy'): SafeHtml {
    const icons = {
      edit: ActionIcons.edit({ size: 16, color: 'currentColor' }),
      duplicate: ActionIcons.duplicate({ size: 16, color: 'currentColor' }),
      delete: ActionIcons.delete({ size: 16, color: 'currentColor' }),
      save: ActionIcons.save({ size: 16, color: 'currentColor' }),
      view: ActionIcons.view({ size: 16, color: 'currentColor' }),
      copy: ActionIcons.duplicate({ size: 16, color: 'currentColor' })
    };
    const html = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
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
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  getPreviewModalButtons(): ModalButton[] {
    return [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.closePreview()
      },
      {
        label: 'Confirmar Agendamento',
        type: 'primary',
        action: () => this.confirmSchedule()
      }
    ];
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