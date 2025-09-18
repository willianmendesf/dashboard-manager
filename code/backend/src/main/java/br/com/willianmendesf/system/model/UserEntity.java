package br.com.willianmendesf.system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    private Long id;
    private String username;
    private String name;
    private String email;
    private String password;
    private String roles;
    private String dtype = null;

    public UserEntity() { }

    @Override
    public String toString() {
        return "People {name=" + name +  ", email=" + email + '}';
    }
}
