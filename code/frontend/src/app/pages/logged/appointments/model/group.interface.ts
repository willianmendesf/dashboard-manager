interface Group {
  id: number;
  name: string;
  description: string;
  members: Contact[];
  avatar?: string;
  selected?: boolean;
}
