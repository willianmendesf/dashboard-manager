import { Routes } from '@angular/router';
import { HomeComponent } from './pages/logged/home/home.component';
import { SettingsComponent } from './pages/logged/settings/settings.component';
import { MessagesComponent } from './pages/logged/messages/messages.component';
import { UserManagementComponent } from './pages/logged/user-management/user-management.component';
import { WhatsAppComponent } from './pages/logged/whatsapp/whatsapp.component';
import { MemberManagementComponent } from './pages/logged/member-management/member-management.component';
import { AppointmentsComponent } from './pages/logged/appointments/appointments.component';
import { LoginComponent } from './pages/access/login/login.component';
import { SolicitarResetComponent } from './pages/access/solicitar-reset/solicitar-reset.component';
import { RedefinirSenhaComponent } from './pages/access/redefinir-senha/redefinir-senha.component';
import { MyProfileComponent } from './pages/logged/my-profile/my-profile.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { PermissionGuard } from './shared/guards/permission.guard';

import { AtualizarCadastroComponent } from './pages/public/atualizar-cadastro/atualizar-cadastro.component';
import { GroupManagementComponent } from './pages/logged/volunteering/volunteering.component';
import { AdicionarVisitantesComponent } from './pages/public/adicionar-visitantes/adicionar-visitantes.component';
import { VisitorManagementComponent } from './pages/logged/visitor-management/visitor-management.component';
import { NotFoundComponent } from './pages/logged/not-found/not-found.component';
import { LandingComponent } from './pages/public/landing/landing.component';
import { EmprestimoPublicoComponent } from './pages/public/emprestimo-publico/emprestimo-publico.component';
import { LoansComponent } from './pages/logged/loans/loans.component';
import { MuralDigitalComponent } from './pages/public/mural-digital/mural-digital.component';
import { BannerManagementComponent } from './pages/logged/banner-management/banner-management.component';
import { ListaPresencaComponent } from './pages/public/lista-presenca/lista-presenca.component';
import { AttendanceDashboardComponent } from './pages/logged/attendance/attendance-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'esqueci-senha', component: SolicitarResetComponent },
  { path: 'redefinir-senha', component: RedefinirSenhaComponent },
  { path: 'atualizar-cadastro', component: AtualizarCadastroComponent },
  { path: 'adicionar-visitantes', component: AdicionarVisitantesComponent },
  { path: 'emprestimo', component: EmprestimoPublicoComponent },
  { path: 'mural', component: MuralDigitalComponent },
  { path: 'lista-presenca', component: ListaPresencaComponent },
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
    path: 'user-management', 
    component: UserManagementComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'volunteering', 
    component: GroupManagementComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'visitor-management', 
    component: VisitorManagementComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'dashboard/attendance', 
    component: AttendanceDashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'loans', 
    component: LoansComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'banner-management', 
    component: BannerManagementComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'settings', 
    component: SettingsComponent,
    canActivate: [PermissionGuard],
    data: { permission: 'ACCESS_SCREEN_SETTINGS' }
  },
  { 
    path: '**', 
    component: NotFoundComponent 
  }
];
