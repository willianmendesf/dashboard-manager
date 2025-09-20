package br.com.willianmendesf.system.configuration;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfiguration {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public String apiNodeUrl() {
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();
        return dotenv.get("API_WTZ_URL");
    }

    @Bean
    public Dotenv loadDotenv() {
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        System.setProperty("SQL_HOST", dotenv.get("SQL_HOST"));
        System.setProperty("SQL_PORT", dotenv.get("SQL_PORT"));
        System.setProperty("SQL_DB", dotenv.get("SQL_DB"));
        System.setProperty("SQL_USER", dotenv.get("SQL_USER"));
        System.setProperty("SQL_PASS", dotenv.get("SQL_PASS"));

        return dotenv;
    }
}
