package fr.bijoux.erp.core.tenant;

import fr.bijoux.erp.core.tenant.context.TenantContext;
import fr.bijoux.erp.core.tenant.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Tests unitaires de TenantContext et TenantContextHolder (Isolation Virtual Threads)")
class TenantContextTest {

    @BeforeEach
    @AfterEach
    void cleanUp() {
        TenantContextHolder.clear();
        TenantContext.clear();
        fr.bijoux.erp.core.tenant.TenantContextHolder.clear();
        fr.bijoux.erp.core.tenant.TenantContext.clear();
    }

    @Test
    @DisplayName("Doit définir, récupérer et nettoyer le tenantId dans le thread courant")
    void shouldSetGetAndClearTenantId() {
        assertThat(TenantContextHolder.getTenantId()).isNull();

        TenantContextHolder.setTenantId("maison-vendome");
        assertThat(TenantContextHolder.getTenantId()).isEqualTo("maison-vendome");
        assertThat(TenantContext.getTenantId()).isEqualTo("maison-vendome");
        assertThat(fr.bijoux.erp.core.tenant.TenantContextHolder.getTenantId()).isEqualTo("maison-vendome");

        TenantContextHolder.clear();
        assertThat(TenantContextHolder.getTenantId()).isNull();
        assertThat(TenantContext.getTenantId()).isNull();
    }

    @Test
    @DisplayName("Doit garantir une isolation stricte entre Virtual Threads sans interférence")
    void shouldEnsureStrictIsolationAcrossVirtualThreads() throws InterruptedException {
        int threadCount = 20;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        ConcurrentHashMap<Integer, String> results = new ConcurrentHashMap<>();

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            final String tenantId = "tenant-" + index;

            Thread.ofVirtual().name("vt-tenant-test-" + index).start(() -> {
                try {
                    startLatch.await();
                    TenantContextHolder.setTenantId(tenantId);
                    Thread.sleep(10);
                    results.put(index, TenantContextHolder.getTenantId());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    TenantContextHolder.clear();
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(5, TimeUnit.SECONDS);

        assertThat(completed).isTrue();
        assertThat(results).hasSize(threadCount);
        for (int i = 0; i < threadCount; i++) {
            assertThat(results.get(i)).isEqualTo("tenant-" + i);
        }
    }

    @Test
    @DisplayName("Doit supporter getContext() et setContext()")
    void shouldSupportGetAndSetContext() {
        TenantContextHolder.setTenantId("joaillerie-dubois");
        TenantContext context = TenantContextHolder.getContext();
        assertThat(context.tenantId()).isEqualTo("joaillerie-dubois");

        TenantContextHolder.clear();
        assertThat(TenantContextHolder.getTenantId()).isNull();

        TenantContextHolder.setContext(context);
        assertThat(TenantContextHolder.getTenantId()).isEqualTo("joaillerie-dubois");

        TenantContextHolder.setContext(null);
        assertThat(TenantContextHolder.getTenantId()).isNull();
    }
}
