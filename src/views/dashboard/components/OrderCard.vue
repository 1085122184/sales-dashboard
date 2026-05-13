<script setup lang="ts">
import ProgressBar from '@/components/base/ProgressBar.vue'
import type { OrderMetric } from '@/types'

defineProps<{ 
  data: OrderMetric
  clickable?: boolean 
}>()
</script>

<template>
  <div class="order-card" :class="{ clickable }">
    <div v-if="clickable" class="card-arrow" :style="{ color: data.color }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17L17 7M17 7H7M17 7V17"/>
      </svg>
    </div>

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
  transition: all 0.3s ease;
  display: flex; flex-direction: column;
  border: 1px solid #f0f4f8;
  flex: 1; box-sizing: border-box;
  position: relative; /* 🌟 必加：作为箭头的锚点 */
  overflow: hidden;
}

/* --- 🌟 统一可点击与 Hover 状态 --- */
.order-card.clickable { cursor: pointer; }
.order-card.clickable:hover { 
  transform: translateY(-3px); 
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); 
  background-color: #fdfdfd;
}

/* --- 🌟 统一箭头样式 --- */
.card-arrow {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 18px;
  height: 18px;
  opacity: 0;
  transform: translate(-6px, 6px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-arrow svg { width: 100%; height: 100%; opacity: 0.8; }
.order-card.clickable:hover .card-arrow { opacity: 1; transform: translate(0, 0); }

/* --- 移动端处理 --- */
@media (max-width: 767px) {
  .order-card { padding: 12px 14px 10px; }
  .card-arrow { width: 15px; height: 15px; top: 10px; right: 10px; }
  .order-card.clickable:hover { transform: none; box-shadow: var(--shadow-card); background-color: #fff; }
  .order-card.clickable:active { transform: scale(0.98); }
}

.card-label { font-size: var(--fs-sm); color: #374151; font-weight: 500; margin-bottom: 4px; }
.card-count  { font-size: var(--fs-2xl); font-weight: 700; color: #111827; line-height: 1.1; flex: 1; }
.card-bottom { flex-shrink: 0; }
.ratio-row   { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ratio-label { font-size: var(--fs-xs); color: #6b7280; }
.ratio-value { font-size: var(--fs-xs); font-weight: 500; color: #6b7280; }
</style>