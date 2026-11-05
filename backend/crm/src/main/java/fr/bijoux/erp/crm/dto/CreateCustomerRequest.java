package fr.bijoux.erp.crm.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record CreateCustomerRequest(
        @NotBlank(message = "Le prénom est obligatoire")
        String firstName,

        @NotBlank(message = "Le nom de famille est obligatoire")
        String lastName,

        String email,
        String phone,
        String address,
        String city,
        String postalCode,
        String cniPassportNumber,
        LocalDate cniExpiryDate,
        String notes
) {}
