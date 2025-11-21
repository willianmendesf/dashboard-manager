package br.com.willianmendesf.system.service.utils;

/**
 * Utilitário para operações com telefones
 */
public class PhoneUtil {

    /**
     * Sanitiza o telefone removendo todos os caracteres não numéricos
     * 
     * @param phone Telefone no formato original (pode conter caracteres especiais)
     * @return Telefone sanitizado (apenas números) ou null se o telefone for null/vazio
     */
    public static String sanitize(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return phone.replaceAll("[^0-9]", "");
    }

    /**
     * Valida se o telefone sanitizado é válido (mínimo 10 dígitos)
     * 
     * @param phone Telefone sanitizado
     * @return true se válido, false caso contrário
     */
    public static boolean isValid(String phone) {
        if (phone == null || phone.isBlank()) {
            return false;
        }
        String sanitized = sanitize(phone);
        return sanitized != null && sanitized.length() >= 10;
    }

    /**
     * Sanitiza e valida o telefone
     * 
     * @param phone Telefone no formato original
     * @return Telefone sanitizado se válido, null caso contrário
     */
    public static String sanitizeAndValidate(String phone) {
        String sanitized = sanitize(phone);
        if (sanitized != null && sanitized.length() >= 10) {
            return sanitized;
        }
        return null;
    }

    /**
     * Formata o telefone para o formato WhatsApp (com código do país 55)
     * Exemplo: 11999999999 -> 5511999999999
     * 
     * @param phone Telefone sanitizado (apenas números)
     * @return Telefone formatado para WhatsApp ou null se inválido
     */
    public static String formatForWhatsApp(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        
        String sanitized = sanitize(phone);
        if (sanitized == null || sanitized.length() < 10) {
            return null;
        }
        
        // Se já começa com 55 e tem mais de 12 dígitos, já está formatado
        if (sanitized.startsWith("55") && sanitized.length() > 12) {
            return sanitized;
        }
        
        // Se começa com 55 mas tem menos de 12 dígitos, remove para reformatar
        if (sanitized.startsWith("55")) {
            sanitized = sanitized.substring(2);
        }
        
        // Adiciona código do país 55
        return "55" + sanitized;
    }
}

