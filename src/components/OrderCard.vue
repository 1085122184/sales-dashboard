<script setup lang="ts">
import ProgressBar from './ProgressBar.vue'
import type { OrderMetric } from '@/types'

defineProps<{
  data: OrderMetric
}>()
</script>

<template>
  <div class="order-card">
    <div class="card-label">{{ data.title }}</div>
    <div class="card-count number">{{ data.count }}</div>
    <div class="card-bottom">
      <div class="ratio-row">
        <span class="ratio-label">占比</span>
        <span class="ratio-value number">{{ data.ratioText }}</span>
      </div>
      <ProgressBar :value="data.ratio" :height="6" :color="data.color" />
    </div>
  </div>
</template>

<style scoped>
.order-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 16px 20px 14px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f4f8;
  flex: 1;
  box-sizing: border-box;
}
.order-card:hover { box-shadow: var(--shadow-card-hover); }

.card-label {
  font-size: var(--fs-sm);
  color: #374151;
  font-weight: 500;
  margin-bottom: 4px;
}
.card-count {
  font-size: var(--fs-2xl);
  font-weight: 700;
  color: #111827;
  line-height: 1.1;
  flex: 1;
}
.card-bottom { flex-shrink: 0; }
.ratio-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.ratio-label { font-size: var(--fs-xs); color: #6b7280; }
.ratio-value { font-size: var(--fs-xs); font-weight: 500; color: #6b7280; }
</style>
