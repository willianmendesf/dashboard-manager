package br.com.willianmendesf.system.service.utils;

public class RGUtil {

    public static boolean isFormatted(String rg) {
        if (rg == null) return false;
        return rg.matches("\\d{2}\\.\\d{3}\\.\\d{3}-[\\dA-Za-z]");
    }

    public static String formatRG(String rg) {
        if (rg == null) return "";
        String alfaNumOnly = rg.replaceAll("[^\\dA-Za-z]", "");
        if (alfaNumOnly.length() != 9) return rg;

        return alfaNumOnly.replaceAll("(\\d{2})(\\d{3})(\\d{3})([\\dA-Za-z])", "$1.$2.$3-$4");
    }

    public static String validateAndFormatRG(String rg) {
        if (isFormatted(rg)) return rg;
        return formatRG(rg);
    }
}
