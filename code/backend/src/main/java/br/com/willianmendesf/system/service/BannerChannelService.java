package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.BannerException;
import br.com.willianmendesf.system.model.dto.BannerChannelDTO;
import br.com.willianmendesf.system.model.entity.BannerChannel;
import br.com.willianmendesf.system.repository.BannerChannelRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class BannerChannelService {

    private final BannerChannelRepository channelRepository;

    public List<BannerChannelDTO> getAllChannels() {
        try {
            log.info("Getting all banner channels");
            return channelRepository.findAll().stream()
                    .sorted((a, b) -> {
                        int activeCompare = Boolean.compare(b.getIsActive(), a.getIsActive());
                        if (activeCompare != 0) return activeCompare;
                        return Integer.compare(a.getDisplayOrder() != null ? a.getDisplayOrder() : 0,
                                              b.getDisplayOrder() != null ? b.getDisplayOrder() : 0);
                    })
                    .map(BannerChannelDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all banner channels", e);
            throw new BannerException("Erro ao buscar canais", e);
        }
    }

    public List<BannerChannelDTO> getActiveChannels() {
        try {
            log.info("Getting active banner channels");
            return channelRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                    .map(BannerChannelDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting active banner channels", e);
            throw new BannerException("Erro ao buscar canais ativos", e);
        }
    }

    public BannerChannelDTO getChannelById(Long id) {
        try {
            log.info("Getting banner channel by ID: {}", id);
            BannerChannel channel = channelRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + id));
            return new BannerChannelDTO(channel);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting banner channel by ID: {}", id, e);
            throw new BannerException("Erro ao buscar canal", e);
        }
    }

    @Transactional
    public BannerChannelDTO createChannel(BannerChannelDTO dto) {
        try {
            log.info("Creating banner channel");
            
            // Validar nome único
            if (dto.getName() != null && channelRepository.findByName(dto.getName()).isPresent()) {
                throw new BannerException("Já existe um canal com o nome: " + dto.getName());
            }

            BannerChannel channel = new BannerChannel();
            channel.setName(dto.getName());
            channel.setDescription(dto.getDescription());
            channel.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
            channel.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);

            if (channel.getName() == null || channel.getName().trim().isEmpty()) {
                throw new BannerException("Nome do canal é obrigatório");
            }

            BannerChannel saved = channelRepository.save(channel);
            return new BannerChannelDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating banner channel", e);
            throw new BannerException("Erro ao criar canal: " + e.getMessage(), e);
        }
    }

    @Transactional
    public BannerChannelDTO updateChannel(Long id, BannerChannelDTO dto) {
        try {
            log.info("Updating banner channel with ID: {}", id);
            BannerChannel channel = channelRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + id));

            // Validar nome único (se mudou)
            if (dto.getName() != null && !dto.getName().equals(channel.getName())) {
                if (channelRepository.findByName(dto.getName()).isPresent()) {
                    throw new BannerException("Já existe um canal com o nome: " + dto.getName());
                }
            }

            if (dto.getName() != null) channel.setName(dto.getName());
            if (dto.getDescription() != null) channel.setDescription(dto.getDescription());
            if (dto.getIsActive() != null) channel.setIsActive(dto.getIsActive());
            if (dto.getDisplayOrder() != null) channel.setDisplayOrder(dto.getDisplayOrder());

            if (channel.getName() == null || channel.getName().trim().isEmpty()) {
                throw new BannerException("Nome do canal é obrigatório");
            }

            BannerChannel saved = channelRepository.save(channel);
            return new BannerChannelDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating banner channel with ID: {}", id, e);
            throw new BannerException("Erro ao atualizar canal", e);
        }
    }

    @Transactional
    public BannerChannelDTO toggleChannelActive(Long id) {
        try {
            log.info("Toggling active status for banner channel with ID: {}", id);
            BannerChannel channel = channelRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + id));
            
            channel.setIsActive(!channel.getIsActive());
            
            BannerChannel saved = channelRepository.save(channel);
            log.info("Channel {} is now {}", id, saved.getIsActive() ? "active" : "inactive");
            return new BannerChannelDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error toggling active status for banner channel with ID: {}", id, e);
            throw new BannerException("Erro ao alterar status do canal", e);
        }
    }

    @Transactional
    public void deleteChannel(Long id) {
        try {
            log.info("Deleting banner channel with ID: {}", id);
            BannerChannel channel = channelRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + id));

            // Verificar se está em uso
            if (!channel.getConfigs().isEmpty() || !channel.getImages().isEmpty()) {
                throw new BannerException("Não é possível deletar o canal pois ele está associado a configurações ou imagens");
            }

            channelRepository.delete(channel);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting banner channel with ID: {}", id, e);
            throw new BannerException("Erro ao excluir canal", e);
        }
    }
}

