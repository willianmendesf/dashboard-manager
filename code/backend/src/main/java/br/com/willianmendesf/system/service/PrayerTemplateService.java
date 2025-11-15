package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.PrayerTemplateDTO;
import br.com.willianmendesf.system.model.entity.PrayerTemplate;
import br.com.willianmendesf.system.repository.PrayerTemplateRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PrayerTemplateService {

    private final PrayerTemplateRepository templateRepository;

    public List<PrayerTemplateDTO> getAll() {
        log.info("Getting all prayer templates");
        return templateRepository.findAllActiveOrdered().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PrayerTemplateDTO getById(Long id) {
        log.info("Getting prayer template by ID: {}", id);
        PrayerTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found: " + id));
        return convertToDTO(template);
    }

    public PrayerTemplateDTO getDefault() {
        log.info("Getting default prayer template");
        return templateRepository.findByIsDefaultTrue()
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("No default template found"));
    }

    @Transactional
    public PrayerTemplateDTO create(PrayerTemplateDTO dto) {
        log.info("Creating new prayer template: {}", dto.getName());
        PrayerTemplate template = convertToEntity(dto);
        
        // Se for marcado como padrão, desmarcar outros
        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            unsetOtherDefaults();
        }
        
        template = templateRepository.save(template);
        return convertToDTO(template);
    }

    @Transactional
    public PrayerTemplateDTO update(Long id, PrayerTemplateDTO dto) {
        log.info("Updating prayer template: {}", id);
        PrayerTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found: " + id));
        
        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setHeader(dto.getHeader());
        template.setListFormat(dto.getListFormat());
        template.setBody(dto.getBody());
        template.setAdditionalMessages(dto.getAdditionalMessages());
        template.setVariables(dto.getVariables());
        template.setActive(dto.getActive());
        
        // Se for marcado como padrão, desmarcar outros
        if (Boolean.TRUE.equals(dto.getIsDefault()) && !template.getIsDefault()) {
            unsetOtherDefaults();
            template.setIsDefault(true);
        } else if (Boolean.FALSE.equals(dto.getIsDefault())) {
            template.setIsDefault(false);
        }
        
        template = templateRepository.save(template);
        return convertToDTO(template);
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deleting prayer template: {}", id);
        PrayerTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found: " + id));
        
        // Não deletar se for o padrão
        if (template.getIsDefault()) {
            throw new RuntimeException("Cannot delete default template");
        }
        
        template.setActive(false);
        templateRepository.save(template);
    }

    @Transactional
    public void setDefault(Long id) {
        log.info("Setting template {} as default", id);
        PrayerTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found: " + id));
        
        unsetOtherDefaults();
        template.setIsDefault(true);
        templateRepository.save(template);
    }

    public List<String> generateMessage(PrayerTemplate template, PrayerPersonDTO intercessor, List<PrayerPersonDTO> persons, Map<String, String> variables) {
        log.info("Generating message for intercessor: {} with {} persons", intercessor.getNome(), persons.size());
        
        // Preparar variáveis globais
        Map<String, String> globalVars = new HashMap<>(variables);
        globalVars.put("nome", intercessor.getNome() != null ? intercessor.getNome() : "");
        globalVars.put("data", java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        
        // Gerar header
        String header = replaceVariables(template.getHeader(), globalVars);
        
        // Gerar lista de nomes
        StringBuilder listaBuilder = new StringBuilder();
        String listFormat = template.getListFormat() != null && !template.getListFormat().trim().isEmpty() 
                ? template.getListFormat() 
                : "- [nome]";
        
        for (PrayerPersonDTO person : persons) {
            String line = listFormat;
            line = line.replace("[nome]", person.getNome() != null ? person.getNome() : "");
            line = line.replace("[tipo]", person.getTipo() != null ? person.getTipo().name() : "");
            line = line.replace("[telefone]", person.getCelular() != null ? person.getCelular() : "");
            listaBuilder.append(line).append("\n");
        }
        
        // Gerar body
        String body = replaceVariables(template.getBody(), globalVars);
        
        // Montar mensagem principal
        StringBuilder mainMessage = new StringBuilder();
        if (header != null && !header.trim().isEmpty()) {
            mainMessage.append(header).append("\n\n");
        }
        String listaStr = listaBuilder.toString().trim();
        if (!listaStr.isEmpty()) {
            mainMessage.append(listaStr);
        }
        if (body != null && !body.trim().isEmpty()) {
            if (mainMessage.length() > 0) {
                mainMessage.append("\n\n");
            }
            mainMessage.append(body);
        }
        
        // Criar lista de mensagens (principal + adicionais)
        List<String> messages = new java.util.ArrayList<>();
        String mainMsg = mainMessage.toString().trim();
        if (!mainMsg.isEmpty()) {
            messages.add(mainMsg);
        }
        
        // Adicionar mensagens adicionais
        if (template.getAdditionalMessages() != null) {
            for (String additionalMsg : template.getAdditionalMessages()) {
                if (additionalMsg != null && !additionalMsg.trim().isEmpty()) {
                    messages.add(replaceVariables(additionalMsg, globalVars));
                }
            }
        }
        
        return messages;
    }

    public String preview(Long id, Map<String, String> variables) {
        log.info("Generating preview for template: {}", id);
        PrayerTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found: " + id));
        
        // Dados de exemplo
        PrayerPersonDTO exampleIntercessor = new PrayerPersonDTO();
        exampleIntercessor.setNome(variables.getOrDefault("nome", "João Silva"));
        
        List<PrayerPersonDTO> examplePersons = new java.util.ArrayList<>();
        PrayerPersonDTO person1 = new PrayerPersonDTO();
        person1.setNome(variables.getOrDefault("pessoa1", "Maria Santos"));
        person1.setTipo(PrayerPerson.PersonType.ADULTO);
        person1.setCelular("(11) 99999-9999");
        examplePersons.add(person1);
        
        PrayerPersonDTO person2 = new PrayerPersonDTO();
        person2.setNome(variables.getOrDefault("pessoa2", "Pedro Oliveira"));
        person2.setTipo(PrayerPerson.PersonType.CRIANCA);
        person2.setCelular("(11) 88888-8888");
        examplePersons.add(person2);
        
        List<String> messages = generateMessage(template, exampleIntercessor, examplePersons, variables);
        return String.join("\n\n---\n\n", messages);
    }

    private void unsetOtherDefaults() {
        List<PrayerTemplate> defaults = templateRepository.findByIsDefault(true);
        for (PrayerTemplate t : defaults) {
            t.setIsDefault(false);
            templateRepository.save(t);
        }
    }

    private String replaceVariables(String text, Map<String, String> variables) {
        if (text == null) {
            return "";
        }
        
        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }

    private PrayerTemplateDTO convertToDTO(PrayerTemplate template) {
        PrayerTemplateDTO dto = new PrayerTemplateDTO();
        dto.setId(template.getId());
        dto.setName(template.getName());
        dto.setDescription(template.getDescription());
        dto.setIsDefault(template.getIsDefault());
        dto.setActive(template.getActive());
        dto.setHeader(template.getHeader());
        dto.setListFormat(template.getListFormat());
        dto.setBody(template.getBody());
        dto.setAdditionalMessages(template.getAdditionalMessages());
        dto.setVariables(template.getVariables());
        dto.setCreatedAt(template.getCreatedAt());
        dto.setUpdatedAt(template.getUpdatedAt());
        return dto;
    }

    private PrayerTemplate convertToEntity(PrayerTemplateDTO dto) {
        PrayerTemplate template = new PrayerTemplate();
        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false);
        template.setActive(dto.getActive() != null ? dto.getActive() : true);
        template.setHeader(dto.getHeader());
        template.setListFormat(dto.getListFormat());
        template.setBody(dto.getBody());
        template.setAdditionalMessages(dto.getAdditionalMessages());
        template.setVariables(dto.getVariables());
        return template;
    }
}

