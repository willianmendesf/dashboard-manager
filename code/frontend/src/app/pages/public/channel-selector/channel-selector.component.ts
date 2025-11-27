import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BannerService, BannerChannelDTO } from '../../../shared/service/banner.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-channel-selector',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './channel-selector.component.html',
  styleUrl: './channel-selector.component.scss'
})
export class ChannelSelectorComponent implements OnInit {
  private bannerService = inject(BannerService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  channels: BannerChannelDTO[] = [];
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadChannels();
  }

  loadChannels(): void {
    this.isLoading = true;
    this.error = null;
    this.channels = [];
    
    this.bannerService.getActiveChannels()
      .pipe(
        catchError(error => {
          console.error('Erro ao carregar canais:', error);
          this.error = 'Erro ao carregar canais. Tente novamente.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return of([]);
        })
      )
      .subscribe({
        next: (channels) => {
          console.log('Canais recebidos:', channels);
          this.channels = channels || [];
          this.isLoading = false;
          this.error = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro na subscription:', error);
          this.error = 'Erro ao carregar canais. Tente novamente.';
          this.isLoading = false;
          this.channels = [];
          this.cdr.detectChanges();
        }
      });
  }

  selectChannel(channel: BannerChannelDTO): void {
    if (channel.id) {
      this.router.navigate(['/mural', channel.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/landing']);
  }
}

