package br.com.willianmendesf.system.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class People {
    private String name;
    private String email;
    private Integer room;

    @Override
    public String toString() {
        return "People {name=" + name +  ", email=" + email + ", room=" + room + '}';
    }
}
