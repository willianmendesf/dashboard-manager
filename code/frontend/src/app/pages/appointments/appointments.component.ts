import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/service/api.service';
import { CommonModule } from '@angular/common';
import { Appointment } from './model/appointment.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'appointments',
  standalone: true,
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
  imports: [CommonModule]
})
export class Appointments implements OnInit {
  private unsubscribe$ = new Subject<void>();
  public appointments : Appointment[] = [];

  constructor(private api : ApiService) { }

  ngOnInit(): void {
    this.getAll();
    console.log(this.appointments)
  }

  public getAll() {
    this.api.get("appointments")
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: appointments => {
        this.appointments = appointments
        console.log(this.appointments)
      },
      error: error => console.log(error),
      complete: () => console.log('Complete')
  });
  }
}
