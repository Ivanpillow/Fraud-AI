<script setup>
import { useTheme } from 'vuetify'

const { global } = useTheme()

const socialLinks = [
  {
    icon: 'tabler-brand-instagram',
    color: '#C13584',
    colorInDark: '#E1306C',
    url: 'https://www.instagram.com/dlc_anhell/',
  },
  {
    icon: 'tabler-brand-instagram',
    color: '#C13584',
    colorInDark: '#E1306C',
    url: 'https://www.instagram.com/ivanpillow/',
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
