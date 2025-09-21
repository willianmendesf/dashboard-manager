package br.com.willianmendesf.system.model;

import br.com.willianmendesf.system.model.enums.WhatsappMediaType;
import br.com.willianmendesf.system.model.enums.WhatsappMessageType;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class WhatsappSender extends WhatsappMessageSender {
    private String caption;
    private String media;
    private Boolean view_once = false;
    private Boolean compress = true;
    private WhatsappMediaType mediaType;

    public WhatsappSender() {
        super();
    }

    public WhatsappSender(String phone, String message, WhatsappMessageType messageType, String caption, String media, Boolean view_once, Boolean compress, WhatsappMediaType mediaType) {
        super(phone, message, messageType);
        this.caption = caption;
        this.media = media;
        this.view_once = view_once;
        this.compress = compress;
        this.mediaType = mediaType;
    }
}
