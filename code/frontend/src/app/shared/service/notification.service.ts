import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

/**
 * Serviço centralizado para gerenciar a exibição de notificações (Toasts)
 * em toda a aplicação. Isso abstrai o uso do ngx-toastr diretamente
 * nos componentes de tela.
 */
@Injectable({
  providedIn: 'root' // Disponível globalmente (Standalone friendly)
})
export class NotificationService {
  // Injeta o ToastrService do ngx-toastr
  private toastr = inject(ToastrService);

  /**
   * Exibe uma notificação de sucesso (fundo verde).
   * @param message A mensagem principal a ser exibida.
   * @param title O título da notificação.
   * @param override Configurações opcionais para este toast específico.
   */
  success(message: string, title: string = 'Sucesso', override?: Partial<any>): void {
    this.toastr.success(message, title, override);
  }

  /**
   * Exibe uma notificação de erro (fundo vermelho).
   * @param message A mensagem principal a ser exibida.
   * @param title O título da notificação.
   * @param override Configurações opcionais para este toast específico.
   */
  error(message: string, title: string = 'Erro', override?: Partial<any>): void {
    this.toastr.error(message, title, override);
  }

  /**
   * Exibe uma notificação informativa (fundo cinza/padrão).
   * @param message A mensagem principal a ser exibida.
   * @param title O título da notificação.
   * @param override Configurações opcionais para este toast específico.
   */
  info(message: string, title: string = 'Informação', override?: Partial<any>): void {
    this.toastr.info(message, title, override);
  }

  /**
   * (Opcional) Método para tratar e exibir erros vindos de requisições HTTP.
   * @param error O objeto de erro retornado pela API.
   * @param defaultMessage Mensagem a ser usada caso o erro seja vago.
   */
  handleHttpError(error: any, defaultMessage: string = 'Falha no servidor.'): void {
    let errorMessage = defaultMessage;
    
    if (error && error.error && typeof error.error === 'string') {
      // Exemplo: O corpo da resposta de erro é uma string simples
      errorMessage = error.error;
    } else if (error && error.status) {
      // Exemplo: Exibir status HTTP e statusText
      errorMessage = `Erro ${error.status}: ${error.statusText || 'Desconhecido'}`;
    }
    
    this.error(errorMessage, 'Erro na Requisição');
  }
}