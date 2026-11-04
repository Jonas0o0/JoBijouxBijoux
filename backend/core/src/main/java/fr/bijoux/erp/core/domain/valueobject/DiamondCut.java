package fr.bijoux.erp.core.domain.valueobject;

public enum DiamondCut {
    EXCELLENT("Excellent"),
    VERY_GOOD("Très Bon"),
    GOOD("Bon"),
    FAIR("Passable"),
    POOR("Médiocre");

    private final String description;

    DiamondCut(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
