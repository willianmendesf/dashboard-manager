package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true) // Transação no nível da classe para garantir que esteja aberta
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Busque o usuário usando o método com @EntityGraph que carrega profile e permissions
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // 2. FORÇAR A INICIALIZAÇÃO DAS PERMISSÕES (A CORREÇÃO CRÍTICA)
        // Isso "acorda" a coleção de permissões enquanto a transação ainda está aberta.
        // Mesmo com EAGER, é uma boa prática garantir que as permissões sejam carregadas
        // antes que a transação feche, evitando LazyInitializationException
        if (user.getProfile() != null) {
            // Forçar inicialização do profile usando Hibernate.initialize()
            Hibernate.initialize(user.getProfile());
            
            if (user.getProfile().getPermissions() != null) {
                // Forçar inicialização da coleção de permissões usando Hibernate.initialize()
                // Isso garante que todas as permissões sejam carregadas dentro da transação
                Hibernate.initialize(user.getProfile().getPermissions());
                
                // Acessar a coleção para garantir que está totalmente carregada
                int permissionsCount = user.getProfile().getPermissions().size();
                
                // Também iterar sobre as permissões para garantir que todas sejam carregadas
                user.getProfile().getPermissions().forEach(permission -> {
                    // Forçar inicialização de cada permissão
                    Hibernate.initialize(permission);
                    // Acessar propriedades da permissão garante que está totalmente carregada
                    permission.getName();
                });
                
                // Chamar getAuthorities() dentro da transação para garantir que seja executado
                // enquanto a transação está aberta. Isso evita LazyInitializationException
                // quando o Spring Security chamar getAuthorities() depois (ex: em @PreAuthorize)
                Collection<? extends GrantedAuthority> authorities = user.getAuthorities();
                
                log.debug("User loaded: {} with profile: {} and {} permissions (authorities: {})", 
                    username, user.getProfile().getName(), permissionsCount, 
                    authorities.stream()
                        .map(a -> a.getAuthority())
                        .collect(Collectors.joining(", ")));
            } else {
                log.warn("User {} loaded but profile permissions are null", username);
            }
        } else {
            log.warn("User {} loaded but profile is null", username);
        }

        return user; // Agora o objeto User está "completo" com todas as permissões carregadas
    }
}

