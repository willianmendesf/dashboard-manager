package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.UserException;
import br.com.willianmendesf.system.model.UserEntity;
import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.utils.HashUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserDTO> findAll() {
        try {
            log.info("Fetching all users from the database");
            var result = userRepository.findAll();
            return result.stream().map(user -> new UserDTO(user.getName(), user.getEmail())).toList();
        } catch (Exception e) {
            throw new UserException("Error fetching users from the database");
        }
    }

    public UserDTO getUserById(Long id) {
        try {
            log.info("Fetching user with ID: {}", id);
            var result = userRepository.findById(id).orElseThrow(() -> new UserException("User not found with ID: " + id));
            return new UserDTO(result.getName(), result.getEmail());
        } catch (Exception e) {
            throw new UserException("Error fetching user with ID: " + id, e);
        }
    }


    public UserEntity createUser(UserEntity userEntity) {
        try {
            log.info("Creating new user!");
            var userPassword = userEntity.getPassword();
            var encryptedPassword = HashUtil.toMD5(userPassword);
            userEntity.setPassword(encryptedPassword);
            userEntity.setId(userRepository.findMaxId() + 1);
            return userRepository.save(userEntity);
        } catch (Exception e) {
            throw new UserException("Error creating new user", e);
        }
    }

    public void deleteById(Long id) {
        try {
            log.info("Deleting user with ID: {}", id);
            userRepository.deleteById(id);
        } catch (Exception e) {
            throw new UserException("Error deleting user with ID: " + id);
        }
    }
}
