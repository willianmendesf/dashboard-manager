interface Message {
  id: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'document';
  recipientType: 'contact' | 'group';
  recipientId: number;
}
