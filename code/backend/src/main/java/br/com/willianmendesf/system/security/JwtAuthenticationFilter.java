package br.com.willianmendesf.system.security;

import br.com.willianmendesf.system.service.CustomUserDetailsService;
import br.com.willianmendesf.system.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// DESABILITADO: Este filtro não é mais necessário pois o sistema usa autenticação baseada em sessão HTTP (JSESSIONID)
// Mantido apenas para referência. Para reativar, descomente @Component abaixo.
// @Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getServletPath();
        
        // 1. PULAR ROTAS PÚBLICAS DE AUTENTICAÇÃO (CRÍTICO)
        // O filtro não deve processar rotas de login, reset de senha, etc.
        if (path.startsWith("/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // 2. PULAR ROTAS PÚBLICAS ADICIONAIS
        if (path.startsWith("/emergency/") || 
            path.startsWith("/files/") || 
            path.equals("/usuarios/registro")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // 3. PULAR REQUISIÇÕES OPTIONS (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // 4. LÓGICA NORMAL DO FILTRO (pegar token, validar, etc.)
        String token = getTokenFromRequest(request);
        
        if (StringUtils.hasText(token)) {
            log.debug("JWT token found for request: {}", request.getRequestURI());
            try {
                String username = jwtService.extractUsername(token);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    
                    if (jwtService.validateToken(token, userDetails)) {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.debug("JWT authentication successful for user: {}", username);
                    } else {
                        log.warn("JWT token validation failed for user: {}", username);
                    }
                }
            } catch (Exception e) {
                log.warn("JWT token validation failed: {}", e.getMessage());
            }
        } else {
            // Remover o log de warning para rotas que não precisam de token
            // (já foram filtradas acima, mas manter para debug se necessário)
            log.debug("No JWT token found for request: {} {}", request.getMethod(), request.getRequestURI());
        }
        
        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

