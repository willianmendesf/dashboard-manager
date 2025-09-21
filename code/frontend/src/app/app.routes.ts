import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'register', loadComponent: () => import('./routes/registers/registers').then(m => m.Registers) },
  { path: 'appointments', loadComponent: () => import('./routes/appointments/appointments').then(m => m.Appointments) }
];
