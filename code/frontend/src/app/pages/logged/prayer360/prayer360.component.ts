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
import { PersonsListComponent } from './components/persons-list.component';
import { PersonFormComponent } from './components/person-form.component';
import { SyncMembersComponent } from './components/sync-members.component';
import { ApiService } from '../../../shared/service/api.service';

@Component({
  selector: 'app-prayer360',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PageTitleComponent,
    PersonsListComponent,
    PersonFormComponent,
    SyncMembersComponent
  ],
  templateUrl: './prayer360.html',
  styleUrl: './prayer360.scss'
})
export class Prayer360Component implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private prayerService = inject(Prayer360Service);
  private notificationService = inject(NotificationService);
  private api = inject(ApiService);

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
  errorLoading = false;
  errorMessage = '';

  // Modais
  showPersonForm = false;
  showSyncModal = false;
  currentPerson: PrayerPerson | null = null;
  isEditingPerson = false;

  // Membros disponíveis para sincronização
  availableMembersCount = 0;
  loadingMembers = false;

  ngOnInit(): void {
    this.loadStatistics();
    this.loadPersons();
    this.checkAvailableMembers();
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
    this.errorLoading = false;
    this.errorMessage = '';
    
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
          this.errorLoading = true;
          this.errorMessage = 'Erro ao carregar configuração. Tentando carregar pessoas...';
          // Tentar carregar pessoas mesmo com erro na config
          this.loadPersons();
        }
      });
  }

  private loadPersons(): void {
    this.loadingStats = true;
    this.errorLoading = false;
    
    this.prayerService.getPersons()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (persons) => {
          if (persons && Array.isArray(persons)) {
            this.totalPersons = persons.length;
            this.totalIntercessors = persons.filter(p => p.isIntercessor === true).length;
            this.totalCandidates = persons.filter(p => p.active === true && p.isIntercessor !== true).length;
          } else {
            this.totalPersons = 0;
            this.totalIntercessors = 0;
            this.totalCandidates = 0;
          }
          this.loadingStats = false;
          this.errorLoading = false;
          // Verificar novamente membros disponíveis após carregar pessoas
          this.checkAvailableMembers();
        },
        error: (error) => {
          console.error('Error loading persons:', error);
          this.loadingStats = false;
          this.errorLoading = true;
          this.errorMessage = error?.error?.message || error?.message || 'Erro ao carregar pessoas. Verifique se há dados cadastrados.';
          this.notificationService.showError(this.errorMessage);
        }
      });
  }

  private checkAvailableMembers(): void {
    this.loadingMembers = true;
    this.api.get('members')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (members: any[]) => {
          if (members && Array.isArray(members)) {
            // Contar membros que podem ser sincronizados (intercessor OU podeReceberOracao)
            this.availableMembersCount = members.filter(m => 
              (m.intercessor === true || m.podeReceberOracao === true) &&
              m.id
            ).length;
          } else {
            this.availableMembersCount = 0;
          }
          this.loadingMembers = false;
        },
        error: (error) => {
          console.error('Error checking available members:', error);
          this.loadingMembers = false;
          this.availableMembersCount = 0;
        }
      });
  }

  generateDistribution(): void {
    // Será implementado no modal
    this.notificationService.showInfo('Funcionalidade de geração de distribuição será implementada');
  }

  // Callbacks para PersonsListComponent
  onSyncClick(): void {
    this.showSyncModal = true;
  }

  onNewPersonClick(): void {
    this.currentPerson = null;
    this.isEditingPerson = false;
    this.showPersonForm = true;
  }

  onViewPerson(person: PrayerPerson): void {
    // Implementar visualização
    this.notificationService.showInfo(`Visualizando: ${person.nome}`);
  }

  onEditPerson(person: PrayerPerson): void {
    this.currentPerson = { ...person };
    this.isEditingPerson = true;
    this.showPersonForm = true;
  }

  onDeletePerson(person: PrayerPerson): void {
    if (confirm(`Tem certeza que deseja excluir "${person.nome}"?`)) {
      this.prayerService.deletePerson(person.id!)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Pessoa excluída com sucesso!');
            this.loadPersons();
          },
          error: (error) => {
            console.error('Error deleting person:', error);
            this.notificationService.showError('Erro ao excluir pessoa. Tente novamente.');
          }
        });
    }
  }

  // Callbacks para PersonFormComponent
  onPersonFormClose(): void {
    this.showPersonForm = false;
    this.currentPerson = null;
    this.isEditingPerson = false;
  }

  onPersonFormSave(person: PrayerPerson): void {
    if (this.isEditingPerson && person.id) {
      this.prayerService.updatePerson(person.id, person)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Pessoa atualizada com sucesso!');
            this.onPersonFormClose();
            this.loadPersons();
          },
          error: (error) => {
            console.error('Error updating person:', error);
            this.notificationService.showError('Erro ao atualizar pessoa. Tente novamente.');
          }
        });
    } else {
      this.prayerService.createPerson(person)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Pessoa criada com sucesso!');
            this.onPersonFormClose();
            this.loadPersons();
          },
          error: (error) => {
            console.error('Error creating person:', error);
            this.notificationService.showError('Erro ao criar pessoa. Tente novamente.');
          }
        });
    }
  }

  // Callbacks para SyncMembersComponent
  onSyncModalClose(): void {
    this.showSyncModal = false;
  }

  onSyncComplete(): void {
    this.loadPersons(); // Recarregar lista após sincronização
    this.checkAvailableMembers(); // Verificar novamente membros disponíveis
  }
}

