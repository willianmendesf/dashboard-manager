package br.com.willianmendesf.system.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "member_groups")
@IdClass(MemberGroupId.class)
public class MemberGroup implements Serializable {

    @Id
    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private MemberEntity member;

    @Id
    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private GroupEntity group;
}

