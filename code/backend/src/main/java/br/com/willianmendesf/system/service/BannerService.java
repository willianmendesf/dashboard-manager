package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.BannerException;
import br.com.willianmendesf.system.model.dto.BannerConfigDTO;
import br.com.willianmendesf.system.model.dto.BannerCurrentStateDTO;
import br.com.willianmendesf.system.model.dto.BannerImageDTO;
import br.com.willianmendesf.system.model.entity.BannerChannel;
import br.com.willianmendesf.system.model.entity.BannerConfig;
import br.com.willianmendesf.system.model.entity.BannerImage;
import br.com.willianmendesf.system.model.enums.BannerType;
import br.com.willianmendesf.system.repository.BannerChannelRepository;
import br.com.willianmendesf.system.repository.BannerConfigRepository;
import br.com.willianmendesf.system.repository.BannerImageRepository;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class BannerService {

    private final BannerConfigRepository configRepository;
    private final BannerImageRepository imageRepository;
    private final BannerChannelRepository channelRepository;
    private final StorageService storageService;

    public BannerCurrentStateDTO getCurrentState(Long channelId) {
        try {
            LocalTime currentTime = LocalTime.now();
            LocalDate currentDate = LocalDate.now();
            log.debug("Getting current banner state for time: {}, date: {}, channelId: {}", currentTime, currentDate, channelId);

            // Buscar configuração ativa para o horário atual, considerando data e canal
            BannerConfig activeConfig = configRepository.findActiveByTimeAndChannelAndDate(
                    currentTime, currentDate, channelId).orElse(null);

            BannerCurrentStateDTO state = new BannerCurrentStateDTO();
            state.setChannelId(channelId);

            if (activeConfig != null && activeConfig.getType() == BannerType.VIDEO_YOUTUBE) {
                // Modo VIDEO
                state.setMode("VIDEO");
                state.setVideoUrl(activeConfig.getYoutubeUrl());
                state.setMuted(activeConfig.getMuted());
                state.setImages(null);
                log.debug("Current state: VIDEO - {}", activeConfig.getYoutubeUrl());
            } else {
                // Modo SLIDE (default ou se não houver config ativa)
                state.setMode("SLIDE");
                state.setVideoUrl(null);
                state.setMuted(null);
                List<BannerImage> activeImages = imageRepository.findByActiveTrueAndChannelsIdOrderByDisplayOrderAsc(channelId);
                
                // Criar DTOs primeiro sem acessar canais
                List<BannerImageDTO> imageDTOs = activeImages.stream()
                        .map(BannerImageDTO::new)
                        .collect(Collectors.toList());
                
                // Depois, inicializar e popular canais de forma segura (se necessário)
                // Por enquanto, deixamos channelIds como null para evitar ConcurrentModificationException
                // Os canais podem ser carregados em uma chamada separada se necessário
                state.setImages(imageDTOs);
                log.debug("Current state: SLIDE - {} images", imageDTOs.size());
            }

            return state;
        } catch (ConcurrentModificationException e) {
            // Erro de concorrência ao acessar coleções lazy - retornar estado vazio
            log.debug("Concurrent modification while loading banner state (channelId: {}), returning empty state", channelId);
            BannerCurrentStateDTO state = new BannerCurrentStateDTO();
            state.setChannelId(channelId);
            state.setMode("SLIDE");
            state.setImages(new ArrayList<>());
            return state;
        } catch (Exception e) {
            log.error("Error getting current banner state", e);
            throw new BannerException("Erro ao obter estado atual dos banners", e);
        }
    }

    public List<BannerConfigDTO> getAllConfigs() {
        try {
            log.info("Getting all banner configs");
            // Retornar TODAS as configurações (ativas e inativas) ordenadas
            List<BannerConfig> configs = configRepository.findAll();
            
            // Criar DTOs primeiro sem acessar canais
            List<BannerConfigDTO> dtos = configs.stream()
                    .sorted((a, b) -> {
                        // Ordenar por: ativo primeiro, depois por order, depois por startTime
                        int activeCompare = Boolean.compare(b.getIsActive(), a.getIsActive());
                        if (activeCompare != 0) return activeCompare;
                        int orderCompare = Integer.compare(a.getOrder() != null ? a.getOrder() : 0, 
                                                          b.getOrder() != null ? b.getOrder() : 0);
                        if (orderCompare != 0) return orderCompare;
                        return a.getStartTime().compareTo(b.getStartTime());
                    })
                    .map(BannerConfigDTO::new)
                    .collect(Collectors.toList());
            
            // Carregar nomes dos canais de forma segura usando uma query separada
            List<BannerChannel> allChannels = channelRepository.findAll();
            for (int i = 0; i < configs.size(); i++) {
                BannerConfig config = configs.get(i);
                BannerConfigDTO dto = dtos.get(i);
                
                // Buscar canais associados usando uma query nativa para evitar problemas de lazy loading
                try {
                    List<Long> channelIds = configRepository.findChannelIdsByConfigId(config.getId());
                    if (channelIds != null && !channelIds.isEmpty()) {
                        dto.setChannelIds(channelIds);
                        // Mapear IDs para nomes
                        List<String> channelNames = allChannels.stream()
                                .filter(ch -> channelIds.contains(ch.getId()))
                                .map(BannerChannel::getName)
                                .collect(Collectors.toList());
                        dto.setChannelNames(channelNames);
                    } else {
                        // Se não tem canais específicos, está em todos
                        dto.setChannelIds(null);
                        dto.setChannelNames(List.of("Todos"));
                    }
                } catch (Exception e) {
                    log.debug("Could not load channels for config {}: {}", config.getId(), e.getMessage());
                    dto.setChannelNames(List.of("Todos")); // Default para "Todos" em caso de erro
                }
            }
            
            return dtos;
        } catch (ConcurrentModificationException e) {
            // Erro de concorrência - retornar lista vazia
            log.debug("Concurrent modification while loading configs, returning empty list");
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Error getting all banner configs", e);
            throw new BannerException("Erro ao buscar configurações de banners", e);
        }
    }

    public BannerConfigDTO getConfigById(Long id) {
        try {
            log.info("Getting banner config by ID: {}", id);
            BannerConfig config = configRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Configuração não encontrada com ID: " + id));
            
            BannerConfigDTO dto = new BannerConfigDTO(config);
            
            // Carregar nomes dos canais de forma segura
            try {
                List<Long> channelIds = configRepository.findChannelIdsByConfigId(id);
                if (channelIds != null && !channelIds.isEmpty()) {
                    dto.setChannelIds(channelIds);
                    List<BannerChannel> allChannels = channelRepository.findAll();
                    List<String> channelNames = allChannels.stream()
                            .filter(ch -> channelIds.contains(ch.getId()))
                            .map(BannerChannel::getName)
                            .collect(Collectors.toList());
                    dto.setChannelNames(channelNames);
                } else {
                    dto.setChannelIds(null);
                    dto.setChannelNames(List.of("Todos"));
                }
            } catch (Exception e) {
                log.debug("Could not load channels for config {}: {}", id, e.getMessage());
                dto.setChannelNames(List.of("Todos"));
            }
            
            return dto;
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting banner config by ID: {}", id, e);
            throw new BannerException("Erro ao buscar configuração", e);
        }
    }

    @Transactional
    public BannerConfigDTO createConfig(BannerConfigDTO dto) {
        try {
            log.info("Creating banner config");
            BannerConfig config = new BannerConfig();
            config.setType(dto.getType());
            config.setStartTime(dto.getStartTime());
            config.setEndTime(dto.getEndTime());
            config.setTitle(dto.getTitle());
            config.setYoutubeUrl(dto.getYoutubeUrl());
            config.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
            config.setOrder(dto.getOrder() != null ? dto.getOrder() : 0);
            config.setMuted(dto.getMuted() != null ? dto.getMuted() : false);
            config.setSpecificDate(dto.getSpecificDate());
            config.setIsRecurring(dto.getIsRecurring() != null ? dto.getIsRecurring() : true);

            // Validação básica
            if (config.getStartTime().isAfter(config.getEndTime())) {
                throw new BannerException("Horário de início deve ser anterior ao horário de fim");
            }

            if (config.getType() == BannerType.VIDEO_YOUTUBE && 
                (config.getYoutubeUrl() == null || config.getYoutubeUrl().trim().isEmpty())) {
                throw new BannerException("URL do YouTube é obrigatória para tipo VIDEO_YOUTUBE");
            }

            // Validação de data específica
            if (config.getIsRecurring() == false && config.getSpecificDate() == null) {
                throw new BannerException("Data específica é obrigatória quando não é recorrente");
            }
            if (config.getIsRecurring() == true && config.getSpecificDate() != null) {
                throw new BannerException("Data específica não deve ser informada quando é recorrente");
            }

            // Salvar a configuração primeiro para obter o ID
            BannerConfig saved = configRepository.save(config);

            // Associar canais após salvar (para garantir que a configuração tenha ID)
            if (dto.getChannelIds() != null && !dto.getChannelIds().isEmpty()) {
                Set<BannerChannel> channels = new HashSet<>();
                for (Long channelId : dto.getChannelIds()) {
                    BannerChannel channel = channelRepository.findById(channelId)
                            .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + channelId));
                    channels.add(channel);
                }
                saved.setChannels(channels);
                saved = configRepository.save(saved); // Salvar novamente com os canais associados
            }

            return new BannerConfigDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating banner config", e);
            throw new BannerException("Erro ao criar configuração: " + e.getMessage(), e);
        }
    }

    @Transactional
    public BannerConfigDTO updateConfig(Long id, BannerConfigDTO dto) {
        try {
            log.info("Updating banner config with ID: {}", id);
            BannerConfig config = configRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Configuração não encontrada com ID: " + id));

            if (dto.getType() != null) config.setType(dto.getType());
            if (dto.getStartTime() != null) config.setStartTime(dto.getStartTime());
            if (dto.getEndTime() != null) config.setEndTime(dto.getEndTime());
            if (dto.getTitle() != null) config.setTitle(dto.getTitle());
            if (dto.getYoutubeUrl() != null) config.setYoutubeUrl(dto.getYoutubeUrl());
            if (dto.getIsActive() != null) config.setIsActive(dto.getIsActive());
            if (dto.getOrder() != null) config.setOrder(dto.getOrder());
            if (dto.getMuted() != null) config.setMuted(dto.getMuted());
            if (dto.getSpecificDate() != null) config.setSpecificDate(dto.getSpecificDate());
            if (dto.getIsRecurring() != null) config.setIsRecurring(dto.getIsRecurring());

            // Validação
            if (config.getStartTime().isAfter(config.getEndTime())) {
                throw new BannerException("Horário de início deve ser anterior ao horário de fim");
            }

            if (config.getType() == BannerType.VIDEO_YOUTUBE && 
                (config.getYoutubeUrl() == null || config.getYoutubeUrl().trim().isEmpty())) {
                throw new BannerException("URL do YouTube é obrigatória para tipo VIDEO_YOUTUBE");
            }

            // Validação de data específica
            if (config.getIsRecurring() == false && config.getSpecificDate() == null) {
                throw new BannerException("Data específica é obrigatória quando não é recorrente");
            }
            if (config.getIsRecurring() == true && config.getSpecificDate() != null) {
                throw new BannerException("Data específica não deve ser informada quando é recorrente");
            }

            // Atualizar canais
            if (dto.getChannelIds() != null) {
                // Deletar associações antigas primeiro usando query nativa para evitar problemas com lazy loading
                configRepository.deleteConfigChannelAssociations(id);
                
                // Criar nova coleção com os canais selecionados
                Set<BannerChannel> channels = new HashSet<>();
                if (!dto.getChannelIds().isEmpty()) {
                    for (Long channelId : dto.getChannelIds()) {
                        BannerChannel channel = channelRepository.findById(channelId)
                                .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + channelId));
                        channels.add(channel);
                    }
                }
                // Setar a nova coleção - o JPA vai gerenciar as novas associações
                config.setChannels(channels);
            }

            BannerConfig saved = configRepository.save(config);
            return new BannerConfigDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating banner config with ID: {}", id, e);
            throw new BannerException("Erro ao atualizar configuração", e);
        }
    }

    @Transactional
    public BannerConfigDTO toggleConfigActive(Long id) {
        try {
            log.info("Toggling active status for banner config with ID: {}", id);
            BannerConfig config = configRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Configuração não encontrada com ID: " + id));
            
            // Alternar status ativo/inativo
            config.setIsActive(!config.getIsActive());
            
            BannerConfig saved = configRepository.save(config);
            log.info("Config {} is now {}", id, saved.getIsActive() ? "active" : "inactive");
            return new BannerConfigDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error toggling active status for banner config with ID: {}", id, e);
            throw new BannerException("Erro ao alterar status da configuração", e);
        }
    }

    @Transactional
    public void deleteConfig(Long id) {
        try {
            log.info("Deleting banner config with ID: {}", id);
            BannerConfig config = configRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Configuração não encontrada com ID: " + id));
            
            // Deletar associações ManyToMany diretamente da tabela de junção
            configRepository.deleteConfigChannelAssociations(id);
            
            configRepository.delete(config);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting banner config with ID: {}", id, e);
            throw new BannerException("Erro ao excluir configuração", e);
        }
    }

    public List<BannerImageDTO> getAllImages(Long channelId) {
        try {
            log.info("Getting all banner images for channelId: {}", channelId);
            List<BannerImage> images;
            if (channelId != null) {
                images = imageRepository.findByActiveTrueAndChannelsIdOrderByDisplayOrderAsc(channelId);
            } else {
                images = imageRepository.findByActiveTrueOrderByDisplayOrderAsc();
            }
            
            // Criar DTOs primeiro sem acessar canais
            List<BannerImageDTO> dtos = images.stream()
                    .map(BannerImageDTO::new)
                    .collect(Collectors.toList());
            
            // Carregar nomes dos canais de forma segura usando uma query separada
            List<BannerChannel> allChannels = channelRepository.findAll();
            for (int i = 0; i < images.size(); i++) {
                BannerImage image = images.get(i);
                BannerImageDTO dto = dtos.get(i);
                
                // Buscar canais associados usando uma query nativa para evitar problemas de lazy loading
                try {
                    List<Long> channelIds = imageRepository.findChannelIdsByImageId(image.getId());
                    if (channelIds != null && !channelIds.isEmpty()) {
                        dto.setChannelIds(channelIds);
                        // Mapear IDs para nomes
                        List<String> channelNames = allChannels.stream()
                                .filter(ch -> channelIds.contains(ch.getId()))
                                .map(BannerChannel::getName)
                                .collect(Collectors.toList());
                        dto.setChannelNames(channelNames);
                    } else {
                        // Se não tem canais específicos, está em todos
                        dto.setChannelIds(null);
                        dto.setChannelNames(List.of("Todos"));
                    }
                } catch (Exception e) {
                    log.debug("Could not load channels for image {}: {}", image.getId(), e.getMessage());
                    dto.setChannelNames(List.of("Todos")); // Default para "Todos" em caso de erro
                }
            }
            
            return dtos;
        } catch (ConcurrentModificationException e) {
            // Erro de concorrência - retornar lista vazia
            log.debug("Concurrent modification while loading images (channelId: {}), returning empty list", channelId);
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Error getting all banner images", e);
            throw new BannerException("Erro ao buscar imagens", e);
        }
    }

    public BannerImageDTO getImageById(Long id) {
        try {
            log.info("Getting banner image by ID: {}", id);
            BannerImage image = imageRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Imagem não encontrada com ID: " + id));
            
            BannerImageDTO dto = new BannerImageDTO(image);
            
            // Carregar nomes dos canais de forma segura
            try {
                List<Long> channelIds = imageRepository.findChannelIdsByImageId(id);
                if (channelIds != null && !channelIds.isEmpty()) {
                    dto.setChannelIds(channelIds);
                    List<BannerChannel> allChannels = channelRepository.findAll();
                    List<String> channelNames = allChannels.stream()
                            .filter(ch -> channelIds.contains(ch.getId()))
                            .map(BannerChannel::getName)
                            .collect(Collectors.toList());
                    dto.setChannelNames(channelNames);
                } else {
                    dto.setChannelIds(null);
                    dto.setChannelNames(List.of("Todos"));
                }
            } catch (Exception e) {
                log.debug("Could not load channels for image {}: {}", id, e.getMessage());
                dto.setChannelNames(List.of("Todos"));
            }
            
            return dto;
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting banner image by ID: {}", id, e);
            throw new BannerException("Erro ao buscar imagem", e);
        }
    }

    @Transactional
    public BannerImageDTO createImage(BannerImageDTO dto) {
        try {
            log.info("Creating banner image");
            BannerImage image = new BannerImage();
            image.setTitle(dto.getTitle());
            image.setImageUrl(dto.getImageUrl());
            image.setActive(dto.getActive() != null ? dto.getActive() : true);
            image.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
            image.setTransitionDurationSeconds(dto.getTransitionDurationSeconds() != null ? dto.getTransitionDurationSeconds() : 10);

            if (image.getImageUrl() == null || image.getImageUrl().trim().isEmpty()) {
                throw new BannerException("URL da imagem é obrigatória");
            }

            // Salvar a imagem primeiro para obter o ID
            BannerImage saved = imageRepository.save(image);

            // Associar canais após salvar (para garantir que a imagem tenha ID)
            if (dto.getChannelIds() != null && !dto.getChannelIds().isEmpty()) {
                Set<BannerChannel> channels = new HashSet<>();
                for (Long channelId : dto.getChannelIds()) {
                    BannerChannel channel = channelRepository.findById(channelId)
                            .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + channelId));
                    channels.add(channel);
                }
                saved.setChannels(channels);
                saved = imageRepository.save(saved); // Salvar novamente com os canais associados
            }

            return new BannerImageDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating banner image", e);
            throw new BannerException("Erro ao criar imagem: " + e.getMessage(), e);
        }
    }

    @Transactional
    public BannerImageDTO updateImage(Long id, BannerImageDTO dto) {
        try {
            log.info("Updating banner image with ID: {}", id);
            BannerImage image = imageRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Imagem não encontrada com ID: " + id));

            if (dto.getTitle() != null) image.setTitle(dto.getTitle());
            if (dto.getImageUrl() != null) image.setImageUrl(dto.getImageUrl());
            if (dto.getActive() != null) image.setActive(dto.getActive());
            if (dto.getDisplayOrder() != null) image.setDisplayOrder(dto.getDisplayOrder());
            if (dto.getTransitionDurationSeconds() != null) image.setTransitionDurationSeconds(dto.getTransitionDurationSeconds());

            // Atualizar canais
            if (dto.getChannelIds() != null) {
                // Deletar associações antigas primeiro usando query nativa para evitar problemas com lazy loading
                imageRepository.deleteImageChannelAssociations(id);
                
                // Criar nova coleção com os canais selecionados
                Set<BannerChannel> channels = new HashSet<>();
                if (!dto.getChannelIds().isEmpty()) {
                    for (Long channelId : dto.getChannelIds()) {
                        BannerChannel channel = channelRepository.findById(channelId)
                                .orElseThrow(() -> new BannerException("Canal não encontrado com ID: " + channelId));
                        channels.add(channel);
                    }
                }
                // Setar a nova coleção - o JPA vai gerenciar as novas associações
                image.setChannels(channels);
            }

            BannerImage saved = imageRepository.save(image);
            return new BannerImageDTO(saved);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating banner image with ID: {}", id, e);
            throw new BannerException("Erro ao atualizar imagem", e);
        }
    }

    @Transactional
    public void deleteImage(Long id) {
        try {
            log.info("Deleting banner image with ID: {}", id);
            BannerImage image = imageRepository.findById(id)
                    .orElseThrow(() -> new BannerException("Imagem não encontrada com ID: " + id));

            // Deletar associações ManyToMany diretamente da tabela de junção
            imageRepository.deleteImageChannelAssociations(id);

            // Deletar arquivo físico primeiro
            if (image.getImageUrl() != null && !image.getImageUrl().trim().isEmpty()) {
                try {
                    storageService.deleteFile(image.getImageUrl());
                    log.info("Arquivo deletado: {}", image.getImageUrl());
                } catch (Exception e) {
                    log.warn("Erro ao deletar arquivo (continuando): {}", e.getMessage());
                    // Continua mesmo se arquivo não existir
                }
            }

            // Deletar do banco
            imageRepository.delete(image);
        } catch (BannerException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting banner image with ID: {}", id, e);
            throw new BannerException("Erro ao excluir imagem", e);
        }
    }
}

