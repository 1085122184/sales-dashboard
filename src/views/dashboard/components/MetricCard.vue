<script setup lang="ts">
import ProgressBar from '@/components/base/ProgressBar.vue'
import type { SalesMetric } from '@/types'
import { formatLargeNumber } from '@/utils'

interface Props {
  data: SalesMetric
  variant?: 'blue' | 'purple'
  clickable?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'blue',
  clickable: false,
})

const emit = defineEmits<{ (e: 'card-click'): void }>()

const colorMap = {
  blue:   { bg: '#dbeafe',                                           border: '#bfdbfe', divider: '#bfdbfe', value: '#1d4ed8', bar: '#3b82f6' },
  purple: { bg: 'linear-gradient(to right, #dbeafe 0%, #ede9fe 100%)', border: '#c4b5fd', divider: '#c4b5fd', value: '#5b21b6', bar: '#7c3aed' },
}
</script>

<template>
  <div
    class="metric-card"
    :class="{ 'clickable': clickable }"
    :style="{ background: colorMap[variant].bg, borderColor: colorMap[variant].border }"
    @click="clickable ? emit('card-click') : null"
  >
    <div v-if="clickable" class="card-arrow" :style="{ color: colorMap[variant].value }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17L17 7M17 7H7M17 7V17"/>
      </svg>
    </div>

    <div class="card-top">
      <div class="card-label">{{ data.label }}</div>
      <div class="card-value number" :style="{ color: colorMap[variant].value }">
        {{ data.value }}
      </div>
    </div>

    <div class="card-bottom">
      <div class="divider" :style="{ background: colorMap[variant].divider }" />
      <div class="budget-row">
        <span class="row-label">预算比</span>
        <span class="row-pct">{{ data.budgetRatioText }}</span>
      </div>
      <ProgressBar :value="data.budgetRatio" :height="7" :color="colorMap[variant].bar" />
      <div class="detail-row">
        <span class="row-label">本月累计</span>
        <span class="row-value number" :class="data.gapColor === 'red' ? 'text-danger' : 'text-success'">
          {{ formatLargeNumber(data.targetGap) }}
        </span>
      </div>
      <div class="detail-row">
        <span class="row-label">本月目标</span>
        <span class="row-value number">{{ formatLargeNumber(data.monthTarget) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  border-radius: var(--radius-lg);
  padding: 18px 20px 16px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  display: flex; flex-direction: column; height: 100%; box-sizing: border-box;
  border: 1px solid transparent;
  position: relative; /* 🌟 必加：作为箭头的锚点 */
  overflow: hidden;
}

/* --- 🌟 统一可点击与 Hover 状态 --- */
.metric-card.clickable { cursor: pointer; }
.metric-card.clickable:hover { 
  transform: translateY(-3px); 
  box-shadow: 0 8px 25px rgba(59,130,246,0.15); 
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
.metric-card.clickable:hover .card-arrow { opacity: 1; transform: translate(0, 0); }

/* --- 移动端处理 --- */
@media (max-width: 767px) {
  .metric-card.clickable:hover  { transform: none; box-shadow: var(--shadow-card); }
  .metric-card.clickable:active { transform: scale(0.98); }
  .metric-card { padding: 14px 14px 12px; }
  .card-arrow { width: 15px; height: 15px; top: 10px; right: 10px; }
}

.card-top { flex: 1; display: flex; flex-direction: column; }
.card-label { font-size: var(--fs-sm); color: #374151; font-weight: 500; margin-bottom: 8px; }
.card-value { font-size: var(--fs-xl); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
.card-bottom { flex-shrink: 0; }
.divider { height: 1px; margin: 12px 0 10px; }
.budget-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.row-pct { font-size: var(--fs-xs); font-weight: 600; color: #374151; }
.detail-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.row-label { font-size: var(--fs-xs); color: #6b7280; }
.row-value { font-size: var(--fs-xs); font-weight: 600; color: #111827; }
.text-danger  { color: #dc2626 !important; }
.text-success { color: #16a34a !important; }
</style>