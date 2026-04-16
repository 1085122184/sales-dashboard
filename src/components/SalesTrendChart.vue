<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, ScatterChart, TreemapChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent, MarkLineComponent, DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { SalesTrendProduct } from '@/types'

echarts.use([LineChart, BarChart, ScatterChart, DataZoomComponent, TreemapChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  data: SalesTrendProduct[]
  selectedProduct?: string | null
}>()

const emit = defineEmits<{ (e: 'clear-selection'): void }>()

const mainChartRef   = ref<HTMLDivElement | null>(null)
const detailChartRef = ref<HTMLDivElement | null>(null)
let mainChart:   echarts.ECharts | null = null
let detailChart: echarts.ECharts | null = null

function isMobile() { return window.innerWidth <= 767 }

const getColor = (p: SalesTrendProduct) => {
  if (p.correlation >= 0.3 && p.volumeChange >= 0 && p.priceChange >= 0) return '#10b981'
  if (p.correlation >= -0.2 && (p.volumeChange >= 0 || p.priceChange >= 0)) return '#3b82f6'
  if (p.correlation >= -0.6) return '#f59e0b'
  return '#ef4444'
}

function renderMainChart() {
  if (!mainChartRef.value) return
  if (mainChart && mainChart.getDom() !== mainChartRef.value) { mainChart.dispose(); mainChart = null }
  if (!mainChart) mainChart = echarts.init(mainChartRef.value)

  const mobile     = isMobile()
  const sortedData = [...props.data].sort((a, b) => b.latestVolume - a.latestVolume)
  const showCount  = mobile ? 6 : 10
  const total      = sortedData.length
  const endPercent = total > showCount ? Math.floor((showCount / total) * 100) : 100

  mainChart.setOption({
    title: {
      text: '全盘产品销量与健康度排行', left: 0, top: 0,
      textStyle: { fontSize: mobile ? 13 : 16, fontWeight: 700, color: '#1e293b' },
      subtext: mobile ? '' : '柱子颜色代表量价健康度，支持鼠标滚轮滑动查看',
    },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.98)', padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
      formatter: (params: any[]) => {
        const t = params[0].data.originalData
        if (!t) return ''
        return `
          <div style="font-weight:700;font-size:14px;margin-bottom:8px">
            <span style="font-size:11px;background:#f1f5f9;padding:2px 5px;border-radius:4px;color:#475569;margin-right:5px">${t.region}</span>${t.product}
          </div>
          <div style="color:#64748b;margin-bottom:3px">近期销量：<b style="color:#0f172a">${Math.round(t.latestVolume).toLocaleString()} 吨</b></div>
          <div style="color:#64748b;margin-bottom:3px">销量环比：<b style="color:${t.volumeChange >= 0 ? '#10b981' : '#ef4444'}">${Math.round(t.volumeChange * 100)}%</b></div>
          <div style="color:#64748b">价格环比：<b style="color:${t.priceChange >= 0 ? '#10b981' : '#ef4444'}">${Math.round(t.priceChange * 100)}%</b></div>
        `
      }
    },
    grid: { left: 10, right: 40, bottom: 10, top: mobile ? 45 : 65, containLabel: true },
    dataZoom: [
      {
        type: 'slider', yAxisIndex: 0, show: total > showCount, right: 0, width: 6,
        start: 0, end: endPercent,
        borderColor: 'transparent', backgroundColor: '#f1f5f9', fillerColor: '#cbd5e1',
        handleSize: 0, showDetail: false, zoomLock: true
      },
      { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true, moveOnMouseMove: true }
    ],
    xAxis: {
      type: 'value', name: '销量',
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      axisLabel: { 
        color: '#64748b', fontSize: mobile ? 10 : 12,
        formatter: (value: number) => Math.round(value).toString()
      }
    },
    yAxis: {
      type: 'category', inverse: true,
      data: sortedData.map(d => d.product),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: {
        color: '#334155', fontWeight: 600, fontSize: mobile ? 11 : 13,
        interval: 0, width: mobile ? 70 : 90, overflow: 'truncate'
      }
    },
    series: [{
      type: 'bar', barWidth: mobile ? 14 : 20,
      data: sortedData.map(d => ({
        value: Math.round(d.latestVolume), originalData: d,
        itemStyle: { color: getColor(d), borderRadius: [0, 4, 4, 0] }
      })),
      label: {
        show: !mobile,
        position: 'right', color: '#64748b', fontWeight: 600, fontSize: 12,
        formatter: (p: any) => Math.round(p.value).toLocaleString()
      }
    }]
  }, { notMerge: true })
  mainChart.resize()
}

const strategyStatus = ref({ label: '', color: '', icon: '' })

// 找到文件中的 renderDetailChart 函数，替换为以下完整逻辑：

function renderDetailChart() {
  if (!detailChartRef.value || !props.selectedProduct) return
  if (detailChart && detailChart.getDom() !== detailChartRef.value) { detailChart.dispose(); detailChart = null }
  if (!detailChart) detailChart = echarts.init(detailChartRef.value)

  const item = props.data.find(d => `${d.productCode}-${d.region}` === props.selectedProduct)
  if (!item || !item.trend) return

  const mobile  = isMobile()
  const days    = item.trend.map((t: any) => t.date)
  const volumes = item.trend.map((t: any) => t.volume)
  const prices  = item.trend.map((t: any) => t.price)

  // 🌟 1. 动态判断货币单位与符号
  const isDomestic = item.region === '国内'
  const currencyName = isDomestic ? '人民币' : '美元'
  const currencySymbol = isDomestic ? '¥' : '$'

  if      (item.volumeChange >= 0 && item.priceChange >= 0) strategyStatus.value = { label: '量价齐升 (健康增长)', color: '#10b981', icon: '🚀' }
  else if (item.volumeChange >= 0 && item.priceChange < 0)  strategyStatus.value = { label: '以价换量 (利润稀释)', color: '#f59e0b', icon: '⚠️' }
  else if (item.volumeChange < 0  && item.priceChange >= 0) strategyStatus.value = { label: '有价无市 (份额流失)', color: '#6366f1', icon: '📉' }
  else                                                       strategyStatus.value = { label: '量价双杀 (极度危险)', color: '#ef4444', icon: '🚨' }

  detailChart.setOption({
    title: {
      text: `${item.product} [${item.region}] 量价走势诊断`,
      left: 'center', top: 0,
      textStyle: { fontSize: mobile ? 13 : 16, fontWeight: 700, color: '#1e293b' }
    },
    legend: { bottom: 0, icon: 'roundRect', textStyle: { color: '#64748b', fontSize: mobile ? 11 : 13 } },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255,255,255,0.98)', padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
      // 🌟 2. 深度定制 Tooltip，为不同数据线添加对应的单位和千分位
      formatter: (params: any[]) => {
        let html = `<div style="font-weight:700;font-size:14px;margin-bottom:8px;color:#1e293b">${params[0].axisValue}</div>`
        params.forEach(p => {
          if (p.seriesName === '成交单价') {
             // 单价加上 ¥ 或 $
             html += `<div style="color:#64748b;margin-bottom:3px">${p.marker} ${p.seriesName}：<b style="color:#0f172a">${currencySymbol}${p.value.toLocaleString()}</b></div>`
          } else {
             // 销量加上 吨
             html += `<div style="color:#64748b;margin-bottom:3px">${p.marker} ${p.seriesName}：<b style="color:#0f172a">${p.value.toLocaleString()} 吨</b></div>`
          }
        })
        return html
      }
    },
    grid: { top: mobile ? 40 : 50, bottom: mobile ? 35 : 40, left: 10, right: 10, containLabel: true },
    xAxis: {
      type: 'category', data: days,
      axisLabel: { color: '#64748b', fontSize: mobile ? 10 : 12 },
      axisPointer: { type: 'shadow' }
    },
    yAxis: [
      {
        type: 'value', name: '销量 (吨)', alignTicks: true, min: 0,
        axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: mobile ? 10 : 12 }
      },
      {
        // 🌟 3. Y轴顶部名称动态展示 人民币/美元
        type: 'value', name: `单价 (${currencyName})`, alignTicks: true, scale: true,
        min: (value: any) => Math.floor(value.min * 0.98),
        max: (value: any) => Math.ceil(value.max * 1.02),
        axisLine: { show: false }, splitLine: { show: false },
        axisLabel: { 
          color: '#64748b', fontSize: mobile ? 10 : 12,
          // 可以在坐标轴数字前直接加上符号（可选）：
          formatter: `{value}` 
        }
      }
    ],
    series: [
      {
        name: '实际销量', type: 'bar', data: volumes,
        itemStyle: { color: '#e2e8f0', borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: '#cbd5e1' } }
      },
      {
        name: '成交单价', type: 'line', yAxisIndex: 1, data: prices,
        smooth: true, symbolSize: mobile ? 6 : 8,
        itemStyle: { color: '#6366f1' },
        lineStyle: { width: mobile ? 2.5 : 3, shadowColor: 'rgba(99,102,241,0.3)', shadowBlur: 8 }
      }
    ]
  }, { notMerge: true })
  detailChart.resize()
}

let renderTimer: ReturnType<typeof setTimeout> | null = null
const tryRender = () => {
  if (renderTimer) clearTimeout(renderTimer)
  if (props.selectedProduct) {
    if (detailChartRef.value && detailChartRef.value.clientWidth > 0) renderDetailChart()
    else renderTimer = setTimeout(tryRender, 30)
  } else {
    if (mainChartRef.value && mainChartRef.value.clientWidth > 0) renderMainChart()
    else renderTimer = setTimeout(tryRender, 30)
  }
}

watch(() => [props.data, props.selectedProduct], () => { tryRender() }, { deep: true, immediate: true })

function handleResize() {
  if (props.selectedProduct) { detailChart?.resize(); renderDetailChart() }
  else                        { mainChart?.resize();   renderMainChart()   }
}

onMounted(()   => window.addEventListener('resize', handleResize))
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (renderTimer) clearTimeout(renderTimer)
  mainChart?.dispose(); detailChart?.dispose()
})
</script>

<template>
  <div class="chart-wrap">
    <Transition name="fade-slide" mode="out-in">

      <div v-if="!selectedProduct" class="view-container" key="main">
        <div ref="mainChartRef" class="echarts-dom"></div>
      </div>

      <div v-else class="view-container" key="detail">
        <div class="detail-header">
          <button class="back-btn" @click="emit('clear-selection')">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M15 18l-6-6 6-6"/></svg>
            返回全局矩阵
          </button>
          <div class="strategy-badge" :style="{ backgroundColor: strategyStatus.color + '15', color: strategyStatus.color, border: `1px solid ${strategyStatus.color}30` }">
            {{ strategyStatus.icon }} {{ strategyStatus.label }}
          </div>
        </div>
        <div ref="detailChartRef" class="echarts-dom detail-dom"></div>
      </div>

    </Transition>
  </div>
</template>

<style scoped>
.chart-wrap { position: relative; width: 100%; height: 100%; min-height: 420px; display: flex; flex-direction: column; }
.view-container { flex: 1; display: flex; flex-direction: column; width: 100%; height: 100%; }
.echarts-dom { flex: 1; width: 100%; min-height: 400px; }
.detail-dom  { min-height: 340px; }

.detail-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  background: #fff; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0;
  margin-bottom: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.back-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;
  color: #334155; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.back-btn:hover { background: #e2e8f0; color: #0f172a; }
.strategy-badge {
  padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; gap: 5px;
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to   { opacity: 0; transform: translateX(-20px); }

@media (max-width: 767px) {
  .chart-wrap  { min-height: 300px; }
  .echarts-dom { min-height: 280px; }
  .detail-dom  { min-height: 260px; }
  .detail-header { padding: 10px 12px; }
  .back-btn { padding: 6px 10px; font-size: 12px; }
  .strategy-badge { font-size: 12px; padding: 4px 10px; }
}
</style>