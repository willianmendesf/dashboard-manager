import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../shared/service/api.service';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

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
  
  public members : any[] = [];
  public stats : any[] = [];

  recentActivities = [
    {icon: '✅', title: 'Novo usuário registrado', description: 'João Silva se registrou na plataforma', time: 'há 2 minutos'},
    {icon: '📊', title: 'Relatório gerado', description: 'Relatório mensal de vendas foi criado', time: 'há 15 minutos'},
    {icon: '🔧', title: 'Sistema atualizado', description: 'Versão 2.1.0 foi implantada com sucesso', time: 'há 1 hora'},
    {icon: '🔒', title: 'Backup realizado', description: 'Backup automático dos dados concluído', time: 'há 3 horas'}
  ];

  systemStatus = [
    {label: 'API Principal', value: '99.9%', status: 'online'},
    {label: 'Base de Dados', value: '98.2%', status: 'online'},
    {label: 'Cache Redis', value: '85.4%', status: 'warning'},
    {label: 'Serviço Whatsapp', value: '100%', status: 'online'}
  ];

  //private toastr = inject(ToastrService)
  private api = inject(ApiService)

  ngOnInit(): void {
    this.getValues()
    this.stats = [
      {icon: '👥', value: this.members.length, label: 'Membros'},
      {icon: '💰', value: 'R$ 18.2K', label: 'Receita Mensal', change: '+8%', trend: 'positive'},
      // {icon: '📈',value: '94.5%', label: 'Taxa de Conversão', change: '-2%', trend: 'negative'},
      {icon: '⏱️', value: '2.4s', label: 'Tempo de Carregamento', change: '+5%', trend: 'negative'}
    ]
  }

  private async getValues(){
    await this.api.get("members")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.members = res
        console.log(this.members.length)
      },
      error: error => console.error(error),
      complete: () => {}//this.toastr.info("Completado")
    })
  }
}
