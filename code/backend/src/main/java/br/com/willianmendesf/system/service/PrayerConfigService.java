package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.PrayerConfigDTO;
import br.com.willianmendesf.system.model.entity.SystemConfiguration;
import br.com.willianmendesf.system.repository.SystemConfigurationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@AllArgsConstructor
public class PrayerConfigService {

    private static final String CONFIG_KEY = "PRAYER360_CONFIG";
    private final SystemConfigurationRepository configRepository;
    private final ObjectMapper objectMapper;

    public PrayerConfigDTO getConfig() {
        log.info("Getting Prayer360 configuration");
        SystemConfiguration config = configRepository.findByKey(CONFIG_KEY)
                .orElseGet(() -> {
                    log.info("Configuration not found, creating default");
                    return createDefaultConfig();
                });
        
        try {
            return objectMapper.readValue(config.getValue(), PrayerConfigDTO.class);
        } catch (JsonProcessingException e) {
            log.error("Error parsing configuration JSON", e);
            return getDefaultConfig();
        }
    }

    @Transactional
    public void updateConfig(PrayerConfigDTO configDTO) {
        log.info("Updating Prayer360 configuration");
        try {
            String jsonValue = objectMapper.writeValueAsString(configDTO);
            SystemConfiguration config = configRepository.findByKey(CONFIG_KEY)
                    .orElseGet(() -> {
                        SystemConfiguration newConfig = new SystemConfiguration();
                        newConfig.setKey(CONFIG_KEY);
                        newConfig.setType("JSON");
                        newConfig.setCategory("SYSTEM");
                        newConfig.setDescription("Prayer360 System Configuration");
                        return newConfig;
                    });
            
            config.setValue(jsonValue);
            configRepository.save(config);
            log.info("Configuration updated successfully");
        } catch (JsonProcessingException e) {
            log.error("Error serializing configuration to JSON", e);
            throw new RuntimeException("Error updating configuration", e);
        }
    }

    @Transactional
    public void resetToDefault() {
        log.info("Resetting Prayer360 configuration to default");
        SystemConfiguration config = configRepository.findByKey(CONFIG_KEY)
                .orElseGet(() -> {
                    SystemConfiguration newConfig = new SystemConfiguration();
                    newConfig.setKey(CONFIG_KEY);
                    newConfig.setType("JSON");
                    newConfig.setCategory("SYSTEM");
                    newConfig.setDescription("Prayer360 System Configuration");
                    return newConfig;
                });
        
        try {
            PrayerConfigDTO defaultConfig = getDefaultConfig();
            config.setValue(objectMapper.writeValueAsString(defaultConfig));
            configRepository.save(config);
            log.info("Configuration reset to default");
        } catch (JsonProcessingException e) {
            log.error("Error resetting configuration", e);
            throw new RuntimeException("Error resetting configuration", e);
        }
    }

    private SystemConfiguration createDefaultConfig() {
        SystemConfiguration config = new SystemConfiguration();
        config.setKey(CONFIG_KEY);
        config.setType("JSON");
        config.setCategory("SYSTEM");
        config.setDescription("Prayer360 System Configuration");
        
        try {
            PrayerConfigDTO defaultConfig = getDefaultConfig();
            config.setValue(objectMapper.writeValueAsString(defaultConfig));
            return configRepository.save(config);
        } catch (JsonProcessingException e) {
            log.error("Error creating default configuration", e);
            throw new RuntimeException("Error creating default configuration", e);
        }
    }

    private PrayerConfigDTO getDefaultConfig() {
        PrayerConfigDTO config = new PrayerConfigDTO();
        config.setMaxPorIntercessor(3);
        config.setMaxCriancasPorIntercessor(1);
        config.setLimiteFlexivel(5);
        config.setModoDesenvolvimento(false);
        
        PrayerConfigDTO.ResetAntecipadoConfig resetConfig = new PrayerConfigDTO.ResetAntecipadoConfig();
        resetConfig.setHabilitado(false);
        resetConfig.setTipo("fixo");
        resetConfig.setQuantidade(3);
        resetConfig.setLimiteProximidade(30);
        resetConfig.setLimiteDistribuicao(0.9);
        resetConfig.setMaxTentativas(1);
        resetConfig.setTentativasHabilitadas(false);
        config.setResetAntecipado(resetConfig);
        
        return config;
    }
}

