package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.AttendanceReportDTO;
import br.com.willianmendesf.system.model.dto.AttendanceStatsDTO;
import br.com.willianmendesf.system.model.dto.DailyCountDTO;
import br.com.willianmendesf.system.model.dto.MemberAttendanceDTO;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.entity.AttendanceEntity;
import br.com.willianmendesf.system.model.entity.EventEntity;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.AttendanceRepository;
import br.com.willianmendesf.system.repository.EventRepository;
import br.com.willianmendesf.system.repository.MemberRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final MemberRepository memberRepository;
    private final EventRepository eventRepository;

    @Transactional
    public Boolean toggleAttendance(Long memberId, Long eventId) {
        try {
            log.info("Toggling attendance - memberId: {}, eventId: {}", memberId, eventId);
            
            // Verificar se existe
            boolean exists = attendanceRepository.existsByMemberIdAndEventId(memberId, eventId);
            
            if (exists) {
                // Remover presença
                attendanceRepository.deleteByMemberIdAndEventId(memberId, eventId);
                log.info("Attendance removed - memberId: {}, eventId: {}", memberId, eventId);
                return false;
            } else {
                // Adicionar presença
                MemberEntity member = memberRepository.findById(memberId)
                        .orElseThrow(() -> new MembersException("Membro não encontrado: " + memberId));
                EventEntity event = eventRepository.findById(eventId)
                        .orElseThrow(() -> new MembersException("Evento não encontrado: " + eventId));
                
                AttendanceEntity attendance = new AttendanceEntity();
                attendance.setMember(member);
                attendance.setEvent(event);
                
                attendanceRepository.save(attendance);
                log.info("Attendance created - memberId: {}, eventId: {}", memberId, eventId);
                return true;
            }
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error toggling attendance", e);
            throw new MembersException("Erro ao atualizar presença: " + e.getMessage(), e);
        }
    }

    public List<MemberAttendanceDTO> getMembersByEvent(Long eventId) {
        try {
            log.info("Getting members with attendance for event: {}", eventId);
            
            // Verificar se evento existe
            eventRepository.findById(eventId)
                    .orElseThrow(() -> new MembersException("Evento não encontrado: " + eventId));
            
            // Buscar todos os membros
            List<MemberEntity> allMembers = memberRepository.findAll();
            
            // Buscar presenças do evento
            List<AttendanceEntity> attendances = attendanceRepository.findByEventId(eventId);
            Set<Long> presentMemberIds = attendances.stream()
                    .map(a -> a.getMember().getId())
                    .collect(Collectors.toSet());
            
            // Criar DTOs combinando membros com status de presença
            List<MemberAttendanceDTO> members = allMembers.stream()
                    .map(member -> {
                        MemberAttendanceDTO dto = new MemberAttendanceDTO();
                        dto.setMember(new MemberDTO(member));
                        dto.setIsPresent(presentMemberIds.contains(member.getId()));
                        return dto;
                    })
                    .sorted((a, b) -> a.getMember().getNome().compareToIgnoreCase(b.getMember().getNome()))
                    .collect(Collectors.toList());
            
            log.info("Found {} members for event {}", members.size(), eventId);
            return members;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting members by event: {}", eventId, e);
            throw new MembersException("Erro ao buscar membros do evento", e);
        }
    }

    public AttendanceStatsDTO getStats(LocalDate startDate, LocalDate endDate) {
        try {
            log.info("Getting attendance stats - startDate: {}, endDate: {}", startDate, endDate);
            
            if (startDate == null || endDate == null) {
                throw new MembersException("Data início e data fim são obrigatórias");
            }
            
            // Buscar eventos no período
            List<EventEntity> events = eventRepository.findByDateBetween(startDate, endDate);
            
            // Agrupar presenças por data do evento
            Map<LocalDate, Long> countsByDate = events.stream()
                    .collect(Collectors.toMap(
                            EventEntity::getDate,
                            event -> attendanceRepository.countByEventId(event.getId()),
                            (existing, replacement) -> existing + replacement
                    ));
            
            // Criar lista de DailyCountDTO
            List<DailyCountDTO> dailyCounts = countsByDate.entrySet().stream()
                    .map(entry -> new DailyCountDTO(entry.getKey(), entry.getValue().intValue()))
                    .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                    .collect(Collectors.toList());
            
            // Calcular média
            Long totalPresence = attendanceRepository.countByDateRange(startDate, endDate);
            Long totalEvents = attendanceRepository.countDistinctEventsByDateRange(startDate, endDate);
            Double periodAverage = totalEvents > 0 ? (double) totalPresence / totalEvents : 0.0;
            
            AttendanceStatsDTO stats = new AttendanceStatsDTO();
            stats.setDailyCounts(dailyCounts);
            stats.setPeriodAverage(periodAverage);
            
            log.info("Stats calculated - totalEvents: {}, totalPresence: {}, average: {}", 
                    totalEvents, totalPresence, periodAverage);
            
            return stats;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting attendance stats", e);
            throw new MembersException("Erro ao calcular estatísticas", e);
        }
    }

    public List<AttendanceReportDTO> getReport(LocalDate startDate, LocalDate endDate,
                                               Integer minPresence, Integer maxPresence,
                                               Integer minAbsence, Integer maxAbsence) {
        try {
            log.info("Getting attendance report - startDate: {}, endDate: {}, minPresence: {}, maxPresence: {}, minAbsence: {}, maxAbsence: {}",
                    startDate, endDate, minPresence, maxPresence, minAbsence, maxAbsence);
            
            if (startDate == null || endDate == null) {
                throw new MembersException("Data início e data fim são obrigatórias");
            }
            
            // Buscar todos os eventos no período
            List<EventEntity> events = eventRepository.findByDateBetween(startDate, endDate);
            int totalEvents = events.size();
            
            // Buscar todos os membros
            List<MemberEntity> allMembers = memberRepository.findAll();
            
            List<AttendanceReportDTO> reports = new ArrayList<>();
            
            for (MemberEntity member : allMembers) {
                // Contar presenças do membro no período
                int presenceCount = 0;
                for (EventEntity event : events) {
                    if (attendanceRepository.existsByMemberIdAndEventId(member.getId(), event.getId())) {
                        presenceCount++;
                    }
                }
                
                int absenceCount = totalEvents - presenceCount;
                double presencePercentage = totalEvents > 0 ? (double) presenceCount / totalEvents * 100 : 0.0;
                
                // Aplicar filtros
                boolean matches = true;
                if (minPresence != null && presenceCount < minPresence) matches = false;
                if (maxPresence != null && presenceCount > maxPresence) matches = false;
                if (minAbsence != null && absenceCount < minAbsence) matches = false;
                if (maxAbsence != null && absenceCount > maxAbsence) matches = false;
                
                if (matches) {
                    AttendanceReportDTO report = new AttendanceReportDTO();
                    report.setMember(new MemberDTO(member));
                    report.setTotalEvents(totalEvents);
                    report.setPresenceCount(presenceCount);
                    report.setAbsenceCount(absenceCount);
                    report.setPresencePercentage(presencePercentage);
                    reports.add(report);
                }
            }
            
            log.info("Report generated - {} members match criteria", reports.size());
            return reports;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting attendance report", e);
            throw new MembersException("Erro ao gerar relatório", e);
        }
    }
}

