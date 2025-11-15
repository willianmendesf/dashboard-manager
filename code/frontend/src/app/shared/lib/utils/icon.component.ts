import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Icons, getIcon, IconOptions } from './icons';

/**
 * Componente reutilizável para renderizar ícones SVG
 * 
 * Uso:
 * <app-icon name="home" [size]="24" [color]="'#fff'"></app-icon>
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span [innerHTML]="safeIconHTML" [attr.aria-hidden]="true"></span>`,
  styles: [`
    span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    span ::ng-deep svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size?: number;
  @Input() color?: string;
  @Input() strokeWidth?: number;
  
  private sanitizer = inject(DomSanitizer);

  get safeIconHTML(): SafeHtml {
    if (!this.name) return '';
    
    const options: IconOptions = {
      size: this.size,
      color: this.color,
      strokeWidth: this.strokeWidth
    };
    
    const html = getIcon(this.name, options);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
