package br.com.willianmendesf.system.exception;

public class AppointmentException extends RuntimeException {
    public AppointmentException() {
        super();
    }

    public AppointmentException(Throwable cause) {
        super(cause);
    }

    public AppointmentException(String message) {
        super(message);
    }

    public AppointmentException(String message, Throwable cause) {
        super(message, cause);
    }
}
