<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getSalesCompanies, getSalesCompanyDetail } from '@/api/dashboard-api'
import type { CompanySummaryMetric, CompanyDetailData } from '@/types/index'

echarts.use([BarChart, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])

const route  = useRoute()
const router = useRouter()

const pageTitle  = ref(route.query.title || '明细数据')
const detailType = ref((route.query.type as string) || 'amount')
const targetDate = ref((route.query.date as string) || '2025-06-15')

const unit       = computed(() => detailType.value === 'volume' ? '吨' : '万')
const metricName = computed(() => detailType.value === 'volume' ? '销量' : '销售额')

const loading       = ref(true)
const detailLoading = ref(false)
const companyList   = ref<CompanySummaryMetric[]>([])
const currentDetail = ref<CompanyDetailData | null>(null)
const selectedId    = ref(0)

/** 手机端侧边栏抽屉 */
const sidebarOpen = ref(false)

const currentCompany = computed(() => companyList.value[selectedId.value] ?? null)

const sortedTableProducts = computed(() => {
  if (!currentDetail.value) return []
  return [...currentDetail.value.products].sort((a, b) => b.percentage - a.percentage)
})
const tableTotalValue = computed(() => sortedTableProducts.value.reduce((sum, p) => sum + p.value, 0))
const tableTotalPct   = computed(() => {
  const sum = sortedTableProducts.value.reduce((sum, p) => sum + p.percentage, 0)
  return +(sum.toFixed(1))
})

const companySummary = computed(() => {
  const c = currentCompany.value
  if (!c) return null
  const diff  = c.value - c.target
  const ratio = c.target ? +(c.value / c.target * 100).toFixed(1) : 0
  return { value: c.value, target: c.target, diff, ratio }
})

const targetDateStr  = (route.query.date as string) || '2025-06-15'
const parsedDate     = new Date(targetDateStr)
const DAY_TODAY      = parsedDate.getDate()
const DAYS_IN_MONTH  = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 0).getDate()
const monthElapsed   = +(DAY_TODAY / DAYS_IN_MONTH * 100).toFixed(1)
const daysLeft       = DAYS_IN_MONTH - DAY_TODAY

const diagnosis = computed(() => {
  const c = currentCompany.value
  if (!c) return null
  const gap          = c.target - c.value
  const dailyCurr    = +(c.value / DAY_TODAY).toFixed(1)
  const projectedTotal = Math.round(dailyCurr * DAYS_IN_MONTH)
  const dailyNeed    = gap > 0 && daysLeft > 0 ? +(gap / daysLeft).toFixed(1) : 0
  const dailyGap     = +(dailyNeed - dailyCurr).toFixed(1)

  if (gap <= 0) return {
    level: 'success', icon: '✓', title: '提前达标',
    text: `当前业绩已达成！超出保底指标 <b style="color:#10b981;font-size:16px;">${Math.abs(gap).toFixed(1)}</b> ${unit.value}。按目前节奏，月末预计冲刺至 <b style="color:#1e293b;font-size:16px;">${projectedTotal}</b> ${unit.value}。`,
  }
  if (projectedTotal >= c.target) return {
    level: 'info', icon: '📈', title: '进度稳健',
    text: `当前进度良好。距月底还有 <b style="color:#1e293b;font-size:16px;">${daysLeft}</b> 天，<b>总差距 ${gap.toFixed(1)} ${unit.value}</b>。按目前日均产出（<b style="color:#3182ce;font-size:16px;">${dailyCurr}</b> ${unit.value}），月末预计可达到 <b style="color:#3182ce;font-size:16px;">${projectedTotal}</b> ${unit.value}，能顺利达标。`,
  }
  return {
    level: 'warning', icon: '⚠', title: '业绩预警',
    text: `达成进度滞后！距月底仅剩 <b style="color:#1e293b;font-size:16px;">${daysLeft}</b> 天，<b>当前总差距高达 <span style="color:#f56565;font-size:17px;">${gap.toFixed(1)}</span> ${unit.value}</b>。<br/>后续须将日均产出提升至 <b style="color:#f56565;font-size:16px;">${dailyNeed}</b> ${unit.value}，即 <b>每日还差 <span style="color:#f56565;font-size:17px;background:#fff5f5;padding:0 4px;border-radius:4px;">${dailyGap > 0 ? dailyGap : 0}</span> ${unit.value}</b> 方可保底！`,
  }
})

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

async function fetchCompanyList() {
  loading.value = true
  try {
    companyList.value = await getSalesCompanies(detailType.value, targetDate.value)
  } catch (err) {
    console.error('获取公司列表失败', err)
  } finally {
    loading.value = false
  }
  if (companyList.value.length > 0) await handleSelectCompany(0)
}

async function handleSelectCompany(idx: number) {
  selectedId.value = idx
  sidebarOpen.value = false   // 手机端选中后自动收起侧栏
  const targetCompany = companyList.value[idx]
  if (!targetCompany?.companyName) return

  detailLoading.value = true
  currentDetail.value = null
  try {
    currentDetail.value = await getSalesCompanyDetail(
      targetCompany.companyName, detailType.value, targetDate.value, targetCompany.target
    )
  } catch (err) {
    console.error(`获取 [${targetCompany.companyName}] 明细失败`, err)
  } finally {
    detailLoading.value = false
    nextTick(() => { initProductChart(); initTrendChart() })
  }
}

const productRef = ref<HTMLElement | null>(null)
const trendRef   = ref<HTMLElement | null>(null)
let productChart: echarts.ECharts | null = null
let trendChart:   echarts.ECharts | null = null

function isMobile() { return window.innerWidth <= 767 }

function initProductChart() {
  if (!currentDetail.value || !productRef.value) return
  if (productChart) productChart.dispose()
  const mobile       = isMobile()
  const productCount = currentDetail.value.products.length
  const h            = Math.max(220, productCount * (mobile ? 40 : 50) + 60)
  productRef.value.style.height = `${h}px`
  productChart = echarts.init(productRef.value, undefined, { height: h })

  const sorted = [...currentDetail.value.products].sort((a, b) => a.value - b.value)
  productChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: '2%', right: mobile ? '8%' : '12%', bottom: 20, top: 20, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'none' },
      backgroundColor: '#fff', borderColor: '#eef2f6', textStyle: { color: '#1e293b', fontSize: 13 },
      formatter: (p: any) => `<b>${p[0].name}</b><br/>${metricName.value}：<b style="color:#3182ce">${p[0].value} ${unit.value}</b>`
    },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#94a3b8', fontSize: mobile ? 10 : 13 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: {
      type: 'category', data: sorted.map(d => d.productName),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: '#334155', fontSize: mobile ? 11 : 14, fontWeight: 500, interval: 0, width: mobile ? 70 : 100, overflow: 'truncate' }
    },
    series: [{
      type: 'bar', barWidth: mobile ? 14 : 22,
      data: sorted.map((d, i) => ({
        value: d.value,
        itemStyle: { color: `rgba(49,130,206,${0.4 + (i / sorted.length) * 0.6})`, borderRadius: [0, 6, 6, 0] }
      })),
      label: { show: !mobile, position: 'right', color: '#64748b', fontSize: 13, fontWeight: 'bold', formatter: '{c}' + unit.value }
    }]
  })
}

function initTrendChart() {
  if (!currentDetail.value || !currentCompany.value || !trendRef.value) return
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendRef.value)

  const c      = currentCompany.value
  const daily  = currentDetail.value.dailySales
  const mobile = isMobile()
  const daysXAxis = Array.from({ length: DAYS_IN_MONTH }, (_, i) => `${i + 1}日`)

  let sum = 0
  const cumulativeData   = daily.map(val => { sum += +(val).toFixed(2); return +(sum).toFixed(2) })
  const dailyBudgetTarget = c.target / DAYS_IN_MONTH
  const idealPaceData    = Array.from({ length: DAYS_IN_MONTH }, (_, i) => +(dailyBudgetTarget * (i + 1)).toFixed(2))

  const isAlert      = c.isAlert
  const primaryColor = isAlert ? '#f56565' : '#3182ce'
  const barColor     = isAlert ? '#fca5a5' : '#93c5fd'

  trendChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 24, right: 24, top: mobile ? 40 : 50, bottom: 20, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
      backgroundColor: '#fff', borderColor: '#eef2f6', textStyle: { color: '#1e293b', fontSize: 13 },
      formatter: (params: any[]) => {
        let html = `<div style="font-weight:700;margin-bottom:6px;color:#1e293b">${params[0].name}</div>`
        params.forEach(p => {
          html += `<div style="line-height:1.8;font-size:12px;"><span style="display:inline-block;width:8px;height:8px;border-radius:${p.seriesName === '当日销量' ? '2px' : '50%'};background:${p.color};margin-right:6px"></span>${p.seriesName}：<b style="color:#1e293b">${p.value} ${unit.value}</b></div>`
        })
        return html
      }
    },
    legend: { top: 0, right: 0, data: ['当日销量', '累计达成', '理想目标进度'], itemWidth: 14, itemHeight: 8, textStyle: { color: '#475569', fontSize: mobile ? 11 : 13, fontWeight: 500 } },
    xAxis: { type: 'category', data: daysXAxis, axisLine: { lineStyle: { color: '#eef2f6' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: mobile ? 10 : 13, interval: 'auto' } },
    yAxis: [
      { type: 'value', name: `单日(${unit.value})`, position: 'left', nameTextStyle: { color: '#64748b', fontSize: mobile ? 10 : 13, align: 'right', padding: [0, 10, 0, 0] }, axisLabel: { color: '#94a3b8', fontSize: mobile ? 10 : 13 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
      { type: 'value', name: `累计(${unit.value})`, position: 'right', nameTextStyle: { color: '#64748b', fontSize: mobile ? 10 : 13, align: 'left', padding: [0, 0, 0, 10] }, axisLabel: { color: '#94a3b8', fontSize: mobile ? 10 : 13 }, splitLine: { show: false }, min: 0, max: Math.max(c.target, c.value) * 1.1 }
    ],
    series: [
      { name: '当日销量',     type: 'bar',  yAxisIndex: 0, data: daily, barWidth: '45%', itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] } },
      { name: '理想目标进度', type: 'line', yAxisIndex: 1, data: idealPaceData, symbol: 'none', lineStyle: { color: '#cbd5e1', type: 'dashed', width: 2.5 }, itemStyle: { color: '#cbd5e1' } },
      { name: '累计达成',     type: 'line', yAxisIndex: 1, data: cumulativeData, smooth: true, symbol: 'circle', symbolSize: mobile ? 5 : 7, lineStyle: { color: primaryColor, width: 3.5 }, itemStyle: { color: primaryColor }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: isAlert ? 'rgba(245,101,101,0.15)' : 'rgba(49,130,206,0.15)' }, { offset: 1, color: 'rgba(255,255,255,0)' }]) } }
    ]
  })
}

onMounted(() => fetchCompanyList())
</script>

<template>
  <div class="exec-dash">

    <!-- ── 顶部导航 ── -->
    <header class="top-bar">
      <div class="top-inner">
        <div class="top-left">
          <button class="back-btn" @click="router.back()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="title-block">
            <div class="breadcrumb">经营驾驶舱 / {{ metricName }}下钻</div>
            <h1 class="page-title">{{ pageTitle }}<span class="accent"> 分析工作台</span></h1>
          </div>
        </div>
        <div class="top-right">
          <div class="date-pill"><span class="dp-label">业务日期</span><span class="dp-val">{{ targetDate }}</span></div>
          <div class="live-dot"><span class="pulse-ring"></span><span class="live-label">实时联调中</span></div>
        </div>
      </div>
    </header>

    <!-- ── 摘要横幅 ── -->
    <section v-if="!loading && companySummary && currentCompany" class="super-banner">
      <div class="sb-cell sb-identity">
        <div class="sb-label">当前分析主体</div>
        <div class="sb-company">{{ currentCompany.companyName }}</div>
        <div class="sb-core-metrics">
          <div class="scm-item"><span class="scm-val">{{ companySummary.value.toLocaleString() }}<small>{{ unit }}</small></span><span class="scm-lbl">已完成</span></div>
          <div class="scm-divider">/</div>
          <div class="scm-item"><span class="scm-val">{{ companySummary.target.toLocaleString() }}<small>{{ unit }}</small></span><span class="scm-lbl">月度指标</span></div>
        </div>
      </div>
      <div class="sb-rule"></div>
      <div class="sb-cell sb-diagnosis" :class="diagnosis!.level" v-if="diagnosis">
        <div class="diag-header">
          <div class="diag-title-wrap"><span class="diag-icon">{{ diagnosis!.icon }}</span><span class="diag-title">{{ diagnosis!.title }}</span></div>
          <div class="diag-ratio" :class="currentCompany.isAlert ? 'c-red' : 'c-green'">达成率 {{ companySummary.ratio }}%</div>
        </div>
        <div class="diag-text" v-html="diagnosis!.text"></div>
      </div>
      <div class="sb-rule"></div>
      <div class="sb-cell sb-timeline">
        <div class="sb-label">月度时间进度 — {{ DAY_TODAY }}/{{ DAYS_IN_MONTH }} 日</div>
        <div class="tl-wrap">
          <div class="tl-bg"><div class="tl-fill" :style="{ width: monthElapsed + '%' }"></div><div class="tl-marker" :style="{ left: monthElapsed + '%' }"><span class="tl-tag">今天</span></div></div>
          <div class="tl-meta"><span>时间进度 {{ monthElapsed }}%</span><span class="ml">剩余 {{ daysLeft }} 天</span></div>
        </div>
      </div>
    </section>

    <!-- ── 主体 ── -->
    <div class="body-wrap">

      <!-- 手机端：浮动打开侧边栏按钮 -->
      <button v-if="!loading" class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? '✕' : '☰ 公司' }}
      </button>

      <!-- 遮罩 -->
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

      <!-- ── 侧边栏 ── -->
      <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }" v-if="!loading">
        <div class="sec-label">园区四大公司</div>
        <div class="co-list">
          <div
            v-for="(co, i) in companyList" :key="i"
            class="co-card"
            :class="{ active: selectedId === i, alert: co.isAlert }"
            @click="handleSelectCompany(i)"
          >
            <div class="co-rank">{{ i + 1 }}</div>
            <div class="co-body">
              <div class="co-top">
                <span class="co-name">{{ co.companyName }}</span>
                <span class="co-ratio" :class="co.isAlert ? 'r-red' : 'r-green'">{{ co.ratioText }}</span>
              </div>
              <div class="co-bar-bg"><div class="co-bar-fill" :class="co.isAlert ? 'f-red' : 'f-blue'" :style="{ width: Math.min(100, co.value / co.target * 100) + '%' }"></div></div>
              <div class="co-bot">
                <span>完成 <b>{{ co.value }}</b>{{ unit }}</span><span class="sep">·</span><span>目标 {{ co.target }}{{ unit }}</span>
                <svg class="sparkline" viewBox="0 0 70 26" preserveAspectRatio="none">
                  <path :d="sparklinePath(co.trend)" fill="none" :stroke="co.isAlert ? '#ef4444' : '#38bdf8'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- ── 画布 ── -->
      <main class="canvas" v-if="!loading">

        <div v-if="detailLoading" class="detail-loading-box">
          <div class="spin"></div>
          <p>正在获取 <b>{{ currentCompany?.companyName }}</b> 穿透数据…</p>
        </div>

        <template v-else-if="currentDetail && currentCompany">

          <div class="viz-card">
            <div class="card-hd">
              <h3>{{ currentCompany.companyName }} · 目标追踪与{{ metricName }}趋势</h3>
              <div class="trend-meta">
                <span class="tm-item">目标进度 <b :class="currentCompany.isAlert ? 'c-red' : 'c-blue'">{{ (currentCompany.value / currentCompany.target * 100).toFixed(1) }}%</b></span>
                <span class="tm-sep">·</span>
                <span class="tm-item">日均产出 <b class="c-muted">{{ (currentCompany.value / DAY_TODAY).toFixed(1) }} {{ unit }}</b></span>
              </div>
            </div>
            <div ref="trendRef" class="chart-trend"></div>
          </div>

          <div class="viz-card">
            <div class="card-hd">
              <h3>{{ currentCompany.companyName }} · 产品{{ metricName }}结构明细</h3>
              <span class="chip" :class="currentCompany.isAlert ? 'chip-red' : ''">核心产品排位</span>
            </div>
            <div ref="productRef" class="chart-product"></div>

            <div class="product-tbl">
              <table>
                <thead>
                  <tr>
                    <th>产品名称</th>
                    <th class="ta-r">{{ metricName }}</th>
                    <th class="ta-r">构成比</th>
                    <th class="col-bar">贡献度</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in sortedTableProducts" :key="p.productName">
                    <td><span class="rk">{{ i + 1 }}</span>{{ p.productName }}</td>
                    <td class="ta-r mono">{{ p.value.toLocaleString() }}{{ unit }}</td>
                    <td class="ta-r"><span class="pct-txt">{{ p.percentage }}%</span></td>
                    <td class="col-bar"><div class="pct-bar-bg"><div class="pct-bar-fill" :style="{ width: p.percentage + '%' }"></div></div></td>
                  </tr>
                  <tr class="tr-total">
                    <td><span class="total-label">合计</span></td>
                    <td class="ta-r mono">{{ tableTotalValue.toLocaleString() }}{{ unit }}</td>
                    <td class="ta-r"><span class="pct-txt">{{ tableTotalPct }}%</span></td>
                    <td class="col-bar"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </template>
      </main>

    </div>

    <div v-if="loading" class="loading-screen">
      <div class="spin"></div>
      <p>构建决策视图中…</p>
    </div>

  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.exec-dash { height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; color: #1e293b; font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* ── 顶部导航 ── */
.top-bar { height: 72px; flex-shrink: 0; background: #fff; border-bottom: 1px solid #eef2f6; padding: 0 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); z-index: 100; }
.top-inner { height: 100%; display: flex; align-items: center; justify-content: space-between; }
.top-left  { display: flex; align-items: center; gap: 22px; min-width: 0; }
.top-right { display: flex; align-items: center; gap: 18px; flex-shrink: 0; }
.back-btn  { width: 42px; height: 42px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; flex-shrink: 0; }
.back-btn svg { width: 20px; height: 20px; }
.back-btn:hover { border-color: #3182ce; color: #3182ce; transform: translateX(-2px); }
.title-block { min-width: 0; }
.breadcrumb  { font-size: 13px; color: #94a3b8; margin-bottom: 4px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.page-title  { font-size: 22px; font-weight: 800; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.page-title .accent { color: #3182ce; font-weight: 500; }
.date-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 99px; padding: 7px 18px; }
.dp-label { font-size: 13px; font-weight: 600; color: #64748b; border-right: 1px solid #cbd5e1; padding-right: 12px; }
.dp-val   { font-size: 14px; font-weight: 700; color: #1e293b; }
.live-dot { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #64748b; font-weight: 500; }
.pulse-ring { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(.95); box-shadow: 0 0 0 0 rgba(16,185,129,.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { transform: scale(.95); } }

/* ── 摘要横幅 ── */
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
.sb-diagnosis { flex: 1.8; min-width: 240px; padding: 18px 26px; border-radius: 12px; border: 1px solid transparent; }
.sb-diagnosis.success { background: #f0fdf4; border-color: #bbf7d0; }
.sb-diagnosis.warning { background: #fff5f5; border-color: #fecaca; }
.sb-diagnosis.info    { background: #eff6ff; border-color: #bfdbfe; }
.diag-header  { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.diag-title-wrap { display: flex; align-items: center; gap: 8px; }
.diag-icon   { font-size: 18px; font-weight: 900; }
.success .diag-icon { color: #10b981; }
.warning .diag-icon { color: #f56565; }
.info    .diag-icon { color: #3182ce; }
.diag-title  { font-size: 16px; font-weight: 800; color: #1e293b; }
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
.c-blue  { color: #3182ce !important; }
.c-muted { color: #94a3b8 !important; }

/* ── 主体布局 ── */
.body-wrap { flex: 1; display: flex; overflow: hidden; position: relative; }

/* 手机浮动按钮（默认隐藏） */
.sidebar-toggle  { display: none; }
.sidebar-overlay { display: none; }

/* ── 侧边栏 ── */
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
.co-bar-bg { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-bottom: 10px; }
.co-bar-fill { height: 100%; border-radius: 99px; transition: width .5s ease; }
.f-blue { background: linear-gradient(90deg, #3182ce, #63b3ed); }
.f-red  { background: linear-gradient(90deg, #f56565, #fc8181); }
.co-bot { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #64748b; }
.co-bot b { color: #1e293b; font-weight: 700; }
.sep { color: #cbd5e1; }
.sparkline { width: 70px; height: 26px; margin-left: auto; }

/* ── 画布 ── */
.canvas { flex: 1; padding: 26px 30px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; background: #f5f7fa; min-width: 0; }
.viz-card { background: #fff; border-radius: 20px; padding: 28px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.card-hd  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
.card-hd h3 { font-size: 18px; font-weight: 800; color: #1e293b; }
.chip     { font-size: 13px; font-weight: 600; background: #eff6ff; color: #3182ce; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 6px; flex-shrink: 0; }
.chip-red { background: #fff5f5; color: #f56565; border-color: #fecaca; }
.chart-trend   { height: 320px; width: 100%; }
.chart-product { height: 260px; width: 100%; }
.trend-meta { display: flex; align-items: center; gap: 10px; }
.tm-item { font-size: 14px; color: #64748b; }
.tm-item b { font-weight: 700; margin-left: 6px; font-size: 15px; }
.tm-sep  { color: #e2e8f0; }

/* ── 产品明细表格 ── */
.product-tbl { width: 100%; margin-top: 12px; overflow-x: auto; }
.product-tbl table { width: 100%; border-collapse: collapse; min-width: 380px; }
.product-tbl th { padding: 12px 10px; font-size: 14px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #f1f5f9; }
.product-tbl td { padding: 14px 10px; font-size: 15px; color: #475569; border-bottom: 1px solid #f8fafc; }
.ta-r  { text-align: right; }
.col-bar { width: 80px; }
.mono  { font-weight: 700; font-size: 16px; color: #1e293b; }
.rk    { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; font-size: 12px; font-weight: 700; color: #94a3b8; margin-right: 8px; }
.pct-bar-bg  { display: inline-block; width: 60px; height: 5px; background: #f1f5f9; border-radius: 99px; vertical-align: middle; overflow: hidden; }
.pct-bar-fill { height: 100%; background: #3182ce; border-radius: 99px; }
.pct-txt { font-size: 14px; font-weight: 500; color: #64748b; }
.tr-total td { border-top: 2px solid #e2e8f0 !important; border-bottom: none !important; padding-top: 16px !important; }
.total-label { font-size: 15px; font-weight: 800; color: #1e293b; }
.tr-total .mono { color: #3182ce; font-size: 17px; }

/* ── Loading ── */
.detail-loading-box { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; border-radius: 20px; min-height: 400px; gap: 16px; }
.detail-loading-box p { font-size: 15px; color: #64748b; }
.detail-loading-box b { color: #3182ce; }
.loading-screen { position: fixed; inset: 0; background: #f5f7fa; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 999; }
.spin { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #3182ce; border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-screen p { font-size: 15px; font-weight: 500; color: #94a3b8; }

/* ============================================================
   平板端（768px ~ 1023px）
   ============================================================ */
@media (max-width: 1023px) {
  .top-bar { padding: 0 20px; height: 64px; }
  .page-title { font-size: 18px; }
  .super-banner { padding: 16px 20px; gap: 20px; }
  /* 摘要横幅单列堆叠 */
  .sb-rule { display: none; }
  .sb-identity, .sb-diagnosis, .sb-timeline { flex: none; width: 100%; }
  .sb-company { font-size: 20px; }
  .scm-val { font-size: 22px; }
  .sidebar { width: 280px; }
  .canvas { padding: 16px 18px; gap: 16px; }
  .viz-card { padding: 20px 22px; border-radius: 14px; }
}

/* ============================================================
   手机端（< 768px）：侧边栏改为抽屉式
   ============================================================ */
@media (max-width: 767px) {
  .top-bar { padding: 0 12px; height: 52px; }
  .page-title { font-size: 15px; }
  .breadcrumb { display: none; }
  /* 顶栏右侧只保留日期 */
  .date-pill { padding: 5px 10px; }
  .dp-label { display: none; }
  .dp-val { font-size: 13px; }
  .live-label { display: none; }

  /* 摘要横幅压缩 */
  .super-banner { padding: 10px 12px; gap: 10px; }
  .sb-company { font-size: 16px; margin-bottom: 6px; }
  .scm-val { font-size: 18px; }
  .diag-text { font-size: 12px; }
  .sb-diagnosis { padding: 10px 12px; }

  /* 侧边栏变为屏外抽屉 */
  .sidebar {
    position: absolute; top: 0; left: 0; bottom: 0;
    z-index: 200; width: 280px;
    transform: translateX(-100%);
    transition: transform 0.28s ease;
    box-shadow: 4px 0 20px rgba(0,0,0,0.15);
  }
  .sidebar.sidebar-open { transform: translateX(0); }

  /* 遮罩 */
  .sidebar-overlay {
    display: block; position: absolute; inset: 0;
    background: rgba(0,0,0,0.35); z-index: 199;
  }

  /* 浮动按钮 */
  .sidebar-toggle {
    display: flex; align-items: center;
    position: absolute; top: 12px; left: 12px; z-index: 198;
    padding: 6px 12px; background: #fff; border: 1px solid #e2e8f0;
    border-radius: 8px; font-size: 13px; font-weight: 600; color: #334155;
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  /* 画布顶部留出浮动按钮空间 */
  .canvas { padding: 50px 12px 16px; gap: 12px; width: 100%; }
  .viz-card { padding: 14px 14px; border-radius: 12px; }
  .card-hd { margin-bottom: 12px; }
  .card-hd h3 { font-size: 14px; }
  .chart-trend   { height: 220px; }
  .chart-product { height: 200px; }
  /* 手机端隐藏贡献度进度条列 */
  .col-bar { display: none; }
}
</style>