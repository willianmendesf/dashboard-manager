import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'cron-selector',
    templateUrl: './cron-selector.component.html',
    styleUrl: './cron-selector.component.scss',
    imports: [CommonModule, FormsModule]
})
export class CronSelectorComponent implements OnInit {
    @Input() currentAppointment: { schedule: string } = { schedule: '0 0 * * *' };
    @Output() currentAppointmentChange = new EventEmitter<{ schedule: string }>();

    public cronFields = {
        segundos: '0',
        minutos: '0',
        horas: '0',
        diaDoMes: '*',
        mes: '*',
        diaDaSemana: '*'
    };

    public segundoOptions: string[] = Array.from({ length: 60 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`]); // 0 a 59
    public minutoOptions: string[] = Array.from({ length: 60 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`]); // 0 a 59
    public horaOptions: string[] = Array.from({ length: 23 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`]); // 0 a 23
    public diaDoMesOptions: (string | number)[] = ['*'].concat(Array.from({ length: 31 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`])); // 1 a 31
    public mesOptions: (string | number)[] = ['*'].concat(Array.from({ length: 12 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`])); // 1 a 12
    public diaDaSemanaOptions: { value: string, label: string }[] = [
        { value: '*', label: 'Qualquer' },
        { value: '7', label: 'Domingo' },
        { value: '1', label: 'Segunda' },
        { value: '2', label: 'Terça' },
        { value: '3', label: 'Quarta' },
        { value: '4', label: 'Quinta' },
        { value: '5', label: 'Sexta' },
        { value: '6', label: 'Sábado' },
    ];

    constructor() {
        this.segundoOptions.unshift('*');
        this.minutoOptions.unshift('*');
        this.horaOptions.unshift('*');
    }

    ngOnInit(): void {
        this.parseCronString(this.currentAppointment.schedule);
        this.updateCronString();
    }

    public updateCronString(): void {
        const { segundos, minutos, horas, diaDoMes, mes, diaDaSemana } = this.cronFields;
        const newCronString = `${segundos} ${minutos} ${horas} ${diaDoMes} ${mes} ${diaDaSemana}`;
        this.currentAppointment.schedule = newCronString;
        this.currentAppointmentChange.emit(this.currentAppointment);
    }

    private parseCronString(cron: string): void {
        const parts = cron.split(' ');
        if (parts.length >= 6) { 
            this.cronFields.segundos = parts[0];
            this.cronFields.minutos = parts[1];
            this.cronFields.horas = parts[2];
            this.cronFields.diaDoMes = parts[3];
            this.cronFields.mes = parts[4];
            this.cronFields.diaDaSemana = parts[5];
        }
        else if (parts.length === 5) {
            this.cronFields.segundos = '0';
            this.cronFields.minutos = parts[0];
            this.cronFields.horas = parts[1];
            this.cronFields.diaDoMes = parts[2];
            this.cronFields.mes = parts[3];
            this.cronFields.diaDaSemana = parts[4];
        }
    }
}