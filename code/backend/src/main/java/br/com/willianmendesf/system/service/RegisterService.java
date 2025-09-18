package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.CadastroException;
import br.com.willianmendesf.system.model.RegisterEntity;
import br.com.willianmendesf.system.model.dto.RegisterDTO;
import br.com.willianmendesf.system.repository.RegisterRepository;
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
            throw new CadastroException("Error to return values" ,e);
        }
    }

    public RegisterDTO getById(Long id) {
        try {
            log.info("Fetching appointment with ID: {}", id);
            RegisterEntity entity = repository.findById(id).orElse(null);
            if (entity == null) throw new CadastroException("Cadastro not found for ID: " + id);
            return new RegisterDTO(entity);
        } catch (Exception e) {
            throw new CadastroException("ID " + id + " not found");
        }
    }

    public void create(RegisterEntity cadastro) {
        try {
            log.info("Creating new appointment!");
            RegisterEntity saved = repository.save(cadastro);
            new RegisterDTO(saved);
        } catch (Exception e) {
            throw new CadastroException("Error to create new appointment", e);
        }
    }

    public void delete(Long id) {
        try {
            log.info("Deleting appointment with ID: {}", id);
            if (!repository.existsById(id)) throw new RuntimeException("Cadastro não encontrado para o ID: " + id);
            repository.deleteById(id);
        } catch (Exception e) {
            throw new CadastroException("Error to delete appointment with ID: " + id, e);
        }
    }
}
