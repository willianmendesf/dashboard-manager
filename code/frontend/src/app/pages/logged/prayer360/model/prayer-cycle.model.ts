import { PrayerPerson } from './prayer-person.model';

export interface PrayerCycle {
  id: number;
  intercessor: PrayerPerson;
  cycleType: 'COMPLETED' | 'ANTICIPATED';
  completionDate: string;
  percentComplete?: number;
  reason?: string;
  createdAt: string;
}

