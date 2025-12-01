package br.com.willianmendesf.system.service.utils;

import br.com.willianmendesf.system.service.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import io.github.cdimascio.dotenv.Dotenv;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappSenderService {

    private final ConfigService configService;
    private final RestTemplate restTemplate;
    
    private String cachedApiNodeUrl = null;
    private boolean cacheValid = false;
    private String cachedSource = null;
    
    private String cachedBasicAuth = null;
    private boolean basicAuthCacheValid = false;

    /**
     * Obtém a URL da API do WhatsApp com fallback em 3 níveis:
     * 1. Banco de dados (ConfigService) - Prioridade máxima (com cache)
     * 2. Variável de ambiente (.env) - Fallback (sem cache)
     * 3. Variável de ambiente do sistema - Último recurso (sem cache)
     * 
     * @return URL da API do WhatsApp
     */
    private String getApiNodeUrl() {
        // Se o cache é válido e veio do banco, retorna o valor em cache
        if (cacheValid && cachedApiNodeUrl != null && "database".equals(cachedSource)) {
            return cachedApiNodeUrl;
        }

        String url = null;

        // Prioridade 1: Tentar buscar do banco de dados (sempre tentar primeiro)
        try {
            url = configService.get("API_WTZ_URL");
            if (url != null && !url.trim().isEmpty()) {
                log.info("WhatsApp API URL obtida do banco de dados: {}", url);
                cachedApiNodeUrl = url;
                cacheValid = true;
                cachedSource = "database";
                return url;
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar API_WTZ_URL do banco de dados: {}", e.getMessage());
        }

        // Prioridade 2: Tentar buscar da variável de ambiente (.env)
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            url = dotenv.get("API_WTZ_URL");
            if (url != null && !url.trim().isEmpty()) {
                log.info("WhatsApp API URL obtida do arquivo .env: {}", url);
                cachedApiNodeUrl = url;
                cacheValid = false;
                cachedSource = "env";
                return url;
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar API_WTZ_URL do arquivo .env: {}", e.getMessage());
        }

        // Prioridade 3: Tentar da variável de ambiente do sistema
        try {
            url = System.getenv("API_WTZ_URL");
            if (url != null && !url.trim().isEmpty()) {
                log.info("WhatsApp API URL obtida da variável de ambiente do sistema: {}", url);
                cachedApiNodeUrl = url;
                cacheValid = false;
                cachedSource = "system";
                return url;
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar API_WTZ_URL da variável de ambiente: {}", e.getMessage());
        }

        // Se ainda temos um cache de fallback (de uma tentativa anterior), usar ele como último recurso
        if (cachedApiNodeUrl != null && cachedSource != null) {
            log.warn("Usando URL do cache de fallback (fonte: {}). Configure no banco de dados para melhor performance.", cachedSource);
            return cachedApiNodeUrl;
        }

        // Se nenhuma fonte forneceu a URL, lança exceção
        log.error("API_WTZ_URL não encontrada em nenhuma fonte (banco de dados, .env ou variável de ambiente)");
        throw new RuntimeException(
            "API_WTZ_URL não configurada. " +
            "Por favor, configure em: Configurações > Sistema > URL da API WhatsApp, " +
            "ou no arquivo .env como API_WTZ_URL, " +
            "ou como variável de ambiente do sistema."
        );
    }

    /**
     * Obtém as credenciais Basic Auth com fallback em 3 níveis:
     * 1. Banco de dados (ConfigService) - Prioridade máxima (com cache)
     * 2. Variável de ambiente APP_BASIC_AUTH (formato usuario:senha) - Fallback
     * 3. Variáveis de ambiente separadas WHATSAPP_API_USERNAME e WHATSAPP_API_PASSWORD - Último recurso
     * 
     * @return String Base64 para header Authorization ou null se não configurado
     */
    private String getBasicAuthCredentials() {
        // Se o cache é válido, retorna o valor em cache
        if (basicAuthCacheValid && cachedBasicAuth != null) {
            return cachedBasicAuth;
        }

        String username = null;
        String password = null;

        // Prioridade 1: Tentar buscar do banco de dados
        try {
            username = configService.get("WHATSAPP_API_USERNAME");
            password = configService.get("WHATSAPP_API_PASSWORD");
            if (username != null && !username.trim().isEmpty() && 
                password != null && !password.trim().isEmpty()) {
                String credentials = username + ":" + password;
                cachedBasicAuth = Base64.getEncoder().encodeToString(credentials.getBytes());
                basicAuthCacheValid = true;
                log.debug("WhatsApp Basic Auth obtido do banco de dados");
                return cachedBasicAuth;
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar credenciais Basic Auth do banco de dados: {}", e.getMessage());
        }

        // Prioridade 2: Tentar buscar da variável de ambiente APP_BASIC_AUTH (formato usuario:senha)
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            String basicAuth = dotenv.get("APP_BASIC_AUTH");
            if (basicAuth != null && !basicAuth.trim().isEmpty()) {
                if (basicAuth.contains(":")) {
                    cachedBasicAuth = Base64.getEncoder().encodeToString(basicAuth.getBytes());
                    basicAuthCacheValid = false; // Não cachear de env
                    log.debug("WhatsApp Basic Auth obtido do arquivo .env (APP_BASIC_AUTH)");
                    return cachedBasicAuth;
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar APP_BASIC_AUTH do arquivo .env: {}", e.getMessage());
        }

        // Prioridade 3: Tentar variáveis de ambiente do sistema
        try {
            String envBasicAuth = System.getenv("APP_BASIC_AUTH");
            if (envBasicAuth != null && !envBasicAuth.trim().isEmpty() && envBasicAuth.contains(":")) {
                cachedBasicAuth = Base64.getEncoder().encodeToString(envBasicAuth.getBytes());
                basicAuthCacheValid = false;
                log.debug("WhatsApp Basic Auth obtido da variável de ambiente do sistema");
                return cachedBasicAuth;
            }
            
            // Tentar variáveis separadas
            username = System.getenv("WHATSAPP_API_USERNAME");
            password = System.getenv("WHATSAPP_API_PASSWORD");
            if (username != null && !username.trim().isEmpty() && 
                password != null && !password.trim().isEmpty()) {
                String credentials = username + ":" + password;
                cachedBasicAuth = Base64.getEncoder().encodeToString(credentials.getBytes());
                basicAuthCacheValid = false;
                log.debug("WhatsApp Basic Auth obtido das variáveis de ambiente do sistema");
                return cachedBasicAuth;
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar credenciais Basic Auth das variáveis de ambiente: {}", e.getMessage());
        }

        // Se não encontrou, retorna null (requisições sem autenticação)
        log.debug("Basic Auth não configurado - requisições serão feitas sem autenticação");
        return null;
    }

    /**
     * Invalida o cache, forçando a busca da URL e credenciais novamente na próxima requisição
     * Útil quando a URL ou credenciais são atualizadas no banco de dados
     */
    public void invalidateCache() {
        cacheValid = false;
        cachedApiNodeUrl = null;
        cachedSource = null;
        basicAuthCacheValid = false;
        cachedBasicAuth = null;
        log.debug("Cache da URL e Basic Auth do WhatsApp invalidado");
    }

    public <T> HttpEntity<T> createRequestEntity(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Adicionar Basic Auth se configurado
        String basicAuth = getBasicAuthCredentials();
        if (basicAuth != null) {
            headers.set("Authorization", "Basic " + basicAuth);
        }
        
        return new HttpEntity<>(body, headers);
    }
    
    /**
     * Cria HttpEntity para requisições GET sem body
     */
    public HttpEntity<Void> createGetRequestEntity() {
        HttpHeaders headers = new HttpHeaders();
        
        // Adicionar Basic Auth se configurado
        String basicAuth = getBasicAuthCredentials();
        if (basicAuth != null) {
            headers.set("Authorization", "Basic " + basicAuth);
        }
        
        return new HttpEntity<>(headers);
    }
    
    /**
     * Cria HttpEntity para requisições multipart (form-data) com Basic Auth
     */
    public <T> HttpEntity<T> createMultipartRequestEntity(T body, MediaType contentType) {
        HttpHeaders headers = new HttpHeaders();
        if (contentType != null) {
            headers.setContentType(contentType);
        }
        
        // Adicionar Basic Auth se configurado
        String basicAuth = getBasicAuthCredentials();
        if (basicAuth != null) {
            headers.set("Authorization", "Basic " + basicAuth);
        }
        
        return new HttpEntity<>(body, headers);
    }

    public ResponseEntity<String> sendRequest(String endpoint, HttpEntity<?> requestEntity) {
        try {
            String apiNodeUrl = getApiNodeUrl();
            ResponseEntity<String> response;

            if (requestEntity.getBody() == null)
                response = restTemplate.exchange(apiNodeUrl + endpoint, HttpMethod.GET, requestEntity, String.class);
            else
                response = restTemplate.postForEntity(apiNodeUrl + endpoint, requestEntity, String.class);

            if (!response.getStatusCode().is2xxSuccessful())
                throw new RuntimeException("Fail to send message: " + response.getStatusCode());

            return response;
        } catch (RestClientException e) {
            // Se houver erro de conexão, invalida o cache para tentar recarregar na próxima vez
            // Isso permite que se a URL no banco for atualizada, ela seja recarregada
            log.error("Erro ao conectar com a API do WhatsApp: {}", e.getMessage());
            invalidateCache();
            throw new RuntimeException("Error connecting to WhatsApp API: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            // Se for erro de configuração (URL não encontrada), propaga sem invalidar cache
            if (e.getMessage() != null && e.getMessage().contains("não configurada")) {
                throw e;
            }
            // Outros erros também invalidam o cache
            invalidateCache();
            throw e;
        }
    }
    
    /**
     * Envia requisição GET para a API externa
     */
    public ResponseEntity<String> sendGetRequest(String endpoint) {
        HttpEntity<Void> requestEntity = createGetRequestEntity();
        return sendRequest(endpoint, requestEntity);
    }
}
