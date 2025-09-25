package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.exception.UserException;
import br.com.willianmendesf.system.model.entity.RegisterEntity;
import br.com.willianmendesf.system.model.dto.RegisterDTO;
import br.com.willianmendesf.system.repository.RegisterRepository;
import br.com.willianmendesf.system.service.utils.HashUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class RegisterService {

    private final RegisterRepository repository;

    public List<RegisterDTO> getAll() {
        try {
            log.info("Fetching all appointments from the database");
            return repository.findAll().stream().map(RegisterDTO::new).toList();
        } catch (Exception e) {
            throw new MembersException("Error to return values" ,e);
        }
    }

    public RegisterDTO getById(Long id) {
        try {
            log.info("Fetching appointment with ID: {}", id);
            RegisterEntity entity = repository.findById(id).orElse(null);
            if (entity == null) throw new MembersException("Cadastro not found for ID: " + id);
            return new RegisterDTO(entity);
        } catch (Exception e) {
            throw new MembersException("ID " + id + " not found");
        }
    }

    public void create(RegisterEntity cadastro) {
        try {
            log.info("Creating new appointment!");
            RegisterEntity saved = repository.save(cadastro);
            new RegisterDTO(saved);
        } catch (Exception e) {
            throw new MembersException("Error to create new appointment", e);
        }
    }

    public RegisterEntity updateById(Long id, RegisterEntity member) {
        log.info("Updating user: {}", member.getNome());
        try {
            RegisterEntity user = repository.findById(id)
                    .orElseThrow(() -> new MembersException("User not found for id " + id));

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

    public void delete(Long id) {
        try {
            log.info("Deleting appointment with ID: {}", id);
            if (!repository.existsById(id)) throw new RuntimeException("Cadastro não encontrado para o ID: " + id);
            repository.deleteById(id);
        } catch (Exception e) {
            throw new MembersException("Error to delete appointment with ID: " + id, e);
        }
    }
}
