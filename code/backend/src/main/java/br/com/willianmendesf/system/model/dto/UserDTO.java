package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserDTO {
    private String name;
    private String email;

    private UserDTO() {}

    public UserDTO(UserEntity user) {
        this.name = user.getName();
        this.email = user.getEmail();
    }
}
