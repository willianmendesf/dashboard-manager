import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../../shared/service/api.service';
import { WhatsappsService, ConnectionStatus, AutoReconnectStatus } from '../../../shared/service/whatsapp.service';
import { PageTitleComponent } from "../../../shared/modules/pagetitle/pagetitle.component";
import { ModalComponent, ModalButton } from '../../../shared/modules/modal/modal.component';
import { WhatsappLoginModalComponent } from './whatsapp-login-modal/whatsapp-login-modal.component';
import { Subject, takeUntil, interval } from 'rxjs';
import { NavigationIcons, StatusIcons, MessageIcons } from '../../../shared/lib/utils/icons';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, WhatsappLoginModalComponent],
  templateUrl:'./whatsapp.html',
  styleUrl: './whatsapp.scss'
})
export class WhatsAppComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);

  activeTab: 'contacts' | 'groups' = 'contacts';
  searchTerm = '';
  selectedRecipient: any = null;
  messageType: 'text' | 'image' | 'document' = 'text';
  messageContent = '';
  selectedFile: File | null = null;

  showAddContactModal = false;
  showAddGroupModal = false;
  showRecipientInfo = false;

  newContact = { name: '', phone: '' };
  newGroup = { name: '', description: '', selectedMembers: [] as Contact[] };

  contacts: any[] = [];
  groups: any[] = []
  messages: Message[] = []

  filteredContacts: Contact[] = [];
  filteredGroups: Group[] = [];

  // Status de conexão
  connectionStatus: ConnectionStatus | null = null;
  isAutoReconnectEnabled: boolean = false;
  autoReconnectIntervalMinutes: number = 60;
  lastStatusCheck: Date | null = null;
  isReconnecting: boolean = false;
  statusCheckInterval: any = null;
  showLoginModal: boolean = false;

  ngOnInit() {
    this.getContacts();
    this.getGroups();
    this.loadConnectionStatus();
    this.loadAutoReconnectStatus();
    this.startStatusPolling();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }

  constructor(
    private api : ApiService,
    private whatsappService: WhatsappsService,
    private cdr: ChangeDetectorRef
  ) {}

  public getContacts() {
    this.api.get("whatsapp/contacts")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        if (Array.isArray(res)) {
          this.contacts = res;
          let newList : any[] = [];
          this.contacts.forEach(item => {
            if (item) {
              (item.name == '' || !item.name) ? item.name="Sem Nome" : item.name;
              if (item.id) {
                item.phone = item.id.replace('@s.whatsapp.net','');
              }
              newList.push(item)
            }
          })
          this.contacts = newList;
        } else {
          this.contacts = [];
        }
        this.filter()
        this.cdr.markForCheck()
      },
      error: error => {
        console.error('Error loading contacts:', error);
        this.contacts = [];
        this.filter()
        this.cdr.markForCheck()
      },
      complete: () => {
        this.filter()
        this.cdr.markForCheck()
      }
    })
  }

  public getHistory(jid:string) {
    this.api.get("whatsapp/history/" + jid)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.messages = res
        this.cdr.markForCheck()
      },
      error: error => console.error(error),
      complete: () => console.log()
    })
  }

  public getGroups() {
    this.api.get("whatsapp/groups")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.groups = Array.isArray(res) ? res : [];
        this.filter()
        this.cdr.markForCheck()
      },
      error: error => {
        console.error('Error loading groups:', error);
        this.groups = [];
        this.filter()
        this.cdr.markForCheck()
      },
      complete: () => {
        this.filter()
        this.cdr.markForCheck()
      }
    })
  }

  public sendWtzMessage(message: WtzMessage) {
    this.api.post("whatsapp", message)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => console.log(res),
      error: error => console.error(error),
      complete: () => console.log("Groups returned;")
    });
  }

  public filter() {
    const term = this.searchTerm.toLowerCase();

    if (!this.contacts || this.contacts.length === 0) {
      this.filteredContacts = [];
    } else {
      this.filteredContacts = this.contacts.filter(contact =>
        contact && (
          (contact.name && contact.name.toLowerCase().includes(term)) ||
          (contact.phone && contact.phone.includes(term))
        )
      );
    }

    if (!this.groups || this.groups.length === 0) {
      this.filteredGroups = [];
    } else {
      this.filteredGroups = this.groups.filter(group =>
        group && (
          (group.name && group.name.toLowerCase().includes(term)) ||
          (group.description && group.description.toLowerCase().includes(term))
        )
      );
    }
  }

  getFilteredItems() {
    return this.activeTab === 'contacts' ? this.filteredContacts : this.filteredGroups;
  }

  selectContact(contact: Contact) {
    this.selectedRecipient = { ...contact, type: 'contact' };
  }

  selectGroup(group: Group) {
    this.selectedRecipient = { ...group, type: 'group' };
  }

  getMessagesForRecipient(): Message[] {
    if (!this.selectedRecipient) return [];

    this.getHistory(this.selectedRecipient.id)

    return this.messages.filter(message => {
      message.id === this.selectedRecipient.id
      // && message.recipientType === this.selectedRecipient.type
    });
  }

  getStatusIcon(status: string): string {
    const icons = {
      'sending': '🕐',
      'sent': '✓',
      'delivered': '✓✓',
      'read': '✓✓'
    };
    return icons[status as keyof typeof icons] || '✓';
  }

  canSendMessage(): boolean {
    if (this.messageType === 'text') {
      return this.messageContent.trim().length > 0;
    }
    return this.selectedFile !== null;
  }

  sendMessage() {
    if (!this.canSendMessage() || !this.selectedRecipient) return;

    // Capturar conteúdo antes de limpar
    const messageText = this.messageContent.trim();
    if (!messageText && this.messageType === 'text') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: this.messageType === 'text' ? messageText : `Arquivo: ${this.selectedFile?.name}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      type: this.messageType,
      recipientType: this.selectedRecipient.type,
      recipientId: this.selectedRecipient.id
    };

    this.sendWtzMessage({
      phone: newMessage.recipientId.toString(),
      message: newMessage.content,
      caption: newMessage.content,
      image: newMessage.content,
      view_once: true,
      compress: true,
    });

    this.messages.push(newMessage);

    // Limpar formulário imediatamente após enviar
    this.messageContent = '';
    this.selectedFile = null;
    this.messageType = 'text';
    
    // Forçar atualização da UI
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);

    // Simular envio
    setTimeout(() => {
      newMessage.status = 'sent';
      setTimeout(() => {
        newMessage.status = 'delivered';
        this.cdr.markForCheck();
      }, 1000);
    }, 500);
  }

  scheduleMessage() {
    // Implementar agendamento
    console.log('Agendar mensagem');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  closeAddContactModal() {
    this.showAddContactModal = false;
    this.newContact = { name: '', phone: '' };
  }

  addContact() {
    if (this.newContact.name && this.newContact.phone) {
      const contact: Contact = {
        id: Math.max(...this.contacts.map(c => c.id)) + 1,
        name: this.newContact.name,
        phone: this.newContact.phone,
        isOnline: false,
        lastSeen: 'Nunca'
      };

      this.contacts.push(contact);
      this.filter();
      this.closeAddContactModal();
    }
  }

  closeAddGroupModal() {
    this.showAddGroupModal = false;
    this.newGroup = { name: '', description: '', selectedMembers: [] };
  }

  addGroup() {
    if (this.newGroup.name && this.newGroup.selectedMembers.length > 0) {
      const group: Group = {
        id: Math.max(...this.groups.map(g => g.id)) + 1,
        name: this.newGroup.name,
        description: this.newGroup.description,
        members: [...this.newGroup.selectedMembers]
      };

      this.groups.push(group);
      this.filter();
      this.closeAddGroupModal();
    }
  }

  toggleMember(contact: Contact) {
    const index = this.newGroup.selectedMembers.findIndex(m => m.id === contact.id);
    if (index > -1) {
      this.newGroup.selectedMembers.splice(index, 1);
    } else {
      this.newGroup.selectedMembers.push(contact);
    }
  }

  isMemberSelected(contact: Contact): boolean {
    return this.newGroup.selectedMembers.some(m => m.id === contact.id);
  }

  getContactModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeAddContactModal()
      },
      {
        label: 'Adicionar Contato',
        type: 'primary',
        action: () => this.addContact()
      }
    ];
  }

  getGroupModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeAddGroupModal()
      },
      {
        label: 'Criar Grupo',
        type: 'primary',
        action: () => this.addGroup(),
        disabled: !this.newGroup.name || this.newGroup.selectedMembers.length === 0
      }
    ];
  }

  getSearchIcon(): SafeHtml {
    const html = NavigationIcons.search({ size: 20, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getUsersIcon(): SafeHtml {
    const html = StatusIcons.users({ size: 20, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getPhoneIcon(): SafeHtml {
    const html = MessageIcons.sms({ size: 24, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getWhatsAppIcon(): SafeHtml {
    const html = MessageIcons.whatsapp({ size: 24, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getRecipientInfoModalButtons(): ModalButton[] {
    return [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.showRecipientInfo = false
      }
    ];
  }

  // Métodos de conexão
  loadConnectionStatus() {
    this.whatsappService.getConnectionStatus()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (status) => {
          this.connectionStatus = status;
          this.lastStatusCheck = new Date();
          // Forçar detecção de mudanças para atualizar botões
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar status da conexão:', error);
          this.connectionStatus = {
            is_connected: false,
            is_logged_in: false,
            error: 'Erro ao verificar status'
          };
          this.lastStatusCheck = new Date();
          this.cdr.detectChanges();
        }
      });
  }

  loadAutoReconnectStatus() {
    this.whatsappService.getAutoReconnectStatus()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (status) => {
          this.isAutoReconnectEnabled = status.enabled;
          this.autoReconnectIntervalMinutes = status.intervalMinutes;
          // Forçar atualização para atualizar botão reconectar
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar status de reconexão automática:', error);
        }
      });
  }

  manualReconnect() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.whatsappService.reconnect()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (result) => {
          this.isReconnecting = false;
          if (result.success) {
            // Recarregar status após reconexão
            setTimeout(() => this.loadConnectionStatus(), 2000);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erro ao reconectar:', error);
          this.isReconnecting = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleAutoReconnect() {
    const newValue = !this.isAutoReconnectEnabled;
    this.whatsappService.toggleAutoReconnect(newValue)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.isAutoReconnectEnabled = newValue;
          // Forçar atualização imediata da UI
          this.cdr.detectChanges();
          // Recarregar status para garantir sincronização
          this.loadAutoReconnectStatus();
        },
        error: (error) => {
          console.error('Erro ao alterar reconexão automática:', error);
          // Reverter em caso de erro
          this.isAutoReconnectEnabled = !newValue;
          this.cdr.detectChanges();
        }
      });
  }

  startStatusPolling() {
    // Atualizar status a cada 30 segundos
    this.statusCheckInterval = setInterval(() => {
      this.loadConnectionStatus();
    }, 30000);
  }

  formatLastCheck(): string {
    if (!this.lastStatusCheck) return 'Nunca';
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.lastStatusCheck.getTime()) / 1000);
    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    return this.lastStatusCheck.toLocaleTimeString('pt-BR');
  }

  // Métodos de login
  openLoginModal() {
    this.showLoginModal = true;
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  handleLoginSuccess() {
    this.closeLoginModal();
    // Recarregar status, contatos e grupos após login bem-sucedido
    setTimeout(() => {
      this.loadConnectionStatus();
      // Aguardar um pouco mais para garantir que a API esteja pronta
      setTimeout(() => {
        this.getContacts();
        this.getGroups();
        this.cdr.markForCheck();
      }, 1500);
    }, 1000);
  }

  logout() {
    if (confirm('Tem certeza que deseja fazer logout do WhatsApp?')) {
      this.whatsappService.logout()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: (result) => {
            if (result.success) {
              // Recarregar status após logout
              setTimeout(() => {
                this.loadConnectionStatus();
              }, 1000);
            }
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erro ao fazer logout:', error);
            this.cdr.markForCheck();
          }
        });
    }
  }

  shouldShowLoginButton(): boolean {
    // Mostrar botão de login apenas quando NÃO estiver logado
    return this.connectionStatus !== null && 
           this.connectionStatus.is_logged_in === false;
  }

  shouldShowReconnectButton(): boolean {
    // Mostrar botão de reconectar apenas quando:
    // - Estiver logado mas desconectado
    // - E a reconexão automática estiver desabilitada
    return this.connectionStatus !== null && 
           this.connectionStatus.is_logged_in === true &&
           this.connectionStatus.is_connected === false &&
           !this.isAutoReconnectEnabled;
  }

  canSendMessages(): boolean {
    // Pode enviar mensagens apenas quando estiver conectado E logado
    return this.connectionStatus !== null && 
           this.connectionStatus.is_connected === true &&
           this.connectionStatus.is_logged_in === true;
  }
}
