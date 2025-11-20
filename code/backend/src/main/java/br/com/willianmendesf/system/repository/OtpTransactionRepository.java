package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.OtpTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpTransactionRepository extends JpaRepository<OtpTransaction, Long> {

    /**
     * Busca uma transação OTP válida (não usada, não expirada) por telefone e contexto
     */
    @Query("SELECT otp FROM OtpTransaction otp " +
           "WHERE otp.phoneNumber = :phoneNumber " +
           "AND otp.context = :context " +
           "AND otp.used = false " +
           "AND otp.expirationTime > :now " +
           "ORDER BY otp.createdAt DESC")
    Optional<OtpTransaction> findValidTransaction(
            @Param("phoneNumber") String phoneNumber,
            @Param("context") String context,
            @Param("now") LocalDateTime now
    );

    /**
     * Busca uma transação OTP por telefone, contexto e código
     */
    Optional<OtpTransaction> findByPhoneNumberAndContextAndCode(
            String phoneNumber,
            String context,
            String code
    );

    /**
     * Deleta todas as transações expiradas
     */
    void deleteByExpirationTimeBefore(LocalDateTime expirationTime);

    /**
     * Busca todas as transações não usadas para um telefone e contexto
     */
    @Query("SELECT otp FROM OtpTransaction otp " +
           "WHERE otp.phoneNumber = :phoneNumber " +
           "AND otp.context = :context " +
           "AND otp.used = false")
    java.util.List<OtpTransaction> findUnusedTransactions(
            @Param("phoneNumber") String phoneNumber,
            @Param("context") String context
    );
}

