package br.com.willianmendesf.system.exception;

public class BannerException extends RuntimeException {
    public BannerException(String message) {
        super(message);
    }

    public BannerException(String message, Throwable cause) {
        super(message, cause);
    }
}

