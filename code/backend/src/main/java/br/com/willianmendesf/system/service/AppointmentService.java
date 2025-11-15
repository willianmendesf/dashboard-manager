package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.AppointmentException;
import br.com.willianmendesf.system.model.dto.AppointmentDTO;
import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.model.enums.RecipientType;
import br.com.willianmendesf.system.model.enums.TaskType;
import br.com.willianmendesf.system.repository.AppointmentRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import static java.util.Objects.isNull;

@Slf4j
@Service
@AllArgsConstructor
public class AppointmentService {

    private final AppointmentRepository repository;

    public List<AppointmentEntity> getAll() {
        try {
            log.info("Fetching all appointments from the database");
            List<AppointmentEntity> entity = repository.findAll();
            return entity.stream().map(AppointmentEntity::new).collect(Collectors.toList());
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public AppointmentDTO getByName(String name) {
        try {
            log.info("Fetching appointment with name: {}", name);
            AppointmentEntity entity = repository.findAll().stream().filter(a -> a.getName().equals(name)).findFirst().orElse(null);
            assert entity != null;
            return new AppointmentDTO(entity);
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public AppointmentDTO getById(Long id) {
        try {
            log.info("Fetching appointment with ID: {}", id);
            AppointmentEntity entity = repository.findById(id).orElse(null);
            assert entity != null;
            return new AppointmentDTO(entity);
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public void create(AppointmentEntity appointment) {
        try {
            log.info("Creating new appointment!");
            validateWhatsAppRecipients(appointment);
            repository.save(appointment);
        } catch(AppointmentException e) {
            throw e;
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public void update(Long id, AppointmentEntity updatedAppointment) {
        try {
            log.info("Updating appointment with ID: {}", id);
            AppointmentEntity updateAppointment = repository.findById(id)
                    .orElseThrow(() -> new AppointmentException("Appointment not found for id: " + id));
            updateAppointment.setAppointmentEntity(updatedAppointment);
            validateWhatsAppRecipients(updateAppointment);
            repository.save(updateAppointment);
        } catch(AppointmentException e) {
            throw e;
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public void delete(Long id) {
        try {
            log.info("Deleting appointment with ID: {}", id);
            AppointmentEntity appointment = repository.findById(id)
                    .orElseThrow(() -> new AppointmentException("Appointment not found for id: " + id));
            
            if (Boolean.TRUE.equals(appointment.getIsSystemAppointment())) {
                throw new AppointmentException("Cannot delete system appointment");
            }
            
            repository.deleteById(id);
        } catch(AppointmentException e) {
            throw e;
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    /**
     * Valida se agendamentos do tipo WHATSAPP_MESSAGE têm recipients configurados
     * Lança AppointmentException se inválido
     */
    private void validateWhatsAppRecipients(AppointmentEntity appointment) {
        if (appointment.getTaskType() == TaskType.WHATSAPP_MESSAGE) {
            if (!hasValidRecipients(appointment)) {
                String appointmentName = appointment.getName() != null ? appointment.getName() : "Unnamed";
                throw new AppointmentException(
                    String.format("No valid recipients found for appointment '%s'. " +
                        "Please configure recipients (recipientType and sendTo/sendToGroups) " +
                        "before saving a WhatsApp message appointment.",
                        appointmentName));
            }
        }
    }

    /**
     * Valida se o agendamento tem destinatários válidos configurados
     * Reutiliza a mesma lógica do AppointmentSchedulerService
     */
    private boolean hasValidRecipients(AppointmentEntity appointment) {
        if (appointment.getRecipientType() == null) {
            return false;
        }

        if (appointment.getRecipientType() == RecipientType.INDIVIDUAL) {
            return !isNull(appointment.getSendTo()) && !appointment.getSendTo().isEmpty();
        }

        if (appointment.getRecipientType() == RecipientType.GROUP) {
            return !isNull(appointment.getSendToGroups()) && !appointment.getSendToGroups().isEmpty();
        }

        return false;
    }
}
