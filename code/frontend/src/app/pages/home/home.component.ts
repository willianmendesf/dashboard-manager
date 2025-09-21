import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../shared/service/api.service';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  styleUrl: "./home.scss",
  templateUrl: './home.html'
})

export class HomeComponent implements OnInit {

  public data : [] = [];

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
    {label: 'Serviço de Email', value: '100%', status: 'online'}
  ];

  constructor(
    private api : ApiService
  ) {

  }
  ngOnInit(): void {
    this.getValues()
    this.stats = [
      {icon: '👥', value: this.data.length, label: 'Usuários', change: '+12%', trend: 'positive'},
      {icon: '💰', value: 'R$ 18.2K', label: 'Receita Mensal', change: '+8%', trend: 'positive'},
      {icon: '📈',value: '94.5%', label: 'Taxa de Conversão', change: '-2%', trend: 'negative'},
      {icon: '⏱️', value: '2.4s', label: 'Tempo de Carregamento', change: '+5%', trend: 'negative'}
    ]
  }

  private getValues(){
    this.api.get("users").subscribe({
      next: res => {
        this.data = res
        console.log(this.data)
      },
      error: error => {},
      complete: () => console.log('Complete')
    })
  }

}
