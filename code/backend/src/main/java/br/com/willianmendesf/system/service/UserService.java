package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.model.entity.Profile;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.ProfileRepository;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;

    /**
     * Creates a new user
     * Business rule: Only ROOT users can create other ROOT users
     */
    @Transactional
    public UserDTO createUser(UserDTO userDTO, User loggedUser) {
        // Validate required fields
        if (userDTO.getUsername() == null || userDTO.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (userDTO.getEmail() == null || userDTO.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (userDTO.getProfileId() == null) {
            throw new IllegalArgumentException("Profile ID is required");
        }

        // Validate if username or email already exists
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nome de usuário já existe.");
        }
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado.");
        }
        
        // Validate CPF if provided
        if (userDTO.getCpf() != null && !userDTO.getCpf().trim().isEmpty()) {
            if (userRepository.existsByCpf(userDTO.getCpf())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado.");
            }
        }
        
        // Validate telefone if provided
        if (userDTO.getTelefone() != null && !userDTO.getTelefone().trim().isEmpty()) {
            if (userRepository.existsByTelefone(userDTO.getTelefone())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já cadastrado.");
            }
        }

        // Load profile
        Profile profile = profileRepository.findById(userDTO.getProfileId())
            .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + userDTO.getProfileId()));

        // Business rule: Only ROOT can assign ROOT profile
        if (isRootProfile(profile) && !isRootUser(loggedUser)) {
            throw new AccessDeniedException("Only ROOT users can designate other users as ROOT.");
        }

        // Create user
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setName(userDTO.getName());
        user.setEmail(userDTO.getEmail());
        user.setCpf(userDTO.getCpf());
        user.setTelefone(userDTO.getTelefone());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword() != null ? userDTO.getPassword() : "changeme"));
        user.setEnabled(userDTO.getEnabled() != null ? userDTO.getEnabled() : true);
        user.setProfile(profile);

        User savedUser = userRepository.save(user);
        log.info("User created: {} with profile: {}", savedUser.getUsername(), profile.getName());

        return toDTO(savedUser);
    }

    /**
     * Updates an existing user
     * Business rule: Only ROOT users can update other users to ROOT
     * Security: Users cannot change their own profile/status
     */
    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO, User loggedUser) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

        // SECURITY CHECK: Prevent users from editing their own profile/status
        boolean isEditingSelf = loggedUser.getId().equals(id);

        // Update basic fields
        if (userDTO.getName() != null) {
            user.setName(userDTO.getName());
        }
        if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailAndIdNot(userDTO.getEmail(), id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado.");
            }
            user.setEmail(userDTO.getEmail());
        }
        
        // Validate username if changed
        if (userDTO.getUsername() != null && !userDTO.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsernameAndIdNot(userDTO.getUsername(), id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Nome de usuário já existe.");
            }
            user.setUsername(userDTO.getUsername());
        }

        // Update password (use novaSenha if provided, otherwise password for backward compatibility)
        String newPassword = userDTO.getNovaSenha() != null && !userDTO.getNovaSenha().isEmpty() 
            ? userDTO.getNovaSenha() 
            : (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty() ? userDTO.getPassword() : null);
        
        if (newPassword != null) {
            user.setPassword(passwordEncoder.encode(newPassword));
            log.info("Password updated for user: {}", user.getUsername());
        }

        // SECURITY: Only update enabled status if NOT editing self
        if (userDTO.getEnabled() != null && !isEditingSelf) {
            user.setEnabled(userDTO.getEnabled());
        } else if (isEditingSelf && userDTO.getEnabled() != null) {
            log.warn("User {} attempted to change their own enabled status. Ignored.", loggedUser.getUsername());
        }

        // CRITICAL BUSINESS RULE: Root users cannot have their function changed by anyone
        boolean isTargetRoot = isRootUser(user);
        if (isTargetRoot && userDTO.getProfileId() != null && !userDTO.getProfileId().equals(user.getProfile().getId())) {
            throw new AccessDeniedException("A função de um usuário Root não pode ser alterada.");
        }

        // SECURITY: Only update profile if NOT editing self and target is NOT Root
        if (userDTO.getProfileId() != null && !isEditingSelf && !isTargetRoot) {
            if (!userDTO.getProfileId().equals(user.getProfile().getId())) {
                Profile newProfile = profileRepository.findById(userDTO.getProfileId())
                    .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + userDTO.getProfileId()));

                // Business rule: Only ROOT can assign ROOT profile
                if (isRootProfile(newProfile) && !isRootUser(loggedUser)) {
                    throw new AccessDeniedException("Only ROOT users can designate other users as ROOT.");
                }

                user.setProfile(newProfile);
            }
        } else if (isEditingSelf && userDTO.getProfileId() != null) {
            log.warn("User {} attempted to change their own profile. Ignored.", loggedUser.getUsername());
        } else if (isTargetRoot && userDTO.getProfileId() != null) {
            log.warn("User {} attempted to change profile of Root user {}. Ignored.", loggedUser.getUsername(), user.getUsername());
        }

        // WRITE-ONCE LOGIC: If user is editing themselves, don't allow changing CPF/Telefone if they already exist
        // Only allow setting them if they're currently null/empty
        if (isEditingSelf) {
            // CPF: Only update if current value is null/empty (write-once)
            if (userDTO.getCpf() != null && !userDTO.getCpf().trim().isEmpty()) {
                if (user.getCpf() != null && !user.getCpf().trim().isEmpty()) {
                    // CPF already exists, ignore the update (write-once protection)
                    log.debug("User {} attempted to change their CPF. Ignored (write-once protection).", loggedUser.getUsername());
                } else {
                    // CPF is empty, allow setting it (first time)
                    if (userRepository.existsByCpf(userDTO.getCpf())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado.");
                    }
                    user.setCpf(userDTO.getCpf());
                }
            }
            
            // Telefone: Only update if current value is null/empty (write-once)
            if (userDTO.getTelefone() != null && !userDTO.getTelefone().trim().isEmpty()) {
                if (user.getTelefone() != null && !user.getTelefone().trim().isEmpty()) {
                    // Telefone already exists, ignore the update (write-once protection)
                    log.debug("User {} attempted to change their telefone. Ignored (write-once protection).", loggedUser.getUsername());
                } else {
                    // Telefone is empty, allow setting it (first time)
                    if (userRepository.existsByTelefone(userDTO.getTelefone())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já cadastrado.");
                    }
                    user.setTelefone(userDTO.getTelefone());
                }
            }
        } else {
            // Admin editing another user: Allow changes with validation
            // Update CPF if provided and validate uniqueness
            if (userDTO.getCpf() != null && !userDTO.getCpf().trim().isEmpty()) {
                if (!userDTO.getCpf().equals(user.getCpf()) && userRepository.existsByCpfAndIdNot(userDTO.getCpf(), id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado.");
                }
                user.setCpf(userDTO.getCpf());
            }
            
            // Update telefone if provided and validate uniqueness
            if (userDTO.getTelefone() != null && !userDTO.getTelefone().trim().isEmpty()) {
                if (!userDTO.getTelefone().equals(user.getTelefone()) && userRepository.existsByTelefoneAndIdNot(userDTO.getTelefone(), id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já cadastrado.");
                }
                user.setTelefone(userDTO.getTelefone());
            }
        }

        User savedUser = userRepository.save(user);
        log.info("User updated: {} (self-edit: {})", savedUser.getUsername(), isEditingSelf);

        return toDTO(savedUser);
    }

    /**
     * Gets all users
     */
    @Transactional(readOnly = true)
    public List<UserDTO> findAll() {
        return userRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    /**
     * Gets user by ID
     */
    @Transactional(readOnly = true)
    public UserDTO findById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
        return toDTO(user);
    }

    /**
     * Deletes a user
     */
    @Transactional
    public void deleteById(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UsernameNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
        log.info("User deleted: {}", id);
    }

    /**
     * Converts User entity to DTO
     */
    public UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setCpf(user.getCpf());
        dto.setTelefone(user.getTelefone());
        dto.setEnabled(user.getEnabled());
        
        // Garantir que profile e profileName sempre tenham valores
        if (user.getProfile() != null) {
            dto.setProfileId(user.getProfile().getId());
            dto.setProfileName(user.getProfile().getName() != null ? user.getProfile().getName() : "USER");
        } else {
            log.warn("User {} has no profile assigned", user.getUsername());
            dto.setProfileId(null);
            dto.setProfileName("USER");
        }
        
        dto.setFotoUrl(user.getFotoUrl());
        dto.setPermissions(user.getAuthorities().stream()
            .map(auth -> auth.getAuthority())
            .collect(Collectors.toList()));
        return dto;
    }

    /**
     * Checks if profile is ROOT
     */
    private boolean isRootProfile(Profile profile) {
        return "ROOT".equalsIgnoreCase(profile.getName());
    }

    /**
     * Checks if user is ROOT
     */
    private boolean isRootUser(User user) {
        return isRootProfile(user.getProfile());
    }

    /**
     * Updates the logged-in user's own profile
     * Only allows updating name and telefone
     */
    @Transactional
    public UserDTO updateMyProfile(User loggedUser, String name, String telefone) {
        if (name != null && !name.trim().isEmpty()) {
            loggedUser.setName(name.trim());
        }
        if (telefone != null) {
            loggedUser.setTelefone(telefone.trim());
        }
        
        User savedUser = userRepository.save(loggedUser);
        log.info("User profile updated: {}", savedUser.getUsername());
        
        return toDTO(savedUser);
    }

    /**
     * Changes the logged-in user's password
     * Validates current password before changing
     */
    @Transactional
    public void changePassword(User loggedUser, String senhaAtual, String novaSenha) {
        // Validate current password
        if (!passwordEncoder.matches(senhaAtual, loggedUser.getPassword())) {
            throw new IllegalArgumentException("Senha atual incorreta");
        }

        // Validate new password
        if (novaSenha == null || novaSenha.length() < 6) {
            throw new IllegalArgumentException("A nova senha deve ter pelo menos 6 caracteres");
        }

        // Update password
        loggedUser.setPassword(passwordEncoder.encode(novaSenha));
        userRepository.save(loggedUser);
        
        log.info("Password changed for user: {}", loggedUser.getUsername());
    }

    /**
     * Removes profile photo from logged-in user
     */
    @Transactional
    public UserDTO removeProfilePhoto(User loggedUser) {
        // Delete file from storage if exists
        if (loggedUser.getFotoUrl() != null) {
            // Try to delete using entity-based deletion
            storageService.deleteFileByEntity("profiles", "usuario", loggedUser.getId().toString());
            // Also try deleting by URL (fallback)
            storageService.deleteFile(loggedUser.getFotoUrl());
        }
        
        loggedUser.setFotoUrl(null);
        User savedUser = userRepository.save(loggedUser);
        log.info("Profile photo removed for user: {}", loggedUser.getUsername());
        return toDTO(savedUser);
    }
}
