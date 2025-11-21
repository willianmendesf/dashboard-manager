package br.com.willianmendesf.system.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"profile"})
@Table(name = "users_auth")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "name", length = 200)
    private String name;

    @Column(name = "email", unique = true, nullable = false, length = 200)
    private String email;

    @Column(name = "telefone", unique = true, length = 20)
    private String telefone;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(name = "codigo_reset_senha")
    private String codigoResetSenha;

    @Column(name = "codigo_reset_expiracao")
    private java.time.LocalDateTime codigoResetExpiracao;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @Version
    @Column(name = "version")
    private Long version = 0L;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Verificação de null para evitar NullPointerException
        if (profile == null || profile.getPermissions() == null || profile.getPermissions().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        
        // Converter permissões para GrantedAuthority
        return profile.getPermissions().stream()
            .map(permission -> new SimpleGrantedAuthority(permission.getName()))
            .collect(Collectors.toList());
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled != null && enabled;
    }
}

