import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/service/api.service';
import { PageTitleComponent } from "../../../shared/modules/pagetitle/pagetitle.component";
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { StatusIcons, NavigationIcons } from '../../../shared/lib/utils/icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PageTitleComponent],
  styleUrl: "./home.scss",
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  
  public members : any[] = [];
  public appointments : any[] = [];
  public users : any[] = [];
  public stats : any[] = [];

  recentActivities = [
    {icon: this.getSafeIcon(() => StatusIcons.check({ size: 20, color: 'currentColor' })), title: 'Novo usuário registrado', description: 'João Silva se registrou na plataforma', time: 'há 2 minutos'},
    {icon: this.getSafeIcon(() => StatusIcons.chart({ size: 20, color: 'currentColor' })), title: 'Relatório gerado', description: 'Relatório mensal de vendas foi criado', time: 'há 15 minutos'},
    {icon: this.getSafeIcon(() => StatusIcons.tool({ size: 20, color: 'currentColor' })), title: 'Sistema atualizado', description: 'Versão 2.1.0 foi implantada com sucesso', time: 'há 1 hora'},
    {icon: this.getSafeIcon(() => StatusIcons.lock({ size: 20, color: 'currentColor' })), title: 'Backup realizado', description: 'Backup automático dos dados concluído', time: 'há 3 horas'}
  ];
  
  private getSafeIcon(iconFn: () => string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(iconFn());
  }

  systemStatus = [
    {label: 'API Principal', value: '99.9%', status: 'online'},
    {label: 'Base de Dados', value: '98.2%', status: 'online'},
    {label: 'Cache Redis', value: '85.4%', status: 'warning'},
    {label: 'Serviço Whatsapp', value: '100%', status: 'online'}
  ];

  //private toastr = inject(ToastrService)
  private api = inject(ApiService)
  private cdr = inject(ChangeDetectorRef)
  private router = inject(Router)

  ngOnInit(): void {
    this.getValues()
    this.getAppointments()
    this.getUsers()
    this.updateStats()
  }

  private updateStats(): void {
    const activeAppointments = this.appointments.filter(apt => apt.enabled === true).length;
    this.stats = [
      {icon: this.getSafeIcon(() => StatusIcons.users({ size: 24, color: 'currentColor' })), value: this.members.length, label: 'Membros', route: '/member-management'},
      {icon: this.getSafeIcon(() => NavigationIcons.appointments({ size: 24, color: 'currentColor' })), value: activeAppointments, label: 'Agendamentos Ativos', route: '/appointments'},
      {icon: this.getSafeIcon(() => StatusIcons.users({ size: 24, color: 'currentColor' })), value: this.users.length, label: 'Usuários do Sistema', route: '/user-management'}
    ]
    this.cdr.markForCheck()
  }

  public navigateToRoute(route: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  private getValues(){
    this.api.get("members")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.members = Array.isArray(res) ? res : [];
        this.updateStats()
      },
      error: error => {
        console.error('Error loading members:', error);
        this.members = [];
        this.updateStats()
      },
      complete: () => {}
    })
  }

  private getAppointments(){
    this.api.get("appointments")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.appointments = Array.isArray(res) ? res : [];
        this.updateStats()
      },
      error: error => {
        console.error('Error loading appointments:', error);
        this.appointments = [];
        this.updateStats()
      },
      complete: () => {}
    })
  }

  private getUsers(){
    this.api.get("users")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.users = Array.isArray(res) ? res : [];
        this.updateStats()
      },
      error: error => {
        console.error('Error loading users:', error);
        this.users = [];
        this.updateStats()
      },
      complete: () => {}
    })
  }
}
