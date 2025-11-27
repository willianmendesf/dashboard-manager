package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.BannerImage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.Hibernate;

import br.com.willianmendesf.system.model.entity.BannerChannel;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerImageDTO {
    private Long id;
    private String title;
    private String imageUrl;
    private Boolean active;
    private Integer displayOrder;
    private Integer transitionDurationSeconds;
    private List<Long> channelIds;
    private List<String> channelNames; // Nomes dos canais para exibição

    public BannerImageDTO(BannerImage image) {
        this.id = image.getId();
        this.title = image.getTitle();
        this.imageUrl = image.getImageUrl();
        this.active = image.getActive();
        this.displayOrder = image.getDisplayOrder();
        this.transitionDurationSeconds = image.getTransitionDurationSeconds();
        // Não acessar canais no construtor para evitar ConcurrentModificationException
        // Os canais serão carregados separadamente no service
        this.channelIds = null;
    }
    
    /**
     * Método auxiliar para popular os channelIds de forma segura
     * Deve ser chamado após a coleção estar totalmente inicializada
     */
    public void setChannelIdsFromEntity(BannerImage image) {
        this.channelIds = null;
        try {
            if (image.getChannels() != null && Hibernate.isInitialized(image.getChannels())) {
                List<Long> ids = new ArrayList<>();
                // Usar toArray() para criar uma cópia segura antes de iterar
                BannerChannel[] channelsArray = image.getChannels().toArray(new BannerChannel[0]);
                for (BannerChannel channel : channelsArray) {
                    if (channel != null && channel.getId() != null) {
                        ids.add(channel.getId());
                    }
                }
                if (!ids.isEmpty()) {
                    this.channelIds = ids;
                }
            }
        } catch (Exception e) {
            // Ignorar silenciosamente qualquer erro
            this.channelIds = null;
        }
    }
}

