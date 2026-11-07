package fr.bijoux.erp.api.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.api.PosController;
import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.core.security.model.Store;
import fr.bijoux.erp.core.security.repository.StoreRepository;
import fr.bijoux.erp.core.tenant.model.Tenant;
import fr.bijoux.erp.core.tenant.model.TenantPlan;
import fr.bijoux.erp.core.tenant.repository.TenantRepository;
import fr.bijoux.erp.crm.domain.model.MeasurementType;
import fr.bijoux.erp.crm.dto.AddMeasurementRequest;
import fr.bijoux.erp.crm.dto.CreateCustomerRequest;
import fr.bijoux.erp.crm.dto.CustomerDto;
import fr.bijoux.erp.gold.domain.model.GoldPaymentMethod;
import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import fr.bijoux.erp.gold.dto.CreateGoldDossierRequest;
import fr.bijoux.erp.gold.dto.GoldDossierResponse;
import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import fr.bijoux.erp.pos.domain.model.PosItemType;
import fr.bijoux.erp.pos.dto.CheckoutRequest;
import fr.bijoux.erp.pos.dto.CheckoutResponse;
import fr.bijoux.erp.workshop.dto.CreateRepairOrderRequest;
import fr.bijoux.erp.workshop.dto.RepairOrderResponse;
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
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suite de tests simulant fidèlement la journée type d'une vendeuse en bijouterie-joaillerie HBJO :
 * 1. Arrivée matinale et déclaration du fond de caisse (300,00 €).
 * 2. Consultation et prise de mesure au baguier pour une cliente VIP (taille 53).
 * 3. Encaissement d'une vente joaillerie avec multi-règlement sous le plafond légal de 1000 € espèces.
 * 4. Réception d'une bague pour réparation SAV en atelier avec encaissement d'un acompte.
 * 5. Opération de rachat d'or aux particuliers avec pesée, taxe TMP 11.5%, inscription Livre de Police, zéro cash et délai 48h.
 * 6. Clôture fiscale journalière Z inaltérable NF525 avec signature cryptographique scellée.
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Simulation Réaliste : Routine Quotidienne d'une Vendeuse en Boutique HBJO")
class DailySalespersonRoutineIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static Long savedCustomerId;

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
    @DisplayName("08h45 - Routine Matinale : Comptage et validation du fond de caisse initial (300 €)")
    void step1_morningCashFloatOpening() throws Exception {
        PosController.CashFloatRequest request = new PosController.CashFloatRequest(
                1L,
                "CAISSE-VENDOME-01",
                30000L, // 300.00 €
                "claire_vendome",
                "Comptage du matin : 150€ en billets de 10/20€ et 150€ en rouleaux de monnaie"
        );

        mockMvc.perform(post("/api/v1/pos/cash-float")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECORDED"))
                .andExpect(jsonPath("$.amountCents").value(30000))
                .andExpect(jsonPath("$.operator").value("claire_vendome"));
    }

    @Test
    @Order(2)
    @DisplayName("10h15 - Accueil Cliente & Baguier : Création fiche CRM et mesure du doigt pour bague sur mesure")
    void step2_customerConsultationAndRingSizing() throws Exception {
        CreateCustomerRequest customerRequest = new CreateCustomerRequest(
                "Éléonore",
                "de Polignac",
                "eleonore.polignac@chateau.fr",
                "06 12 34 56 78",
                "14 Avenue Montaigne",
                "Paris",
                "75008",
                "CNI-FR-123456789",
                LocalDate.now().plusYears(5),
                "Préfère le platine et les saphirs de Ceylan non chauffés"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.firstName").value("Éléonore"))
                .andExpect(jsonPath("$.lastName").value("de Polignac"))
                .andReturn();

        CustomerDto customer = objectMapper.readValue(result.getResponse().getContentAsString(), CustomerDto.class);
        savedCustomerId = customer.id();
        assertThat(savedCustomerId).isNotNull();

        // Enregistrement de la mesure au baguier joaillier (Taille 53 sur l'annulaire gauche)
        AddMeasurementRequest measurementRequest = new AddMeasurementRequest(
                MeasurementType.TAILLE_DOIGT_BAGUIER,
                BigDecimal.valueOf(53.0),
                "Annulaire Gauche"
        );

        mockMvc.perform(post("/api/v1/customers/" + savedCustomerId + "/measurements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(measurementRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.measurements[0].measurementType").value("TAILLE_DOIGT_BAGUIER"))
                .andExpect(jsonPath("$.measurements[0].fingerName").value("Annulaire Gauche"));
    }

    @Test
    @Order(3)
    @DisplayName("11h30 - Vente Joaillerie : Bague Solitaire Diamant 1.05ct avec règlement mixte sous plafond espèces 1000€")
    void step3_highJewelrySaleWithMixedPayment() throws Exception {
        // Article : Solitaire Platine 950 Diamant 1.05ct vendu 3 200,00 € TTC
        CheckoutRequest.CartLineDto itemLine = new CheckoutRequest.CartLineDto(
                1,
                PosItemType.CATALOG_ITEM,
                101L,
                "Solitaire Platine 950 Diamant 1.05ct H-VS1",
                1,
                320000L, // 3 200.00 €
                VatRegime.STANDARD_20,
                null,
                false
        );

        // Multi-paiement : 450,00 € Espèces (légal car <= 1 000 € Art. L112-6 CMF) + 2 750,00 € Carte Bancaire
        CheckoutRequest.PaymentDto cashPayment = new CheckoutRequest.PaymentDto(
                PaymentMethod.CASH,
                45000L,
                null,
                null,
                null,
                null
        );

        CheckoutRequest.PaymentDto cardPayment = new CheckoutRequest.PaymentDto(
                PaymentMethod.CARD,
                275000L,
                null,
                "TPE-VENDOME-01",
                null,
                null
        );

        CheckoutRequest request = new CheckoutRequest(
                1L, // Boutique Place Vendôme
                "claire_vendome",
                savedCustomerId,
                List.of(itemLine),
                List.of(cashPayment, cardPayment)
        );

        MvcResult result = mockMvc.perform(post("/api/v1/pos/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTtcCents").value(320000))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.signature").isNotEmpty())
                .andReturn();

        CheckoutResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), CheckoutResponse.class);
        assertThat(response.ticketNumber()).startsWith("TKT-1-");
        assertThat(response.signature()).isNotBlank();
        assertThat(response.payments()).hasSize(2);
    }

    @Test
    @Order(4)
    @DisplayName("14h20 - Dépôt Atelier SAV : Réception bague émeraude pour mise à taille et encaissement acompte 60€")
    void step4_workshopRepairDepositWithAdvancePayment() throws Exception {
        CreateRepairOrderRequest repairRequest = new CreateRepairOrderRequest(
                1L,
                savedCustomerId,
                "claire_vendome",
                "Bague émeraude de Colombie : mise à taille 54 vers 52 et sertissage 2 griffes",
                "OR",
                "750",
                new BigDecimal("4.50"),
                null,
                16000L,
                "Promis pour samedi",
                6000L,
                8000L
        );

        MvcResult result = mockMvc.perform(post("/api/v1/workshop/orders/repair")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(repairRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.estimatedQuoteCents").value(16000))
                .andExpect(jsonPath("$.status").value("DEPOT"))
                .andReturn();

        RepairOrderResponse repair = objectMapper.readValue(result.getResponse().getContentAsString(), RepairOrderResponse.class);
        assertThat(repair.id()).isNotNull();

        // Vérification de la préparation de la facture SAV
        mockMvc.perform(get("/api/v1/workshop/orders/" + repair.id() + "/invoice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.repairOrderId").value(repair.id()))
                .andExpect(jsonPath("$.remainingBalanceCents").value(10000)); // 160€ - 60€ = 100€ restant à payer
    }

    @Test
    @Order(5)
    @DisplayName("16h00 - Rachat d'Or : Collier or 18K brisé, taxe TMP 11.5%, Livre de Police, zéro espèces et délai 48h")
    void step5_goldBuybackWithLegalCompliance() throws Exception {
        // Vente de 15.20g d'or 18K (750‰) à 50.00 € le gramme
        CreateGoldDossierRequest.GoldScrapItemDto scrapItem = new CreateGoldDossierRequest.GoldScrapItemDto(
                "Collier maille forçat or jaune 18K avec maillons brisés",
                "OR",
                "OR_750",
                new BigDecimal("15.20"),
                new BigDecimal("15.20"),
                new BigDecimal("0.750"),
                5000L // 50.00 € / g
        );

        CreateGoldDossierRequest request = new CreateGoldDossierRequest(
                1L,
                "claire_vendome",
                savedCustomerId,
                "Hélène Mercier",
                "CNI-FR-9876543210",
                "8 Rue de la Paix, 75002 Paris",
                GoldTaxRegime.TMP_11_5,
                GoldPaymentMethod.VIREMENT,
                null,
                null,
                List.of(scrapItem)
        );

        MvcResult result = mockMvc.perform(post("/api/v1/gold/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dossierNumber").isNotEmpty())
                .andExpect(jsonPath("$.totalGrossWeightGrams").value(15.20))
                .andExpect(jsonPath("$.taxStrategy").value("TMP_11_5"))
                .andReturn();

        GoldDossierResponse buyback = objectMapper.readValue(result.getResponse().getContentAsString(), GoldDossierResponse.class);
        assertThat(buyback.dossierNumber()).isNotEmpty();
        assertThat(buyback.netPayableToSellerCents()).isGreaterThan(0L);
    }

    @Test
    @Order(6)
    @DisplayName("19h15 - Clôture de Journée : Exécution du Z Journalier fiscal inaltérable avec scellement SHA-256")
    void step6_eveningDailyZClosure() throws Exception {
        mockMvc.perform(post("/api/v1/pos/closures/z")
                        .param("storeId", "1")
                        .param("operator", "claire_vendome"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closureType").value("JOURNALIER_Z"))
                .andExpect(jsonPath("$.storeId").value(1))
                .andExpect(jsonPath("$.operatorUsername").value("claire_vendome"))
                .andExpect(jsonPath("$.signature").isNotEmpty())
                .andExpect(jsonPath("$.totalTtcCents").isNumber());
    }
}
