import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Contact {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  lastSeen?: string;
  isOnline: boolean;
}

interface Group {
  id: number;
  name: string;
  description: string;
  members: Contact[];
  avatar?: string;
}

interface Message {
  id: number;
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'document';
  recipientType: 'contact' | 'group';
  recipientId: number;
}

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'./whatsapp.html',
  styleUrl: './whatsapp.scss'
})
export class WhatsAppComponent implements OnInit {
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

  contacts: Contact[] = [
    {
      id: 1,
      name: 'João Silva',
      phone: '+55 11 99999-1111',
      isOnline: true,
      lastSeen: 'Online'
    },
    {
      id: 2,
      name: 'Maria Santos',
      phone: '+55 11 99999-2222',
      isOnline: false,
      lastSeen: 'há 2 horas'
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      phone: '+55 11 99999-3333',
      isOnline: true,
      lastSeen: 'Online'
    },
    {
      id: 4,
      name: 'Ana Costa',
      phone: '+55 11 99999-4444',
      isOnline: false,
      lastSeen: 'há 1 dia'
    }
  ];

  groups: Group[] = [
    {
      id: 1,
      name: 'Equipe Marketing',
      description: 'Discussões sobre campanhas e estratégias',
      members: [this.contacts[0], this.contacts[1]]
    },
    {
      id: 2,
      name: 'Projeto Alpha',
      description: 'Coordenação do projeto Alpha',
      members: [this.contacts[2], this.contacts[3]]
    }
  ];

  messages: Message[] = [
    {
      id: 1,
      content: 'Olá! Como está o projeto?',
      timestamp: '14:30',
      status: 'read',
      type: 'text',
      recipientType: 'contact',
      recipientId: 1
    },
    {
      id: 2,
      content: 'Reunião agendada para amanhã às 10h',
      timestamp: '15:45',
      status: 'delivered',
      type: 'text',
      recipientType: 'group',
      recipientId: 1
    }
  ];

  filteredContacts: Contact[] = [];
  filteredGroups: Group[] = [];

  ngOnInit() {
    this.filterContacts();
  }

  filterContacts() {
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

    return this.messages.filter(message =>
      message.recipientType === this.selectedRecipient.type &&
      message.recipientId === this.selectedRecipient.id
    );
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
      id: Date.now(),
      content: this.messageType === 'text' ? this.messageContent : `Arquivo: ${this.selectedFile?.name}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      type: this.messageType,
      recipientType: this.selectedRecipient.type,
      recipientId: this.selectedRecipient.id
    };

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
      this.filterContacts();
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
      this.filterContacts();
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
}
