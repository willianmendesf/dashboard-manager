package br.com.willianmendesf.system.model.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberGroupId implements Serializable {
    private Long member;
    private Long group;
}

