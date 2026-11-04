package fr.bijoux.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Point d'entrée principal de la plateforme ERP Bijoux (HBJO).
 * Architecture Modulaire Spring Modulith avec Java 21 et Virtual Threads.
 */
@SpringBootApplication
@EnableAsync
@ConfigurationPropertiesScan
public class ErpBijouxApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpBijouxApplication.class, args);
    }
}
