package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.User;
import br.com.willianmendesf.system.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class UserService {

    private final UserRepository userRepository;


    public List<User> findAll() {
        log.info("Fetching all users from the database");
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        try {
            log.info("Fetching user with ID: {}", id);
            return userRepository.findById(id).orElseThrow();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching user with ID: " + id, e);
        }
    }

    public void deleteById(Long id) {
        log.info("Deleting user with ID: {}", id);
        userRepository.deleteById(id);
    }
}
