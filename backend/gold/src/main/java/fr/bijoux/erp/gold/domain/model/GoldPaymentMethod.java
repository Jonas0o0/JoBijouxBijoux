package fr.bijoux.erp.gold.domain.model;

/**
 * Modes de règlement légaux pour le rachat d'or aux particuliers (Art. L112-6 CMF).
 * LE PAIEMENT EN ESPÈCES EST STRICTEMENT INTERDIT PAR LA LOI FRANÇAISE.
 */
public enum GoldPaymentMethod {
    VIREMENT("Virement bancaire"),
    CHEQUE("Chèque bancaire barré non transmissible");

    private final String label;

    GoldPaymentMethod(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
