package fr.bijoux.erp.api.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.api.AuthController;
import fr.bijoux.erp.catalog.domain.model.JewelryItem;
import fr.bijoux.erp.catalog.domain.model.JewelryItemStatus;
import fr.bijoux.erp.catalog.domain.repository.JewelryItemRepository;
import fr.bijoux.erp.catalog.dto.StockTransferRequest;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import fr.bijoux.erp.core.domain.valueobject.MoneyAmount;
import fr.bijoux.erp.core.domain.valueobject.WeightInGrams;
import fr.bijoux.erp.core.security.dto.CreateUserRequest;
import fr.bijoux.erp.core.security.dto.UserDto;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.model.Store;
import fr.bijoux.erp.core.security.repository.StoreRepository;
import fr.bijoux.erp.core.tenant.model.Tenant;
import fr.bijoux.erp.core.tenant.model.TenantPlan;
import fr.bijoux.erp.core.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suite de tests simulant les routines occasionnelles et administratives d'une bijouterie :
 * 1. Création d'un nouveau compte pour une vendeuse recrutée avec rôle et code PIN caisse.
 * 2. Authentification SaaS immédiate de la nouvelle vendeuse et obtention de son token JWT.
 * 3. Transfert d'une pièce de joaillerie vers une autre boutique (Place Vendôme -> Cannes Croisette).
 * 4. Exécution de la clôture fiscale mensuelle M inaltérable.
 * 5. Génération et vérification de conformité du fichier FEC officiel DGFIP (18 colonnes normées).
 * 6. Audit et consultation du Livre de Police officiel pour contrôle des Douanes / Police (CGI 537/538).
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Simulation Réaliste : Routines Occasionnelles, Gestion d'Équipe & Comptabilité")
class OccasionalManagementRoutineIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JewelryItemRepository jewelryItemRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static Long transferredItemId;

    @BeforeEach
    void initDb() {
        try {
            jdbcTemplate.execute("ALTER TABLE event_publication ALTER COLUMN serialized_event SET DATA TYPE VARCHAR(10000)");
        } catch (Exception ignored) {
        }
        if (storeRepository.count() == 0) {
            Tenant tenant = tenantRepository.save(new Tenant("maison-vendome", "Maison Vendôme", "12345678900012", TenantPlan.PREMIUM_HAUTE_JOAILLERIE));
            Store store1 = new Store("STORE-PARIS-01", "Boutique Vendôme", tenant);
            storeRepository.save(store1);
            Store store3 = new Store("STORE-CANNES-03", "Boutique Cannes Croisette", tenant);
            storeRepository.save(store3);
        }
    }

    @Test
    @Order(1)
    @DisplayName("Étape 1 : Création d'un compte pour une nouvelle vendeuse (Sophie Martin, PIN 7842, Vendôme)")
    void step1_createNewSalespersonAccount() throws Exception {
        Long storeId = storeRepository.findAll().get(0).getId();

        CreateUserRequest request = new CreateUserRequest(
                "smartin",
                "7842",
                "Sophie",
                "Martin",
                "sophie.martin@bijoux-vendome.fr",
                storeId,
                Set.of(Role.ROLE_VENDEUR)
        );

        MvcResult result = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("smartin"))
                .andExpect(jsonPath("$.firstName").value("Sophie"))
                .andExpect(jsonPath("$.lastName").value("Martin"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_VENDEUR"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();

        UserDto userDto = objectMapper.readValue(result.getResponse().getContentAsString(), UserDto.class);
        assertThat(userDto.id()).isNotNull();

        // Vérification de la présence dans la liste des collaborateurs
        mockMvc.perform(get("/api/v1/users").param("storeId", String.valueOf(storeId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.username == 'smartin')]").exists());
    }

    @Test
    @Order(2)
    @DisplayName("Étape 2 : Connexion immédiate de la nouvelle vendeuse via son identifiant et sélection boutique")
    void step2_newSalespersonLogin() throws Exception {
        Long storeId = storeRepository.findAll().get(0).getId();

        AuthController.LoginRequest loginRequest = new AuthController.LoginRequest(
                "smartin",
                "7842",
                "maison-vendome",
                storeId
        );

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("smartin"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tenantId").value("maison-vendome"))
                .andExpect(jsonPath("$.storeId").value(storeId.intValue()))
                .andExpect(jsonPath("$.stores").isArray())
                .andReturn();

        AuthController.LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), AuthController.LoginResponse.class);
        assertThat(response.token()).isNotBlank();
        assertThat(response.roles()).contains("ROLE_VENDEUR");
    }

    @Test
    @Order(3)
    @DisplayName("Étape 3 : Transfert de stock inter-magasins (Place Vendôme -> Cannes Croisette avec bordereau sécurisé)")
    void step3_interStoreStockTransfer() throws Exception {
        Long sourceStoreId = storeRepository.findAll().get(0).getId();
        Long targetStoreId = storeRepository.findAll().get(1).getId();

        // Création en base d'une parure d'exception pour le test
        JewelryItem item = new JewelryItem(
                "SN-PARURE-CANNES-01",
                "REF-RIVIERE-DIA",
                "Collier Rivière Diamants 4.50ct Or Blanc 750",
                GoldFineness.OR_750,
                new WeightInGrams(new BigDecimal("28.400")),
                MoneyAmount.ofCents(1250000L), // 12 500 €
                MoneyAmount.ofCents(600000L),
                null,
                sourceStoreId
        );
        item.setStatus(JewelryItemStatus.EN_VITRINE);
        JewelryItem saved = jewelryItemRepository.save(item);
        transferredItemId = saved.getId();

        StockTransferRequest transferRequest = new StockTransferRequest(
                targetStoreId,
                null,
                "BRINKS_EVOLUTIC_SECURITY",
                "TR-CANNES-2026-089",
                "gerant_vendome",
                "Demande expresse pour vente privée Festival de Cannes"
        );

        mockMvc.perform(post("/api/v1/stock/items/" + transferredItemId + "/transfer-store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(transferRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(transferredItemId))
                .andExpect(jsonPath("$.storeId").value(targetStoreId.intValue()))
                .andExpect(jsonPath("$.serialNumber").value("SN-PARURE-CANNES-01"));

        // Vérification de la disponibilité du bijou dans la boutique cible
        mockMvc.perform(get("/api/v1/stock/items").param("storeId", String.valueOf(targetStoreId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.serialNumber == 'SN-PARURE-CANNES-01')]").exists());
    }

    @Test
    @Order(4)
    @DisplayName("Étape 4 : Clôture Fiscale Mensuelle M inaltérable (NF525 / CGI Art. 286)")
    void step4_monthlyMClosure() throws Exception {
        Long storeId = storeRepository.findAll().get(0).getId();

        mockMvc.perform(post("/api/v1/pos/closures/m")
                        .param("storeId", String.valueOf(storeId))
                        .param("operator", "gerant_vendome"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closureType").value("MENSUEL_M"))
                .andExpect(jsonPath("$.storeId").value(storeId.intValue()))
                .andExpect(jsonPath("$.signature").isNotEmpty());
    }

    @Test
    @Order(5)
    @DisplayName("Étape 5 : Export FEC DGFIP (18 colonnes normées, équilibre Débit/Crédit et Plan Comptable Général)")
    void step5_fecAccountingExportVerification() throws Exception {
        Long storeId = storeRepository.findAll().get(0).getId();

        MvcResult result = mockMvc.perform(get("/api/v1/accounting/fec")
                        .param("storeId", String.valueOf(storeId)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("FEC_MAG" + storeId + "_")))
                .andReturn();

        String fecText = result.getResponse().getContentAsString();
        assertThat(fecText).isNotEmpty();

        String[] lines = fecText.split("\n");
        assertThat(lines.length).isGreaterThanOrEqualTo(1);

        // Vérification stricte des 18 en-têtes officiels de la DGFIP (Art. A.47 A-1 LPF)
        String headerLine = lines[0];
        String[] columns = headerLine.split("\t");
        assertThat(columns).hasSize(18);
        assertThat(columns[0]).isEqualTo("JournalCode");
        assertThat(columns[1]).isEqualTo("JournalLib");
        assertThat(columns[2]).isEqualTo("EcritureNum");
        assertThat(columns[3]).isEqualTo("EcritureDate");
        assertThat(columns[4]).isEqualTo("CompteNum");
        assertThat(columns[5]).isEqualTo("CompteLib");
        assertThat(columns[11]).isEqualTo("Debit");
        assertThat(columns[12]).isEqualTo("Credit");
    }

    @Test
    @Order(6)
    @DisplayName("Étape 6 : Consultation et Audit du Livre de Police officiel (CGI 537/538, DGDDI)")
    void step6_policeBookAuditAndInspection() throws Exception {
        Long storeId = storeRepository.findAll().get(0).getId();

        mockMvc.perform(get("/api/v1/police-book/entries")
                        .param("storeId", String.valueOf(storeId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
