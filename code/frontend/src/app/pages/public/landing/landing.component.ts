import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/service/auth.service';
import { ConfigService } from '../../../shared/service/config.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  public logoUrl = signal<string>('./img/logo.png');
  
  private router = inject(Router);
  private authService = inject(AuthService);
  private configService = inject(ConfigService);

  ngOnInit(): void {
    // Verificar autenticação e redirecionar se necessário
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }
    
    // Carregar logo do banco de dados (mesma lógica da área logada)
    this.configService.getLogoUrl().pipe(
      catchError(() => of(null))
    ).subscribe(url => {
      if (url && url.trim() !== '') {
        this.logoUrl.set(url);
      } else {
        this.logoUrl.set('./img/logo.png');
      }
    });
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = './img/logo.png';
  }
}

