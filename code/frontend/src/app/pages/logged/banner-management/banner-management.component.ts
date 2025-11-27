import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BannerService, BannerConfigDTO, BannerImageDTO, BannerChannelDTO } from '../../../shared/service/banner.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { ModalComponent } from '../../../shared/modules/modal/modal.component';
import { environment } from '../../../../environments/environment';
import { ActionIcons } from '../../../shared/lib/utils/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-banner-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent],
  templateUrl: './banner-management.component.html',
  styleUrl: './banner-management.component.scss'
})
export class BannerManagementComponent implements OnInit, OnDestroy {
  private bannerService = inject(BannerService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();

  // Tabs
  activeTab: 'images' | 'schedules' | 'channels' = 'images';

  // Images
  images: BannerImageDTO[] = [];
  isLoadingImages = false;
  showImageModal = false;
  isEditingImage = false;
  currentImage: BannerImageDTO = { imageUrl: '', active: true, displayOrder: 0, transitionDurationSeconds: 10 };
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  // Schedules
  configs: BannerConfigDTO[] = [];
  isLoadingConfigs = false;
  showConfigModal = false;
  isEditingConfig = false;
  currentConfig: BannerConfigDTO = {
    type: 'VIDEO_YOUTUBE',
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    isActive: true,
    order: 0,
    muted: false,
    isRecurring: true
  };

  // Channels
  channels: BannerChannelDTO[] = [];
  isLoadingChannels = false;
  showChannelModal = false;
  isEditingChannel = false;
  currentChannel: BannerChannelDTO = { name: '', description: '', isActive: true, displayOrder: 0 };

  ngOnInit(): void {
    this.loadImages();
    this.loadConfigs();
    this.loadChannels();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Images Management
  loadImages(): void {
    this.isLoadingImages = true;
    this.bannerService.getAllImages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (images) => {
          // Criar nova referência do array para garantir detecção de mudanças
          this.images = images ? [...images] : [];
          // Ordenar por displayOrder
          this.images.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          this.isLoadingImages = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar imagens:', error);
          this.notificationService.showError('Erro ao carregar imagens');
          this.isLoadingImages = false;
          this.cdr.detectChanges();
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validação de tipo
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('Por favor, selecione apenas arquivos de imagem.');
        input.value = '';
        return;
      }
      
      // Validação de tamanho (máximo 100MB para imagens de alta qualidade)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        this.notificationService.showError('A imagem deve ter no máximo 100MB.');
        input.value = '';
        return;
      }
      
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.onerror = () => {
        this.notificationService.showError('Erro ao ler o arquivo selecionado.');
        this.selectedFile = null;
        this.imagePreview = null;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImagePreview(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    // Limpar input
    const input = document.getElementById('bannerImageInput') as HTMLInputElement;
    if (input) input.value = '';
    const inputEmpty = document.getElementById('bannerImageInputEmpty') as HTMLInputElement;
    if (inputEmpty) inputEmpty.value = '';
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  openImageModal(image?: BannerImageDTO): void {
    if (image) {
      this.isEditingImage = true;
      this.currentImage = { ...image };
      // Não mostrar preview da imagem existente inicialmente
      // O preview será mostrado no template usando getImageUrl()
      this.imagePreview = null;
      this.selectedFile = null;
    } else {
      this.isEditingImage = false;
      this.currentImage = { imageUrl: '', active: true, displayOrder: 0, transitionDurationSeconds: 10 };
      this.imagePreview = null;
      this.selectedFile = null;
    }
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.currentImage = { imageUrl: '', active: true, displayOrder: 0, transitionDurationSeconds: 10 };
    this.imagePreview = null;
    this.selectedFile = null;
  }

  saveImage(): void {
    if (this.isEditingImage) {
      // Update existing image
      this.bannerService.updateImage(this.currentImage.id!, this.currentImage)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Imagem atualizada com sucesso');
            this.closeImageModal();
            // Recarregar após fechar modal para garantir atualização
            setTimeout(() => {
              this.loadImages();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao atualizar imagem:', error);
            this.notificationService.showError('Erro ao atualizar imagem');
          }
        });
    } else {
      // Upload new image
      if (!this.selectedFile) {
        this.notificationService.showError('Selecione um arquivo');
        return;
      }

      this.bannerService.uploadImage(
        this.selectedFile,
        this.currentImage.title,
        this.currentImage.displayOrder,
        this.currentImage.transitionDurationSeconds,
        this.currentImage.channelIds
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Imagem enviada com sucesso');
            this.closeImageModal();
            // Recarregar após fechar modal para garantir atualização
            setTimeout(() => {
              this.loadImages();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao enviar imagem:', error);
            // Extrair mensagem de erro da resposta da API
            let errorMessage = 'Erro ao enviar imagem';
            if (error?.error) {
              // Se o erro tem uma propriedade 'error' (string)
              if (typeof error.error === 'string') {
                errorMessage = error.error;
              } else if (error.error?.error) {
                // Se o erro tem uma propriedade 'error' (objeto com mensagem)
                errorMessage = error.error.error;
              } else if (error.error?.message) {
                errorMessage = error.error.message;
              }
            } else if (error?.message) {
              errorMessage = error.message;
            }
            
            // Tratamento específico para erros de tamanho de arquivo
            if (errorMessage.toLowerCase().includes('size') || 
                errorMessage.toLowerCase().includes('tamanho') ||
                errorMessage.toLowerCase().includes('large') ||
                errorMessage.toLowerCase().includes('grande') ||
                error?.status === 413) {
              errorMessage = 'A imagem é muito grande. O tamanho máximo permitido é 100MB.';
            }
            
            this.notificationService.showError(errorMessage);
          }
        });
    }
  }

  deleteImage(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta imagem? O arquivo será removido permanentemente.')) {
      this.bannerService.deleteImage(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Imagem excluída com sucesso');
            // Remover da lista imediatamente para feedback visual
            this.images = this.images.filter(img => img.id !== id);
            this.cdr.detectChanges();
            // Recarregar para garantir sincronização
            setTimeout(() => {
              this.loadImages();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao excluir imagem:', error);
            this.notificationService.showError('Erro ao excluir imagem');
          }
        });
    }
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    
    // Se já é uma URL completa (http/https), retornar diretamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // O StorageService retorna URLs no formato /api/v1/files/{folder}/{filename}
    const baseUrl = environment.apiUrl.replace('/api/v1/', '');
    
    // Se já começa com /api/v1/files, usar diretamente
    if (url.startsWith('/api/v1/files')) {
      return `${baseUrl}${url}`;
    }
    
    // Se começa com /, assumir que é relativo ao baseUrl
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    // Caso contrário, construir URL completa
    return `${baseUrl}/api/v1/files/banners/${url}`;
  }

  // Configs Management
  loadConfigs(): void {
    this.isLoadingConfigs = true;
    this.bannerService.getAllConfigs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
          // Criar nova referência do array para garantir detecção de mudanças
          this.configs = configs ? [...configs] : [];
          // Ordenar por ordem de prioridade e horário de início
          this.configs.sort((a, b) => {
            const orderDiff = (a.order || 0) - (b.order || 0);
            if (orderDiff !== 0) return orderDiff;
            return (a.startTime || '').localeCompare(b.startTime || '');
          });
          this.isLoadingConfigs = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar configurações:', error);
          this.notificationService.showError('Erro ao carregar configurações');
          this.isLoadingConfigs = false;
          this.cdr.detectChanges();
        }
      });
  }

  openConfigModal(config?: BannerConfigDTO): void {
    if (config) {
      this.isEditingConfig = true;
      this.currentConfig = { ...config };
      // Garantir que o tipo sempre seja VIDEO_YOUTUBE
      this.currentConfig.type = 'VIDEO_YOUTUBE';
    } else {
      this.isEditingConfig = false;
      this.currentConfig = {
        type: 'VIDEO_YOUTUBE',
        startTime: '09:00',
        endTime: '10:00',
        title: '',
        isActive: true,
        order: 0,
        muted: false,
        isRecurring: true
      };
    }
    this.showConfigModal = true;
  }

  closeConfigModal(): void {
    this.showConfigModal = false;
    this.currentConfig = {
      type: 'VIDEO_YOUTUBE',
      startTime: '09:00',
      endTime: '10:00',
      title: '',
      isActive: true,
      order: 0,
      muted: false,
      isRecurring: true
    };
  }

  saveConfig(): void {
    if (this.currentConfig.startTime >= this.currentConfig.endTime) {
      this.notificationService.showError('Horário de início deve ser anterior ao horário de fim para o vídeo');
      return;
    }

    if (!this.currentConfig.youtubeUrl?.trim()) {
      this.notificationService.showError('URL do YouTube é obrigatória');
      return;
    }

    // Validação de data específica
    if (this.currentConfig.isRecurring === false && !this.currentConfig.specificDate) {
      this.notificationService.showError('Data específica é obrigatória quando não é recorrente');
      return;
    }
    if (this.currentConfig.isRecurring === true && this.currentConfig.specificDate) {
      this.currentConfig.specificDate = undefined; // Limpar data se for recorrente
    }

    if (this.isEditingConfig) {
      this.bannerService.updateConfig(this.currentConfig.id!, this.currentConfig)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Vídeo atualizado com sucesso');
            this.closeConfigModal();
            // Recarregar após fechar modal para garantir atualização
            setTimeout(() => {
              this.loadConfigs();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao atualizar vídeo:', error);
            this.notificationService.showError('Erro ao atualizar vídeo');
          }
        });
    } else {
      this.bannerService.createConfig(this.currentConfig)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Vídeo criado com sucesso');
            this.closeConfigModal();
            // Recarregar após fechar modal para garantir atualização
            setTimeout(() => {
              this.loadConfigs();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao criar vídeo:', error);
            this.notificationService.showError('Erro ao criar vídeo');
          }
        });
    }
  }

  toggleConfigActive(config: BannerConfigDTO): void {
    if (!config.id) return;
    
    const action = config.isActive ? 'desativar' : 'ativar';
    if (confirm(`Tem certeza que deseja ${action} este Vídeo?`)) {
      this.bannerService.toggleConfigActive(config.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedConfig) => {
            this.notificationService.showSuccess(`Vídeo ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso`);
            // Atualizar na lista imediatamente
            const index = this.configs.findIndex(c => c.id === config.id);
            if (index !== -1) {
              this.configs[index] = updatedConfig;
              this.cdr.detectChanges();
            }
            // Recarregar para garantir sincronização
            setTimeout(() => {
              this.loadConfigs();
            }, 100);
          },
          error: (error) => {
            console.error(`Erro ao ${action} vídeo:`, error);
            this.notificationService.showError(`Erro ao ${action} vídeo`);
          }
        });
    }
  }

  deleteConfig(id: number): void {
    if (confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este Vídeo? Esta ação não pode ser desfeita.')) {
      this.bannerService.deleteConfig(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Vídeo excluído com sucesso');
            // Remover da lista imediatamente para feedback visual
            this.configs = this.configs.filter(config => config.id !== id);
            this.cdr.detectChanges();
            // Recarregar para garantir sincronização
            setTimeout(() => {
              this.loadConfigs();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao excluir vídeo:', error);
            this.notificationService.showError('Erro ao excluir vídeo');
          }
        });
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  getConfigTypeLabel(type: string): string {
    return type === 'VIDEO_YOUTUBE' ? 'Vídeo YouTube' : 'Slide de Imagens';
  }

  getIcon(iconName: 'edit' | 'delete'): SafeHtml {
    const icons = {
      edit: ActionIcons.edit({ size: 16, color: 'currentColor' }),
      delete: ActionIcons.delete({ size: 16, color: 'currentColor' })
    };
    const html = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Channels Management
  loadChannels(): void {
    this.isLoadingChannels = true;
    this.bannerService.getAllChannels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (channels) => {
          this.channels = channels ? [...channels] : [];
          this.channels.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          this.isLoadingChannels = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar canais:', error);
          this.notificationService.showError('Erro ao carregar canais');
          this.isLoadingChannels = false;
          this.cdr.detectChanges();
        }
      });
  }

  openChannelModal(channel?: BannerChannelDTO): void {
    this.isEditingChannel = !!channel;
    this.currentChannel = channel ? { ...channel } : { name: '', description: '', isActive: true, displayOrder: 0 };
    this.showChannelModal = true;
  }

  closeChannelModal(): void {
    this.showChannelModal = false;
    this.currentChannel = { name: '', description: '', isActive: true, displayOrder: 0 };
  }

  saveChannel(): void {
    if (!this.currentChannel.name || this.currentChannel.name.trim() === '') {
      this.notificationService.showError('Nome do canal é obrigatório');
      return;
    }

    if (this.isEditingChannel) {
      this.bannerService.updateChannel(this.currentChannel.id!, this.currentChannel)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Canal atualizado com sucesso');
            this.closeChannelModal();
            setTimeout(() => {
              this.loadChannels();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao atualizar canal:', error);
            this.notificationService.showError('Erro ao atualizar canal');
          }
        });
    } else {
      this.bannerService.createChannel(this.currentChannel)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Canal criado com sucesso');
            this.closeChannelModal();
            setTimeout(() => {
              this.loadChannels();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao criar canal:', error);
            this.notificationService.showError('Erro ao criar canal');
          }
        });
    }
  }

  toggleChannelActive(channel: BannerChannelDTO): void {
    if (!channel.id) return;
    
    const action = channel.isActive ? 'desativar' : 'ativar';
    if (confirm(`Tem certeza que deseja ${action} este canal?`)) {
      this.bannerService.toggleChannelActive(channel.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedChannel) => {
            this.notificationService.showSuccess(`Canal ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso`);
            const index = this.channels.findIndex(c => c.id === channel.id);
            if (index !== -1) {
              this.channels[index] = updatedChannel;
              this.cdr.detectChanges();
            }
            setTimeout(() => {
              this.loadChannels();
            }, 100);
          },
          error: (error) => {
            console.error(`Erro ao ${action} canal:`, error);
            this.notificationService.showError(`Erro ao ${action} canal`);
          }
        });
    }
  }

  deleteChannel(id: number): void {
    if (confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este canal? Esta ação não pode ser desfeita.')) {
      this.bannerService.deleteChannel(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Canal excluído com sucesso');
            this.channels = this.channels.filter(channel => channel.id !== id);
            this.cdr.detectChanges();
            setTimeout(() => {
              this.loadChannels();
            }, 100);
          },
          error: (error) => {
            console.error('Erro ao excluir canal:', error);
            this.notificationService.showError('Erro ao excluir canal');
          }
        });
    }
  }

  isChannelSelected(channelId: number, channelIds?: number[]): boolean {
    return channelIds ? channelIds.includes(channelId) : false;
  }

  toggleChannelSelection(channelId: number, channelIds?: number[]): number[] {
    const ids = channelIds ? [...channelIds] : [];
    const index = ids.indexOf(channelId);
    if (index > -1) {
      ids.splice(index, 1);
    } else {
      ids.push(channelId);
    }
    return ids;
  }
}

