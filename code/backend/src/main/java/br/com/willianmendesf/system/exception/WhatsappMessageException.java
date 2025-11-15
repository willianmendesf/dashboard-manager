package br.com.willianmendesf.system.exception;

public class WhatsappMessageException extends RuntimeException {
    public WhatsappMessageException() {
        super();
    }

    public WhatsappMessageException(Throwable cause) {
        super(cause);
    }

    public WhatsappMessageException(String message) {
        super(message);
    }

    public WhatsappMessageException(String message, Throwable cause) {
        super(message, cause);
    }
}
