package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.ImportResultDTO;
import br.com.willianmendesf.system.model.entity.VisitorEntity;
import br.com.willianmendesf.system.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitorImportService {

    private final VisitorRepository repository;

    @Transactional
    public ImportResultDTO importVisitors(MultipartFile file) {
        ImportResultDTO result = new ImportResultDTO();
        
        if (file == null || file.isEmpty()) {
            result.addError(0, "Arquivo vazio ou não fornecido");
            return result;
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            result.addError(0, "Nome do arquivo não disponível");
            return result;
        }

        try {
            if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                return importFromExcel(file, result);
            } else if (fileName.endsWith(".csv")) {
                return importFromCsv(file, result);
            } else {
                result.addError(0, "Formato de arquivo não suportado. Use .xlsx ou .csv");
                return result;
            }
        } catch (Exception e) {
            log.error("Error importing visitors from file: {}", fileName, e);
            result.addError(0, "Erro ao processar arquivo: " + e.getMessage());
            return result;
        }
    }

    private ImportResultDTO importFromExcel(MultipartFile file, ImportResultDTO result) throws Exception {
        List<VisitorEntity> visitorsToSave = new ArrayList<>();
        
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            result.setTotalRows(sheet.getLastRowNum());
            
            // Skip header row (row 0)
            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) continue;
                
                // Skip completely empty rows
                boolean hasData = false;
                for (int cellIndex = 0; cellIndex < row.getLastCellNum(); cellIndex++) {
                    Cell cell = row.getCell(cellIndex);
                    if (cell != null) {
                        String value = getCellValueAsString(cell);
                        if (value != null && !value.trim().isEmpty()) {
                            hasData = true;
                            break;
                        }
                    }
                }
                if (!hasData) continue;
                
                try {
                    VisitorEntity visitor = parseVisitorFromExcelRow(row, rowIndex + 1, result);
                    if (visitor != null) {
                        visitorsToSave.add(visitor);
                    }
                } catch (Exception e) {
                    result.addError(rowIndex + 1, "Erro ao processar linha: " + e.getMessage());
                    result.setErrorCount(result.getErrorCount() + 1);
                }
            }
        }
        
        // Batch save all visitors
        if (!visitorsToSave.isEmpty()) {
            try {
                List<VisitorEntity> savedVisitors = repository.saveAll(visitorsToSave);
                result.setSuccessCount(savedVisitors.size());
                result.setCreatedCount(savedVisitors.size());
            } catch (Exception e) {
                log.error("Error saving visitors batch: {}", e.getMessage(), e);
                result.addError(0, "Erro ao salvar visitantes: " + e.getMessage());
            }
        }
        
        return result;
    }

    private ImportResultDTO importFromCsv(MultipartFile file, ImportResultDTO result) throws Exception {
        List<VisitorEntity> visitorsToSave = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"))) {
            String line;
            int rowNumber = 0;
            
            // Skip header row
            reader.readLine();
            rowNumber++;
            
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                try {
                    String[] values = parseCsvLine(line);
                    VisitorEntity visitor = parseVisitorFromCsvRow(values, rowNumber, result);
                    if (visitor != null) {
                        visitorsToSave.add(visitor);
                    }
                } catch (Exception e) {
                    result.addError(rowNumber, "Erro ao processar linha: " + e.getMessage());
                    result.setErrorCount(result.getErrorCount() + 1);
                }
            }
            
            result.setTotalRows(rowNumber - 1); // Exclude header
        }
        
        // Batch save all visitors
        if (!visitorsToSave.isEmpty()) {
            try {
                List<VisitorEntity> savedVisitors = repository.saveAll(visitorsToSave);
                result.setSuccessCount(savedVisitors.size());
                result.setCreatedCount(savedVisitors.size());
            } catch (Exception e) {
                log.error("Error saving visitors batch: {}", e.getMessage(), e);
                result.addError(0, "Erro ao salvar visitantes: " + e.getMessage());
            }
        }
        
        return result;
    }

    private VisitorEntity parseVisitorFromExcelRow(Row row, int rowNumber, ImportResultDTO result) {
        try {
            String nomeCompleto = getCellValueAsString(row.getCell(0));
            if (nomeCompleto == null || nomeCompleto.trim().isEmpty()) {
                result.addError(rowNumber, "Nome Completo é obrigatório");
                return null;
            }
            
            VisitorEntity visitor = new VisitorEntity();
            visitor.setNomeCompleto(nomeCompleto.trim());
            
            // Data Visita (coluna 1)
            String dataVisitaStr = getCellValueAsString(row.getCell(1));
            if (dataVisitaStr != null && !dataVisitaStr.trim().isEmpty()) {
                try {
                    LocalDate dataVisita = parseDate(dataVisitaStr);
                    if (dataVisita != null) {
                        visitor.setDataVisita(dataVisita);
                    } else {
                        visitor.setDataVisita(LocalDate.now());
                    }
                } catch (Exception e) {
                    log.warn("Invalid date format at row {}: {}", rowNumber, dataVisitaStr);
                    visitor.setDataVisita(LocalDate.now());
                }
            } else {
                visitor.setDataVisita(LocalDate.now());
            }
            
            // Telefone (coluna 2)
            String telefone = getCellValueAsString(row.getCell(2));
            if (telefone != null && !telefone.trim().isEmpty()) {
                visitor.setTelefone(telefone.trim());
            }
            
            // Já Frequenta Igreja? (coluna 3)
            String jaFrequentaIgreja = getCellValueAsString(row.getCell(3));
            if (jaFrequentaIgreja != null && !jaFrequentaIgreja.trim().isEmpty()) {
                visitor.setJaFrequentaIgreja(jaFrequentaIgreja.trim());
            }
            
            // Está à Procura de Igreja? (coluna 4)
            String procuraIgreja = getCellValueAsString(row.getCell(4));
            if (procuraIgreja != null && !procuraIgreja.trim().isEmpty()) {
                visitor.setProcuraIgreja(procuraIgreja.trim());
            }
            
            // É de SP? (coluna 5)
            Boolean eDeSP = getCellValueAsBoolean(row.getCell(5));
            visitor.setEDeSP(eDeSP != null ? eDeSP : false);
            
            // Estado (coluna 6) - apenas se não for SP
            if (Boolean.FALSE.equals(visitor.getEDeSP())) {
                String estado = getCellValueAsString(row.getCell(6));
                if (estado != null && !estado.trim().isEmpty()) {
                    visitor.setEstado(estado.trim().toUpperCase());
                }
            }
            
            return visitor;
        } catch (Exception e) {
            log.error("Error parsing row {}: {}", rowNumber, e.getMessage(), e);
            result.addError(rowNumber, "Erro ao processar: " + e.getMessage());
            return null;
        }
    }

    private VisitorEntity parseVisitorFromCsvRow(String[] values, int rowNumber, ImportResultDTO result) {
        try {
            String nomeCompleto = (values.length > 0 && values[0] != null) ? values[0].trim() : "";
            if (nomeCompleto.isEmpty()) {
                result.addError(rowNumber, "Nome Completo é obrigatório");
                return null;
            }
            
            VisitorEntity visitor = new VisitorEntity();
            visitor.setNomeCompleto(nomeCompleto);
            
            // Data Visita (coluna 1)
            String dataVisitaStr = (values.length > 1 && values[1] != null) ? values[1].trim() : "";
            if (!dataVisitaStr.isEmpty()) {
                try {
                    LocalDate dataVisita = parseDate(dataVisitaStr);
                    if (dataVisita != null) {
                        visitor.setDataVisita(dataVisita);
                    } else {
                        visitor.setDataVisita(LocalDate.now());
                    }
                } catch (Exception e) {
                    log.warn("Invalid date format at row {}: {}", rowNumber, dataVisitaStr);
                    visitor.setDataVisita(LocalDate.now());
                }
            } else {
                visitor.setDataVisita(LocalDate.now());
            }
            
            // Telefone (coluna 2)
            String telefone = (values.length > 2 && values[2] != null) ? values[2].trim() : "";
            if (!telefone.isEmpty()) {
                visitor.setTelefone(telefone);
            }
            
            // Já Frequenta Igreja? (coluna 3)
            String jaFrequentaIgreja = (values.length > 3 && values[3] != null) ? values[3].trim() : "";
            if (!jaFrequentaIgreja.isEmpty()) {
                visitor.setJaFrequentaIgreja(jaFrequentaIgreja);
            }
            
            // Está à Procura de Igreja? (coluna 4)
            String procuraIgreja = (values.length > 4 && values[4] != null) ? values[4].trim() : "";
            if (!procuraIgreja.isEmpty()) {
                visitor.setProcuraIgreja(procuraIgreja);
            }
            
            // É de SP? (coluna 5)
            String eDeSPStr = (values.length > 5 && values[5] != null) ? values[5].trim().toLowerCase() : "";
            Boolean eDeSP = eDeSPStr.equals("sim") || eDeSPStr.equals("true") || eDeSPStr.equals("1");
            visitor.setEDeSP(eDeSP);
            
            // Estado (coluna 6) - apenas se não for SP
            if (!eDeSP) {
                String estado = (values.length > 6 && values[6] != null) ? values[6].trim() : "";
                if (!estado.isEmpty()) {
                    visitor.setEstado(estado.toUpperCase());
                }
            }
            
            return visitor;
        } catch (Exception e) {
            log.error("Error parsing CSV row {}: {}", rowNumber, e.getMessage(), e);
            result.addError(rowNumber, "Erro ao processar: " + e.getMessage());
            return null;
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    double numValue = cell.getNumericCellValue();
                    if (numValue == (long) numValue) {
                        return String.valueOf((long) numValue);
                    } else {
                        return String.valueOf(numValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private Boolean getCellValueAsBoolean(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case STRING:
                String value = cell.getStringCellValue().trim().toLowerCase();
                return value.equals("true") || value.equals("sim") || value.equals("1");
            case NUMERIC:
                return cell.getNumericCellValue() == 1;
            default:
                return null;
        }
    }

    private LocalDate parseDate(String dateStr) {
        try {
            // Try ISO format first
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            try {
                // Try dd/MM/yyyy
                String[] parts = dateStr.split("/");
                if (parts.length == 3) {
                    return LocalDate.of(
                        Integer.parseInt(parts[2]),
                        Integer.parseInt(parts[1]),
                        Integer.parseInt(parts[0])
                    );
                }
            } catch (Exception e2) {
                log.warn("Could not parse date: {}", dateStr);
            }
            return null;
        }
    }

    private String[] parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentValue = new StringBuilder();
        
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                values.add(currentValue.toString().trim());
                currentValue = new StringBuilder();
            } else {
                currentValue.append(c);
            }
        }
        values.add(currentValue.toString().trim());
        
        return values.toArray(new String[0]);
    }

    public byte[] generateTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Visitantes");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "Nome Completo", "Data Visita", "Telefone", "Já Frequenta Igreja?", 
                "Está à Procura de Igreja?", "É de SP?", "Estado"
            };
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
}

