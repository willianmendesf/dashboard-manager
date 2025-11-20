package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.AttendanceChartPreferenceDTO;
import br.com.willianmendesf.system.model.dto.VisitorChartPreferenceDTO;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.model.entity.UserPreference;
import br.com.willianmendesf.system.repository.UserPreferenceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPreferenceService {

    private final UserPreferenceRepository repository;
    private final ObjectMapper objectMapper = createObjectMapper();

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }

    private static final String VISITOR_CHART_PREFERENCE_KEY = "visitor_chart_date_range";
    private static final String ATTENDANCE_CHART_PREFERENCE_KEY = "attendance_chart_preferences";

    @Transactional
    public void saveVisitorChartPreference(User user, VisitorChartPreferenceDTO preference) {
        try {
            String jsonValue = objectMapper.writeValueAsString(preference);
            
            Optional<UserPreference> existing = repository.findByUserAndPreferenceKey(user, VISITOR_CHART_PREFERENCE_KEY);
            
            UserPreference userPreference;
            if (existing.isPresent()) {
                userPreference = existing.get();
                userPreference.setPreferenceValue(jsonValue);
            } else {
                userPreference = new UserPreference();
                userPreference.setUser(user);
                userPreference.setPreferenceKey(VISITOR_CHART_PREFERENCE_KEY);
                userPreference.setPreferenceValue(jsonValue);
            }
            
            repository.save(userPreference);
            log.info("Saved visitor chart preference for user: {}", user.getUsername());
        } catch (JsonProcessingException e) {
            log.error("Error serializing visitor chart preference", e);
            throw new RuntimeException("Erro ao salvar preferência do gráfico de visitantes", e);
        }
    }

    @Transactional(readOnly = true)
    public VisitorChartPreferenceDTO getVisitorChartPreference(User user) {
        try {
            Optional<UserPreference> preferenceOpt = repository.findByUserAndPreferenceKey(user, VISITOR_CHART_PREFERENCE_KEY);
            
            if (preferenceOpt.isPresent() && preferenceOpt.get().getPreferenceValue() != null) {
                String jsonValue = preferenceOpt.get().getPreferenceValue();
                return objectMapper.readValue(jsonValue, VisitorChartPreferenceDTO.class);
            }
            
            return null;
        } catch (JsonProcessingException e) {
            log.error("Error deserializing visitor chart preference", e);
            return null;
        }
    }

    @Transactional
    public void deleteVisitorChartPreference(User user) {
        repository.deleteByUserAndPreferenceKey(user, VISITOR_CHART_PREFERENCE_KEY);
        log.info("Deleted visitor chart preference for user: {}", user.getUsername());
    }

    @Transactional
    public void saveAttendanceChartPreference(User user, AttendanceChartPreferenceDTO preference) {
        try {
            String jsonValue = objectMapper.writeValueAsString(preference);
            
            Optional<UserPreference> existing = repository.findByUserAndPreferenceKey(user, ATTENDANCE_CHART_PREFERENCE_KEY);
            
            UserPreference userPreference;
            if (existing.isPresent()) {
                userPreference = existing.get();
                userPreference.setPreferenceValue(jsonValue);
            } else {
                userPreference = new UserPreference();
                userPreference.setUser(user);
                userPreference.setPreferenceKey(ATTENDANCE_CHART_PREFERENCE_KEY);
                userPreference.setPreferenceValue(jsonValue);
            }
            
            repository.save(userPreference);
            log.info("Saved attendance chart preference for user: {}", user.getUsername());
        } catch (JsonProcessingException e) {
            log.error("Error serializing attendance chart preference", e);
            throw new RuntimeException("Erro ao salvar preferência do gráfico de presença", e);
        }
    }

    @Transactional(readOnly = true)
    public AttendanceChartPreferenceDTO getAttendanceChartPreference(User user) {
        try {
            Optional<UserPreference> preferenceOpt = repository.findByUserAndPreferenceKey(user, ATTENDANCE_CHART_PREFERENCE_KEY);
            
            if (preferenceOpt.isPresent() && preferenceOpt.get().getPreferenceValue() != null) {
                String jsonValue = preferenceOpt.get().getPreferenceValue();
                return objectMapper.readValue(jsonValue, AttendanceChartPreferenceDTO.class);
            }
            
            return null;
        } catch (JsonProcessingException e) {
            log.error("Error deserializing attendance chart preference", e);
            return null;
        }
    }

    @Transactional
    public void deleteAttendanceChartPreference(User user) {
        repository.deleteByUserAndPreferenceKey(user, ATTENDANCE_CHART_PREFERENCE_KEY);
        log.info("Deleted attendance chart preference for user: {}", user.getUsername());
    }
}

