package fr.bijoux.erp.core.domain.valueobject;

import java.io.Serializable;
import java.util.Objects;

/**
 * Value Object immuable représentant la caractérisation gemmologique d'un diamant selon les 4C.
 * Carat (Poids), Color (Couleur), Clarity (Pureté), Cut (Taille).
 * Inclut également le polissage, la symétrie, la fluorescence et le certificat de laboratoire.
 */
public record Diamond4C(
        Carat carat,
        DiamondColor color,
        DiamondClarity clarity,
        DiamondCut cut,
        PolishGrade polish,
        SymmetryGrade symmetry,
        Fluorescence fluorescence,
        CertificateLab certificateLab,
        String certificateNumber,
        String laserInscription
) implements Serializable {

    public Diamond4C {
        Objects.requireNonNull(carat, "Le poids en carats est obligatoire");
        Objects.requireNonNull(color, "La couleur du diamant est obligatoire");
        Objects.requireNonNull(clarity, "La pureté du diamant est obligatoire");
        Objects.requireNonNull(cut, "La qualité de taille est obligatoire");
        if (polish == null) polish = PolishGrade.VERY_GOOD;
        if (symmetry == null) symmetry = SymmetryGrade.VERY_GOOD;
        if (fluorescence == null) fluorescence = Fluorescence.NONE;
        if (certificateLab == null) certificateLab = CertificateLab.NONE;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Carat carat;
        private DiamondColor color;
        private DiamondClarity clarity;
        private DiamondCut cut;
        private PolishGrade polish = PolishGrade.VERY_GOOD;
        private SymmetryGrade symmetry = SymmetryGrade.VERY_GOOD;
        private Fluorescence fluorescence = Fluorescence.NONE;
        private CertificateLab certificateLab = CertificateLab.NONE;
        private String certificateNumber;
        private String laserInscription;

        public Builder carat(Carat carat) {
            this.carat = carat;
            return this;
        }

        public Builder color(DiamondColor color) {
            this.color = color;
            return this;
        }

        public Builder clarity(DiamondClarity clarity) {
            this.clarity = clarity;
            return this;
        }

        public Builder cut(DiamondCut cut) {
            this.cut = cut;
            return this;
        }

        public Builder polish(PolishGrade polish) {
            this.polish = polish;
            return this;
        }

        public Builder symmetry(SymmetryGrade symmetry) {
            this.symmetry = symmetry;
            return this;
        }

        public Builder fluorescence(Fluorescence fluorescence) {
            this.fluorescence = fluorescence;
            return this;
        }

        public Builder certificateLab(CertificateLab certificateLab) {
            this.certificateLab = certificateLab;
            return this;
        }

        public Builder certificateNumber(String certificateNumber) {
            this.certificateNumber = certificateNumber;
            return this;
        }

        public Builder laserInscription(String laserInscription) {
            this.laserInscription = laserInscription;
            return this;
        }

        public Diamond4C build() {
            return new Diamond4C(
                    carat, color, clarity, cut, polish, symmetry,
                    fluorescence, certificateLab, certificateNumber, laserInscription
            );
        }
    }
}
