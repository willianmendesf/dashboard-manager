import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { WhatsAppComponent } from './pages/whatsapp/whatsapp.component';
import { MemberManagementComponent } from './pages/member-management/member-management.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { LoginComponent } from './pages/login/login.component';
import { SolicitarResetComponent } from './pages/solicitar-reset/solicitar-reset.component';
import { RedefinirSenhaComponent } from './pages/redefinir-senha/redefinir-senha.component';
import { MyProfileComponent } from './pages/my-profile/my-profile.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { PermissionGuard } from './shared/guards/permission.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'esqueci-senha', component: SolicitarResetComponent },
  { path: 'redefinir-senha', component: RedefinirSenhaComponent },
  { 
    path: 'meu-perfil', 
    component: MyProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'appointments', 
    component: AppointmentsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'member-management', 
    component: MemberManagementComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'projects', 
    component: ProjectsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'messages', 
    component: MessagesComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'whatsapp', 
    component: WhatsAppComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'analytics', 
    component: AnalyticsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'user-management', 
    component: UserManagementComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'settings', 
    component: SettingsComponent,
    canActivate: [PermissionGuard],
    data: { permission: 'ACCESS_SCREEN_SETTINGS' }
  }
];
