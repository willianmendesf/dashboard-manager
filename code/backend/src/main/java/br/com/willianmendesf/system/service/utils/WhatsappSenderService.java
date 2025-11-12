package br.com.willianmendesf.system.service.utils;

import br.com.willianmendesf.system.service.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import io.github.cdimascio.dotenv.Dotenv;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappSenderService {

    private final ConfigService configService;
    private final RestTemplate restTemplate;
    
    private String cachedApiNodeUrl = null;
    private boolean cacheValid = false;
    private String cachedSource = null;

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
     * Invalida o cache, forçando a busca da URL novamente na próxima requisição
     * Útil quando a URL é atualizada no banco de dados
     */
    public void invalidateCache() {
        cacheValid = false;
        cachedApiNodeUrl = null;
        cachedSource = null;
        log.debug("Cache da URL do WhatsApp invalidado");
    }

    public <T> HttpEntity<T> createRequestEntity(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    public ResponseEntity<String> sendRequest(String endpoint, HttpEntity<?> requestEntity) {
        try {
            String apiNodeUrl = getApiNodeUrl();
            ResponseEntity<String> response;

            if (requestEntity.getBody() == null)
                response = restTemplate.getForEntity(apiNodeUrl + endpoint, String.class, requestEntity, String.class);
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
}
