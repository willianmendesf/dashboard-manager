package br.com.willianmendesf.system.interfaces;

import br.com.willianmendesf.system.model.Appointments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentsInterface extends JpaRepository<Appointments, Long> {

}
