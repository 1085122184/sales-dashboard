<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  borderRadius?: string
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '20px',
  borderRadius: '6px',
})
</script>

<template>
  <div
    class="skeleton"
    :style="{ width, height, borderRadius }"
  />
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    #f1f5f9 25%,
    #e2e8f0 37%,
    #f1f5f9 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
