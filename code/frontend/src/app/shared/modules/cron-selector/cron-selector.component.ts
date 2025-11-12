import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'cron-selector',
    templateUrl: './cron-selector.component.html',
    styleUrl: './cron-selector.component.scss',
    imports: [CommonModule, FormsModule]
})
export class CronSelectorComponent implements OnInit, OnChanges {
    @Input() currentAppointment: { schedule: string } = { schedule: '0 0 * * *' };
    @Input() uniqueId: string = 'cron';
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
    public horaOptions: string[] = Array.from({ length: 24 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`]); // 0 a 23
    public diaDoMesOptions: (string | number)[] = ['*'].concat(Array.from({ length: 32 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`])); // 1 a 31
    public mesOptions: (string | number)[] = ['*'].concat(Array.from({ length: 13 }, (_, i) => i).flatMap(num => [num.toString(), `*/${num}`])); // 1 a 12
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
        if (this.currentAppointment?.schedule) {
            this.parseCronString(this.currentAppointment.schedule);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentAppointment'] && changes['currentAppointment'].currentValue) {
            const schedule = changes['currentAppointment'].currentValue.schedule;
            if (schedule) {
                this.parseCronString(schedule);
            }
        }
    }

    public updateCronString(): void {
        const { segundos, minutos, horas, diaDoMes, mes, diaDaSemana } = this.cronFields;
        const newCronString = `${segundos} ${minutos} ${horas} ${diaDoMes} ${mes} ${diaDaSemana}`;
        this.currentAppointment.schedule = newCronString;
        this.currentAppointmentChange.emit(this.currentAppointment);
    }

    private parseCronString(cron: string): void {
        if (!cron || !cron.trim()) {
            return;
        }

        const parts = cron.trim().split(/\s+/);
        
        if (parts.length >= 6) { 
            this.setCronField('segundos', parts[0], this.segundoOptions);
            this.setCronField('minutos', parts[1], this.minutoOptions);
            this.setCronField('horas', parts[2], this.horaOptions);
            this.setCronField('diaDoMes', parts[3], this.diaDoMesOptions);
            this.setCronField('mes', parts[4], this.mesOptions);
            this.setCronField('diaDaSemana', parts[5], this.diaDaSemanaOptions.map(d => d.value));
        }
        else if (parts.length === 5) {
            this.cronFields.segundos = '0';
            this.setCronField('minutos', parts[0], this.minutoOptions);
            this.setCronField('horas', parts[1], this.horaOptions);
            this.setCronField('diaDoMes', parts[2], this.diaDoMesOptions);
            this.setCronField('mes', parts[3], this.mesOptions);
            this.setCronField('diaDaSemana', parts[4], this.diaDaSemanaOptions.map(d => d.value));
        }
    }

    private setCronField(fieldName: keyof typeof this.cronFields, value: string, options: (string | number)[]): void {
        const stringValue = String(value);
        const stringOptions = options.map(opt => String(opt));
        
        // Se o valor existe nas opções, usa ele
        if (stringOptions.includes(stringValue)) {
            this.cronFields[fieldName] = stringValue;
        } else {
            // Se não existe, adiciona às opções e usa
            if (fieldName === 'diaDaSemana') {
                // Para dia da semana, adiciona como opção especial
                const diaDaSemanaOptions = this.diaDaSemanaOptions as { value: string, label: string }[];
                if (!diaDaSemanaOptions.find(d => d.value === stringValue)) {
                    diaDaSemanaOptions.push({ value: stringValue, label: stringValue });
                }
            } else {
                // Para outros campos, adiciona à lista de opções
                const optionsArray = this.getOptionsArray(fieldName);
                if (!optionsArray.includes(stringValue)) {
                    optionsArray.push(stringValue);
                    optionsArray.sort((a, b) => {
                        if (a === '*') return -1;
                        if (b === '*') return 1;
                        return a.localeCompare(b);
                    });
                }
            }
            this.cronFields[fieldName] = stringValue;
        }
    }

    private getOptionsArray(fieldName: string): string[] {
        switch (fieldName) {
            case 'segundos': return this.segundoOptions;
            case 'minutos': return this.minutoOptions;
            case 'horas': return this.horaOptions;
            case 'diaDoMes': return this.diaDoMesOptions.map(d => String(d));
            case 'mes': return this.mesOptions.map(m => String(m));
            default: return [];
        }
    }
}