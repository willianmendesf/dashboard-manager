import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { Prayer360Service } from './service/prayer360.service';
import { PrayerPerson } from './model/prayer-person.model';
import { PrayerDistributionResponse, DistributionStatistics } from './model/prayer-distribution.model';
import { PrayerConfig } from './model/prayer-config.model';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-prayer360',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent],
  templateUrl: './prayer360.html',
  styleUrl: './prayer360.scss'
})
export class Prayer360Component implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private prayerService = inject(Prayer360Service);
  private notificationService = inject(NotificationService);

  activeTab: 'distribution' | 'persons' | 'history' | 'config' = 'distribution';
  
  // Estatísticas
  statistics: DistributionStatistics | null = null;
  totalPersons = 0;
  totalIntercessors = 0;
  totalCandidates = 0;
  
  // Distribuições recentes
  recentDistributions: any[] = [];
  
  // Loading states
  loading = false;
  loadingStats = false;

  ngOnInit(): void {
    this.loadStatistics();
    this.loadPersons();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  switchTab(tab: 'distribution' | 'persons' | 'history' | 'config'): void {
    this.activeTab = tab;
  }

  private loadStatistics(): void {
    this.loadingStats = true;
    this.prayerService.getConfig()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (config) => {
          // Carregar estatísticas básicas
          this.loadPersons();
        },
        error: (error) => {
          console.error('Error loading config:', error);
          this.loadingStats = false;
        }
      });
  }

  private loadPersons(): void {
    this.prayerService.getPersons()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (persons) => {
          this.totalPersons = persons.length;
          this.totalIntercessors = persons.filter(p => p.isIntercessor).length;
          this.totalCandidates = persons.filter(p => p.active).length;
          this.loadingStats = false;
        },
        error: (error) => {
          console.error('Error loading persons:', error);
          this.loadingStats = false;
        }
      });
  }

  generateDistribution(): void {
    // Será implementado no modal
    this.notificationService.showInfo('Funcionalidade de geração de distribuição será implementada');
  }
}

