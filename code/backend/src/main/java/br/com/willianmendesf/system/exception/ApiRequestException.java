package br.com.willianmendesf.system.exception;

public class ApiRequestException extends RuntimeException {
    public ApiRequestException() {
        super();
    }

    public ApiRequestException(Throwable cause) {
        super(cause);
    }

    public ApiRequestException(String message) {
        super(message);
    }

    public ApiRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
