package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.dto.*;
import br.com.willianmendesf.system.model.entity.PrayerDistribution;
import br.com.willianmendesf.system.model.entity.PrayerPerson;
import br.com.willianmendesf.system.model.entity.PrayerTemplate;
import br.com.willianmendesf.system.repository.PrayerDistributionRepository;
import br.com.willianmendesf.system.repository.PrayerPersonRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PrayerDistributionService {

    private final PrayerPersonService personService;
    private final PrayerRules rules;
    private final PrayerHistoryService historyService;
    private final PrayerCycleService cycleService;
    private final PrayerConfigService configService;
    private final PrayerDistributionRepository distributionRepository;
    private final PrayerPersonRepository personRepository;
    private final PrayerTemplateService prayerTemplateService;
    private final WhatsappMessageService whatsappMessageService;

    public PrayerDistributionResponse generateDistribution(PrayerDistributionRequest request) {
        log.info("Generating prayer distribution");
        
        PrayerConfigDTO config = request.getConfig() != null ? request.getConfig() : configService.getConfig();
        
        // Obter intercessores e candidatos
        List<PrayerPersonDTO> intercessorsRaw = personService.getIntercessors();
        List<PrayerPersonDTO> candidatesRaw = request.getPersonIds() != null && !request.getPersonIds().isEmpty()
                ? request.getPersonIds().stream()
                    .map(id -> personService.getById(id))
                    .filter(p -> Boolean.TRUE.equals(p.getActive()))
                    .collect(Collectors.toList())
                : personService.getCandidates();
        
        if (intercessorsRaw.isEmpty()) {
            throw new RuntimeException("Nenhum intercessor encontrado na lista");
        }
        if (candidatesRaw.isEmpty()) {
            throw new RuntimeException("Nenhuma pessoa para receber oração encontrada");
        }
        
        int totalCandidates = candidatesRaw.size();
        
        // Sistema de múltiplas tentativas
        List<IntercessorDistributionDTO> result;
        if (config.getResetAntecipado().getTentativasHabilitadas()) {
            result = generateDistributionWithRetries(intercessorsRaw, candidatesRaw, totalCandidates, config);
        } else {
            result = generateDistributionSingle(intercessorsRaw, candidatesRaw, totalCandidates, config);
        }
        
        // Calcular estatísticas
        DistributionStatisticsDTO statistics = calculateStatistics(result, candidatesRaw);
        
        // Salvar distribuições no banco
        saveDistributions(result);
        
        return new PrayerDistributionResponse(result, statistics);
    }

    private List<IntercessorDistributionDTO> generateDistributionSingle(
            List<PrayerPersonDTO> intercessorsRaw, 
            List<PrayerPersonDTO> candidatesRaw, 
            int totalCandidates,
            PrayerConfigDTO config) {
        
        // Inicializar estruturas de distribuição
        List<IntercessorDistributionDTO> intercessors = intercessorsRaw.stream()
                .map(inter -> {
                    IntercessorDistributionDTO dist = new IntercessorDistributionDTO();
                    dist.setIntercessor(inter);
                    dist.setPrayerList(new ArrayList<>());
                    return dist;
                })
                .collect(Collectors.toList());
        
        // Separar candidatos por tipo
        Map<String, List<PrayerPersonDTO>> separated = rules.separarPorTipo(candidatesRaw);
        List<PrayerPersonDTO> criancas = separated.get("criancas");
        List<PrayerPersonDTO> adultos = separated.get("adultos");
        
        // Estado da semana
        Set<String> assigned = new HashSet<>();
        
        // Construir histórico
        Map<String, Set<String>> historySets = rules.construirConjuntosHistorico(candidatesRaw);
        
        // Verificar e resetar ciclos completados
        verifyAndResetCycles(intercessors, historySets, candidatesRaw, config);
        
        // Aplicar rodadas de distribuição
        distributeChildren(intercessors, criancas, assigned, historySets, config, totalCandidates);
        distributeAdultsRounds(intercessors, adultos, assigned, historySets, config, 2, totalCandidates);
        distributeThirdByHistory(intercessors, adultos, criancas, assigned, historySets, config, totalCandidates);
        distributeFourthFlexible(intercessors, adultos, criancas, assigned, historySets, totalCandidates, config);
        
        return intercessors;
    }

    private void distributeChildren(List<IntercessorDistributionDTO> intercessors, 
                                   List<PrayerPersonDTO> childrenPool, 
                                   Set<String> assignedSet, 
                                   Map<String, Set<String>> historySets,
                                   PrayerConfigDTO config,
                                   int totalCandidates) {
        if (childrenPool.isEmpty()) return;
        
        Map<String, Integer> childCounts = rules.construirContadorCriancas(historySets, new ArrayList<>());
        List<IntercessorDistributionDTO> intercessorsByChildCount = rules.ordenarPorContadorCriancas(intercessors, childCounts);
        List<PrayerPersonDTO> shuffledChildren = rules.embaralharArray(childrenPool);
        
        // 1ª passada: máximo 1 criança por intercessor
        for (IntercessorDistributionDTO inter : intercessorsByChildCount) {
            if (!rules.podeReceberMaisNomes(inter, config.getMaxPorIntercessor())) continue;
            if (rules.jaTemCrianca(inter)) continue;
            
            List<PrayerPersonDTO> eligible = getEligibleTargets(inter, shuffledChildren, assignedSet, historySets, totalCandidates, "crianca");
            if (!eligible.isEmpty()) {
                PrayerPersonDTO pick = eligible.get(0);
                inter.getPrayerList().add(pick);
                assignedSet.add(pick.getNome());
            }
        }
        
        // 2ª passada: distribuir crianças restantes
        List<PrayerPersonDTO> remainingChildren = shuffledChildren.stream()
                .filter(c -> !assignedSet.contains(c.getNome()))
                .collect(Collectors.toList());
        
        if (remainingChildren.isEmpty()) return;
        
        for (IntercessorDistributionDTO inter : intercessors) {
            if (!rules.podeReceberMaisNomes(inter, config.getMaxPorIntercessor())) continue;
            
            List<PrayerPersonDTO> eligible = getEligibleTargets(inter, remainingChildren, assignedSet, historySets, totalCandidates, "crianca");
            if (!eligible.isEmpty()) {
                PrayerPersonDTO pick = eligible.get(0);
                inter.getPrayerList().add(pick);
                assignedSet.add(pick.getNome());
            }
        }
        
        log.info("Crianças distribuídas!");
    }

    private void distributeAdultsRounds(List<IntercessorDistributionDTO> intercessors, 
                                       List<PrayerPersonDTO> adultsPool, 
                                       Set<String> assignedSet, 
                                       Map<String, Set<String>> historySets,
                                       PrayerConfigDTO config,
                                       int rounds,
                                       int totalCandidates) {
        if (adultsPool.isEmpty()) return;
        List<PrayerPersonDTO> shuffledAdults = rules.embaralharArray(adultsPool);
        
        for (int r = 0; r < rounds; r++) {
            List<IntercessorDistributionDTO> intercessorsByHistory = rules.ordenarPorHistoricoGeral(intercessors, historySets);
            log.info("Rodada {} de adultos - Priorização por histórico aplicada", r + 1);
            
            for (IntercessorDistributionDTO inter : intercessorsByHistory) {
                if (!rules.podeReceberMaisNomes(inter, config.getMaxPorIntercessor())) continue;
                
                List<PrayerPersonDTO> eligible = getEligibleTargets(inter, shuffledAdults, assignedSet, historySets, totalCandidates, "adulto");
                if (!eligible.isEmpty()) {
                    PrayerPersonDTO pick = eligible.get(0);
                    inter.getPrayerList().add(pick);
                    assignedSet.add(pick.getNome());
                }
            }
        }
    }

    private void distributeThirdByHistory(List<IntercessorDistributionDTO> intercessors, 
                                         List<PrayerPersonDTO> adultsPool, 
                                         List<PrayerPersonDTO> childrenPool, 
                                         Set<String> assignedSet, 
                                         Map<String, Set<String>> historySets,
                                         PrayerConfigDTO config,
                                         int totalCandidates) {
        List<IntercessorDistributionDTO> sorted = rules.ordenarPorHistoricoGeral(intercessors, historySets);
        List<PrayerPersonDTO> shuffledAdults = rules.embaralharArray(adultsPool);
        List<PrayerPersonDTO> shuffledChildren = rules.embaralharArray(childrenPool);
        
        for (IntercessorDistributionDTO inter : sorted) {
            if (!rules.podeReceberMaisNomes(inter, config.getMaxPorIntercessor())) continue;
            
            // Priorizar adultos
            List<PrayerPersonDTO> eligible = getEligibleTargets(inter, shuffledAdults, assignedSet, historySets, totalCandidates, "adulto");
            
            // Se não houver adultos, tentar crianças
            if (eligible.isEmpty()) {
                List<PrayerPersonDTO> remainingChildren = shuffledChildren.stream()
                        .filter(c -> !assignedSet.contains(c.getNome()))
                        .collect(Collectors.toList());
                eligible = getEligibleTargets(inter, remainingChildren, assignedSet, historySets, totalCandidates, "crianca");
            }
            
            if (!eligible.isEmpty()) {
                PrayerPersonDTO pick = eligible.get(0);
                inter.getPrayerList().add(pick);
                assignedSet.add(pick.getNome());
            }
        }
    }

    private void distributeFourthFlexible(List<IntercessorDistributionDTO> intercessors, 
                                         List<PrayerPersonDTO> adultsPool, 
                                         List<PrayerPersonDTO> childrenPool, 
                                         Set<String> assignedSet, 
                                         Map<String, Set<String>> historySets,
                                         int totalCandidates,
                                         PrayerConfigDTO config) {
        int remainingCount = totalCandidates - assignedSet.size();
        if (remainingCount == 0) return;
        
        boolean canFlexibilize = rules.podeFlexibilizarLimite(intercessors, config.getMaxPorIntercessor());
        if (!canFlexibilize) {
            log.info("Flexibilização não aplicada: nem todos atingiram o limite de {} nomes", config.getMaxPorIntercessor());
            return;
        }
        
        log.info("Iniciando distribuição flexível: {} pessoas restantes", remainingCount);
        log.info("Limite flexibilizado de {} para {} nomes", config.getMaxPorIntercessor(), config.getLimiteFlexivel());
        
        List<IntercessorDistributionDTO> intercessorsByHistory = rules.ordenarPorHistoricoGeral(intercessors, historySets);
        List<PrayerPersonDTO> shuffledAdults = rules.embaralharArray(adultsPool);
        List<PrayerPersonDTO> shuffledChildren = rules.embaralharArray(childrenPool);
        
        for (IntercessorDistributionDTO inter : intercessorsByHistory) {
            if (!rules.podeReceberMaisNomesFlexivel(inter, config.getMaxPorIntercessor(), intercessors, config.getLimiteFlexivel())) continue;
            
            // Tentar adultos primeiro
            List<PrayerPersonDTO> eligible = getEligibleTargets(inter, shuffledAdults, assignedSet, historySets, totalCandidates, "adulto");
            
            // Se não houver adultos, tentar crianças
            if (eligible.isEmpty()) {
                List<PrayerPersonDTO> remainingChildren = shuffledChildren.stream()
                        .filter(c -> !assignedSet.contains(c.getNome()))
                        .collect(Collectors.toList());
                eligible = getEligibleTargets(inter, remainingChildren, assignedSet, historySets, totalCandidates, "crianca");
            }
            
            if (!eligible.isEmpty()) {
                PrayerPersonDTO pick = eligible.get(0);
                inter.getPrayerList().add(pick);
                assignedSet.add(pick.getNome());
            }
        }
    }

    private List<PrayerPersonDTO> getEligibleTargets(IntercessorDistributionDTO inter, 
                                                     List<PrayerPersonDTO> pool, 
                                                     Set<String> assignedSet, 
                                                     Map<String, Set<String>> historySets,
                                                     int totalPessoas,
                                                     String preferType) {
        String interName = inter.getIntercessor().getNome();
        
        List<PrayerPersonDTO> filtered = pool.stream()
                .filter(candidate -> {
                    String targetName = candidate.getNome();
                    if (targetName == null) return false;
                    
                    // Aplicar todas as regras
                    if (!rules.podeOrarPorPessoa(interName, targetName)) return false;
                    if (rules.jaFoiAtribuidoNaSemana(targetName, assignedSet)) return false;
                    if (rules.jaRecebeuPessoaNoHistorico(interName, targetName, historySets, totalPessoas, "nome")) return false;
                    
                    return true;
                })
                .collect(Collectors.toList());
        
        // Aplicar preferência de tipo se especificada
        if (preferType != null) {
            final String finalPreferType = preferType;
            filtered = filtered.stream()
                    .sorted((a, b) -> {
                        boolean aMatches = finalPreferType.equals("crianca") 
                                ? a.getTipo() == PrayerPerson.PersonType.CRIANCA 
                                : a.getTipo() != PrayerPerson.PersonType.CRIANCA;
                        boolean bMatches = finalPreferType.equals("crianca") 
                                ? b.getTipo() == PrayerPerson.PersonType.CRIANCA 
                                : b.getTipo() != PrayerPerson.PersonType.CRIANCA;
                        return Boolean.compare(bMatches, aMatches);
                    })
                    .collect(Collectors.toList());
        }
        
        return filtered;
    }

    private void verifyAndResetCycles(List<IntercessorDistributionDTO> intercessors, 
                                     Map<String, Set<String>> historySets, 
                                     List<PrayerPersonDTO> allPersons,
                                     PrayerConfigDTO config) {
        int totalAlvos = allPersons.size();
        int resetCount = 0;
        
        for (IntercessorDistributionDTO inter : intercessors) {
            String nomeInter = inter.getIntercessor().getNome();
            int contagemUnica = historySets.getOrDefault(nomeInter, new HashSet<>()).size();
            int totalAlvosExcluindoSiMesmo = totalAlvos - 1;
            
            if (contagemUnica >= totalAlvosExcluindoSiMesmo) {
                log.info("Resetando ciclo para: {} (orou por {}/{} pessoas)", nomeInter, contagemUnica, totalAlvosExcluindoSiMesmo);
                
                // Registrar ciclo completado
                cycleService.saveCycleCompleted(inter.getIntercessor().getId());
                
                // Limpar histórico do intercessor
                boolean limpo = historyService.clearHistoryFor(inter.getIntercessor().getId());
                if (limpo) {
                    historySets.put(nomeInter, new HashSet<>());
                    resetCount++;
                    log.info("Reset completo para: {}", nomeInter);
                }
            }
        }
        
        if (resetCount > 0) {
            log.info("Total de ciclos resetados: {}", resetCount);
        }
    }

    private List<IntercessorDistributionDTO> generateDistributionWithRetries(
            List<PrayerPersonDTO> intercessorsRaw, 
            List<PrayerPersonDTO> candidatesRaw, 
            int totalCandidates,
            PrayerConfigDTO config) {
        // Implementação simplificada - retorna distribuição única por enquanto
        // TODO: Implementar sistema completo de múltiplas tentativas
        return generateDistributionSingle(intercessorsRaw, candidatesRaw, totalCandidates, config);
    }

    private int contarPessoasDistribuidas(List<IntercessorDistributionDTO> intercessors) {
        Set<String> distribuidas = new HashSet<>();
        for (IntercessorDistributionDTO inter : intercessors) {
            for (PrayerPersonDTO person : inter.getPrayerList()) {
                distribuidas.add(person.getNome());
            }
        }
        return distribuidas.size();
    }

    private DistributionStatisticsDTO calculateStatistics(List<IntercessorDistributionDTO> distributions, 
                                                         List<PrayerPersonDTO> allCandidates) {
        DistributionStatisticsDTO stats = new DistributionStatisticsDTO();
        stats.setTotalIntercessors(distributions.size());
        stats.setTotalCandidates(allCandidates.size());
        
        Set<String> distributed = new HashSet<>();
        int totalChildren = 0;
        int totalAdults = 0;
        
        for (IntercessorDistributionDTO dist : distributions) {
            for (PrayerPersonDTO person : dist.getPrayerList()) {
                distributed.add(person.getNome());
                if (person.getTipo() == PrayerPerson.PersonType.CRIANCA) {
                    totalChildren++;
                } else {
                    totalAdults++;
                }
            }
        }
        
        stats.setTotalDistributed(distributed.size());
        stats.setTotalNotDistributed(allCandidates.size() - distributed.size());
        stats.setDistributionRate(allCandidates.size() > 0 
                ? (double) distributed.size() / allCandidates.size() 
                : 0.0);
        stats.setTotalChildren(totalChildren);
        stats.setTotalAdults(totalAdults);
        
        return stats;
    }

    @Transactional
    private void saveDistributions(List<IntercessorDistributionDTO> distributions) {
        LocalDate today = LocalDate.now();
        
        for (IntercessorDistributionDTO dist : distributions) {
            if (dist.getPrayerList().isEmpty()) continue;
            
            PrayerPerson intercessor = personRepository.findById(dist.getIntercessor().getId())
                    .orElseThrow(() -> new RuntimeException("Intercessor not found"));
            
            PrayerDistribution distribution = new PrayerDistribution();
            distribution.setDistributionDate(today);
            distribution.setIntercessor(intercessor);
            distribution.setTotalDistributed(dist.getPrayerList().size());
            distribution.setStatus(PrayerDistribution.DistributionStatus.PENDING);
            
            // Converter lista de pessoas para formato JSON
            List<Map<String, Object>> distributedPersons = dist.getPrayerList().stream()
                    .map(p -> {
                        Map<String, Object> personMap = new HashMap<>();
                        personMap.put("nome", p.getNome());
                        personMap.put("tipo", p.getTipo() != null ? p.getTipo().name() : null);
                        personMap.put("celular", p.getCelular());
                        return personMap;
                    })
                    .collect(Collectors.toList());
            
            distribution.setDistributedPersons(distributedPersons);
            distributionRepository.save(distribution);
        }
    }

    @Transactional
    public void resendMessage(Long distributionId, Long intercessorId) {
        log.info("Resending message for distribution ID: {} and intercessor ID: {}", distributionId, intercessorId);
        
        // Buscar distribuição
        PrayerDistribution distribution = distributionRepository.findById(distributionId)
                .orElseThrow(() -> new RuntimeException("Distribution not found: " + distributionId));
        
        // Verificar se é do intercessor correto
        if (!distribution.getIntercessor().getId().equals(intercessorId)) {
            throw new RuntimeException("Distribution does not belong to intercessor: " + intercessorId);
        }
        
        // Buscar intercessor atualizado
        PrayerPersonDTO intercessorDTO = personService.getById(intercessorId);
        
        // Converter distributedPersons de volta para PrayerPersonDTO
        List<PrayerPersonDTO> prayerList = distribution.getDistributedPersons().stream()
                .map(personMap -> {
                    PrayerPersonDTO dto = new PrayerPersonDTO();
                    dto.setNome((String) personMap.get("nome"));
                    String tipoStr = (String) personMap.get("tipo");
                    if (tipoStr != null) {
                        dto.setTipo(PrayerPerson.PersonType.valueOf(tipoStr));
                    }
                    dto.setCelular((String) personMap.get("celular"));
                    return dto;
                })
                .collect(Collectors.toList());
        
        // Buscar template padrão
        PrayerTemplateDTO templateDTO = prayerTemplateService.getDefault();
        PrayerTemplate template = convertTemplateDTOToEntity(templateDTO);
        
        try {
            // Gerar mensagens
            List<String> messages = prayerTemplateService.generateMessage(
                    template,
                    intercessorDTO,
                    prayerList,
                    new HashMap<>()
            );
            
            // Enviar cada mensagem via WhatsApp
            for (String message : messages) {
                if (intercessorDTO.getCelular() == null || intercessorDTO.getCelular().trim().isEmpty()) {
                    throw new RuntimeException("Intercessor não tem celular configurado");
                }
                
                WhatsappSender sender = new WhatsappSender();
                sender.setPhone(intercessorDTO.getCelular());
                sender.setMessage(message);
                whatsappMessageService.sendMessage(sender);
            }
            
            // Atualizar status
            distribution.setStatus(PrayerDistribution.DistributionStatus.SENT);
            distribution.setSentAt(LocalDateTime.now());
            distributionRepository.save(distribution);
            
            log.info("Message resent successfully for distribution ID: {}", distributionId);
        } catch (Exception e) {
            log.error("Error resending message for distribution ID {}: {}", distributionId, e.getMessage(), e);
            
            // Atualizar status como FAILED
            distribution.setStatus(PrayerDistribution.DistributionStatus.FAILED);
            distributionRepository.save(distribution);
            
            throw new RuntimeException("Failed to resend message: " + e.getMessage(), e);
        }
    }

    private PrayerTemplate convertTemplateDTOToEntity(PrayerTemplateDTO dto) {
        PrayerTemplate template = new PrayerTemplate();
        template.setId(dto.getId());
        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setIsDefault(dto.getIsDefault());
        template.setActive(dto.getActive());
        template.setHeader(dto.getHeader());
        template.setListFormat(dto.getListFormat());
        template.setBody(dto.getBody());
        template.setAdditionalMessages(dto.getAdditionalMessages());
        template.setVariables(dto.getVariables());
        return template;
    }
}

