package br.com.willianmendesf.system.model.converter;

import br.com.willianmendesf.system.model.enums.TaskType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Converter(autoApply = true)
public class TaskTypeConverter implements AttributeConverter<TaskType, String> {

    @Override
    public String convertToDatabaseColumn(TaskType taskType) {
        if (taskType == null) {
            return null;
        }
        return taskType.name();
    }

    @Override
    public TaskType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        
        try {
            return TaskType.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            log.warn("Valor desconhecido de TaskType encontrado no banco de dados: {}. Retornando null.", dbData);
            return null;
        }
    }
}

