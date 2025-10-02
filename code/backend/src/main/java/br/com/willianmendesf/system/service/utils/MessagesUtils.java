package br.com.willianmendesf.system.service.utils;

import br.com.willianmendesf.system.model.entity.AppointmentEntity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class MessagesUtils {
    public static String generateMonitoringMessage(AppointmentEntity appointment) {
        return String.format(
                "🚨 *MENSAGEM DE MONITORAMENTO DE AGENDAMENTO* 🚨\n\n" +
                        "--------------------------------------\n" +
                        "Nome Agendamento: *%s*\n" +
                        "Descrição: *%s*\n" +
                        "Data e Hora de envio: *%s*\n" +
                        //"Status Atual: *%s*\n" +
                        "--------------------------------------\n\n" +
                        "Verifique o sistema para mais detalhes.",
                appointment.getName(),
                appointment.getDescription(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
        );
    }
}
