import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router'
import { SidebarComponent } from "./views/sidebar/sidebar.component";

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SidebarComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('frontend');
}
