package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.core.security.dto.CreateUserRequest;
import fr.bijoux.erp.core.security.dto.UserDto;
import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Utilisateurs et Collaborateurs")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/v1/users - Doit créer un nouveau collaborateur vendeuse")
    void shouldCreateUser() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "smartin",
                "7842",
                "Sophie",
                "Martin",
                "sophie@vendome.fr",
                1L,
                Set.of(Role.ROLE_VENDEUR)
        );

        UserDto response = new UserDto(
                5L,
                "smartin",
                "Sophie",
                "Martin",
                "sophie@vendome.fr",
                true,
                Set.of("ROLE_VENDEUR"),
                1L,
                "Boutique Vendôme",
                Instant.now()
        );

        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("smartin"))
                .andExpect(jsonPath("$.firstName").value("Sophie"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_VENDEUR"));
    }

    @Test
    @DisplayName("GET /api/v1/users - Doit lister les vendeuses du magasin")
    void shouldListUsersByStore() throws Exception {
        UserDto response = new UserDto(
                5L,
                "smartin",
                "Sophie",
                "Martin",
                "sophie@vendome.fr",
                true,
                Set.of("ROLE_VENDEUR"),
                1L,
                "Boutique Vendôme",
                Instant.now()
        );

        when(userService.findUsersByStore(1L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/users").param("storeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("smartin"));
    }
}
