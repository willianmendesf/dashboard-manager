package br.com.willianmendesf.system.configuration;

import br.com.willianmendesf.system.service.CustomUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Habilita @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    // Bean para criptografar senhas
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Bean para o seu AuthController customizado
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // Bean para AuthenticationProvider (necessário para CustomUserDetailsService)
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // REMOVIDO: @Bean CorsConfigurationSource - Agora está no WebConfig.java com prioridade máxima

    // Bean da Cadeia de Filtros de Segurança (Onde tudo é amarrado)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. O WebConfig.java (CorsFilter) já cuida do CORS com prioridade máxima

            // 2. FORÇAR A DESABILITAÇÃO DO CSRF (CRÍTICO PARA API JSON - CORREÇÃO DO 403)
            // O CSRF está EXPLICITAMENTE desabilitado porque:
            // - Usamos autenticação via cookie/sessão (stateful)
            // - Todas as requisições são via API JSON (não formulários HTML)
            // - O CSRF é necessário apenas para formulários HTML tradicionais
            // SEM esta linha, o Spring Security ativa CSRF por padrão em modo stateful
            .csrf(csrf -> csrf.disable())

            // 3. AUTORIZE AS REQUISIÇÕES
            .authorizeHttpRequests(authorize -> authorize
                // 3a. CORS e OPTIONS são gerenciados exclusivamente pelo WebConfig.java (CorsFilter com HIGHEST_PRECEDENCE)
                // Não precisamos de regra de OPTIONS aqui para evitar conflitos

                // 3b. Permita rotas públicas de autenticação
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/logout").permitAll()
                .requestMatchers("/auth/solicitar-reset").permitAll()
                .requestMatchers("/auth/redefinir-senha").permitAll()

                // 3c. Permita outras rotas públicas essenciais
                .requestMatchers("/emergency/**").permitAll()
                .requestMatchers("/usuarios/registro").permitAll()
                .requestMatchers("/files/**").permitAll()

                // 3d. Exija autenticação para todo o resto
                .anyRequest().authenticated()
            )

            // 4. Configure o authentication provider
            .authenticationProvider(authenticationProvider())

            // 5. CONFIGURE O LOGOUT (O Spring cuida disso)
            .logout(logout -> logout
                .logoutUrl("/auth/logout")
                .deleteCookies("JSESSIONID") // Limpa o cookie
                .invalidateHttpSession(true)
                .logoutSuccessHandler((req, res, auth) -> res.setStatus(HttpServletResponse.SC_OK))
            );

        // NÃO USAMOS .formLogin() (porque você tem um AuthController)
        // NÃO USAMOS .addFilterBefore() (porque não temos JWT)
        // NÃO USAMOS .sessionManagement(STATELESS) (porque queremos sessões stateful)
        // NÃO USAMOS .cors() (porque agora está no WebConfig.java com prioridade máxima)

        return http.build();
    }
}
