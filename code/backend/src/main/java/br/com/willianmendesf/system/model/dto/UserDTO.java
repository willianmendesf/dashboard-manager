package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String telefone;
    private String password; // Only used for creation/update
    private String novaSenha; // Only used for update (optional)
    private Boolean enabled;
    private Long profileId;
    private String profileName;
    private List<String> permissions;
    private String fotoUrl;
}
