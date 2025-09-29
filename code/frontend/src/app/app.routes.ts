import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { WhatsAppComponent } from './pages/whatsapp/whatsapp.component';
import { MemberManagementComponent } from './pages/member-management/member-management.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'member-management', component: MemberManagementComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'messages', component: MessagesComponent },
  { path: 'whatsapp', component: WhatsAppComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'user-management', component: UserManagementComponent },
  { path: 'settings', component: SettingsComponent }
];
