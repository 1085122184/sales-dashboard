<script setup lang="ts">
import { computed } from 'vue'
import type { CompanySummaryMetric } from '@/types/index'

const props = defineProps<{
  company: CompanySummaryMetric
  unit: string
  yesterday: string
  // 🌟 新增模式切换：'sales' 代表销量/销售额，'collection' 代表回款
  mode: 'sales' | 'collection'
}>()

const companySummary = computed(() => {
  const diff = props.company.value - props.company.target
  const ratio = props.company.target ? +(props.company.value / props.company.target * 100).toFixed(1) : 0
  return { value: props.company.value, target: props.company.target, diff, ratio }
})

const parsedDate = computed(() => new Date(props.yesterday))
const DAY_TODAY = computed(() => parsedDate.value.getDate())
const DAYS_IN_MONTH = computed(() => new Date(parsedDate.value.getFullYear(), parsedDate.value.getMonth() + 1, 0).getDate())
const monthElapsed = computed(() => +(DAY_TODAY.value / DAYS_IN_MONTH.value * 100).toFixed(1))
const daysLeft = computed(() => DAYS_IN_MONTH.value - DAY_TODAY.value)

// 智能诊断逻辑 (增加 mode 差异化文案)
const diagnosis = computed(() => {
  const c = props.company
  const gap = c.target - c.value
  const dailyCurr = +(c.value / DAY_TODAY.value).toFixed(1)
  const projectedTotal = Math.round(dailyCurr * DAYS_IN_MONTH.value)
  const dailyNeed = gap > 0 && daysLeft.value > 0 ? +(gap / daysLeft.value).toFixed(1) : 0

  // 🌟 根据模式定义不同的专业词汇
  const isColl = props.mode === 'collection'
  const termBiz = isColl ? '回款' : '业绩'
  const termDaily = isColl ? '日均到款' : '日均产出'
  const termGap = isColl ? '资金缺口' : '总差距'

  if (gap <= 0) return {
    level: 'success', icon: '✓', title: `${termBiz}已达标`,
    text: `当前${termBiz}已提前达成！超出目标 <b style="color:#10b981;font-size:16px;">${Math.abs(gap).toFixed(1)}</b> ${props.unit}。`
  }

  if (projectedTotal >= c.target) return {
    level: 'info', icon: '📈', title: '进度稳健',
    text: `当前进度良好。${termGap} ${gap.toFixed(1)} ${props.unit}。按目前${termDaily}（<b style="color:#3182ce;font-size:16px;">${dailyCurr}</b> ${props.unit}），预计月末可顺利达标。`
  }

  return {
    level: 'warning', icon: '⚠', title: `${termBiz}预警`,
    text: `达成进度滞后！${termGap}高达 <span style="color:#f56565;font-size:17px;">${gap.toFixed(1)}</span> ${props.unit}。后续须将${termDaily}提升至 <b style="color:#f56565;font-size:16px;">${dailyNeed}</b> ${props.unit}方可保底！`
  }
})
</script>

<template>
  <section class="super-banner">
    <div class="sb-cell sb-identity">
      <div class="sb-label">分析主体 · {{ mode === 'collection' ? '资金回笼' : '经营成果' }}</div>
      <div class="sb-company">{{ company.companyName }}</div>
      <div class="sb-core-metrics">
        <div class="scm-item">
          <span class="scm-val">{{ companySummary.value.toLocaleString() }}<small>{{ unit }}</small></span>
          <span class="scm-lbl">{{ mode === 'collection' ? '已回款' : '已完成' }}</span>
        </div>
        <div class="scm-divider">/</div>
        <div class="scm-item">
          <span class="scm-val">{{ companySummary.target.toLocaleString() }}<small>{{ unit }}</small></span>
          <span class="scm-lbl">月度目标</span>
        </div>
      </div>
    </div>
    
    <div class="sb-rule"></div>
    
    <div class="sb-cell sb-diagnosis" :class="diagnosis.level">
      <div class="diag-content">
        <div class="diag-header">
          <div class="diag-title-wrap">
            <span class="diag-icon">{{ diagnosis.icon }}</span>
            <span class="diag-title">{{ diagnosis.title }}</span>
          </div>
          <div class="diag-ratio" :class="company.isAlert ? 'c-red' : 'c-green'">
             {{ mode === 'collection' ? '回款率' : '达成率' }} {{ companySummary.ratio }}%
          </div>
        </div>
        <div class="diag-text" v-html="diagnosis.text"></div>
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
        <div class="tl-meta"><span>时间进度 {{ monthElapsed }}%</span><span class="ml">剩余 {{ daysLeft }} 天</span></div>
      </div>
    </div>
  </section>
</template>

<style scoped>

.super-banner { flex-shrink: 0; display: flex; align-items: stretch; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #eef2f6; padding: 24px 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); gap: 36px; }
.sb-cell     { display: flex; flex-direction: column; justify-content: center; }
.sb-rule     { width: 1px; background: #eef2f6; flex-shrink: 0; }
.sb-identity { flex: 1.2; min-width: 200px; }
.sb-label    { font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 8px; }
.sb-company  { font-size: 26px; font-weight: 800; color: #1e293b; line-height: 1.2; margin-bottom: 12px; }
.sb-core-metrics { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.scm-item    { display: flex; align-items: baseline; gap: 4px; }
.scm-val     { font-size: 30px; font-weight: 800; color: #1e293b; }
.scm-val small { font-size: 15px; font-weight: 500; color: #64748b; margin-left: 2px; }
.scm-lbl     { font-size: 14px; color: #64748b; }
.scm-divider { font-size: 22px; color: #cbd5e1; font-weight: 300; }


.sb-diagnosis { flex: 1.8; min-width: 240px; padding: 18px 26px; border-radius: 12px; border: 1px solid transparent; transition: all 0.3s ease; position: relative; overflow: hidden; }
.sb-diagnosis.success { background: #f0fdf4; border-color: #bbf7d0; }
.sb-diagnosis.warning { background: #fff5f5; border-color: #fecaca; }
.sb-diagnosis.info    { background: #eff6ff; border-color: #bfdbfe; }

.diag-content { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.diag-header  { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.diag-title-wrap { display: flex; align-items: center; gap: 8px; }
.diag-icon   { font-size: 18px; font-weight: 900; }
.success .diag-icon { color: #10b981; }
.warning .diag-icon { color: #f56565; }
.info    .diag-icon { color: #3182ce; }
.diag-title  { font-size: 16px; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 8px; }

.diag-ratio  { font-size: 20px; font-weight: 800; }
.diag-text   { font-size: 15px; color: #475569; line-height: 1.6; }


.sb-timeline { flex: 1; min-width: 220px; }
.tl-wrap { margin-top: 8px; }
.tl-bg { position: relative; height: 10px; background: #f1f5f9; border-radius: 99px; margin-bottom: 10px; overflow: visible; }
.tl-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #3182ce, #63b3ed); border-radius: 99px; transition: width .5s ease; }
.tl-marker { position: absolute; top: -6px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; }
.tl-marker::before { content: ''; width: 2px; height: 22px; background: #3182ce; border-radius: 1px; }
.tl-tag  { font-size: 12px; color: #3182ce; font-weight: 600; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 4px; margin-top: 3px; white-space: nowrap; }
.tl-meta { display: flex; font-size: 14px; color: #94a3b8; }
.ml { margin-left: auto; }
.c-green { color: #10b981 !important; }
.c-red   { color: #f56565 !important; }

@media (max-width: 1023px) {
  .super-banner { padding: 16px 20px; gap: 20px; }
  .sb-rule { display: none; }
  .sb-identity, .sb-diagnosis, .sb-timeline { flex: none; width: 100%; }
  .sb-company { font-size: 20px; }
  .scm-val { font-size: 22px; }
}
@media (max-width: 767px) {
  .super-banner { padding: 10px 12px; gap: 10px; }
  .sb-company { font-size: 16px; margin-bottom: 6px; }
  .scm-val { font-size: 18px; }
  .diag-text { font-size: 12px; }
  .sb-diagnosis { padding: 10px 12px; }
}
</style>