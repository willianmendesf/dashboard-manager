export interface PrayerTemplate {
  id?: number;
  name: string;
  description?: string;
  isDefault: boolean;
  active: boolean;
  header?: string;
  listFormat?: string;
  body?: string;
  additionalMessages?: string[];
  variables?: string[];
  createdAt?: string;
  updatedAt?: string;
}

