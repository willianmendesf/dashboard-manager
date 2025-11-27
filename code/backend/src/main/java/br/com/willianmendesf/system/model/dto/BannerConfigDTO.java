package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.BannerChannel;
import br.com.willianmendesf.system.model.entity.BannerConfig;
import br.com.willianmendesf.system.model.enums.BannerType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.Hibernate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerConfigDTO {
    private Long id;
    private BannerType type;
    private LocalTime startTime;
    private LocalTime endTime;
    private String title;
    private String youtubeUrl;
    private Boolean isActive;
    private Integer order;
    private Boolean muted;
    private LocalDate specificDate;
    private Boolean isRecurring;
    private List<Long> channelIds;
    private List<String> channelNames; // Nomes dos canais para exibição

    public BannerConfigDTO(BannerConfig config) {
        this.id = config.getId();
        this.type = config.getType();
        this.startTime = config.getStartTime();
        this.endTime = config.getEndTime();
        this.title = config.getTitle();
        this.youtubeUrl = config.getYoutubeUrl();
        this.isActive = config.getIsActive();
        this.order = config.getOrder();
        this.muted = config.getMuted();
        this.specificDate = config.getSpecificDate();
        this.isRecurring = config.getIsRecurring();
        
        // Acessar canais de forma segura para evitar ConcurrentModificationException
        // Não acessar a coleção se ela não estiver totalmente inicializada
        this.channelIds = null;
        try {
            if (config.getChannels() != null && Hibernate.isInitialized(config.getChannels())) {
                // Verificar se a coleção não está vazia antes de tentar acessar
                if (!config.getChannels().isEmpty()) {
                    List<Long> ids = new ArrayList<>();
                    // Usar toArray() para criar uma cópia segura antes de iterar
                    BannerChannel[] channelsArray = config.getChannels().toArray(new BannerChannel[0]);
                    for (BannerChannel channel : channelsArray) {
                        if (channel != null && channel.getId() != null) {
                            ids.add(channel.getId());
                        }
                    }
                    if (!ids.isEmpty()) {
                        this.channelIds = ids;
                    }
                }
            }
        } catch (ConcurrentModificationException | IllegalStateException e) {
            // Coleção está sendo modificada ou não está pronta - ignorar silenciosamente
            this.channelIds = null;
        } catch (Exception e) {
            // Qualquer outro erro - ignorar silenciosamente
            this.channelIds = null;
        }
    }
}

