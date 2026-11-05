package fr.bijoux.erp.crm.dto;

import java.time.LocalDate;

public record UpdateCustomerRequest(
        String firstName,
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
