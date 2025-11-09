package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.model.entity.Profile;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.ProfileRepository;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        // Validate if username or email already exists
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + userDTO.getUsername());
        }
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + userDTO.getEmail());
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
     */
    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO, User loggedUser) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

        // Update basic fields
        if (userDTO.getName() != null) {
            user.setName(userDTO.getName());
        }
        if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(userDTO.getEmail())) {
                throw new IllegalArgumentException("Email already exists: " + userDTO.getEmail());
            }
            user.setEmail(userDTO.getEmail());
        }
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        }
        if (userDTO.getEnabled() != null) {
            user.setEnabled(userDTO.getEnabled());
        }

        // Update profile if provided
        if (userDTO.getProfileId() != null && !userDTO.getProfileId().equals(user.getProfile().getId())) {
            Profile newProfile = profileRepository.findById(userDTO.getProfileId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + userDTO.getProfileId()));

            // Business rule: Only ROOT can assign ROOT profile
            if (isRootProfile(newProfile) && !isRootUser(loggedUser)) {
                throw new AccessDeniedException("Only ROOT users can designate other users as ROOT.");
            }

            user.setProfile(newProfile);
        }

        User savedUser = userRepository.save(user);
        log.info("User updated: {}", savedUser.getUsername());

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
        dto.setProfileId(user.getProfile().getId());
        dto.setProfileName(user.getProfile().getName());
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
