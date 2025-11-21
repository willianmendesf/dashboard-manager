package br.com.willianmendesf.system.service.otp;

/**
 * Interface para providers de OTP que implementam validação específica por contexto.
 * Permite que diferentes módulos (Membros, Admins, Leads) implementem sua própria lógica
 * de validação de telefone sem acoplar o sistema de OTP a tabelas específicas.
 */
public interface OtpUserProvider {

    /**
     * Retorna a chave única deste contexto (ex: "MEMBER_PORTAL", "ADMIN_LOGIN")
     * @return A chave única do contexto
     */
    String getContextKey();

    /**
     * Verifica se o telefone existe na base de dados específica deste contexto
     * e se pode receber OTP.
     * 
     * @param phoneNumber Telefone sanitizado (apenas números)
     * @return true se o usuário existir e puder receber OTP, false caso contrário
     */
    boolean canReceiveOtp(String phoneNumber);
}

