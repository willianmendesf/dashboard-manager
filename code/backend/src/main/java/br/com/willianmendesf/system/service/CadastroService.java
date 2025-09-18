package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.CadastroException;
import br.com.willianmendesf.system.model.CadastroEntity;
import br.com.willianmendesf.system.model.dto.CadastroDTO;
import br.com.willianmendesf.system.repository.CadastroRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class CadastroService {

    private final CadastroRepository repository;

    public List<CadastroDTO> getAll() {
        try {
            log.info("Fetching all appointments from the database");
            return repository.findAll().stream().map(CadastroDTO::new).toList();
        } catch (Exception e) {
            throw new CadastroException("Error to return values" ,e);
        }
    }

    public CadastroDTO getById(Long id) {
        try {
            log.info("Fetching appointment with ID: {}", id);
            CadastroEntity entity = repository.findById(id).orElse(null);
            if (entity == null) throw new CadastroException("Cadastro not found for ID: " + id);
            return new CadastroDTO(entity);
        } catch (Exception e) {
            throw new CadastroException("ID " + id + " not found");
        }
    }

    public void create(CadastroEntity cadastro) {
        try {
            log.info("Creating new appointment!");
            CadastroEntity saved = repository.save(cadastro);
            new CadastroDTO(saved);
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
