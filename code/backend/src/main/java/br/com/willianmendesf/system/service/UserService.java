package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.UserException;
import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.model.entity.UserEntity;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.utils.HashUtil;
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
        log.info("Getting all users");
        try {
            var result = userRepository.findAll();
            return result.stream().map(UserDTO::new).toList();
        } catch (Exception e) {
            throw new UserException("Error fetching users from the database");
        }
    }

//    public UserDTO getLastCreated() {
//        try {
//            log.info("Fetching all users from the database");
//            return new UserDTO(userRepository.findFirstByOrderByCreatedAtDesc().getFirst());
//        } catch (Exception e) {
//            throw new UserException("Error fetching users from the database");
//        }
//    }

    public UserDTO getUserById(Long id) {
        log.info("Getting user by id: {}", id);
        try {
            log.info("Fetching user with ID: {}", id);
            var result = userRepository.findById(id).orElseThrow(() -> new UserException("User not found with ID: " + id));
            return new UserDTO(result);
        } catch (Exception e) {
            throw new UserException("Error fetching user with ID: " + id, e);
        }
    }

    public UserEntity updateById(Long id, UserEntity userEntity) {
        log.info("Updating user: {}", userEntity.getUsername());
        try {
            UserEntity user = userRepository.findById(id)
                    .orElseThrow(() -> new UserException("User not found for id " + id));

            user.setName(userEntity.getName());
            user.setUsername(userEntity.getUsername());

            if (userEntity.getPassword() != null) {
                var encryptedPassword = HashUtil.toMD5(userEntity.getPassword());
                user.setPassword(encryptedPassword);
            }

            user.setRoles(userEntity.getRoles());
            user.setStatus(userEntity.getStatus());

            return userRepository.save(user);
        } catch (Exception e) {
            throw new UserException("Error updating user", e);
        }
    }


    public UserEntity createUser(UserEntity userEntity) {
        log.info("Creating user: {}", userEntity.getUsername());
        try {
            var userPassword = userEntity.getPassword();
            var encryptedPassword = HashUtil.toMD5(userPassword);
            userEntity.setPassword(encryptedPassword);
            return userRepository.save(userEntity);
        } catch (Exception e) {
            throw new UserException("Error creating new user", e);
        }
    }

    public void deleteById(Long id) {
        log.info("Deleting user by id: {}", id);
        try {
            userRepository.deleteById(id);
        } catch (Exception e) {
            throw new UserException("Error deleting user with ID: " + id);
        }
    }
}
