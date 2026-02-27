<script setup lang="ts">
import ProgressBar from './ProgressBar.vue'
import type { SalesMetric } from '@/types'

interface Props {
  data: SalesMetric
  /** 颜色变体：blue（默认浅蓝）| purple（蓝紫渐变） */
  variant?: 'blue' | 'purple'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'blue',
})

function formatNumber(val: number): string {
  const abs = Math.abs(val)
  return (val < 0 ? '-' : '') + abs.toLocaleString('zh-CN') + ' 万'
}

/**
 * blue   → 纯浅蓝色背景
 * purple → 浅蓝（左）渐变到浅紫（右），与 blue 左侧颜色完全衔接
 */
const colorMap = {
  blue: {
    bg: '#dbeafe',                                           // 纯浅蓝，无渐变
    border: '#bfdbfe',
    divider: '#bfdbfe',
    value: '#1d4ed8',
    bar: '#3b82f6',
  },
  purple: {
    bg: 'linear-gradient(to right, #dbeafe 0%, #ede9fe 100%)', // 浅蓝 → 浅紫
    border: '#c4b5fd',
    divider: '#c4b5fd',
    value: '#5b21b6',
    bar: '#7c3aed',
  },
}
</script>

<template>
  <div
    class="metric-card"
    :style="{
      background: colorMap[variant].bg,
      borderColor: colorMap[variant].border,
    }"
  >
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
        <span class="row-label">目标差距</span>
        <span
          class="row-value number"
          :class="data.gapColor === 'red' ? 'text-danger' : 'text-success'"
        >
          {{ formatNumber(data.targetGap) }}
        </span>
      </div>
      <div class="detail-row">
        <span class="row-label">本月目标</span>
        <span class="row-value number">
          {{ data.monthTarget.toLocaleString('zh-CN') }} 万
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  border-radius: var(--radius-lg);
  padding: 18px 20px 16px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid transparent;
}
.metric-card:hover { box-shadow: var(--shadow-card-hover); }

.card-top { flex: 1; display: flex; flex-direction: column; }
.card-label { font-size: 22px; color: #374151; font-weight: 500; margin-bottom: 8px; }
.card-value { font-size: 26px; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }

.card-bottom { flex-shrink: 0; }
.divider { height: 1px; margin: 12px 0 10px; }

.budget-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.row-pct { font-size: 16px; font-weight: 600; color: #374151; }

.detail-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.row-label { font-size: 16px; color: #6b7280; }
.row-value { font-size: 16px; font-weight: 600; color: #111827; }
.text-danger { color: #dc2626 !important; }
.text-success { color: #16a34a !important; }
</style>
