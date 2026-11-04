package fr.bijoux.erp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

@DisplayName("Tests d'architecture et de modularité Spring Modulith")
class ModulithArchitectureTest {

    private final ApplicationModules modules = ApplicationModules.of(ErpBijouxApplication.class);

    @Test
    @DisplayName("Doit valider strictement les frontières et dépendances des modules métiers")
    void shouldVerifyModulithArchitecture() {
        System.out.println("=== Spring Modulith Modules Détectés ===");
        modules.forEach(System.out::println);

        // Vérification stricte de l'encapsulation et interdiction des dépendances cycliques
        modules.verify();
    }

    @Test
    @DisplayName("Doit générer la documentation vivante d'architecture (C4 / PlantUML)")
    void shouldGenerateModulithDocumentation() {
        new Documenter(modules).writeDocumentation();
    }
}
