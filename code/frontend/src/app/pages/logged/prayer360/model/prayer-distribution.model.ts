import { PrayerPerson } from './prayer-person.model';

export interface PrayerDistribution {
  id: number;
  distributionDate: string;
  intercessor: PrayerPerson;
  distributedPersons: any[];
  totalDistributed: number;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  templateId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntercessorDistribution {
  intercessor: PrayerPerson;
  prayerList: PrayerPerson[];
}

export interface PrayerDistributionRequest {
  config?: PrayerConfig;
  personIds?: number[];
}

export interface PrayerDistributionResponse {
  distributions: IntercessorDistribution[];
  statistics: DistributionStatistics;
}

export interface DistributionStatistics {
  totalIntercessors: number;
  totalCandidates: number;
  totalDistributed: number;
  totalNotDistributed: number;
  distributionRate: number;
  totalChildren: number;
  totalAdults: number;
}

