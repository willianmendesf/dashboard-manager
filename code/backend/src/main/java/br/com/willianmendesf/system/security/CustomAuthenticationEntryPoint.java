package br.com.willianmendesf.system.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom AuthenticationEntryPoint que retorna 401 (Unauthorized) em formato JSON
 * para requisições AJAX/API quando a autenticação é necessária.
 * 
 * Nota: O Spring Security só chama este EntryPoint para rotas que requerem autenticação.
 * Rotas públicas (permitAll) são permitidas antes de chegar aqui.
 */
@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(jakarta.servlet.http.HttpServletRequest request, 
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // Retornar 401 em formato JSON para requisições AJAX/API
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}");
    }
}

