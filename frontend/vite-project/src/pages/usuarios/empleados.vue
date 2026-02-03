<template>
  <VContainer>
    <VCard>
      <VCardTitle>Usuarios</VCardTitle>
      <VDataTable
        :headers="headers"
        :items="usuarios"
        class="elevation-1"
      >
        <template #item.correo="{ item }">
          <a :href="`mailto:${item.correo}`">{{ item.correo }}</a>
        </template>
      </VDataTable>
    </VCard>
  </VContainer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api' 

const usuarios = ref([])

const headers = [
  { title: 'Nombre', key: 'Nombre' },
  { title: 'Puesto', key: 'Puesto' },
  { title: 'Correo', key: 'Correo' },
]

const obtenerUsuarios = async () => {
  try {
    const res = await api.get('/usuarios')
    // console.log('Usuarios recibidos:', res.data)
    usuarios.value = res.data
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
  }
}

onMounted(() => {
  obtenerUsuarios()
})
</script>