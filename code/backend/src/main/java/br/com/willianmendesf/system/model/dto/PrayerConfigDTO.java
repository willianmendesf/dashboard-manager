package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrayerConfigDTO {
    private Integer maxPorIntercessor = 3;
    private Integer maxCriancasPorIntercessor = 1;
    private Integer limiteFlexivel = 5;
    private ResetAntecipadoConfig resetAntecipado = new ResetAntecipadoConfig();
    private Boolean modoDesenvolvimento = false;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetAntecipadoConfig {
        private Boolean habilitado = false;
        private String tipo = "fixo"; // fixo, dinamico, proporcional
        private Integer quantidade = 3;
        private Integer limiteProximidade = 30;
        private Double limiteDistribuicao = 0.9;
        private Integer maxTentativas = 1;
        private Boolean tentativasHabilitadas = false;
    }
}

