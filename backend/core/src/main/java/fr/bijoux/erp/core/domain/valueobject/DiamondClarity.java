package fr.bijoux.erp.core.domain.valueobject;

public enum DiamondClarity {
    FL("Flawless - Pur à la loupe 10x"),
    IF("Internally Flawless - Pur à l'intérieur"),
    VVS1("Very Very Slightly Included 1 - Minuscules inclusions difficilement visibles"),
    VVS2("Very Very Slightly Included 2"),
    VS1("Very Slightly Included 1 - Très petites inclusions"),
    VS2("Very Slightly Included 2"),
    SI1("Slightly Included 1 - Petites inclusions faciles à voir à 10x"),
    SI2("Slightly Included 2"),
    SI3("Slightly Included 3"),
    I1("Included 1 - Inclusions visibles à l'œil nu"),
    I2("Included 2 - Inclusions nombreuses affectant la brillance"),
    I3("Included 3 - Inclusions majeures affectant la solidité");

    private final String description;

    DiamondClarity(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
