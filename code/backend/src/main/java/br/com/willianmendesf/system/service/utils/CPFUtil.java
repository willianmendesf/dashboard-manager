package br.com.willianmendesf.system.service.utils;

public class CPFUtil {

    public static boolean isFormatted(String cpf) {
        if (cpf == null) return false;
        return cpf.matches("\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}");
    }

    public static String formatCPF(String cpf) {
        if (cpf == null) return "";
        String digitsOnly = cpf.replaceAll("\\D", "");
        if (digitsOnly.length() != 11) return cpf;

        return digitsOnly.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
    }

    public static String validateAndFormatCPF(String cpf) {
        if (isFormatted(cpf)) return cpf;
        return formatCPF(cpf);
    }
}
