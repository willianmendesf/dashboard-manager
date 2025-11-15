package br.com.willianmendesf.system.exception;

public class ImageException extends RuntimeException {
    public ImageException() {
        super();
    }

    public ImageException(Throwable cause) {
        super(cause);
    }

    public ImageException(String message) {
        super(message);
    }

    public ImageException(String message, Throwable cause) {
        super(message, cause);
    }
}
