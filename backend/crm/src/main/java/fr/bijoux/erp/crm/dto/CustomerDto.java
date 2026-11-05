package fr.bijoux.erp.crm.dto;

import fr.bijoux.erp.crm.domain.model.Customer;
import fr.bijoux.erp.crm.domain.model.CustomerMeasurement;
import fr.bijoux.erp.crm.domain.model.MeasurementType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record CustomerDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String address,
        String city,
        String postalCode,
        String cniPassportNumber,
        LocalDate cniExpiryDate,
        String notes,
        Instant createdAt,
        List<MeasurementDetailDto> measurements
) {
    public record MeasurementDetailDto(
            Long id,
            MeasurementType measurementType,
            BigDecimal value,
            String fingerName,
            Instant recordedAt
    ) {
        public static MeasurementDetailDto fromEntity(CustomerMeasurement m) {
            return new MeasurementDetailDto(m.getId(), m.getMeasurementType(), m.getValue(), m.getFingerName(), m.getRecordedAt());
        }
    }

    public static CustomerDto fromEntity(Customer c) {
        List<MeasurementDetailDto> measDtos = c.getMeasurements().stream()
                .map(MeasurementDetailDto::fromEntity)
                .toList();

        return new CustomerDto(
                c.getId(),
                c.getFirstName(),
                c.getLastName(),
                c.getEmail(),
                c.getPhone(),
                c.getAddress(),
                c.getCity(),
                c.getPostalCode(),
                c.getCniPassportNumber(),
                c.getCniExpiryDate(),
                c.getNotes(),
                c.getCreatedAt(),
                measDtos
        );
    }
}
