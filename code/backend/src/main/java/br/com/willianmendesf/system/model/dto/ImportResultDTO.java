package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultDTO {
    private int totalRows;
    private int successCount;
    private int errorCount;
    private int updatedCount;
    private int createdCount;
    private List<String> errors = new ArrayList<>();
    
    public void addError(int rowNumber, String message) {
        errors.add(String.format("Linha %d: %s", rowNumber, message));
    }
}

