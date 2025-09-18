package br.com.willianmendesf.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "br.com.willianmendesf.system")
public class Application {
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
		System.out.println("Application Started");
	}
}
