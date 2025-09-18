package br.com.willianmendesf.system.exception;

public class CadastroException extends RuntimeException {
    public CadastroException() {
        super();
    }

    public CadastroException(Throwable cause) {
        super(cause);
    }

    public CadastroException(String message) {
        super(message);
    }

    public CadastroException(String message, Throwable cause) {
        super(message, cause);
    }
}
