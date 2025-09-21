import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer } from "./views/footer/footer";
import { Header } from "./views/header/header";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('frontend');
}
