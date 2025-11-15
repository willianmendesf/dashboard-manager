package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.model.entity.Permission;
import br.com.willianmendesf.system.model.entity.Profile;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.model.enums.TaskType;
import br.com.willianmendesf.system.repository.AppointmentRepository;
import br.com.willianmendesf.system.repository.PermissionRepository;
import br.com.willianmendesf.system.repository.ProfileRepository;
import br.com.willianmendesf.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class DataInitializationService {

    private final PermissionRepository permissionRepository;
    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentRepository appointmentRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeData() {
        log.info("Initializing default permissions, profiles and users...");

        // Create permissions
        createPermissions();

        // Create profiles
        createProfiles();

        // Create default ROOT user if it doesn't exist
        createDefaultRootUser();

        // Initialize Prayer360 appointment
        initializePrayer360Appointment();

        log.info("Data initialization completed.");
    }

    private void createPermissions() {
        // System permissions
        createPermissionIfNotExists("READ_CONFIG", "Read system configurations");
        createPermissionIfNotExists("WRITE_CONFIG", "Write system configurations");
        
        // User management permissions
        createPermissionIfNotExists("READ_USERS", "Read users");
        createPermissionIfNotExists("WRITE_USERS", "Create and update users");
        createPermissionIfNotExists("DELETE_USERS", "Delete users");
        
        // Member management permissions
        createPermissionIfNotExists("READ_MEMBERS", "Read members");
        createPermissionIfNotExists("WRITE_MEMBERS", "Create and update members");
        createPermissionIfNotExists("DELETE_MEMBERS", "Delete members");
        
        // Visitor management permissions
        createPermissionIfNotExists("READ_VISITORS", "Read visitors");
        createPermissionIfNotExists("WRITE_VISITORS", "Create and update visitors");
        createPermissionIfNotExists("DELETE_VISITORS", "Delete visitors");
        
        // Profile management permissions
        createPermissionIfNotExists("READ_PROFILES", "Read profiles");
        createPermissionIfNotExists("WRITE_PROFILES", "Create and update profiles");
        createPermissionIfNotExists("DELETE_PROFILES", "Delete profiles");
        
        // Dashboard permissions
        createPermissionIfNotExists("ACCESS_DASHBOARD", "Access dashboard");
        createPermissionIfNotExists("ACCESS_SCREEN_SETTINGS", "Access settings screen");
        
        // Prayer360 permissions
        createPermissionIfNotExists("ACCESS_PRAYER360", "Access Prayer360 menu");
        createPermissionIfNotExists("READ_PRAYER360", "Read Prayer360 data");
        createPermissionIfNotExists("WRITE_PRAYER360", "Write Prayer360 data");
        createPermissionIfNotExists("MANAGE_PRAYER360_CONFIG", "Manage Prayer360 configuration");
        
        log.info("Permissions initialized");
    }

    private void createProfiles() {
        // ROOT profile - has all permissions
        Profile rootProfile = createProfileIfNotExists("ROOT", "Root administrator with all permissions");
        // Always update ROOT profile with all permissions (in case new permissions were added)
        Set<Permission> allPermissions = new HashSet<>(permissionRepository.findAll());
        rootProfile.setPermissions(allPermissions);
        profileRepository.save(rootProfile);

        // ADMIN profile - has most permissions except creating ROOT
        Profile adminProfile = createProfileIfNotExists("ADMIN", "Administrator with most permissions");
        Set<Permission> adminPermissions = new HashSet<>();
        permissionRepository.findAll().forEach(permission -> {
            if (!permission.getName().equals("DELETE_USERS")) { // Can't delete users
                adminPermissions.add(permission);
            }
        });
        adminProfile.setPermissions(adminPermissions);
        profileRepository.save(adminProfile);

        // USER profile - basic permissions
        Profile userProfile = createProfileIfNotExists("USER", "Standard user with basic permissions");
        Set<Permission> userPermissions = new HashSet<>();
        userPermissions.add(permissionRepository.findByName("ACCESS_DASHBOARD").orElseThrow());
        userProfile.setPermissions(userPermissions);
        profileRepository.save(userProfile);

        log.info("Profiles initialized");
    }

    private void createDefaultRootUser() {
        if (!userRepository.existsByUsername("root")) {
            Profile rootProfile = profileRepository.findByName("ROOT")
                .orElseThrow(() -> new RuntimeException("ROOT profile not found"));

            // Use environment variable or default password
            // In production, set ROOT_PASSWORD in .env
            String rootPassword = System.getenv("ROOT_PASSWORD");
            if (rootPassword == null || rootPassword.isEmpty()) {
                rootPassword = "root123"; // Default for development
                log.warn("ROOT_PASSWORD not set in environment. Using default password 'root123'");
            }

            User rootUser = new User();
            rootUser.setUsername("root");
            rootUser.setName("Root Administrator");
            rootUser.setEmail("root@system.local");
            rootUser.setPassword(passwordEncoder.encode(rootPassword));
            rootUser.setEnabled(true);
            rootUser.setProfile(rootProfile);

            userRepository.save(rootUser);
            log.info("Default ROOT user created: username=root");
        } else {
            // Update root password if ROOT_PASSWORD_RESET is set (emergency reset)
            String resetPassword = System.getenv("ROOT_PASSWORD_RESET");
            if (resetPassword != null && !resetPassword.isEmpty()) {
                User rootUser = userRepository.findByUsername("root")
                    .orElseThrow(() -> new RuntimeException("ROOT user not found"));
                rootUser.setPassword(passwordEncoder.encode(resetPassword));
                userRepository.save(rootUser);
                log.warn("ROOT password was reset via ROOT_PASSWORD_RESET environment variable");
            }
        }
    }

    private Permission createPermissionIfNotExists(String name, String description) {
        return permissionRepository.findByName(name)
            .orElseGet(() -> {
                Permission permission = new Permission();
                permission.setName(name);
                permission.setDescription(description);
                return permissionRepository.save(permission);
            });
    }

    private Profile createProfileIfNotExists(String name, String description) {
        return profileRepository.findByName(name)
            .orElseGet(() -> {
                Profile profile = new Profile();
                profile.setName(name);
                profile.setDescription(description);
                return profileRepository.save(profile);
            });
    }

    private void initializePrayer360Appointment() {
        log.info("Initializing Prayer360 appointment...");
        String appointmentName = "Oração360 - Distribuição Automática";
        
        appointmentRepository.findByName(appointmentName).ifPresentOrElse(
            existing -> {
                // Se já existe, garantir que está marcado como sistema e em modo desenvolvimento
                if (!Boolean.TRUE.equals(existing.getIsSystemAppointment())) {
                    existing.setIsSystemAppointment(true);
                    appointmentRepository.save(existing);
                    log.info("Updated existing Prayer360 appointment to system appointment");
                }
                if (!Boolean.TRUE.equals(existing.getDevelopment())) {
                    existing.setDevelopment(true);
                    appointmentRepository.save(existing);
                    log.info("Updated existing Prayer360 appointment to development mode");
                }
                log.info("Prayer360 appointment already exists: {}", appointmentName);
            },
            () -> {
                // Criar novo agendamento
                AppointmentEntity appointment = new AppointmentEntity();
                appointment.setName(appointmentName);
                appointment.setDescription("Agendamento automático para distribuição de orações do sistema Oração360");
                appointment.setSchedule("0 0 8 * * MON"); // Segunda-feira às 8h
                appointment.setEnabled(false); // DESABILITADO por padrão
                appointment.setDevelopment(true); // MODO DESENVOLVIMENTO ATIVO
                appointment.setIsSystemAppointment(true); // NÃO PODE SER DELETADO
                appointment.setTaskType(TaskType.PRAYER360_DISTRIBUTION);
                appointment.setRetries(0L);
                appointment.setTimeout(300000L); // 5 minutos
                
                appointmentRepository.save(appointment);
                log.info("Created Prayer360 appointment: {} (disabled, development mode, system appointment)", appointmentName);
            }
        );
    }
}

