<script setup>
import { defineProps, defineEmits, ref, watch, computed } from 'vue';

const props = defineProps({
    modelValue: Boolean,
    title: { type: String, default: 'Notificación Importante' },
    mensaje: { type: String, required: true },
    color: { type: String, required: true },
    timeout: { type: [Number, String], required: true } 
});

const emit = defineEmits(['update:modelValue']);

const isVisible = ref(props.modelValue);
let timer = null;

const updateModel = (val) => {
    emit('update:modelValue', val);
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

// Lógica del temporizador (es correcta, la mantenemos)
watch(() => props.modelValue, (newVal) => {
    isVisible.value = newVal;

    if (timer) {
        clearTimeout(timer);
    }
    
    if (newVal) {
        const duration = parseInt(props.timeout);
        if (duration > 0) {
            timer = setTimeout(() => {
                updateModel(false);
            }, duration);
        }
    }
});
</script>

<template>
  <VDialog
    :model-value="isVisible"
    @update:model-value="updateModel"
    max-width="450px"
    :persistent="false" 
    class="mensaje-temporal-dialog"
  >
    <VCard>
      <VCardTitle 
        class="d-flex align-center" 
        :class="[`text-${props.color}`, 'py-4']"
        style="padding-left: 24px; padding-right: 24px;"
      >
        <VIcon :icon="dynamicIcon"  size="24" class="me-3" :color="props.color" />
        
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
        <p class="text-body-1" v-html="props.mensaje"></p>
        <!-- <p v-if="parseInt(props.timeout) > 0" class="mt-4 text-caption text-medium-emphasis">
            Se cerrará automáticamente en {{ (parseInt(props.timeout) / 1000).toFixed(1) }} segundos.
        </p> -->
      </VCardText>

      </VCard>
  </VDialog>
</template>


<style scoped>
.v-card-title {
  font-size: 1.25rem; 
}
</style>