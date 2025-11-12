package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.GroupDTO;
import br.com.willianmendesf.system.model.entity.GroupEntity;
import br.com.willianmendesf.system.repository.GroupRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class GroupService {

    private final GroupRepository repository;

    public List<GroupDTO> getAll() {
        try {
            log.info("Getting all groups");
            return repository.findAll().stream()
                    .map(group -> {
                        Long count = repository.countMembersByGroupId(group.getId());
                        return new GroupDTO(group, count);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new MembersException("Error to return groups", e);
        }
    }

    public GroupDTO getById(Long id) {
        try {
            log.info("Getting group by ID: {}", id);
            GroupEntity group = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Group not found for ID: " + id));
            Long count = repository.countMembersByGroupId(id);
            return new GroupDTO(group, count);
        } catch (Exception e) {
            throw new MembersException("Error getting group with ID: " + id, e);
        }
    }

    @Transactional
    public GroupDTO create(GroupDTO dto) {
        try {
            log.info("Creating group: {}", dto.getNome());
            
            // Verifica se já existe grupo com o mesmo nome
            if (repository.findByNome(dto.getNome()).isPresent()) {
                throw new MembersException("Já existe um grupo com o nome: " + dto.getNome());
            }

            GroupEntity group = new GroupEntity();
            group.setNome(dto.getNome());
            group.setDescricao(dto.getDescricao());
            
            GroupEntity saved = repository.save(group);
            return new GroupDTO(saved, 0L);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            throw new MembersException("Error creating group", e);
        }
    }

    @Transactional
    public GroupDTO update(Long id, GroupDTO dto) {
        try {
            log.info("Updating group ID: {}", id);
            GroupEntity group = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Group not found for ID: " + id));

            // Verifica se o novo nome já existe em outro grupo
            if (dto.getNome() != null && !dto.getNome().equals(group.getNome())) {
                repository.findByNome(dto.getNome()).ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new MembersException("Já existe um grupo com o nome: " + dto.getNome());
                    }
                });
            }

            if (dto.getNome() != null && !dto.getNome().trim().isEmpty()) {
                group.setNome(dto.getNome());
            }
            if (dto.getDescricao() != null) {
                group.setDescricao(dto.getDescricao());
            }

            GroupEntity updated = repository.save(group);
            Long count = repository.countMembersByGroupId(id);
            return new GroupDTO(updated, count);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            throw new MembersException("Error updating group", e);
        }
    }

    @Transactional
    public void delete(Long id) {
        try {
            log.info("Deleting group by ID: {}", id);
            GroupEntity group = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Group not found with ID: " + id));
            
            // Verifica se o grupo tem membros cadastrados
            Long memberCount = repository.countMembersByGroupId(id);
            if (memberCount != null && memberCount > 0) {
                throw new MembersException(
                    String.format("Não é possível deletar o grupo '%s' pois ele possui %d pessoa(s) cadastrada(s). " +
                                "Remova os membros do grupo antes de deletá-lo.", group.getNome(), memberCount)
                );
            }
            
            repository.deleteById(id);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            throw new MembersException("Error deleting group with ID: " + id, e);
        }
    }
}

