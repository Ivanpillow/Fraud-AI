<script setup>
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard title="Inicio">
          <!-- <VCardText>
            <img 
              src="/imagenes/logos/logo_borde_blanco.svg" 
              alt="Logo" 
              class="responsive-logo"
            />
          </VCardText> -->
          <VCardText>
            <img 
              src="/imagenes/logos/img_loader.png" 
              alt="Logo" 
              class="responsive-logo"
            />
          </VCardText>
            <VCardText class="text-center mt-4">
                <h2>Bienvenido a CasaAdminERP</h2>
                <!-- <p>Tu solución integral para la gestión administrativa y contable.</p> -->
            </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.responsive-logo {
  display: block;
  margin: 0 auto;
  max-width: 800px;   
  width: 100%;        
  height: auto;
}

/* En pantallas pequeñas (ej: móviles) */
@media (max-width: 600px) {
  .responsive-logo {
    max-width: 300px; 
  }
}
</style>
