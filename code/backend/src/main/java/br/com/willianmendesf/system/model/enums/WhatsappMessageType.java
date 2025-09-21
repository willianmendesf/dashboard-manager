package br.com.willianmendesf.system.model.enums;

public enum WhatsappMessageType {
    individual("individual"),
    group("group");

    private String desc;

    WhatsappMessageType(String desc) {
        this.desc = desc;
    }
}
