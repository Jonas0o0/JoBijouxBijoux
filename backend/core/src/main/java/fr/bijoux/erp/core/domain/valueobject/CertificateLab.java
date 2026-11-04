package fr.bijoux.erp.core.domain.valueobject;

public enum CertificateLab {
    GIA("Gemological Institute of America"),
    HRD("Hoge Raad voor Diamant (Anvers)"),
    IGI("International Gemological Institute"),
    LFG("Laboratoire Français de Gemmologie"),
    NONE("Sans certificat de laboratoire");

    private final String description;

    CertificateLab(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
