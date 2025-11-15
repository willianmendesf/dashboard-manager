interface Group {
  id: string | number;  // JID do WhatsApp é string, mas pode ser number em outros contextos
  name: string;
  description?: string;
  members?: Contact[];
  avatar?: string;
  selected?: boolean;
}
