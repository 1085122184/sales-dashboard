<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="section-title">
    <span class="title-text">{{ title }}</span>
  </div>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.title-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  position: relative;
  padding-bottom: 6px;
}

.title-text::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary) 0%, transparent 100%);
  border-radius: 1px;
}
</style>
