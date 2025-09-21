import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../shared/service/api.service';
import { Register } from './model/register.model';
import { WhatsappsService } from '../../shared/service/whatsapp.service';

@Component({
  selector: 'register',
  templateUrl: './registers.html',
  styleUrl: './registers.scss',
  standalone: true,
  imports: [CommonModule]
})
export class Registers implements OnInit {

  public registers : Register[] = [];

  constructor(
    private api : ApiService,
    private wtz : WhatsappsService
  ) { }

  ngOnInit(): void {
    this.getAll();
    this.sendTest();
    console.log(this.registers)
  }

  public getAll() {
    this.api.get("register").subscribe({
    next: registers => {
      this.registers = registers
      console.log(this.registers)
    },
    error: error => console.log(error),
    complete: () => console.log('Complete')
  });
  }

  public sendTest() {
    const message = {
      phone: "5511966152161@s.whatsapp.net",
      message: "Teste da minha api!"
    }

    this.api.post("whatsapp", message).subscribe({
      next: res => console.log(res),
      error: error => console.error(error),
      complete: () => console.info("completed yes!")
    })
  }
}
