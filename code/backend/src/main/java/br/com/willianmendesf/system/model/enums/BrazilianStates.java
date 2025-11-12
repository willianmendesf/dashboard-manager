package br.com.willianmendesf.system.model.enums;

import java.util.Arrays;
import java.util.List;

public class BrazilianStates {
    
    public static final List<String> ESTADOS = Arrays.asList(
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", 
        "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", 
        "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    );
    
    public static final List<String> ESTADOS_NOMES = Arrays.asList(
        "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", 
        "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão", 
        "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", 
        "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", 
        "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", 
        "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
    );
    
    public static boolean isValid(String estado) {
        return ESTADOS.contains(estado != null ? estado.toUpperCase() : null);
    }
}

