package br.com.willianmendesf.system.model.entity;

import br.com.willianmendesf.system.model.enums.EventType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "events")
public class EventEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private EventType type;
    
    @Version
    @Column(name = "version")
    private Long version = 0L;
    
    @PrePersist
    protected void onCreate() {
        if (this.name == null || this.name.trim().isEmpty()) {
            this.name = "Culto";
        }
        if (this.startTime == null) {
            this.startTime = LocalTime.of(9, 30);
        }
        if (this.endTime == null) {
            this.endTime = LocalTime.of(12, 30);
        }
        if (this.type == null) {
            this.type = EventType.WORSHIP_SERVICE;
        }
    }
}

