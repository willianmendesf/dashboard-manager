package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String status;
    private String role;
//    private String created;

    private UserDTO() {}

    public UserDTO(UserEntity user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.name = user.getName();
        this.email = user.getEmail();
        this.status = user.getStatus() == true ? "active" : "inactive";;
        this.role = user.getRoles();
//        this.created = user.getCreated();
    }
}
