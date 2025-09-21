import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { UsersComponent } from './pages/users/users.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'settings', component: SettingsComponent }
];