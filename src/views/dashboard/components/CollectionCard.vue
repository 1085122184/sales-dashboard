<script setup lang="ts">
import ProgressBar from '@/components/base/ProgressBar.vue'
import type { CollectionMetric } from '@/types'

defineProps<{ 
  data: CollectionMetric
  clickable?: boolean 
}>()

function formatWan(val: number): string {
  const abs = Math.abs(val)
  return (val < 0 ? '-' : '') + abs.toLocaleString('zh-CN') + ' 万'
}
</script>

<template>
  <div class="collection-card" :class="{ clickable }">
    
    <div v-if="clickable" class="card-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17L17 7M17 7H7M17 7V17"/>
      </svg>
    </div>

    <div class="card-top">
      <div class="card-label">回款金额（月累计）</div>
      <div class="card-value number">{{ data.amount }}</div>
    </div>
    <div class="card-bottom">
      <div class="divider" />
      <div class="rate-row">
        <span class="row-label">回款率</span>
        <span class="rate-value number">{{ data.rateText }}</span>
      </div>
      <ProgressBar :value="data.rate" :height="7" color="#16a34a" />
      <div class="detail-row">
        <span class="row-label">目标差距</span>
        <span class="row-value number text-danger">{{ formatWan(data.targetGap) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-card {
  background: #f0fdf4;
  border-radius: var(--radius-lg);
  padding: 18px 20px 16px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  display: flex; flex-direction: column; height: 100%; box-sizing: border-box;
  border: 1px solid #bbf7d0;
  position: relative; 
  overflow: hidden;
}

/* --- 可点击与 Hover 状态 --- */
.collection-card.clickable {
  cursor: pointer;
}
.collection-card.clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(22, 163, 74, 0.15); 
}


.card-arrow {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 18px;
  height: 18px;
  color: #16a34a; 
  opacity: 0;
  transform: translate(-6px, 6px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-arrow svg {
  width: 100%;
  height: 100%;
  opacity: 0.8;
}


.collection-card.clickable:hover .card-arrow {
  opacity: 1;
  transform: translate(0, 0);
}

.card-top { flex: 1; display: flex; flex-direction: column; }
.card-label { font-size: var(--fs-sm); color: #14532d; font-weight: 500; margin-bottom: 8px; }
.card-value { font-size: var(--fs-xl); font-weight: 700; color: #16a34a; line-height: 1.2; letter-spacing: -0.02em; }
.card-bottom { flex-shrink: 0; }
.divider { height: 1px; background: #bbf7d0; margin: 12px 0 10px; }
.rate-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.rate-value { font-size: var(--fs-xs); font-weight: 600; color: #16a34a; }
.detail-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.row-label { font-size: var(--fs-xs); color: #166534; }
.row-value { font-size: var(--fs-xs); font-weight: 600; color: #14532d; }
.text-danger { color: #dc2626; }

@media (max-width: 767px) {
  .collection-card { padding: 14px 14px 12px; }
  .card-arrow { width: 15px; height: 15px; top: 10px; right: 10px; }
}
</style>