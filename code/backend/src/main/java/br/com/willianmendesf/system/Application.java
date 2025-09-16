package br.com.willianmendesf.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "br.com.willianmendesf.system")
@EnableJpaRepositories("br.com.willianmendesf.system.interfaces")
@EntityScan("br.com.willianmendesf.system.model")
public class Application {
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
		System.out.println("Application Started");
	}
}
