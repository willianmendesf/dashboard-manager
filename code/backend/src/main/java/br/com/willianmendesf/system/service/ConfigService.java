package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.entity.SystemConfiguration;
import br.com.willianmendesf.system.repository.SystemConfigurationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import br.com.willianmendesf.system.service.utils.WhatsappSenderService;

@Service
@Slf4j
public class ConfigService {

    private final SystemConfigurationRepository repository;
    private final WhatsappSenderService whatsappSenderService;
    
    // Construtor com @Lazy para quebrar dependência circular
    public ConfigService(
            SystemConfigurationRepository repository,
            @Lazy WhatsappSenderService whatsappSenderService) {
        this.repository = repository;
        this.whatsappSenderService = whatsappSenderService;
    }
    
    // In-memory cache to avoid repeated database queries
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        log.info("Initializing ConfigService - loading configurations from database");
        // This runs after Hibernate has created all tables
        try {
            loadAllConfigurations();
        } catch (Exception e) {
            log.warn("Could not load configurations on startup: {}", e.getMessage());
        }
    }

    /**
     * Loads all configurations from database into cache
     */
    @Transactional(readOnly = true)
    public void loadAllConfigurations() {
        try {
            List<SystemConfiguration> configurations = repository.findAll();
            cache.clear();
            configurations.forEach(config -> {
                cache.put(config.getKey(), config.getValue());
                log.debug("Configuration loaded: {} = {}", config.getKey(), 
                    "PASSWORD".equals(config.getType()) ? "***" : config.getValue());
            });
            log.info("{} configurations loaded into cache", configurations.size());
        } catch (org.springframework.dao.InvalidDataAccessResourceUsageException e) {
            // Table doesn't exist yet - Hibernate will create it
            log.warn("Configuration table does not exist yet. It will be created by Hibernate.");
            cache.clear();
        } catch (Exception e) {
            log.error("Error loading configurations from database", e);
            throw e;
        }
    }

    /**
     * Gets the value of a configuration by key name
     * @param key Configuration key name
     * @return Configuration value or null if not found
     */
    public String get(String key) {
        String value = cache.get(key);
        if (value == null) {
            // If not in cache, try to fetch from database (may have been added externally)
            try {
                Optional<SystemConfiguration> config = repository.findByKey(key);
                if (config.isPresent()) {
                    value = config.get().getValue();
                    cache.put(key, value);
                }
            } catch (org.springframework.dao.InvalidDataAccessResourceUsageException e) {
                // Table doesn't exist yet
                log.debug("Configuration table does not exist yet for key: {}", key);
                return null;
            } catch (Exception e) {
                log.warn("Error fetching configuration {} from database: {}", key, e.getMessage());
                return null;
            }
        }
        return value;
    }

    /**
     * Gets the value of a configuration with default value
     * @param key Configuration key name
     * @param defaultValue Default value if configuration doesn't exist
     * @return Configuration value or default value
     */
    public String get(String key, String defaultValue) {
        String value = get(key);
        return value != null ? value : defaultValue;
    }

    /**
     * Gets a configuration as Integer
     */
    public Integer getInt(String key, Integer defaultValue) {
        String value = get(key);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.warn("Error converting configuration {} to Integer: {}", key, value);
            return defaultValue;
        }
    }

    /**
     * Gets a configuration as Boolean
     */
    public Boolean getBoolean(String key, Boolean defaultValue) {
        String value = get(key);
        if (value == null) return defaultValue;
        return Boolean.parseBoolean(value);
    }

    /**
     * Updates a configuration
     * @param key Key name
     * @param value New value
     */
    @Transactional
    public void set(String key, String value) {
        try {
            Optional<SystemConfiguration> configOpt = repository.findByKey(key);
            SystemConfiguration config;
            
            if (configOpt.isPresent()) {
                config = configOpt.get();
                config.setValue(value);
            } else {
                config = new SystemConfiguration();
                config.setKey(key);
                config.setValue(value);
                // Auto-detect type based on key name
                if (key.contains("API_KEY") || key.contains("PASSWORD") || key.contains("SECRET")) {
                    config.setType("PASSWORD");
                } else {
                    config.setType("STRING");
                }
            }
            
            repository.save(config);
            cache.put(key, value);
            log.info("Configuration updated: {} = {}", key, 
                "PASSWORD".equals(config.getType()) ? "***" : value);
            
            // Invalidar cache do WhatsApp se a configuração for relacionada
            if (key.equals("API_WTZ_URL") || 
                key.equals("WHATSAPP_API_USERNAME") || 
                key.equals("WHATSAPP_API_PASSWORD")) {
                whatsappSenderService.invalidateCache();
                log.info("Cache do WhatsApp invalidado devido à atualização de {}", key);
            }
        } catch (org.springframework.dao.InvalidDataAccessResourceUsageException e) {
            log.error("Configuration table does not exist. Please ensure the database schema is initialized.");
            throw new RuntimeException("Configuration table does not exist. Please restart the application after Hibernate creates the table.", e);
        }
    }

    /**
     * Updates multiple configurations
     * @param configurations Map with key-value pairs of configurations
     */
    @Transactional
    public void setAll(Map<String, String> configurations) {
        final boolean[] shouldInvalidateWhatsAppCache = {false};
        
        configurations.forEach((key, value) -> {
            Optional<SystemConfiguration> configOpt = repository.findByKey(key);
            SystemConfiguration config;
            
            if (configOpt.isPresent()) {
                config = configOpt.get();
                config.setValue(value);
            } else {
                config = new SystemConfiguration();
                config.setKey(key);
                config.setValue(value);
                // Auto-detect type based on key name
                if (key.contains("API_KEY") || key.contains("PASSWORD") || key.contains("SECRET")) {
                    config.setType("PASSWORD");
                } else {
                    config.setType("STRING");
                }
            }
            
            repository.save(config);
            cache.put(key, value);
            
            // Verificar se alguma configuração do WhatsApp foi atualizada
            if (key.equals("API_WTZ_URL") || 
                key.equals("WHATSAPP_API_USERNAME") || 
                key.equals("WHATSAPP_API_PASSWORD")) {
                shouldInvalidateWhatsAppCache[0] = true;
            }
        });
        
        log.info("{} configurations updated", configurations.size());
        
        // Invalidar cache do WhatsApp se necessário
        if (shouldInvalidateWhatsAppCache[0]) {
            whatsappSenderService.invalidateCache();
            log.info("Cache do WhatsApp invalidado devido à atualização de configurações relacionadas");
        }
    }

    /**
     * Gets all configurations
     */
    @Transactional(readOnly = true)
    public Map<String, String> getAll() {
        Map<String, String> allConfigs = new HashMap<>();
        List<SystemConfiguration> configurations = repository.findAll();
        configurations.forEach(config -> {
            allConfigs.put(config.getKey(), config.getValue());
        });
        return allConfigs;
    }

    /**
     * Gets all configurations as entities (with metadata)
     */
    @Transactional(readOnly = true)
    public List<SystemConfiguration> getAllEntities() {
        return repository.findAll();
    }

    /**
     * Removes a configuration from cache (useful after external updates)
     */
    public void evict(String key) {
        cache.remove(key);
    }

    /**
     * Clears entire cache and reloads from database
     */
    public void refresh() {
        loadAllConfigurations();
    }
}
