import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router'
import { SidebarComponent } from "./views/sidebar/sidebar.component";

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    SidebarComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('frontend');
  public readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth <= 768);
    }
  }
}
