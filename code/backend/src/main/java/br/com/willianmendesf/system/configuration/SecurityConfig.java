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
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import br.com.willianmendesf.system.security.CustomAuthenticationEntryPoint;

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

    // Bean para SecurityContextRepository - garante que a sessão seja persistida
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    // Bean para CustomAuthenticationEntryPoint - retorna 401 apenas para rotas protegidas
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint = new CustomAuthenticationEntryPoint();

    // Bean da Cadeia de Filtros de Segurança (Onde tudo é amarrado)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. O WebConfig.java (CorsFilter) já cuida do CORS com prioridade máxima

            // 2. FORÇAR A DESABILITAÇÃO DO CSRF (CRÍTICO PARA API JSON)
            // O CSRF está desabilitado porque usamos autenticação via cookie/sessão stateful
            // e todas as requisições são via API JSON (não formulários HTML tradicionais)
            .csrf(csrf -> csrf.disable())

            // 3. CONFIGURAR GERENCIAMENTO DE SESSÃO (CRÍTICO - CRIA JSESSIONID)
            // ALWAYS: Spring Security sempre cria uma sessão HTTP se ela não existir
            // Isso garante que o cookie JSESSIONID seja criado no login
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                .maximumSessions(1) // Permite apenas uma sessão por usuário
                .maxSessionsPreventsLogin(false) // Permite login mesmo com sessão existente
            )

            // 3.5. CONFIGURAR TRATAMENTO DE EXCEÇÕES (CRÍTICO PARA API JSON)
            // Retorna 401 (Unauthorized) apenas para rotas protegidas
            // Rotas públicas não devem retornar 401, devem ser permitidas normalmente
            // Isso permite que o interceptor do Angular detecte a expiração da sessão
            .exceptionHandling(e -> e
                .authenticationEntryPoint(customAuthenticationEntryPoint)
            )

            // 4. AUTORIZE AS REQUISIÇÕES
            .authorizeHttpRequests(authorize -> authorize
                // 4a. Permita rotas públicas de autenticação
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/logout").permitAll()
                .requestMatchers("/auth/solicitar-reset").permitAll()
                .requestMatchers("/auth/redefinir-senha").permitAll()

                // 4b. Permita outras rotas públicas essenciais
                .requestMatchers("/emergency/**").permitAll()
                .requestMatchers("/usuarios/registro").permitAll()
                .requestMatchers("/files/**").permitAll()
                .requestMatchers("/public/**").permitAll() // Portal público de atualização cadastral, visitantes e empréstimos
                .requestMatchers("/enrollments/request").permitAll() // Solicitação de participação em grupos (público)
                .requestMatchers("/enrollments/member/**").permitAll() // Consulta de enrollments do membro (público)
                .requestMatchers("/enrollments/can-request/**").permitAll() // Verificar se pode solicitar novamente (público)
                
                // 4d. Rotas públicas de presença (lista de presença pública)
                // IMPORTANTE: getServletPath() retorna apenas a parte após o context-path
                // Como context-path é /api/v1, para /api/v1/events o servletPath é /events
                .requestMatchers(request -> {
                    String path = request.getServletPath();
                    return path != null && (path.equals("/events") || path.startsWith("/events?"));
                }).permitAll() // Listar eventos (público) - com ou sem query params
                .requestMatchers("/attendance/toggle").permitAll() // Toggle presença (público)
                .requestMatchers(request -> {
                    String path = request.getServletPath();
                    return path != null && path.matches("/attendance/event/\\d+/members");
                }).permitAll() // Listar membros por evento (público)

                // 4c. Exija autenticação para todo o resto
                .anyRequest().authenticated()
            )

            // 5. Configure o authentication provider
            .authenticationProvider(authenticationProvider())

            // 6. CONFIGURE O LOGOUT
            .logout(logout -> logout
                .logoutUrl("/auth/logout")
                .deleteCookies("JSESSIONID") // Limpa o cookie de sessão
                .invalidateHttpSession(true) // Invalida a sessão HTTP
                .clearAuthentication(true) // Limpa a autenticação
                .logoutSuccessHandler((req, res, auth) -> res.setStatus(HttpServletResponse.SC_OK))
            );

        return http.build();
    }
}
