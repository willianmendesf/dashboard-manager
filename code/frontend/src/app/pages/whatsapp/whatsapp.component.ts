import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/service/api.service';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent],
  templateUrl:'./whatsapp.html',
  styleUrl: './whatsapp.scss'
})
export class WhatsAppComponent implements OnInit {
  private unsubscribe$ = new Subject<void>();

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

  ngOnInit() {
    this.getContacts();
    this.getGroups();
  }

  constructor(
    private api : ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  public getContacts() {
    this.api.get("whatsapp/contacts")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.contacts = res
        let newList : any[] = [];
        this.contacts.forEach(item => {
          (item.name == '') ? item.name="Sem Nome" : item.name;
          item.phone = item.id.replace('@s.whatsapp.net','');
          newList.push(item)
        })
        this.contacts = newList;
        this.cdr.markForCheck()
      },
      error: error => console.error(error),
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
        this.groups = res
        this.cdr.markForCheck()
      },
      error: error => console.error(error),
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

    this.filteredContacts = this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(term) ||
      contact.phone.includes(term)
    );

    this.filteredGroups = this.groups.filter(group =>
      group.name.toLowerCase().includes(term) ||
      group.description.toLowerCase().includes(term)
    );
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

    const newMessage: Message = {
      id: Date.now().toString(),
      content: this.messageType === 'text' ? this.messageContent : `Arquivo: ${this.selectedFile?.name}`,
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

    // Simular envio
    setTimeout(() => {
      newMessage.status = 'sent';
      setTimeout(() => {
        newMessage.status = 'delivered';
      }, 1000);
    }, 500);

    // Limpar formulário
    this.messageContent = '';
    this.selectedFile = null;
    this.messageType = 'text';
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

  getRecipientInfoModalButtons(): ModalButton[] {
    return [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.showRecipientInfo = false
      }
    ];
  }
}
