import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigService, Configuration } from '../../../shared/service/config.service';
import { ApiService } from '../../../shared/service/api.service';
import { LogoUploadComponent } from '../../../shared/modules/logo-upload/logo-upload.component';
import { FaviconUploadComponent } from '../../../shared/modules/favicon-upload/favicon-upload.component';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { IfHasPermissionDirective } from '../../../shared/directives/if-has-permission.directive';
import { CronSelectorComponent } from '../../../shared/modules/cron-selector/cron-selector.component';
import { environment } from '../../../../environments/environment';
import { timeout, catchError, of, Observable, tap } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LogoUploadComponent, FaviconUploadComponent, PageTitleComponent, CronSelectorComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  configurations$!: Observable<Configuration[]>;
  saving = false;
  logoUrl: string | null = null;
  faviconUrl: string | null = null;
  apiUrl = environment.apiUrl;

  // Objetos para os cron selectors (similar ao currentAppointment)
  jobWeeklyReports = { schedule: '0 9 * * 1' };
  jobDataSync = { schedule: '*/30 * * * *' };
  jobLoadAppointments = { schedule: '0 */5 * * * *' };

  // Notification types for WhatsApp
  notificationTypes = [
    { key: 'WEEKLY_REPORTS', label: 'Relatórios semanais' },
    { key: 'SECURITY_ALERTS', label: 'Alertas de segurança' }
  ];

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    // Form será inicializado no ngOnInit
  }

  ngOnInit(): void {
    // Inicializar formulário primeiro
    this.initializeForm();
    // Depois carregar configurações
    this.loadConfigurations();
  }

  /**
   * Inicializa o formulário com valores padrão
   */
  private initializeForm(): void {
    this.settingsForm = this.fb.group({
      // Appearance
      logoUrl: [''],
      faviconUrl: [''],
      primaryColor: ['#3B82F6', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      secondaryColor: ['#10B981', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      menuBackgroundColor: ['#1F2937', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      menuTextColor: ['#FFFFFF', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      
      // System - Job Recurrences
      jobRecurrenceWeeklyReports: ['0 9 * * 1'],
      jobRecurrenceDataSync: ['*/30 * * * *'],
      jobRecurrenceLoadAppointments: ['0 */5 * * * *'],
      
      // System - API Keys
      apiKeyExternalService1: [''],
      apiKeyExternalService2: [''],
      
      // Notifications
      notificationsEmail: [true],
      notificationsPush: [true],
      notificationsWhatsApp: [false],
      whatsAppWeeklyReports: [false],
      whatsAppSecurityAlerts: [false],
      whatsappApiUrl: [''],
      
      // WhatsApp - Connection
      whatsappApiUsername: [''],
      whatsappApiPassword: [''],
      whatsappAutoReconnectEnabled: [true],
      whatsappAutoReconnectIntervalMinutes: [60, [Validators.min(1), Validators.max(1440)]],
    });
  }

  /**
   * Carrega todas as configurações do backend
   * Usa Observable com async pipe para evitar problemas de change detection
   */
  loadConfigurations(): void {
    this.configurations$ = this.configService.getAll()
      .pipe(
        timeout(10000), // Timeout de 10 segundos
        tap((configs) => {
          this.populateFormFromConfigurations(configs || []);
          this.loadCSSVariables(configs || []); // Load CSS variables on init
          
          // Se não houver configurações, mostra aviso mas continua
          if (configs.length === 0) {
            console.warn('Nenhuma configuração encontrada. Usando valores padrão.');
          }
        }),
        catchError((error) => {
          console.error('Erro ao carregar configurações:', error);
          // Retorna array vazio em caso de erro
          return of([]);
        })
      );
  }

  /**
   * Popula o formulário com as configurações carregadas
   */
  populateFormFromConfigurations(configs: Configuration[]): void {
    const configMap = new Map(configs.map(c => [c.key, c.value]));
    
    // Appearance
    this.logoUrl = configMap.get('LOGO_URL') || null;
    this.faviconUrl = configMap.get('FAVICON_URL') || null;
    const primaryColor = configMap.get('PRIMARY_COLOR') || '#3B82F6';
    const secondaryColor = configMap.get('SECONDARY_COLOR') || '#10B981';
    const menuBackgroundColor = configMap.get('COR_FUNDO_MENU') || '#1F2937';
    const menuTextColor = configMap.get('COR_TEXTO_MENU') || '#FFFFFF';
    
    // Atualizar objetos dos cron selectors
    this.jobWeeklyReports.schedule = configMap.get('JOB_RECURRENCE_WEEKLY_REPORTS') || '0 9 * * 1';
    this.jobDataSync.schedule = configMap.get('JOB_RECURRENCE_DATA_SYNC') || '*/30 * * * *';
    this.jobLoadAppointments.schedule = configMap.get('JOB_RECURRENCE_LOAD_APPOINTMENTS') || '0 */5 * * * *';

    this.settingsForm.patchValue({
      logoUrl: this.logoUrl || '',
      faviconUrl: this.faviconUrl || '',
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      menuBackgroundColor: menuBackgroundColor,
      menuTextColor: menuTextColor,
      
      // System - Job Recurrences (manter para compatibilidade com o form)
      jobRecurrenceWeeklyReports: this.jobWeeklyReports.schedule,
      jobRecurrenceDataSync: this.jobDataSync.schedule,
      jobRecurrenceLoadAppointments: this.jobLoadAppointments.schedule,
      
      // System - API Keys (não carregamos valores reais por segurança)
      apiKeyExternalService1: configMap.get('API_KEY_EXTERNAL_SERVICE_1') ? '******' : '',
      apiKeyExternalService2: configMap.get('API_KEY_EXTERNAL_SERVICE_2') ? '******' : '',
      
      // WhatsApp - Connection
      whatsappApiUsername: configMap.get('WHATSAPP_API_USERNAME') || '',
      whatsappApiPassword: configMap.get('WHATSAPP_API_PASSWORD') ? '******' : '',
      whatsappAutoReconnectEnabled: configMap.get('WHATSAPP_AUTO_RECONNECT_ENABLED') === 'true' || configMap.get('WHATSAPP_AUTO_RECONNECT_ENABLED') === null,
      whatsappAutoReconnectIntervalMinutes: parseInt(configMap.get('WHATSAPP_AUTO_RECONNECT_INTERVAL_MINUTES') || '60', 10),
      
      // Notifications
      notificationsEmail: this.parseBoolean(configMap.get('NOTIFICATIONS_EMAIL'), true),
      notificationsPush: this.parseBoolean(configMap.get('NOTIFICATIONS_PUSH'), true),
      notificationsWhatsApp: this.parseBoolean(configMap.get('NOTIFICATIONS_WHATSAPP'), false),
      whatsAppWeeklyReports: this.parseBoolean(configMap.get('WHATSAPP_WEEKLY_REPORTS'), false),
      whatsAppSecurityAlerts: this.parseBoolean(configMap.get('WHATSAPP_SECURITY_ALERTS'), false),
      whatsappApiUrl: configMap.get('API_WTZ_URL') || '',
    });
  }

  /**
   * Handler para upload de logo
   * Salva automaticamente a URL do logo no backend
   */
  onLogoUploaded(logoUrl: string): void {
    this.logoUrl = logoUrl;
    this.settingsForm.patchValue({ logoUrl: logoUrl });
    
    // Salvar automaticamente a URL do logo no backend
    this.configService.updateConfiguration('LOGO_URL', logoUrl).subscribe({
      error: (error) => {
        console.error('Erro ao salvar URL do logo:', error);
      }
    });
  }

  /**
   * Handler para remoção de logo
   */
  onLogoRemoved(): void {
    this.logoUrl = null;
    this.settingsForm.patchValue({ logoUrl: '' });
    
    // Remover logo do backend
    this.configService.updateConfiguration('LOGO_URL', '').subscribe({
      error: (error) => {
        console.error('Erro ao remover logo:', error);
      }
    });
  }

  /**
   * Handler para upload de favicon
   * Salva automaticamente a URL do favicon no backend
   */
  onFaviconUploaded(faviconUrl: string): void {
    this.faviconUrl = faviconUrl;
    this.settingsForm.patchValue({ faviconUrl: faviconUrl });
    
    // Salvar automaticamente a URL do favicon no backend
    this.configService.updateConfiguration('FAVICON_URL', faviconUrl).subscribe({
      next: () => {
        // Atualizar favicon no DOM imediatamente
        this.updateFaviconInDOM(faviconUrl);
      },
      error: (error) => {
        console.error('Erro ao salvar URL do favicon:', error);
      }
    });
  }

  /**
   * Handler para remoção de favicon
   */
  onFaviconRemoved(): void {
    this.faviconUrl = null;
    this.settingsForm.patchValue({ faviconUrl: '' });
    
    // Remover favicon do backend
    this.configService.updateConfiguration('FAVICON_URL', '').subscribe({
      next: () => {
        // Restaurar favicon default
        this.updateFaviconInDOM(null);
      },
      error: (error) => {
        console.error('Erro ao remover favicon:', error);
      }
    });
  }

  /**
   * Atualiza o favicon no DOM
   */
  private updateFaviconInDOM(faviconUrl: string | null): void {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existingLinks.forEach(link => link.remove());

    if (faviconUrl) {
      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = faviconUrl;
      document.head.appendChild(link);
    } else {
      // Restore default favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = './img/icon.png';
      document.head.appendChild(link);
    }
  }

  /**
   * Salva todas as configurações
   */
  saveSettings(): void {
    if (this.settingsForm.invalid) {
      return;
    }

    this.saving = true;
    const formValue = this.settingsForm.value;
    
    // Preparar objeto com todas as configurações
    const configurationsToSave: { [key: string]: string } = {
      // Appearance
      LOGO_URL: formValue.logoUrl || '',
      FAVICON_URL: formValue.faviconUrl || '',
      PRIMARY_COLOR: formValue.primaryColor,
      SECONDARY_COLOR: formValue.secondaryColor,
      COR_FUNDO_MENU: formValue.menuBackgroundColor,
      COR_TEXTO_MENU: formValue.menuTextColor,
      
      // System - Job Recurrences (usar os valores dos objetos cron)
      JOB_RECURRENCE_WEEKLY_REPORTS: this.jobWeeklyReports.schedule,
      JOB_RECURRENCE_DATA_SYNC: this.jobDataSync.schedule,
      JOB_RECURRENCE_LOAD_APPOINTMENTS: this.jobLoadAppointments.schedule,
      
      // System - API Keys (só atualiza se não for ****** - senão mantém o valor atual)
      // NOTA: Em produção, você deve verificar se o valor mudou antes de atualizar
      
      // Notifications
      NOTIFICATIONS_EMAIL: String(formValue.notificationsEmail),
      NOTIFICATIONS_PUSH: String(formValue.notificationsPush),
      NOTIFICATIONS_WHATSAPP: String(formValue.notificationsWhatsApp),
      WHATSAPP_WEEKLY_REPORTS: String(formValue.whatsAppWeeklyReports),
      WHATSAPP_SECURITY_ALERTS: String(formValue.whatsAppSecurityAlerts),
      API_WTZ_URL: formValue.whatsappApiUrl || '',
      
      // WhatsApp - Connection
      WHATSAPP_AUTO_RECONNECT_ENABLED: String(formValue.whatsappAutoReconnectEnabled),
      WHATSAPP_AUTO_RECONNECT_INTERVAL_MINUTES: String(formValue.whatsappAutoReconnectIntervalMinutes || 60),
    };

    // Atualizar API keys apenas se não forem ****** ou vazias
    // Se o valor for ******, significa que é o valor mascarado do banco e não deve ser atualizado
    if (formValue.apiKeyExternalService1 && 
        formValue.apiKeyExternalService1 !== '******' && 
        formValue.apiKeyExternalService1.trim() !== '') {
      configurationsToSave['API_KEY_EXTERNAL_SERVICE_1'] = formValue.apiKeyExternalService1;
    }
    if (formValue.apiKeyExternalService2 && 
        formValue.apiKeyExternalService2 !== '******' && 
        formValue.apiKeyExternalService2.trim() !== '') {
      configurationsToSave['API_KEY_EXTERNAL_SERVICE_2'] = formValue.apiKeyExternalService2;
    }
    
    // Atualizar credenciais WhatsApp apenas se não forem ****** ou vazias
    if (formValue.whatsappApiUsername && formValue.whatsappApiUsername.trim() !== '') {
      configurationsToSave['WHATSAPP_API_USERNAME'] = formValue.whatsappApiUsername;
    }
    if (formValue.whatsappApiPassword && 
        formValue.whatsappApiPassword !== '******' && 
        formValue.whatsappApiPassword.trim() !== '') {
      configurationsToSave['WHATSAPP_API_PASSWORD'] = formValue.whatsappApiPassword;
    }

    this.configService.updateConfigurations(configurationsToSave).subscribe({
      next: () => {
        // Inject CSS variables for white-label
        this.injectCSSVariables(configurationsToSave);
        // Update favicon if changed
        if (configurationsToSave['FAVICON_URL']) {
          this.updateFaviconInDOM(configurationsToSave['FAVICON_URL']);
        } else if (formValue.faviconUrl === '') {
          this.updateFaviconInDOM(null);
        }
        this.notificationService.showSuccess('Configurações salvas com sucesso!');
        this.saving = false;
        this.loadConfigurations(); // Recarregar para garantir sincronização
      },
      error: (error) => {
        console.error('Erro ao salvar configurações:', error);
        this.notificationService.showError('Erro ao salvar configurações. Tente novamente.');
        this.saving = false;
      }
    });
  }

  /**
   * Cancela as alterações e recarrega as configurações
   */
  cancelChanges(): void {
    this.loadConfigurations();
  }

  /**
   * Verifica se o toggle WhatsApp está ativo
   */
  get isWhatsAppEnabled(): boolean {
    return this.settingsForm.get('notificationsWhatsApp')?.value || false;
  }

  /**
   * Helper para converter string para boolean
   */
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined || value === null) return defaultValue;
    return value === 'true' || value === 'True' || value === 'TRUE';
  }

  /**
   * Injects CSS variables into :root for white-label functionality
   */
  private injectCSSVariables(configs: { [key: string]: string }): void {
    const root = document.documentElement;
    
    // Inject colors as CSS variables
    if (configs['PRIMARY_COLOR']) {
      root.style.setProperty('--cor-primaria', configs['PRIMARY_COLOR']);
    }
    if (configs['SECONDARY_COLOR']) {
      root.style.setProperty('--cor-secundaria', configs['SECONDARY_COLOR']);
    }
    if (configs['COR_FUNDO_MENU']) {
      root.style.setProperty('--cor-fundo-menu', configs['COR_FUNDO_MENU']);
    }
    if (configs['COR_TEXTO_MENU']) {
      root.style.setProperty('--cor-texto-menu', configs['COR_TEXTO_MENU']);
    }
  }

  /**
   * Loads CSS variables from configurations on init
   */
  private loadCSSVariables(configs: Configuration[]): void {
    const configMap = new Map(configs.map(c => [c.key, c.value]));
    
    const root = document.documentElement;
    const primaryColor = configMap.get('PRIMARY_COLOR') || '#3B82F6';
    const secondaryColor = configMap.get('SECONDARY_COLOR') || '#10B981';
    const menuBackgroundColor = configMap.get('COR_FUNDO_MENU') || '#1F2937';
    const menuTextColor = configMap.get('COR_TEXTO_MENU') || '#FFFFFF';
    
    root.style.setProperty('--cor-primaria', primaryColor);
    root.style.setProperty('--cor-secundaria', secondaryColor);
    root.style.setProperty('--cor-fundo-menu', menuBackgroundColor);
    root.style.setProperty('--cor-texto-menu', menuTextColor);
  }
}
