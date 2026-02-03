<script setup>
import { useTheme } from 'vuetify'

const { global } = useTheme()

const socialLinks = [
  {
    icon: 'tabler-world',
    color: '#4CAF50',
    colorInDark: '#81C784',
    url: 'https://casaadministraciones.com',
  },
  {
    icon: 'tabler-brand-facebook-filled',
    color: '#4267b2',
    colorInDark: '#497CE2',
    url: 'https://www.facebook.com/casaadministraciones',
  },
  {
    icon: 'tabler-brand-instagram',
    color: '#C13584',
    colorInDark: '#E1306C',
    url: 'https://www.instagram.com/casaadmons/',
  },
  {
    icon: 'tabler-brand-tiktok',
    color: '#000000',
    colorInDark: '#ffffff',
    url: 'https://www.tiktok.com/@casaadministraciones',
  },
  {
    icon: 'tabler-brand-youtube-filled',
    color: '#FF0000',
    colorInDark: '#FF4D4D',
    url: 'https://www.youtube.com/@CasaAdministracionesComercial',
  },
  {
    icon: 'tabler-brand-linkedin',
    color: '#0077B5',
    colorInDark: '#0A66C2',
    url: 'https://linkedin.com/company/casaadministraciones',
  },
]
</script>

<template>
  <div class="d-flex justify-center flex-wrap gap-1">
    <VBtn
      v-for="link in socialLinks"
      :key="link.icon"
      icon
      variant="text"
      size="small"
      tag="a"
      :href="link.url"
      target="_blank"
      :color="global.name.value === 'dark' ? link.colorInDark : link.color"
    >
      <VIcon
        size="20"
        :icon="link.icon"
      />
    </VBtn>
  </div>
</template>
