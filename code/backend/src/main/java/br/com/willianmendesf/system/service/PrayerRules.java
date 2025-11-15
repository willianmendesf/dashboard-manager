package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.IntercessorDistributionDTO;
import br.com.willianmendesf.system.model.dto.PrayerConfigDTO;
import br.com.willianmendesf.system.model.dto.PrayerPersonDTO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@AllArgsConstructor
public class PrayerRules {

    private final PrayerHistoryService historyService;

    /**
     * Regra 2: Não orar por si mesmo
     */
    public boolean podeOrarPorPessoa(String nomeIntercessor, String nomePessoa) {
        return !nomeIntercessor.equals(nomePessoa);
    }

    /**
     * Regra 3: Unicidade semanal
     */
    public boolean jaFoiAtribuidoNaSemana(String nomePessoa, Set<String> atribuidosNaSemana) {
        return atribuidosNaSemana.contains(nomePessoa);
    }

    /**
     * Regra 4: Não repetir até completar ciclo
     */
    public boolean jaRecebeuPessoaNoHistorico(String nomeIntercessor, String nomePessoa, 
                                               Map<String, Set<String>> historySets, 
                                               int totalPessoas, String campoNome) {
        Set<String> pessoasRecebidas = historySets.getOrDefault(nomeIntercessor, new HashSet<>());
        
        // Regra 7: Se já recebeu todos, pode receber qualquer um novamente
        if (pessoasRecebidas.size() >= totalPessoas - 1) {
            return false;
        }
        
        // Regra 4: Se não completou o ciclo, verificar se já recebeu esta pessoa específica
        return pessoasRecebidas.contains(nomePessoa);
    }

    /**
     * Regra 5: Máximo de nomes por intercessor
     */
    public boolean podeReceberMaisNomes(IntercessorDistributionDTO distribuicaoIntercessor, int maxPorIntercessor) {
        return distribuicaoIntercessor.getPrayerList().size() < maxPorIntercessor;
    }

    /**
     * Regra 5 - Flexibilizada: Verifica se pode flexibilizar o limite quando todos atingiram o máximo
     */
    public boolean podeFlexibilizarLimite(List<IntercessorDistributionDTO> distribuicaoCompleta, int maxPorIntercessor) {
        return distribuicaoCompleta.stream()
                .allMatch(inter -> inter.getPrayerList().size() >= maxPorIntercessor);
    }

    /**
     * Regra 5 - Flexibilizada: Máximo de nomes considerando flexibilização
     */
    public boolean podeReceberMaisNomesFlexivel(IntercessorDistributionDTO distribuicaoIntercessor, 
                                                 int maxPorIntercessor, 
                                                 List<IntercessorDistributionDTO> distribuicaoCompleta, 
                                                 int limiteFlexivel) {
        int limiteAtual = podeFlexibilizarLimite(distribuicaoCompleta, maxPorIntercessor) 
                ? limiteFlexivel 
                : maxPorIntercessor;
        
        return distribuicaoIntercessor.getPrayerList().size() < limiteAtual;
    }

    /**
     * Regra 1: Máximo de 1 criança por intercessor (se possível)
     */
    public boolean jaTemCrianca(IntercessorDistributionDTO distribuicaoIntercessor) {
        return distribuicaoIntercessor.getPrayerList().stream()
                .anyMatch(p -> p.getTipo() == br.com.willianmendesf.system.model.entity.PrayerPerson.PersonType.CRIANCA);
    }

    /**
     * Regra 8: Constrói contadores de crianças recebidas por intercessor
     */
    public Map<String, Integer> construirContadorCriancas(Map<String, Set<String>> historySets, 
                                                           List<PrayerPersonDTO> allPersons) {
        Map<String, Integer> contadorCriancas = new HashMap<>();
        
        // Inicializar contadores
        for (String intercessorName : historySets.keySet()) {
            contadorCriancas.put(intercessorName, 0);
        }
        
        // Contar crianças no histórico (precisa buscar do histórico completo)
        Map<String, List<br.com.willianmendesf.system.model.dto.PrayerDistributionDTO>> fullHistory = historyService.readHistory(
                java.time.LocalDate.now().minusYears(10), 
                java.time.LocalDate.now()
        );
        
        // Processar histórico para contar crianças
        for (Map.Entry<String, List<br.com.willianmendesf.system.model.dto.PrayerDistributionDTO>> entry : fullHistory.entrySet()) {
            for (br.com.willianmendesf.system.model.dto.PrayerDistributionDTO dist : entry.getValue()) {
                String intercessorName = dist.getIntercessor() != null ? dist.getIntercessor().getNome() : null;
                if (intercessorName == null) continue;
                
                List<Map<String, Object>> persons = dist.getDistributedPersons();
                if (persons == null) continue;
                
                for (Map<String, Object> person : persons) {
                    String tipo = (String) person.get("tipo");
                    if (tipo != null && (tipo.equalsIgnoreCase("CRIANCA") || tipo.equalsIgnoreCase("criança"))) {
                        contadorCriancas.put(intercessorName, contadorCriancas.getOrDefault(intercessorName, 0) + 1);
                    }
                }
            }
        }
        
        return contadorCriancas;
    }

    /**
     * Utilitário: Ordenar intercessores por histórico geral (quem orou por menos pessoas)
     */
    public List<IntercessorDistributionDTO> ordenarPorHistoricoGeral(List<IntercessorDistributionDTO> distribuicao, 
                                                                      Map<String, Set<String>> historySets) {
        return distribuicao.stream()
                .sorted(Comparator.comparingInt(inter -> {
                    String nome = inter.getIntercessor().getNome();
                    return historySets.getOrDefault(nome, new HashSet<>()).size();
                }))
                .collect(Collectors.toList());
    }

    /**
     * Utilitário: Ordenar intercessores por contador de crianças
     */
    public List<IntercessorDistributionDTO> ordenarPorContadorCriancas(List<IntercessorDistributionDTO> distribuicao, 
                                                                        Map<String, Integer> contadorCriancas) {
        return distribuicao.stream()
                .sorted(Comparator.comparingInt(inter -> {
                    String nome = inter.getIntercessor().getNome();
                    return contadorCriancas.getOrDefault(nome, 0);
                }))
                .collect(Collectors.toList());
    }

    /**
     * Utilitário: Embaralhar array (algoritmo Fisher-Yates)
     */
    public <T> List<T> embaralharArray(List<T> array) {
        List<T> arrayEmbaralhado = new ArrayList<>(array);
        Random random = new Random();
        for (int i = arrayEmbaralhado.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            T temp = arrayEmbaralhado.get(i);
            arrayEmbaralhado.set(i, arrayEmbaralhado.get(j));
            arrayEmbaralhado.set(j, temp);
        }
        return arrayEmbaralhado;
    }

    /**
     * Utilitário: Separar pessoas por tipo
     */
    public Map<String, List<PrayerPersonDTO>> separarPorTipo(List<PrayerPersonDTO> pessoas) {
        Map<String, List<PrayerPersonDTO>> result = new HashMap<>();
        List<PrayerPersonDTO> criancas = new ArrayList<>();
        List<PrayerPersonDTO> adultos = new ArrayList<>();
        
        for (PrayerPersonDTO pessoa : pessoas) {
            if (pessoa.getTipo() == br.com.willianmendesf.system.model.entity.PrayerPerson.PersonType.CRIANCA) {
                criancas.add(pessoa);
            } else {
                adultos.add(pessoa);
            }
        }
        
        result.put("criancas", criancas);
        result.put("adultos", adultos);
        return result;
    }

    /**
     * Utilitário: Construir conjuntos de histórico
     */
    public Map<String, Set<String>> construirConjuntosHistorico(List<PrayerPersonDTO> allPersons) {
        Map<String, Set<String>> historySets = new HashMap<>();
        Map<String, List<br.com.willianmendesf.system.model.dto.PrayerDistributionDTO>> fullHistory = historyService.readHistory(
                java.time.LocalDate.now().minusYears(10), 
                java.time.LocalDate.now()
        );
        
        for (Map.Entry<String, List<br.com.willianmendesf.system.model.dto.PrayerDistributionDTO>> entry : fullHistory.entrySet()) {
            for (br.com.willianmendesf.system.model.dto.PrayerDistributionDTO dist : entry.getValue()) {
                String intercessorName = dist.getIntercessor() != null ? dist.getIntercessor().getNome() : null;
                if (intercessorName == null) continue;
                
                historySets.putIfAbsent(intercessorName, new HashSet<>());
                
                List<Map<String, Object>> persons = dist.getDistributedPersons();
                if (persons == null) continue;
                
                for (Map<String, Object> person : persons) {
                    String personName = (String) person.get("nome");
                    if (personName != null) {
                        historySets.get(intercessorName).add(personName);
                    }
                }
            }
        }
        
        return historySets;
    }
}

