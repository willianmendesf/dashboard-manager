package br.com.willianmendesf.system.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class WebConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE) // PRIORIDADE MÁXIMA - intercepta antes do Spring Security
    public CorsFilter corsFilter() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. Defina as origens permitidas
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost",       // Apache
            "http://localhost:4200"   // Angular 'ng serve'
        ));

        // 2. Defina os métodos permitidos
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 3. Defina os headers permitidos
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type"));

        // 4. PERMITIR CREDENCIAIS (A CAUSA DO 403 OK)
        // Isso é OBRIGATÓRIO para Sessão/Cookie
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Aplica a todas as rotas

        return new CorsFilter(source);
    }
}

