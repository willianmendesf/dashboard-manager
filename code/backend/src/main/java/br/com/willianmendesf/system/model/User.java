package br.com.willianmendesf.system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    private Long id;
    private String name;
    private String email;
    private String password;
    private String dtype = null;

    public User() { }

    @Override
    public String toString() {
        return "People {name=" + name +  ", email=" + email + '}';
    }
}
