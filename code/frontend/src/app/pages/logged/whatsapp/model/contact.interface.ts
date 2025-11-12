interface Contact {
  id: string | number;  // JID do WhatsApp é string
  name: string;
  phone: string;
  avatar?: string;
  lastSeen?: string;
  isOnline: boolean;
}
