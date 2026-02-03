<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    modelValue: Boolean,
    title: { type: String, default: 'Confirmación' },
    mensaje: { type: String, required: true },
    color: { type: String, default: 'primary' } ,
    confirmText: { type: String, default: 'Aceptar' },
    cancelText: { type: String, default: 'Cancelar' },
    showCancelButton: { type: Boolean, default: true }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const updateModel = (val) => {
  emit('update:modelValue', val);
};

const confirmar = () => {
  emit('confirm');
  updateModel(false);
};

const dynamicIcon = computed(() => {
    switch (props.color) {
        case 'success': return 'tabler-check';
        case 'error': return 'tabler-alert-circle';
        case 'warning': return 'tabler-alert-triangle';
        case 'info': return 'tabler-info-circle';
        default: return 'tabler-info-circle';
    }
});



</script>
<template>
  <VDialog
    :model-value="props.modelValue"
    @update:model-value="updateModel"
    max-width="450px"
    persistent
  >
    <VCard>
      <VCardTitle 
        class="d-flex align-center" 
        :class="[`text-${props.color}`, 'py-4']"
        style="padding-left: 24px; padding-right: 24px;"
      >
        <VIcon :icon="dynamicIcon" size="24" class="me-3" :color="props.color" />
        
        <span class="font-weight-bold text-h6">{{ props.title }}</span>

        <VSpacer />
        <VBtn 
          icon="tabler-x" 
          @click="updateModel(false)" 
          variant="text" 
          :color="props.color" 
          size="small"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="text-center py-6 px-8">
        <p class="text-h6" v-html="props.mensaje"></p>
      </VCardText>

      <VDivider />

      <VCardActions class="px-6 py-4">
        <VSpacer />
        
        <VBtn 
          v-if="props.showCancelButton" 
          color="secondary" 
          variant="tonal" 
          @click="updateModel(false)"
        >
          {{ props.cancelText }}
        </VBtn>
        
        <VBtn 
          :color="props.color" 
          @click="confirmar" 
          class="text-white font-weight-bold"
          variant="flat"
        >
          {{ props.confirmText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-card-title {
  font-size: 1.25rem; 
}
</style>