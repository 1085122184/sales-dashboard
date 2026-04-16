<script setup lang="ts">
import ProgressBar from './ProgressBar.vue'
import type { SalesMetric } from '@/types'

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

function formatNumber(val: number): string {
  const abs = Math.abs(val)
  return (val < 0 ? '-' : '') + abs.toLocaleString('zh-CN') + ' 万'
}

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
    <div class="card-top">
      <div class="card-label">
        {{ data.label }}
        <span v-if="clickable" class="arrow-icon">➔</span>
      </div>
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
          {{ formatNumber(data.targetGap) }}
        </span>
      </div>
      <div class="detail-row">
        <span class="row-label">本月目标</span>
        <span class="row-value number">{{ data.monthTarget.toLocaleString('zh-CN') }} 万</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  border-radius: var(--radius-lg);
  padding: 18px 20px 16px;
  box-shadow: var(--shadow-card);
  transition: all 0.25s ease;
  display: flex; flex-direction: column; height: 100%; box-sizing: border-box;
  border: 1px solid transparent;
}

.metric-card.clickable { cursor: pointer; }
/* 桌面端悬停上浮 */
.metric-card.clickable:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(59,130,246,0.2); }

/* 手机端禁用上浮，改用按下缩放 */
@media (max-width: 767px) {
  .metric-card.clickable:hover  { transform: none; box-shadow: var(--shadow-card); }
  .metric-card.clickable:active { transform: scale(0.98); }
}

.card-top { flex: 1; display: flex; flex-direction: column; }
.card-label { font-size: var(--fs-sm); color: #374151; font-weight: 500; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.card-value { font-size: var(--fs-xl); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }

.arrow-icon { font-size: 12px; color: #6b7280; opacity: 0; transition: opacity 0.2s, transform 0.2s; }
.metric-card.clickable:hover .arrow-icon { opacity: 1; transform: translateX(4px); color: var(--color-primary, #3b82f6); }

.card-bottom { flex-shrink: 0; }
.divider { height: 1px; margin: 12px 0 10px; }
.budget-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.row-pct { font-size: var(--fs-xs); font-weight: 600; color: #374151; }
.detail-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.row-label { font-size: var(--fs-xs); color: #6b7280; }
.row-value { font-size: var(--fs-xs); font-weight: 600; color: #111827; }
.text-danger  { color: #dc2626 !important; }
.text-success { color: #16a34a !important; }

/* 手机端内边距收紧 */
@media (max-width: 767px) {
  .metric-card { padding: 14px 14px 12px; }
}
</style>