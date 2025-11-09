package br.com.willianmendesf.system.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE) // PRIORIDADE MÁXIMA - intercepta antes do Spring Security
    public CorsFilter corsFilter() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. Defina as origens permitidas
        // IMPORTANTE: Quando allowCredentials é true, não pode usar "*", deve especificar origens
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost",           // Nginx proxy (produção)
            "http://localhost:80",        // Nginx proxy (alternativa)
            "http://localhost:4200",      // Angular dev server
            "http://127.0.0.1",           // Localhost alternativo
            "http://127.0.0.1:4200"       // Localhost alternativo dev
        ));

        // 2. Defina os métodos permitidos
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 3. Defina os headers permitidos
        // IMPORTANTE: Incluir headers necessários para cookies e sessão
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Cache-Control",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));

        // 4. PERMITIR CREDENCIAIS (OBRIGATÓRIO para cookies/sessão)
        // Isso permite que o navegador envie cookies (JSESSIONID) nas requisições
        configuration.setAllowCredentials(true);

        // 5. Headers expostos na resposta (para debug se necessário)
        configuration.setExposedHeaders(Arrays.asList(
            "Set-Cookie",
            "Access-Control-Allow-Credentials",
            "Access-Control-Allow-Origin"
        ));

        // 6. Tempo de cache para preflight (OPTIONS)
        configuration.setMaxAge(3600L); // 1 hora

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Aplica a todas as rotas

        return new CorsFilter(source);
    }
}

