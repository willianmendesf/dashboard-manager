package br.com.willianmendesf.system.service.utils;

import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.service.WhatsappMessageService;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@AllArgsConstructor
public class MessagesUtils {

    private static WhatsappMessageService whatsapp;

    public static String generateMonitoringMessage(AppointmentEntity appointment) {
        return String.format(
                "🚨 *MENSAGEM DE MONITORAMENTO DE AGENDAMENTO* 🚨\n" +
                        "--------------------------------------\n" +
                        "Nome: *%s*\n" +
                        "Descrição: *%s*\n" +
                        "Data/Hora envio: *%s*\n" +
                        //"Enviado para: *%s*\n" +
                        //"Status Atual: *%s*\n" +
                        "--------------------------------------\n\n" +
                "Verifique o sistema para mais detalhes.",
                appointment.getName(),
                appointment.getDescription(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                //sources
        );
    }
}
