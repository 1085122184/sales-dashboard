<script setup lang="ts">
import ProgressBar from './ProgressBar.vue'
import type { CollectionMetric } from '@/types'

defineProps<{
  data: CollectionMetric
}>()

function formatWan(val: number): string {
  const abs = Math.abs(val)
  return (val < 0 ? '-' : '') + abs.toLocaleString('zh-CN') + '.00 万'
}
</script>

<template>
  <div class="collection-card">
    <div class="card-top">
      <div class="card-label">回款金额</div>
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
      <div class="detail-row">
        <span class="row-label">本月目标</span>
        <span class="row-value number">{{ data.monthTarget.toLocaleString('zh-CN') }}.00 万</span>
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
  transition: box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #bbf7d0;
}
.collection-card:hover { box-shadow: 0 4px 20px rgba(22,163,74,0.14); }

.card-top {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-label {
  font-size: 22px;
  color: #14532d;
  font-weight: 500;
  margin-bottom: 8px;
}
.card-value {
  font-size: 26px;
  font-weight: 700;
  color: #16a34a;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.card-bottom { flex-shrink: 0; }
.divider {
  height: 1px;
  background: #bbf7d0;
  margin: 12px 0 10px;
}
.rate-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 7px;
}
.rate-value { font-size: 16px; font-weight: 600; color: #16a34a; }
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}
.row-label { font-size: 16px; color: #166534; }
.row-value { font-size: 16px; font-weight: 600; color: #14532d; }
.text-danger { color: #dc2626; }
</style>
