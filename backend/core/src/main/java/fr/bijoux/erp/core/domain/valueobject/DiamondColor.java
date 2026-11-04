package fr.bijoux.erp.core.domain.valueobject;

public enum DiamondColor {
    D("Exceptionnel Blanc +"),
    E("Exceptionnel Blanc"),
    F("Rare Blanc +"),
    G("Rare Blanc"),
    H("Blanc"),
    I("Légèrement Teinté Blanc +"),
    J("Légèrement Teinté Blanc"),
    K("Teinté Blanc"),
    L("Teinté Blanc"),
    M("Teinté 1"),
    N_Z("Teinté Clair à Jaune");

    private final String description;

    DiamondColor(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
