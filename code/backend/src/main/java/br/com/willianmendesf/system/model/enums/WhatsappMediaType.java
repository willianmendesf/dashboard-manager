package br.com.willianmendesf.system.model.enums;

import lombok.Getter;

@Getter
public enum WhatsappMediaType {
    IMAGE("image"),
    VIDEO("video"),
    AUDIO("audio"),
    DOCUMENT("document");

    private String desc;

    WhatsappMediaType(String desc){
        this.desc = desc;
    }
}
