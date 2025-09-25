import { Injectable } from '@angular/core';

import { Message } from '../model/message.model';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class MessageService {

  constructor(private toastr: ToastrService ) { }

  messages: Message[] = [];

  addSuccess(text: string) {
    this.toastr.success(text, '');
    //this.add('Sucesso', text, 'success');
  }

  addInfo(text: string) {
    this.toastr.info(text, '');
    // this.add('Informação', text, 'info');
  }

  addWarning(text: string) {
    this.toastr.warning(text, '');
   // this.add('Aviso', text, 'warning');
  }

  addError(text: string) {
    this.toastr.error(text, '');
    // this.add('Erro', text, 'danger');
  }

  addPrimary(title: string, text: string) {
    this.add(title, text, 'primary');
  }

  addSecondary(title: string, text: string) {
    this.add(title, text, 'secondary');
  }

  addLight(title: string, text: string) {
    this.add(title, text, 'light');
  }

  addDark(title: string, text: string) {
    this.add(title, text, 'dark');
  }

  add(title: string, text: string, type: string) {
    let message: Message = new Message();
    message.title = title;
    message.text = text;
    message.type = type;
    this.messages.push(message);
  }
}
