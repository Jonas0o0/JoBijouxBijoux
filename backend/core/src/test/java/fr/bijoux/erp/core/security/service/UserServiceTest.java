package fr.bijoux.erp.core.security.service;

import fr.bijoux.erp.core.security.dto.CreateUserRequest;
import fr.bijoux.erp.core.security.dto.UserDto;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.model.Store;
import fr.bijoux.erp.core.security.model.User;
import fr.bijoux.erp.core.security.repository.StoreRepository;
import fr.bijoux.erp.core.security.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests du service de gestion des utilisateurs et vendeuses")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private Store sampleStore;

    @BeforeEach
    void setUp() {
        sampleStore = new Store("STORE-PARIS-01", "Boutique Vendôme");
        sampleStore.setId(1L);
    }

    @Test
    @DisplayName("Doit créer une vendeuse avec succès et hasher son code PIN")
    void shouldCreateSellerSuccessfully() {
        CreateUserRequest request = new CreateUserRequest(
                "smartin",
                "7842",
                "Sophie",
                "Martin",
                "sophie.martin@vendome.fr",
                1L,
                Set.of(Role.ROLE_VENDEUR)
        );

        when(userRepository.existsByUsername("smartin")).thenReturn(false);
        when(userRepository.existsByEmail("sophie.martin@vendome.fr")).thenReturn(false);
        when(passwordEncoder.encode("7842")).thenReturn("$2a$10$hashedPinValue");
        when(storeRepository.findById(1L)).thenReturn(Optional.of(sampleStore));

        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(42L);
            return u;
        });

        UserDto created = userService.createUser(request);

        assertThat(created).isNotNull();
        assertThat(created.id()).isEqualTo(42L);
        assertThat(created.username()).isEqualTo("smartin");
        assertThat(created.firstName()).isEqualTo("Sophie");
        assertThat(created.lastName()).isEqualTo("Martin");
        assertThat(created.roles()).contains("ROLE_VENDEUR");
        assertThat(created.storeId()).isEqualTo(1L);
        assertThat(created.active()).isTrue();

        verify(passwordEncoder).encode("7842");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Doit refuser la création si l'identifiant est déjà pris")
    void shouldRejectDuplicateUsername() {
        CreateUserRequest request = new CreateUserRequest(
                "caissier",
                "1234",
                "Jean",
                "Dupont",
                "jean@dupont.fr",
                1L,
                Set.of(Role.ROLE_VENDEUR)
        );

        when(userRepository.existsByUsername("caissier")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("déjà utilisé");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Doit lister les vendeuses d'un magasin donné")
    void shouldFindUsersByStore() {
        User user1 = new User("vendeuse1", "hash", "Claire", "Dubois", "claire@bijoux.fr");
        user1.setId(10L);
        user1.setStore(sampleStore);
        user1.setRoles(Set.of(Role.ROLE_VENDEUR));

        when(userRepository.findByStoreId(1L)).thenReturn(List.of(user1));

        List<UserDto> users = userService.findUsersByStore(1L);

        assertThat(users).hasSize(1);
        assertThat(users.get(0).username()).isEqualTo("vendeuse1");
        assertThat(users.get(0).storeName()).isEqualTo("Boutique Vendôme");
    }
}
