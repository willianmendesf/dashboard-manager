import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  
  /**
   * Recebe um número de telefone (ex: "(11) 90000-0000") 
   * e retorna um link 'wa.me' limpo (ex: "https://wa.me/5511900000000").
   * 
   * @param phoneNumber Número de telefone formatado ou não
   * @returns URL do WhatsApp ou null se o número for inválido
   */
  getWhatsAppLink(phoneNumber: string | null | undefined): string | null {
    if (!phoneNumber) {
      return null;
    }

    // 1. Limpa o número (remove tudo exceto dígitos)
    const cleanedNumber = phoneNumber.replace(/\D/g, '');

    // 2. Garante que tem um número válido (mínimo 10 dígitos: DD + 8 NÚMERO)
    if (cleanedNumber.length < 10) {
      return null;
    }

    // 3. Remove o 55 se já estiver presente (evita duplicação)
    let finalNumber = cleanedNumber;
    if (finalNumber.startsWith('55') && finalNumber.length > 12) {
      finalNumber = finalNumber.substring(2);
    }

    // 4. Monta a URL (assumindo que o 55 já não está incluído)
    return `https://wa.me/55${finalNumber}`;
  }
}

