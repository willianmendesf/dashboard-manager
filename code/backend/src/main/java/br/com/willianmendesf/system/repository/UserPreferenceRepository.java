package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.model.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    Optional<UserPreference> findByUserAndPreferenceKey(User user, String preferenceKey);
    void deleteByUserAndPreferenceKey(User user, String preferenceKey);
}

