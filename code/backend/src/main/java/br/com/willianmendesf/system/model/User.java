package br.com.willianmendesf.system.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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

    public User() { }

    @Override
    public String toString() {
        return "People {name=" + name +  ", email=" + email + '}';
    }
}
