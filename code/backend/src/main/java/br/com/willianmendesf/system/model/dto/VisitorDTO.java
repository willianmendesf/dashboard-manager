package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.VisitorEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AccessLevel;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class VisitorDTO {
    private Long id;
    private String nomeCompleto;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataVisita;
    private String telefone;
    private String jaFrequentaIgreja;
    private String nomeIgreja;
    private String procuraIgreja;
    
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private Boolean eDeSP;
    
    @JsonGetter("eDeSP")
    public Boolean getEDeSP() {
        return eDeSP;
    }
    
    @JsonSetter("eDeSP")
    public void setEDeSP(Boolean eDeSP) {
        this.eDeSP = eDeSP;
    }
    private String estado;
    private String fotoUrl;
    private Integer age;
    private Long mainVisitorId;
    private String relationship;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    public VisitorDTO(VisitorEntity visitor) {
        this.id = visitor.getId();
        this.nomeCompleto = visitor.getNomeCompleto();
        this.dataVisita = visitor.getDataVisita();
        this.telefone = visitor.getTelefone();
        this.jaFrequentaIgreja = visitor.getJaFrequentaIgreja();
        this.nomeIgreja = visitor.getNomeIgreja();
        this.procuraIgreja = visitor.getProcuraIgreja();
        this.eDeSP = visitor.getEDeSP();
        this.estado = visitor.getEstado();
        this.fotoUrl = visitor.getFotoUrl();
        this.age = visitor.getAge();
        this.mainVisitorId = visitor.getMainVisitor() != null ? visitor.getMainVisitor().getId() : null;
        this.relationship = visitor.getRelationship();
        this.createdAt = visitor.getCreatedAt();
        this.updatedAt = visitor.getUpdatedAt();
    }
}

