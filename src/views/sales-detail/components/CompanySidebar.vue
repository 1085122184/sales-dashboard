<script setup lang="ts">
import type { CompanySummaryMetric } from '@/types/index'

const props = defineProps<{
  companyList: CompanySummaryMetric[]
  selectedId: number
  unit: string
  sidebarOpen: boolean
  hideTarget?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedId', idx: number): void
  (e: 'update:sidebarOpen', val: boolean): void
  (e: 'change', idx: number): void
}>()

function sparklinePath(data: number[]): string {
  if (!data || data.length < 2) return ''
  const W = 60, H = 22
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function handleSelect(idx: number) {
  emit('update:selectedId', idx)
  emit('update:sidebarOpen', false)
  emit('change', idx)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
    <div class="sec-label">园区四大公司</div>
    <div class="co-list">
      <div
        v-for="(co, i) in companyList" :key="i"
        class="co-card"
        :class="{ active: selectedId === i, alert: co.isAlert }"
        @click="handleSelect(i)"
      >
        <div class="co-rank">{{ i + 1 }}</div>
        <div class="co-body">
          <div class="co-top">
            <span class="co-name">{{ co.companyName }}</span>
            <div class="co-top-right">
              <template v-if="!hideTarget">
              <span class="co-bar-pct" :class="co.isAlert ? 'c-red' : 'c-blue'">
                {{ (co.value / (co.target || 1) * 100).toFixed(1) }}%
              </span>
              </template>
              <span class="co-ratio" :class="co.isAlert ? 'r-red' : 'r-green'">{{ co.ratioText }}</span>
            </div>
          </div>
          <div class="co-bar-bg">
            <div class="co-bar-fill" :class="co.isAlert ? 'f-red' : 'f-blue'" :style="{ width: Math.min(100, co.value / (co.target || 1) * 100) + '%' }"></div>
          </div>
          <div class="co-bot">
            <template v-if="!hideTarget">
              <span>完成 <b>{{ co.value }}</b>{{ unit }}</span><span class="sep">·</span><span>目标 {{ co.target }}{{ unit }}</span>
            </template>
            <template v-else>
              <!-- <span>订单流水 <b>{{ co.value.toLocaleString() }}</b> 笔</span> -->
            </template>
            <svg class="sparkline" viewBox="0 0 70 26" preserveAspectRatio="none">
              <path :d="sparklinePath(co.trend)" fill="none" :stroke="co.isAlert ? '#ef4444' : '#38bdf8'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar { width: 360px; flex-shrink: 0; background: #fff; border-right: 1px solid #eef2f6; padding: 24px 22px; overflow-y: auto; }
.sec-label { font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; margin-bottom: 16px; }
.co-list { display: flex; flex-direction: column; gap: 12px; }
.co-card { display: flex; gap: 14px; padding: 18px; border-radius: 16px; border: 1px solid #f1f5f9; background: #fff; cursor: pointer; transition: all .2s; }
.co-card:hover { background: #f8fafc; border-color: #cbd5e1; }
.co-card.active { background: #f0f7ff; border-color: #3182ce; box-shadow: 0 4px 15px rgba(49,130,206,0.1); }
.co-card.alert.active { background: #fff5f5; border-color: #f56565; }
.co-rank { width: 26px; height: 26px; flex-shrink: 0; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #94a3b8; margin-top: 2px; }
.co-body { flex: 1; min-width: 0; }
.co-top  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.co-name  { font-size: 17px; font-weight: 700; color: #1e293b; }
.co-ratio { font-size: 18px; font-weight: 800; }
.r-green { color: #3182ce; }
.r-red   { color: #f56565; }
.co-top-right { display: flex; align-items: center; gap: 10px; }
.co-bar-pct { font-size: 13px; font-weight: 700; font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
.c-blue.co-bar-pct { background: #eff6ff; }
.c-red.co-bar-pct { background: #fff5f5; }
.co-bar-bg { height: 8px; background: #f8fafc; border-radius: 99px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 10px; }
.co-bar-fill { height: 100%; border-radius: 99px; transition: width .5s ease; }
.f-blue { background: linear-gradient(90deg, #3182ce, #63b3ed); }
.f-red  { background: linear-gradient(90deg, #f56565, #fc8181); }
.co-bot { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #64748b; }
.co-bot b { color: #1e293b; font-weight: 700; }
.sep { color: #cbd5e1; }
.sparkline { width: 70px; height: 26px; margin-left: auto; }

@media (max-width: 1023px) {
  .sidebar { width: 280px; }
}
@media (max-width: 767px) {
  .sidebar {
    position: absolute; top: 0; left: 0; bottom: 0;
    z-index: 200; width: 280px;
    transform: translateX(-100%);
    transition: transform 0.28s ease;
    box-shadow: 4px 0 20px rgba(0,0,0,0.15);
  }
  .sidebar.sidebar-open { transform: translateX(0); }
}
</style>