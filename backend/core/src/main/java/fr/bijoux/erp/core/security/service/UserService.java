package fr.bijoux.erp.core.security.service;

import fr.bijoux.erp.core.security.dto.CreateUserRequest;
import fr.bijoux.erp.core.security.dto.UserDto;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.model.Store;
import fr.bijoux.erp.core.security.model.User;
import fr.bijoux.erp.core.security.repository.StoreRepository;
import fr.bijoux.erp.core.security.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Service de gestion des collaborateurs et des habilitations de l'équipe magasin HBJO.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       StoreRepository storeRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("L'identifiant '" + request.username() + "' est déjà utilisé");
        }
        if (request.email() != null && !request.email().isBlank() && userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("L'adresse email '" + request.email() + "' est déjà associée à un compte");
        }

        String passwordHash = passwordEncoder.encode(request.pinOrPassword());
        User user = new User(
                request.username(),
                passwordHash,
                request.firstName(),
                request.lastName(),
                request.email()
        );

        Set<Role> roles = request.roles() != null && !request.roles().isEmpty()
                ? new HashSet<>(request.roles())
                : new HashSet<>(Set.of(Role.ROLE_VENDEUR));
        user.setRoles(roles);

        if (request.storeId() != null) {
            Store store = storeRepository.findById(request.storeId())
                    .orElseThrow(() -> new IllegalArgumentException("Magasin introuvable : " + request.storeId()));
            user.setStore(store);
        }

        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<UserDto> findUsersByStore(Long storeId) {
        List<User> users = storeId != null
                ? userRepository.findByStoreId(storeId)
                : userRepository.findAll();
        return users.stream().map(UserDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findByUsername(String username) {
        return userRepository.findByUsername(username).map(UserDto::fromEntity);
    }

    @Transactional
    public UserDto toggleActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable id=" + userId));
        user.setActive(active);
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto updateRoles(Long userId, Set<Role> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable id=" + userId));
        user.setRoles(new HashSet<>(roles));
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }
}
