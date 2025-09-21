import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { UsersComponent } from './pages/users/users.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { WhatsAppComponent } from './pages/whatsapp/whatsapp.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'messages', component: MessagesComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'user-management', component: UserManagementComponent },
  { path: 'whatsapp', component: WhatsAppComponent }
];
