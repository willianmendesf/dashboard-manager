package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.ImportResultDTO;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.MemberRepository;
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
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberImportService {

    private final MemberRepository memberRepository;

    /**
     * Imports members from Excel (.xlsx) or CSV file
     */
    @Transactional
    public ImportResultDTO importMembers(MultipartFile file) {
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
            log.error("Error importing members from file: {}", fileName, e);
            result.addError(0, "Erro ao processar arquivo: " + e.getMessage());
            return result;
        }
    }

    /**
     * Imports members from Excel file
     */
    private ImportResultDTO importFromExcel(MultipartFile file, ImportResultDTO result) throws Exception {
        List<MemberEntity> membersToSave = new ArrayList<>();
        
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
                if (!hasData) continue; // Skip empty rows
                
                try {
                    MemberEntity member = parseMemberFromExcelRow(row, rowIndex + 1, result);
                    if (member != null) {
                        membersToSave.add(member);
                    }
                } catch (Exception e) {
                    result.addError(rowIndex + 1, "Erro ao processar linha: " + e.getMessage());
                    result.setErrorCount(result.getErrorCount() + 1);
                }
            }
        }
        
        // Batch save all members
        if (!membersToSave.isEmpty()) {
            try {
                List<MemberEntity> savedMembers = memberRepository.saveAll(membersToSave);
                result.setSuccessCount(savedMembers.size());
                // Created/Updated counts are already set in parseMemberFromExcelRow
            } catch (Exception e) {
                log.error("Error saving members batch: {}", e.getMessage(), e);
                result.addError(0, "Erro ao salvar membros: " + e.getMessage());
            }
        }
        
        return result;
    }

    /**
     * Imports members from CSV file
     */
    private ImportResultDTO importFromCsv(MultipartFile file, ImportResultDTO result) throws Exception {
        List<MemberEntity> membersToSave = new ArrayList<>();
        
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
                    MemberEntity member = parseMemberFromCsvRow(values, rowNumber, result);
                    if (member != null) {
                        membersToSave.add(member);
                    }
                } catch (Exception e) {
                    result.addError(rowNumber, "Erro ao processar linha: " + e.getMessage());
                    result.setErrorCount(result.getErrorCount() + 1);
                }
            }
            
            result.setTotalRows(rowNumber - 1); // Exclude header
        }
        
        // Batch save all members
        if (!membersToSave.isEmpty()) {
            try {
                List<MemberEntity> savedMembers = memberRepository.saveAll(membersToSave);
                result.setSuccessCount(savedMembers.size());
                // Created/Updated counts are already set in parseMemberFromCsvRow
            } catch (Exception e) {
                log.error("Error saving members batch: {}", e.getMessage(), e);
                result.addError(0, "Erro ao salvar membros: " + e.getMessage());
            }
        }
        
        return result;
    }

    /**
     * Parses a member from Excel row
     * Expected columns order (0-indexed):
     * 0: Nome, 1: Tipo Cadastro, 2: Data Nascimento, 3: Estado Civil,
     * 4: CEP, 5: Logradouro, 6: Número, 7: Complemento, 8: Bairro, 9: Cidade, 10: Estado,
     * 11: Telefone, 12: Comercial, 13: Celular, 14: Email, 15: Grupos
     */
    private MemberEntity parseMemberFromExcelRow(Row row, int rowNumber, ImportResultDTO result) {
        try {
            String nome = getCellValueAsString(row.getCell(0));
            String email = getCellValueAsString(row.getCell(14));

            // Check if member already exists (by email) - only if provided
            MemberEntity existingMember = null;
            if (email != null && !email.trim().isEmpty()) {
                existingMember = memberRepository.findByEmail(email);
            }

            MemberEntity member;
            if (existingMember != null) {
                // Update existing member
                member = existingMember;
                result.setUpdatedCount(result.getUpdatedCount() + 1);
            } else {
                // Create new member
                member = new MemberEntity();
                result.setCreatedCount(result.getCreatedCount() + 1);
            }

            // Map fields from Excel columns (all optional)
            // Nome is required in DB, so set a default if empty
            if (nome != null && !nome.trim().isEmpty()) {
                member.setNome(nome);
            } else {
                member.setNome("Sem Nome"); // Default for required field
            }
            
            String tipoCadastro = getCellValueAsString(row.getCell(1));
            if (tipoCadastro != null && !tipoCadastro.trim().isEmpty()) {
                member.setTipoCadastro(tipoCadastro);
            }
            
            // Parse date of birth
            Date nascimentoDate = getCellValueAsDate(row.getCell(2));
            if (nascimentoDate != null) {
                member.setNascimento(nascimentoDate.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate());
            }
            
            // Parse estado civil (boolean: true = casado, false = solteiro)
            // Required field in DB, so set default if not provided
            Boolean estadoCivil = getCellValueAsBoolean(row.getCell(3));
            if (estadoCivil != null) {
                member.setEstadoCivil(estadoCivil);
            } else {
                member.setEstadoCivil(false); // Default (required field)
            }
            
            String cep = getCellValueAsString(row.getCell(4));
            if (cep != null && !cep.trim().isEmpty()) {
                member.setCep(cep);
            }
            
            String logradouro = getCellValueAsString(row.getCell(5));
            if (logradouro != null && !logradouro.trim().isEmpty()) {
                member.setLogradouro(logradouro);
            }
            
            String numero = getCellValueAsString(row.getCell(6));
            if (numero != null && !numero.trim().isEmpty()) {
                member.setNumero(numero);
            }
            
            String complemento = getCellValueAsString(row.getCell(7));
            if (complemento != null && !complemento.trim().isEmpty()) {
                member.setComplemento(complemento);
            }
            
            String bairro = getCellValueAsString(row.getCell(8));
            if (bairro != null && !bairro.trim().isEmpty()) {
                member.setBairro(bairro);
            }
            
            String cidade = getCellValueAsString(row.getCell(9));
            if (cidade != null && !cidade.trim().isEmpty()) {
                member.setCidade(cidade);
            }
            
            String estado = getCellValueAsString(row.getCell(10));
            if (estado != null && !estado.trim().isEmpty()) {
                member.setEstado(estado);
            }
            
            String telefone = getCellValueAsString(row.getCell(11));
            if (telefone != null && !telefone.trim().isEmpty()) {
                member.setTelefone(telefone);
            }
            
            String comercial = getCellValueAsString(row.getCell(12));
            if (comercial != null && !comercial.trim().isEmpty()) {
                member.setComercial(comercial);
            }
            
            String celular = getCellValueAsString(row.getCell(13));
            if (celular != null && !celular.trim().isEmpty()) {
                member.setCelular(celular);
            }
            
            if (email != null && !email.trim().isEmpty()) {
                member.setEmail(email);
            }
            
            String grupos = getCellValueAsString(row.getCell(15));
            if (grupos != null && !grupos.trim().isEmpty()) {
                member.setGrupos(grupos);
            }
            
            // Default values
            if (member.getIntercessor() == null) {
                member.setIntercessor(false);
            }
            
            // LGPD field is required (cannot be null)
            if (member.getLgpd() == null) {
                member.setLgpd(false); // Default: not accepted
            }

            return member;
        } catch (Exception e) {
            log.error("Error parsing row {}: {}", rowNumber, e.getMessage(), e);
            result.addError(rowNumber, "Erro ao processar: " + e.getMessage());
            return null;
        }
    }

    /**
     * Parses a member from CSV row
     */
    private MemberEntity parseMemberFromCsvRow(String[] values, int rowNumber, ImportResultDTO result) {
        try {
            // Accept any number of columns, just use what's available
            String nome = (values.length > 0 && values[0] != null) ? values[0].trim() : "";
            String email = (values.length > 14 && values[14] != null) ? values[14].trim() : "";

            // Check if member already exists (by email) - only if provided
            MemberEntity existingMember = null;
            if (!email.isEmpty()) {
                existingMember = memberRepository.findByEmail(email);
            }

            MemberEntity member;
            if (existingMember != null) {
                member = existingMember;
                result.setUpdatedCount(result.getUpdatedCount() + 1);
            } else {
                member = new MemberEntity();
                result.setCreatedCount(result.getCreatedCount() + 1);
            }

            // Map fields (all optional)
            // Nome is required in DB, so set a default if empty
            if (!nome.isEmpty()) {
                member.setNome(nome);
            } else {
                member.setNome("Sem Nome"); // Default for required field
            }
            
            String tipoCadastro = (values.length > 1 && values[1] != null) ? values[1].trim() : "";
            if (!tipoCadastro.isEmpty()) {
                member.setTipoCadastro(tipoCadastro);
            }
            
            // Parse date
            String nascimentoStr = (values.length > 2 && values[2] != null) ? values[2].trim() : "";
            if (!nascimentoStr.isEmpty()) {
                try {
                    LocalDate nascimento = parseDate(nascimentoStr);
                    if (nascimento != null) {
                        member.setNascimento(nascimento);
                    }
                } catch (Exception e) {
                    log.warn("Invalid date format at row {}: {}", rowNumber, nascimentoStr);
                    // Continue without date if invalid
                }
            }
            
            // Parse estado civil (required field in DB, so set default if not provided)
            String estadoCivilStr = (values.length > 3 && values[3] != null) ? values[3].trim().toLowerCase() : "";
            if (estadoCivilStr.equals("casado") || estadoCivilStr.equals("true") || estadoCivilStr.equals("1")) {
                member.setEstadoCivil(true);
            } else {
                member.setEstadoCivil(false); // Default (required field)
            }
            
            String cep = (values.length > 4 && values[4] != null) ? values[4].trim() : "";
            if (!cep.isEmpty()) {
                member.setCep(cep);
            }
            
            String logradouro = (values.length > 5 && values[5] != null) ? values[5].trim() : "";
            if (!logradouro.isEmpty()) {
                member.setLogradouro(logradouro);
            }
            
            String numero = (values.length > 6 && values[6] != null) ? values[6].trim() : "";
            if (!numero.isEmpty()) {
                member.setNumero(numero);
            }
            
            String complemento = (values.length > 7 && values[7] != null) ? values[7].trim() : "";
            if (!complemento.isEmpty()) {
                member.setComplemento(complemento);
            }
            
            String bairro = (values.length > 8 && values[8] != null) ? values[8].trim() : "";
            if (!bairro.isEmpty()) {
                member.setBairro(bairro);
            }
            
            String cidade = (values.length > 9 && values[9] != null) ? values[9].trim() : "";
            if (!cidade.isEmpty()) {
                member.setCidade(cidade);
            }
            
            String estado = (values.length > 10 && values[10] != null) ? values[10].trim() : "";
            if (!estado.isEmpty()) {
                member.setEstado(estado);
            }
            
            String telefone = (values.length > 11 && values[11] != null) ? values[11].trim() : "";
            if (!telefone.isEmpty()) {
                member.setTelefone(telefone);
            }
            
            String comercial = (values.length > 12 && values[12] != null) ? values[12].trim() : "";
            if (!comercial.isEmpty()) {
                member.setComercial(comercial);
            }
            
            String celular = (values.length > 13 && values[13] != null) ? values[13].trim() : "";
            if (!celular.isEmpty()) {
                member.setCelular(celular);
            }
            
            if (!email.isEmpty()) {
                member.setEmail(email);
            }
            
            String grupos = (values.length > 15 && values[15] != null) ? values[15].trim() : "";
            if (!grupos.isEmpty()) {
                member.setGrupos(grupos);
            }
            
            if (member.getIntercessor() == null) {
                member.setIntercessor(false);
            }
            
            // LGPD field is required (cannot be null)
            if (member.getLgpd() == null) {
                member.setLgpd(false); // Default: not accepted
            }

            return member;
        } catch (Exception e) {
            log.error("Error parsing CSV row {}: {}", rowNumber, e.getMessage(), e);
            result.addError(rowNumber, "Erro ao processar: " + e.getMessage());
            return null;
        }
    }

    /**
     * Helper methods for reading cell values
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Remove decimal if it's a whole number
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

    private Date getCellValueAsDate(Cell cell) {
        if (cell == null) return null;
        
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                String dateStr = cell.getStringCellValue().trim();
                // Try to parse common date formats
                return parseDateString(dateStr);
            }
        } catch (Exception e) {
            log.warn("Error parsing date from cell: {}", e.getMessage());
        }
        return null;
    }

    private Boolean getCellValueAsBoolean(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case STRING:
                String value = cell.getStringCellValue().trim().toLowerCase();
                return value.equals("true") || value.equals("sim") || value.equals("casado") || value.equals("1");
            case NUMERIC:
                return cell.getNumericCellValue() == 1;
            default:
                return null;
        }
    }

    private Date parseDateString(String dateStr) {
        // Try common date formats
        try {
            return java.sql.Date.valueOf(LocalDate.parse(dateStr));
        } catch (Exception e) {
            // Try other formats if needed
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

    /**
     * Parses CSV line handling quoted values
     */
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

    /**
     * Generates an Excel template file with header row
     */
    public byte[] generateTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Membros");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "Nome", "Tipo Cadastro", "Data Nascimento", "Estado Civil",
                "CEP", "Logradouro", "Número", "Complemento", "Bairro", "Cidade", "Estado",
                "Telefone", "Comercial", "Celular", "Email", "Grupos"
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

