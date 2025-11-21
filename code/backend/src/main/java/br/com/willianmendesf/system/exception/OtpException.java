package br.com.willianmendesf.system.exception;

public class OtpException extends RuntimeException {
    public OtpException() {
        super();
    }

    public OtpException(Throwable cause) {
        super(cause);
    }

    public OtpException(String message) {
        super(message);
    }

    public OtpException(String message, Throwable cause) {
        super(message, cause);
    }
}

