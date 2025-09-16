package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import static java.util.Objects.isNull;

@Component
public class TestConection implements CommandLineRunner {

    private final UserRepository userRepository;

    @Autowired
    public TestConection(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if(!isNull(userRepository.count())) {
            System.out.println("Database Connected!");
        }
    }
}
