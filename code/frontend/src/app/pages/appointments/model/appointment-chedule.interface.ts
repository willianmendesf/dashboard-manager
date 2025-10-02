export interface AppointmentSchedule {
  schedule: string; // A string final da expressão CRON, ex: "0 0 * * *"
  minutos: string; // 0-59 ou *
  horas: string;   // 0-23 ou *
  diaDoMes: string; // 1-31 ou * ou ?
  mes: string;     // 1-12 ou *
  diaDaSemana: string; // 0-7 ou * (0/7 = Domingo, 1 = Segunda...)
}