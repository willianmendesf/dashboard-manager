import { Component, OnInit, OnDestroy, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BannerService, BannerCurrentStateDTO, BannerImageDTO } from '../../../shared/service/banner.service';
import { interval, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mural-digital',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mural-digital.component.html',
  styleUrl: './mural-digital.component.scss'
})
export class MuralDigitalComponent implements OnInit, OnDestroy {
  private bannerService = inject(BannerService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentMode: 'SLIDE' | 'VIDEO' = 'SLIDE';
  currentVideoUrl: string | null = null;
  currentVideoId: string | null = null;
  currentMuted: boolean = false;
  currentImages: BannerImageDTO[] = [];
  currentImageIndex: number = 0;
  currentImageUrl: string = '';
  previousState: BannerCurrentStateDTO | null = null;
  isTransitioning: boolean = false;
  isImageTransitioning: boolean = false; // Transição entre imagens
  videoIframeKey: string = ''; // Key para forçar recriação do iframe

  slideTransitionDuration: number = 10000; // Default 10 segundos
  currentSlideProgress: number = 0; // Progresso da transição atual (0-100)
  private slideTimeout: any = null;
  private progressInterval: any = null;
  private slideStartTime: number = 0;

  ngOnInit(): void {
    this.loadCurrentState();
    // Polling a cada 5 segundos
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCurrentState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.slideTimeout) {
      clearTimeout(this.slideTimeout);
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  private loadCurrentState(): void {
    this.bannerService.getCurrentState()
      .pipe(
        catchError(error => {
          console.error('Erro ao carregar estado atual:', error);
          return of(null);
        })
      )
      .subscribe(state => {
        if (state) {
          // Se é o primeiro carregamento e não há estado anterior, aplicar diretamente
          if (!this.previousState) {
            this.applyStateDirectly(state);
          } else {
            this.handleStateChange(state);
          }
        }
      });
  }

  private applyStateDirectly(state: BannerCurrentStateDTO): void {
    // Aplicar estado inicial sem transição
    if (state.mode === 'VIDEO') {
      this.switchToVideo(state);
    } else {
      this.switchToSlide(state);
    }
    
    this.previousState = {
      mode: state.mode,
      videoUrl: state.videoUrl,
      muted: state.muted ?? false,
      images: state.images ? [...state.images] : []
    };
    
    // Aguardar um frame para garantir que o DOM foi atualizado
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  private handleStateChange(newState: BannerCurrentStateDTO): void {
    // Verificar se houve mudança real
    const hasModeChanged = !this.previousState || this.previousState.mode !== newState.mode;
    const hasVideoUrlChanged = !this.previousState || 
      (this.previousState.videoUrl !== newState.videoUrl);
    const hasImagesChanged = this.hasImagesChanged(this.previousState?.images || [], newState.images || []);
    const hasMutedChanged = !this.previousState || 
      ((this.previousState.muted ?? false) !== (newState.muted ?? false));

    // Se não houve mudanças, retornar SEM ATUALIZAR NADA
    if (!hasModeChanged && !hasVideoUrlChanged && !hasImagesChanged && !hasMutedChanged) {
      return; // Sem mudanças - não fazer nada
    }

    // Se apenas o muted mudou e estamos em modo VIDEO, atualizar sem recriar iframe
    // (YouTube permite mudar muted via API sem recriar)
    if (!hasModeChanged && !hasVideoUrlChanged && !hasImagesChanged && hasMutedChanged && newState.mode === 'VIDEO') {
      this.currentMuted = newState.muted ?? false;
      // Atualizar previousState mas NÃO recriar iframe
      this.previousState = { 
        mode: newState.mode,
        videoUrl: newState.videoUrl,
        muted: newState.muted ?? false,
        images: newState.images ? [...newState.images] : []
      };
      return; // Não recriar iframe, apenas atualizar estado interno
    }

    // Se apenas as imagens mudaram e o modo continua SLIDE, atualizar sem reiniciar carrossel
    if (!hasModeChanged && !hasVideoUrlChanged && hasImagesChanged && newState.mode === 'SLIDE') {
      this.updateImagesOnly(newState);
      // Atualizar previousState apenas se realmente houve mudança
      this.previousState = { 
        mode: newState.mode,
        videoUrl: newState.videoUrl,
        muted: newState.muted ?? false,
        images: newState.images ? [...newState.images] : []
      };
      return;
    }

    // Se estamos em modo VIDEO e a URL mudou (mesmo modo), atualizar vídeo sem transição
    if (!hasModeChanged && hasVideoUrlChanged && newState.mode === 'VIDEO' && this.currentMode === 'VIDEO') {
      this.switchToVideo(newState);
      this.previousState = { 
        mode: newState.mode,
        videoUrl: newState.videoUrl,
        muted: newState.muted ?? false,
        images: newState.images ? [...newState.images] : []
      };
      return;
    }

    // Se estamos em modo VIDEO e NADA mudou, não fazer nada (não recriar iframe)
    if (!hasModeChanged && !hasVideoUrlChanged && !hasImagesChanged && !hasMutedChanged && 
        newState.mode === 'VIDEO' && this.currentMode === 'VIDEO') {
      return; // Vídeo já está rodando, não fazer nada
    }

    if (this.isTransitioning) {
      return; // Já está em transição
    }

    // Apenas fazer transição completa se o modo mudou
    this.isTransitioning = true;

    // Fade out
    setTimeout(() => {
      if (newState.mode === 'VIDEO') {
        this.switchToVideo(newState);
      } else {
        this.switchToSlide(newState);
      }

      // Fade in após troca
      setTimeout(() => {
        this.isTransitioning = false;
        this.previousState = { 
          mode: newState.mode,
          videoUrl: newState.videoUrl,
          muted: newState.muted ?? false,
          images: newState.images ? [...newState.images] : []
        };
        // Forçar detecção de mudanças após transição
        this.cdr.detectChanges();
      }, 300);
    }, 300); // Tempo de fade out
  }

  private updateImagesOnly(state: BannerCurrentStateDTO): void {
    const newImages = state.images ? [...state.images] : [];
    
    // Verificar se as imagens realmente mudaram
    const imagesChanged = this.hasImagesChanged(this.currentImages, newImages);
    
    if (!imagesChanged) {
      // Se as imagens não mudaram, não fazer nada - deixar o carrossel continuar normalmente
      return;
    }
    
    // Atualizar apenas as imagens sem transição completa
    this.currentImages = newImages;
    
    // Resetar índice apenas se necessário (imagem atual não existe mais)
    if (this.currentImageIndex >= this.currentImages.length) {
      this.currentImageIndex = 0;
      this.updateCurrentImageUrl();
      // Reiniciar carrossel apenas se o índice foi resetado
      this.startSlideCarousel();
    } else {
      // Se o índice ainda é válido, apenas atualizar a URL da imagem atual
      // mas NÃO reiniciar o carrossel para não interromper a transição atual
      this.updateCurrentImageUrl();
    }
    
    // Forçar detecção de mudanças
    this.cdr.detectChanges();
  }

  private hasImagesChanged(oldImages: BannerImageDTO[], newImages: BannerImageDTO[]): boolean {
    // Se os tamanhos são diferentes, há mudança
    if (oldImages.length !== newImages.length) {
      return true;
    }

    // Se ambos estão vazios, não há mudança
    if (oldImages.length === 0 && newImages.length === 0) {
      return false;
    }

    // Criar strings de comparação usando ID e URL combinados
    // Isso garante detecção mesmo se IDs forem undefined
    const createImageKey = (img: BannerImageDTO): string => {
      return `${img.id || 'no-id'}|${img.imageUrl || ''}`;
    };

    const oldKeys = oldImages.map(createImageKey).sort().join('||');
    const newKeys = newImages.map(createImageKey).sort().join('||');

    return oldKeys !== newKeys;
  }

  private switchToVideo(state: BannerCurrentStateDTO): void {
    const newVideoUrl = state.videoUrl ?? null;
    const newVideoId = newVideoUrl ? this.extractYouTubeId(newVideoUrl) : null;
    const newMuted = state.muted ?? false;

    // Verificar se o vídeo realmente mudou
    const videoChanged = this.currentVideoId !== newVideoId || 
                       this.currentVideoUrl !== newVideoUrl ||
                       this.currentMuted !== newMuted;

    this.currentMode = 'VIDEO';
    this.currentMuted = newMuted;
    this.currentImages = [];
    this.currentImageIndex = 0;
    this.currentVideoUrl = newVideoUrl;

    // Extrair ID do YouTube
    if (this.currentVideoUrl) {
      this.currentVideoId = newVideoId;
      if (!this.currentVideoId) {
        console.error('Não foi possível extrair o ID do YouTube da URL:', this.currentVideoUrl);
        this.videoIframeKey = '';
      } else {
        // APENAS gerar nova key se o vídeo realmente mudou
        if (videoChanged) {
          this.videoIframeKey = `${this.currentVideoId}-${Date.now()}`;
          console.log('Vídeo configurado:', {
            videoId: this.currentVideoId,
            muted: this.currentMuted,
            url: this.currentVideoUrl
          });
        }
        // Se o vídeo não mudou, manter a key atual para não recriar o iframe
      }
    } else {
      this.currentVideoId = null;
      this.videoIframeKey = '';
    }

    // Parar carrossel de slides
    if (this.slideTimeout) {
      clearTimeout(this.slideTimeout);
      this.slideTimeout = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Forçar detecção de mudanças apenas se necessário
    if (videoChanged) {
      this.cdr.detectChanges();
    }
  }

  private switchToSlide(state: BannerCurrentStateDTO): void {
    this.currentMode = 'SLIDE';
    this.currentVideoUrl = null;
    this.currentVideoId = null;
    this.videoIframeKey = ''; // Limpar key do vídeo
    
    // Criar nova referência do array para garantir detecção de mudanças
    this.currentImages = state.images ? [...state.images] : [];
    
    // Resetar índice sempre que mudar as imagens
    this.currentImageIndex = 0;
    
    // Atualizar URL da imagem atual
    this.updateCurrentImageUrl();

    // Forçar detecção de mudanças antes de iniciar carrossel
    this.cdr.detectChanges();

    // Iniciar carrossel de slides
    this.startSlideCarousel();
  }

  private startSlideCarousel(): void {
    // Sempre limpar intervalos anteriores
    if (this.slideTimeout) {
      clearTimeout(this.slideTimeout);
      this.slideTimeout = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Se não há imagens ou apenas uma, não iniciar carrossel
    if (this.currentImages.length <= 1) {
      this.currentSlideProgress = 0;
      return;
    }

    // Garantir que o índice está válido
    if (this.currentImageIndex >= this.currentImages.length) {
      this.currentImageIndex = 0;
    }

    // Iniciar transição da imagem atual
    this.startCurrentSlideTransition();
  }

  private startCurrentSlideTransition(): void {
    // Obter duração da imagem atual (default 10 segundos)
    const currentImage = this.currentImages[this.currentImageIndex];
    const duration = (currentImage?.transitionDurationSeconds || 10) * 1000; // Converter para ms

    // Resetar progresso
    this.currentSlideProgress = 0;
    this.slideStartTime = Date.now();
    this.isImageTransitioning = false;

    // Atualizar progresso a cada 50ms para animação suave
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.slideStartTime;
      this.currentSlideProgress = Math.min((elapsed / duration) * 100, 100);
      this.cdr.detectChanges();
    }, 50);

    // Avançar para próxima imagem após duração completa
    // A transição visual será iniciada no nextSlide()
    this.slideTimeout = setTimeout(() => {
      this.nextSlide();
    }, duration);
  }

  private nextSlide(): void {
    if (this.currentImages.length > 0) {
      // Limpar intervalos
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      
      // Fade out completo antes de trocar
      this.isImageTransitioning = true;
      this.cdr.detectChanges();
      
      // Aguardar fade out completo (800ms) antes de trocar imagem
      setTimeout(() => {
        // Avançar para próxima imagem
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentImages.length;
        this.updateCurrentImageUrl();
        this.isImageTransitioning = false;
        this.currentSlideProgress = 0;
        
        // Forçar detecção de mudanças para mostrar nova imagem
        this.cdr.detectChanges();
        
        // Aguardar um frame para garantir que a nova imagem está carregada
        setTimeout(() => {
          // Reiniciar transição para nova imagem
          this.startCurrentSlideTransition();
        }, 50);
      }, 800);
    }
  }

  private updateCurrentImageUrl(): void {
    this.currentImageUrl = this.buildImageUrl();
  }

  private buildImageUrl(): string {
    if (this.currentImages.length === 0) {
      return '';
    }
    const image = this.currentImages[this.currentImageIndex];
    if (!image || !image.imageUrl) {
      return '';
    }
    
    // Se já é uma URL completa (http/https), retornar diretamente
    if (image.imageUrl.startsWith('http://') || image.imageUrl.startsWith('https://')) {
      return image.imageUrl;
    }
    
    // O StorageService retorna URLs no formato /api/v1/files/{folder}/{filename}
    // Precisamos construir a URL completa
    const baseUrl = environment.apiUrl.replace('/api/v1/', '');
    
    // Se já começa com /api/v1/files, usar diretamente
    if (image.imageUrl.startsWith('/api/v1/files')) {
      return `${baseUrl}${image.imageUrl}`;
    }
    
    // Se começa com /, assumir que é relativo ao baseUrl
    if (image.imageUrl.startsWith('/')) {
      return `${baseUrl}${image.imageUrl}`;
    }
    
    // Caso contrário, construir URL completa
    return `${baseUrl}/api/v1/files/banners/${image.imageUrl}`;
  }

  getCurrentImageUrl(): string {
    return this.currentImageUrl;
  }

  getYouTubeEmbedUrl(): SafeResourceUrl | null {
    if (!this.currentVideoId) {
      console.debug('getYouTubeEmbedUrl: currentVideoId is null', {
        currentVideoUrl: this.currentVideoUrl,
        currentMode: this.currentMode
      });
      return null;
    }
    
    const muteParam = this.currentMuted ? '1' : '0';
    // Adicionar parâmetros adicionais para garantir autoplay e loop
    const url = `https://www.youtube.com/embed/${this.currentVideoId}?autoplay=1&controls=0&mute=${muteParam}&loop=1&playlist=${this.currentVideoId}&enablejsapi=1&rel=0&modestbranding=1`;
    
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    console.debug('getYouTubeEmbedUrl: URL criada', {
      videoId: this.currentVideoId,
      muted: this.currentMuted,
      url: url.substring(0, 100) + '...'
    });
    
    return safeUrl;
  }

  private extractYouTubeId(url: string): string | null {
    if (!url || typeof url !== 'string') return null;

    // Remover espaços e normalizar
    const normalizedUrl = url.trim();

    // Padrões de URL do YouTube
    const patterns = [
      // youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
      // youtu.be/VIDEO_ID
      /youtu\.be\/([^&\n?#]+)/,
      // youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([^&\n?#]+)/,
      // youtube.com/v/VIDEO_ID
      /youtube\.com\/v\/([^&\n?#]+)/,
      // youtube.com/VIDEO_ID (formato curto)
      /youtube\.com\/([a-zA-Z0-9_-]{11})(?:\?|$|&)/
    ];

    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        // Validar que o ID tem 11 caracteres (formato padrão do YouTube)
        if (videoId.length === 11) {
          return videoId;
        }
      }
    }

    // Se nenhum padrão funcionou, tentar extrair diretamente se a URL contém um ID de 11 caracteres
    const directMatch = normalizedUrl.match(/([a-zA-Z0-9_-]{11})/);
    if (directMatch && directMatch[1]) {
      return directMatch[1];
    }

    console.warn('Não foi possível extrair ID do YouTube da URL:', normalizedUrl);
    return null;
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.currentImages.length) {
      // Limpar intervalos atuais
      if (this.slideTimeout) {
        clearTimeout(this.slideTimeout);
        this.slideTimeout = null;
      }
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      
      this.currentImageIndex = index;
      this.updateCurrentImageUrl();
      this.isImageTransitioning = false;
      this.currentSlideProgress = 0;
      
      // Reiniciar carrossel
      this.startSlideCarousel();
      this.cdr.detectChanges();
    }
  }

  getSlideProgress(): number {
    return this.currentSlideProgress;
  }

  goBack(): void {
    this.router.navigate(['/landing']);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Suporte para controle remoto/TV: ESC ou Backspace para voltar
    if (event.key === 'Escape' || event.key === 'Backspace') {
      // Verificar se não está em um input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        this.goBack();
      }
    }
  }
}

