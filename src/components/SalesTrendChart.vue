<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent, MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { SalesTrendProduct } from '@/types' // 🌟 引入真实的数据类型

echarts.use([LineChart, BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  data: SalesTrendProduct[] // 🌟 替换为真实类型
  selectedProduct?: string | null // 这里接收到的是 "productCode-region" 的组合ID
}>()

const emit = defineEmits<{
  (e: 'clear-selection'): void
}>()

const mainChartRef = ref<HTMLDivElement | null>(null)
const detailChartRef = ref<HTMLDivElement | null>(null)
let mainChart: echarts.ECharts | null = null
let detailChart: echarts.ECharts | null = null

// ==========================================
// 👑 图表 1：宏观全局视图 (量价四象限矩阵 Scatter)
// ==========================================
function renderMainChart() {
  if (!mainChartRef.value) return
  if (mainChart && mainChart.getDom() !== mainChartRef.value) {
    mainChart.dispose(); mainChart = null
  }
  if (!mainChart) mainChart = echarts.init(mainChartRef.value)

  const scatterData = props.data.map(d => {
    let color = '#3b82f6' 
    if (d.volumeChange >= 0 && d.priceChange >= 0) color = '#10b981' 
    else if (d.volumeChange < 0 && d.priceChange < 0) color = '#ef4444' 
    else color = '#f59e0b' 

    return {
      name: `${d.product} (${d.region})`, // 🌟 避免重名
      value: [
        Number((d.volumeChange * 100).toFixed(2)), 
        Number((d.priceChange * 100).toFixed(2)), 
        d 
      ],
      symbolSize: Math.max(15, Math.min(40, d.latestVolume / 50)),
      itemStyle: { color, opacity: 0.85, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' }
    }
  })

  mainChart.setOption({
    title: { 
      text: '全盘产品量价走势矩阵', 
      left: 0, top: 0, 
      textStyle: { fontSize: 16, fontWeight: 700, color: '#1e293b' },
      subtext: '气泡代表右侧表格中的产品，点击可查看该产品走势明细'
    },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)',
      padding: [12, 16], extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
      formatter: (params: any) => {
        const t = params.value[2]
        return `
          <div style="font-weight:700; font-size:15px; margin-bottom:8px">
            <span style="font-size:12px; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:#475569; margin-right:6px; border:1px solid #cbd5e1">${t.region}</span>
            ${t.product}
          </div>
          <div style="color:#64748b; margin-bottom:4px">近期销量：<b style="color:#0f172a">${t.latestVolume.toLocaleString()} 吨</b></div>
          <div style="color:#64748b; margin-bottom:4px">销量环比：<b style="color:${t.volumeChange>=0?'#10b981':'#ef4444'}">${(t.volumeChange*100).toFixed(1)}%</b></div>
          <div style="color:#64748b">价格环比：<b style="color:${t.priceChange>=0?'#10b981':'#ef4444'}">${(t.priceChange*100).toFixed(1)}%</b></div>
        `
      }
    },
    grid: { left: 10, right: 30, bottom: 10, top: 60, containLabel: true },
    xAxis: {
      type: 'value', name: '销量环比变动 (%)', nameLocation: 'middle', nameGap: 25,
      splitLine: { show: false }, axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value', name: '价格环比变动 (%)',
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { color: '#64748b' }
    },
    series: [{
      type: 'scatter',
      data: scatterData,
      markLine: {
        symbol: ['none', 'none'],
        lineStyle: { color: '#94a3b8', type: 'dashed' },
        data: [
          { xAxis: 0, label: { formatter: '销量持平', position: 'end', color: '#64748b' } },
          { yAxis: 0, label: { formatter: '价格持平', position: 'end', color: '#64748b' } }
        ]
      }
    }]
  }, { notMerge: true })
  
  mainChart.resize()
}

// ==========================================
// 👑 图表 2：微观诊断视图 (量价背离双轴图 Dual-axis)
// ==========================================
const strategyStatus = ref({ label: '', color: '', icon: '' })

function renderDetailChart() {
  if (!detailChartRef.value || !props.selectedProduct) return
  if (detailChart && detailChart.getDom() !== detailChartRef.value) {
    detailChart.dispose(); detailChart = null
  }
  if (!detailChart) detailChart = echarts.init(detailChartRef.value)

  // 🌟 核心修改：使用 编码-区域 的唯一组合进行查找匹配
  const item = props.data.find(d => `${d.productCode}-${d.region}` === props.selectedProduct)
  if (!item || !item.trend) return

  const days = item.trend.map((t: any) => t.date)
  const volumes = item.trend.map((t: any) => t.volume)
  const prices = item.trend.map((t: any) => t.price)

  if (item.volumeChange >= 0 && item.priceChange >= 0) strategyStatus.value = { label: '量价齐升 (健康增长)', color: '#10b981', icon: '🚀' }
  else if (item.volumeChange >= 0 && item.priceChange < 0) strategyStatus.value = { label: '以价换量 (利润稀释)', color: '#f59e0b', icon: '⚠️' }
  else if (item.volumeChange < 0 && item.priceChange >= 0) strategyStatus.value = { label: '有价无市 (份额流失)', color: '#6366f1', icon: '📉' }
  else strategyStatus.value = { label: '量价双杀 (极度危险)', color: '#ef4444', icon: '🚨' }

  detailChart.setOption({
    // 🌟 标题补充区域标识
    title: { text: `${item.product} [${item.region}] 近期量价走势诊断`, left: 'center', top: 0, textStyle: { fontSize: 16, fontWeight: 700, color: '#1e293b' } },
    legend: { bottom: 0, icon: 'roundRect', textStyle: { color: '#64748b' } },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255,255,255,0.98)', padding: [12, 16], extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;'
    },
    grid: { top: 50, bottom: 40, left: 10, right: 10, containLabel: true },
    xAxis: { type: 'category', data: days, axisLabel: { color: '#64748b' }, axisPointer: { type: 'shadow' } },
    yAxis: [
      { 
        type: 'value', 
        name: '销量', 
        alignTicks: true, 
        min: 0, 
        axisLine: { show: false }, 
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, 
        axisLabel: { color: '#64748b' } 
      },
      { 
        type: 'value', 
        name: '单价', 
        alignTicks: true, 
        scale: true, 
        min: (value: any) => Math.floor(value.min * 0.98),
        max: (value: any) => Math.ceil(value.max * 1.02),
        axisLine: { show: false }, 
        splitLine: { show: false }, 
        axisLabel: { color: '#64748b' } 
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
        smooth: true, symbolSize: 8,
        itemStyle: { color: '#6366f1' },
        lineStyle: { width: 3, shadowColor: 'rgba(99,102,241,0.3)', shadowBlur: 8 }
      }
    ]
  }, { notMerge: true })
  detailChart.resize()
}

// ─── 智能轮询渲染机制 ───
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
  if (props.selectedProduct) detailChart?.resize()
  else mainChart?.resize()
}

onMounted(() => window.addEventListener('resize', handleResize))
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
            {{ strategyStatus.icon }} 诊断：{{ strategyStatus.label }}
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
.detail-dom { min-height: 340px; }

.detail-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #ffffff; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0;
  margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.back-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;
  color: #334155; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.back-btn:hover { background: #e2e8f0; color: #0f172a; border-color: #94a3b8; }

.strategy-badge {
  padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 700;
  display: flex; align-items: center; gap: 6px; letter-spacing: 0.5px;
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>