package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.GroupEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupDTO {
    private Long id;
    private String nome;
    private String descricao;
    private Long memberCount;

    public GroupDTO(GroupEntity group) {
        this.id = group.getId();
        this.nome = group.getNome();
        this.descricao = group.getDescricao();
        this.memberCount = group.getMembers() != null ? (long) group.getMembers().size() : 0L;
    }

    public GroupDTO(GroupEntity group, Long memberCount) {
        this.id = group.getId();
        this.nome = group.getNome();
        this.descricao = group.getDescricao();
        this.memberCount = memberCount != null ? memberCount : 0L;
    }
}

