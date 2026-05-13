<script setup lang="ts">
import { computed } from 'vue'
import type { CompanySummaryMetric } from '@/types/index'

const props = defineProps<{
  company: CompanySummaryMetric
  unit: string
  yesterday: string
}>()

// 1. 核心数据测算
const companySummary = computed(() => {
  const diff = props.company.value - props.company.target
  const ratio = props.company.target ? +(props.company.value / props.company.target * 100).toFixed(1) : 0
  return { value: props.company.value, target: props.company.target, diff, ratio }
})

// 2. 时间进度测算
const parsedDate = computed(() => new Date(props.yesterday))
const DAY_TODAY = computed(() => parsedDate.value.getDate())
const DAYS_IN_MONTH = computed(() => new Date(parsedDate.value.getFullYear(), parsedDate.value.getMonth() + 1, 0).getDate())
const monthElapsed = computed(() => +(DAY_TODAY.value / DAYS_IN_MONTH.value * 100).toFixed(1))
const daysLeft = computed(() => DAYS_IN_MONTH.value - DAY_TODAY.value)
</script>

<template>
  <section class="super-banner">
    
    <div class="sb-cell sb-identity">
      <div class="sb-label">分析主体 · 回款数据</div>
      <div class="sb-company">{{ company.companyName }}</div>
      
      <div class="sb-core-metrics">
        <div class="scm-item">
          <span class="scm-val">{{ companySummary.value.toLocaleString() }}<small>{{ unit }}</small></span>
          <span class="scm-lbl">已回款</span>
        </div>
        
        <div class="scm-divider">/</div>
        
        <div class="scm-item">
          <span class="scm-val">{{ companySummary.target.toLocaleString() }}<small>{{ unit }}</small></span>
          <span class="scm-lbl">月度目标</span>
        </div>
        
        <div class="scm-divider" style="margin: 0 10px;">·</div>
        
        <div class="scm-item">
          <span class="scm-val" :class="company.isAlert ? 'c-red' : 'c-green'">
            {{ companySummary.ratio }}<small>%</small>
          </span>
          <span class="scm-lbl">回款进度</span>
        </div>
      </div>
    </div>
    
    <div class="sb-rule"></div>
    
    <div class="sb-cell sb-timeline">
      <div class="sb-label">月度时间进度 — {{ DAY_TODAY }}/{{ DAYS_IN_MONTH }} 日</div>
      <div class="tl-wrap">
        <div class="tl-bg">
          <div class="tl-fill" :style="{ width: monthElapsed + '%' }"></div>
          <div class="tl-marker" :style="{ left: monthElapsed + '%' }"><span class="tl-tag">今天</span></div>
        </div>
        <div class="tl-meta">
          <span>时间消耗 {{ monthElapsed }}%</span>
          <span class="ml">剩余冲刺 {{ daysLeft }} 天</span>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
.super-banner { flex-shrink: 0; display: flex; align-items: stretch; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #eef2f6; padding: 24px 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); gap: 36px; }

/* 单元格与分割线 */
.sb-cell { display: flex; flex-direction: column; justify-content: center; }
.sb-rule { width: 1px; background: #eef2f6; flex-shrink: 0; margin: 0 20px; }

/* ── 左侧：核心指标区 ── */
.sb-identity { flex: 1.5; min-width: 320px; }
.sb-label { font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 8px; }
.sb-company { font-size: 26px; font-weight: 800; color: #1e293b; line-height: 1.2; margin-bottom: 16px; }

.sb-core-metrics { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.scm-item { display: flex; align-items: baseline; gap: 6px; }
.scm-val { font-size: 32px; font-weight: 800; color: #1e293b; font-family: 'Inter', monospace; }
.scm-val small { font-size: 15px; font-weight: 600; color: #64748b; margin-left: 2px; font-family: system-ui, sans-serif; }
.scm-lbl { font-size: 14px; color: #64748b; font-weight: 500; }
.scm-divider { font-size: 22px; color: #cbd5e1; font-weight: 300; }

/* 状态颜色 */
.c-green { color: #10b981 !important; }
.c-red   { color: #f56565 !important; }

/* ── 右侧：时间轴区 ── */
.sb-timeline { flex: 1; min-width: 280px; }
.tl-wrap { margin-top: 14px; }
.tl-bg { position: relative; height: 10px; background: #f1f5f9; border-radius: 99px; margin-bottom: 12px; overflow: visible; }
.tl-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 99px; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
.tl-marker { position: absolute; top: -6px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; }
.tl-marker::before { content: ''; width: 2px; height: 22px; background: #10b981; border-radius: 1px; }
.tl-tag { font-size: 12px; color: #065f46; font-weight: 600; background: #d1fae5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; margin-top: 3px; white-space: nowrap; }

.tl-meta { display: flex; font-size: 14px; color: #64748b; font-weight: 500; }
.ml { margin-left: auto; }

/* ── 移动端适配 ── */
@media (max-width: 1023px) {
  .super-banner { padding: 20px 24px; gap: 20px; }
  .sb-rule { display: none; }
  .sb-identity, .sb-timeline { flex: none; width: 100%; }
  .sb-company { font-size: 22px; margin-bottom: 12px; }
  .scm-val { font-size: 24px; }
}
@media (max-width: 767px) {
  .super-banner { padding: 16px; gap: 16px; }
  .sb-company { font-size: 18px; margin-bottom: 10px; }
  .scm-val { font-size: 20px; }
  .sb-core-metrics { gap: 8px; }
  .scm-divider { margin: 0 4px !important; }
}
</style>