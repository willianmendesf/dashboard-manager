package br.com.willianmendesf.system.model.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class WhatsappGroup {
    private String jid;
    private String name;
}
