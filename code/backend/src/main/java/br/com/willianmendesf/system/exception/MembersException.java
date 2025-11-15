package br.com.willianmendesf.system.exception;

public class MembersException extends RuntimeException {
    public MembersException() {
        super();
    }

    public MembersException(Throwable cause) {
        super(cause);
    }

    public MembersException(String message) {
        super(message);
    }

    public MembersException(String message, Throwable cause) {
        super(message, cause);
    }
}
