package br.com.willianmendesf.system.model;

import br.com.willianmendesf.system.model.enums.WhatsappMessageType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WhatsappMessageSender {
    private String phone;
    private String message;
    private WhatsappMessageType messageType;

    public WhatsappMessageSender() { }

    public WhatsappMessageSender(WhatsappSender message) {
        this.phone = message.getPhone();
        this.message = message.getMessage();
        this.messageType = message.getMessageType();
    }
}
