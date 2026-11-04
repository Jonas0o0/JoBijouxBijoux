package fr.bijoux.erp.core.domain.valueobject;

public enum MetalType {
    OR("Or"),
    ARGENT("Argent"),
    PLATINE("Platine");

    private final String label;

    MetalType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
