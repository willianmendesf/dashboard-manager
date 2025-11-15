package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.PrayerPerson;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrayerPersonDTO {
    private Long id;
    private String nome;
    private String celular;
    private PrayerPerson.PersonType tipo;
    private Boolean isIntercessor;
    private Boolean isExternal;
    private Long memberId;
    private String nomePai;
    private String telefonePai;
    private String nomeMae;
    private String telefoneMae;
    private List<Map<String, String>> responsaveis;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private MemberDTO memberData; // Dados do membro se vinculado
}

