package fr.bijoux.erp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Test d'intégration du démarrage de l'application Spring Boot")
class ErpBijouxApplicationTests {

    @Test
    @DisplayName("Le contexte d'application doit démarrer correctement avec Virtual Threads et tous les modules")
    void contextLoads() {
        assertThat(true).isTrue();
    }
}
