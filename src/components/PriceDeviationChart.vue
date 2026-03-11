<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, TitleComponent, DataZoomComponent, MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { PriceDeviationItem, PriceDeviationDetail } from '@/types'
import { getPriceDeviationDetails } from '@/api/dashboard-api'

echarts.use([BarChart, ScatterChart, GridComponent, TooltipComponent, TitleComponent, DataZoomComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  data: PriceDeviationItem[]
  selectedProduct?: string | null
}>()

const emit = defineEmits<{ (e: 'clear-selection'): void }>()

const mainChartRef = ref<HTMLDivElement | null>(null)
const detailChartRef = ref<HTMLDivElement | null>(null)
let mainChart: echarts.ECharts | null = null
let detailChart: echarts.ECharts | null = null

const RED_COLOR = '#ef4444' 
const GREEN_COLOR = '#10b981' 

// 🌟 下钻数据与状态
const detailData = ref<PriceDeviationDetail[]>([])
const isDetailLoading = ref(false)

// 👑 图表 1：高管全局视图
// 👑 图表 1：高管全局视图
function renderMainChart() {
  if (!mainChartRef.value) return
  if (mainChart) { mainChart.dispose(); mainChart = null }
  mainChart = echarts.init(mainChartRef.value)

  if (!props.data || props.data.length === 0) {
    mainChart.clear()
    mainChart.setOption({
      title: { text: '全盘产品价格涨跌幅排行', left: '0', top: 0, textStyle: { fontSize: 16, fontWeight: 700, color: '#1e293b' } },
      graphic: { type: 'text', left: 'center', top: 'center', style: { text: '暂无匹配数据', fill: '#94a3b8', fontSize: 14 } }
    })
    return
  }

  const sortedData = [...props.data].sort((a, b) => a.deviationRate - b.deviationRate)
  const yAxisData = sortedData.map(d => `${d.product} (${d.region})`)
  
  const seriesData = sortedData.map(d => {
    const isDrop = d.deviationRate < 0
    let color = '#94a3b8' 
    if (d.deviationRate <= -0.1) color = '#dc2626' 
    else if (d.deviationRate < -0.05) color = '#ef4444' 
    else if (d.deviationRate < 0) color = '#fca5a5' 
    else if (d.deviationRate > 0) color = '#10b981' 

    return {
      value: (d.deviationRate * 100).toFixed(2), name: `${d.product} (${d.region})`,
      itemStyle: { color, borderRadius: isDrop ? [4, 0, 0, 4] : [0, 4, 4, 0] }, raw: d 
    }
  })

  // 🌟 修改：使用 Math.max 确保 endValue 最小为 0，防止报错
  const endValue = Math.max(0, Math.min(yAxisData.length - 1, 7))

  mainChart.setOption({
    title: { 
      text: '全盘产品价格涨跌幅排行', left: '0', top: 0, 
      textStyle: { fontSize: 16, fontWeight: 700, color: '#1e293b' },
      subtext: '支持鼠标滚轮上下滑动查看更多' // 增加小提示
    },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(255,255,255,0.95)', padding: [12, 16], extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
      formatter: (params: any) => {
        const d = params[0].data.raw
        const isDrop = d.deviationRate < 0
        return `
          <div style="font-weight:700; font-size:16px; margin-bottom:8px; color:#0f172a">
            <span style="font-size:12px; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:#475569; margin-right:6px; border:1px solid #cbd5e1">${d.region}</span>
            ${d.product}
          </div>
          <div style="color:#475569; margin-bottom:4px">七日均价：¥${d.sevenDayAvgPrice.toLocaleString()}</div>
          <div style="color:#475569; margin-bottom:4px">当日均价：<b style="color:#0f172a">¥${d.todayAvgPrice.toLocaleString()}</b></div>
          <div style="color:#475569; margin-top:8px; border-top:1px solid #e2e8f0; padding-top:8px;">
            偏差额：<b style="color:${isDrop ? RED_COLOR : GREEN_COLOR}">${isDrop?'':'+'}${d.deviationAmount.toLocaleString()} 元</b>
          </div>
          <div style="color:#475569">偏差率：<b style="color:${isDrop ? RED_COLOR : GREEN_COLOR}">${d.deviationRateText}</b></div>
        `
      }
    },
    // 🌟 Grid 右侧留出 40px 的空间给滚动条
    grid: { top: 60, bottom: 20, left: 10, right: 40, containLabel: true },
    
    // 🌟 新增：开启虚拟滚动 (DataZoom)
    dataZoom: [
      {
        type: 'slider',          // 右侧的可视化滚动条
        yAxisIndex: 0,
        right: 10,               // 紧贴右侧
        width: 6,                // 滚动条极简纤细化
        startValue: 0,           // 从第一条开始
        endValue: endValue,      // 到第 8 条结束
        showDetail: false,       // 隐藏文字提示，保持整洁
        fillerColor: 'rgba(148, 163, 184, 0.4)', // 滚动条颜色
        borderColor: 'transparent',
        backgroundColor: 'rgba(241, 245, 249, 0.5)',
        handleSize: '0%',        // 隐藏两端的拖拽手柄，现代 UI 风格
        borderRadius: 10
      },
      {
        type: 'inside',          // 支持鼠标滚轮和触控板滑动
        yAxisIndex: 0,
        zoomOnMouseWheel: false, // 禁止鼠标滚轮缩放大小
        moveOnMouseWheel: true   // 允许鼠标滚轮上下平移
      }
    ],

    xAxis: { type: 'value', position: 'top', splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }, axisLabel: { formatter: '{value}%', color: '#64748b' } },
    yAxis: { type: 'category', data: yAxisData, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 13, fontWeight: 600, color: '#334155', margin: 12 } },
    series: [{
      name: '涨跌幅', type: 'bar', data: seriesData, 
      barWidth: 16, // 🌟 锁定柱子厚度，配合滚动条效果绝佳
      label: { show: true, position: (value: any) => value < 0 ? 'left' : 'right', formatter: '{c}%', fontWeight: 700, fontSize: 12, color: 'inherit' }
    }]
  }, { notMerge: true })
  mainChart.resize()
}

// 👑 图表 2：微观诊断视图 (基于真实后端数据)
function renderDetailChart() {
  if (!detailChartRef.value || !props.selectedProduct) return
  if (detailChart) { detailChart.dispose(); detailChart = null }
  detailChart = echarts.init(detailChartRef.value)

  // 基于 code-region 查找原始数据
  const item = props.data.find(d => `${d.productCode}-${d.region}` === props.selectedProduct)
  if (!item) return

  const targetPrice = item.sevenDayAvgPrice

  const scatterSeries = detailData.value.map(d => {
    const isWarning = d.price < targetPrice * 0.95 
    return {
      name: d.customer,
      value: [d.volume, d.price, d],
      symbolSize: Math.max(15, (d.volume / 100) * 12 + 10), 
      itemStyle: { 
        color: isWarning ? '#ef4444' : '#3b82f6',
        opacity: 0.8,
        shadowBlur: isWarning ? 15 : 5,
        shadowColor: isWarning ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.1)'
      }
    }
  })

  detailChart.setOption({
    title: { 
      text: `${item.product} [${item.region}] 客户成交分布`, 
      left: 'center', top: 0, 
      textStyle: { fontSize: 16, fontWeight: 700, color: '#1e293b' },
    },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)', padding: 16, borderColor: '#e2e8f0', textStyle: { color: '#0f172a' },
      formatter: (params: any) => {
        const d = params.value[2]
        const diff = d.price - targetPrice
        const diffPct = (diff / targetPrice * 100).toFixed(1)
        return `
          <div style="font-weight:800;font-size:16px;margin-bottom:8px">${d.customer}</div>
          <div style="color:#64748b;margin-bottom:4px">提货销量：<b style="color:#0f172a">${d.volume} 吨</b></div>
          <div style="color:#64748b;margin-bottom:4px">实际单价：<b style="color:#0f172a">¥${d.price.toLocaleString()}</b></div>
          <div style="color:#64748b;margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9">
            均价偏离：<b style="color:${diff<0?'#ef4444':'#10b981'}">${diff>0?'+':''}${diff.toLocaleString()}元 (${diffPct}%)</b>
          </div>
        `
      }
    },
    grid: { top: 60, bottom: 20, left: 10, right: 30, containLabel: true },
    xAxis: { type: 'value', name: '提货量 (吨) →', nameLocation: 'middle', nameGap: 25, splitLine: { show: false }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', name: '实际单价 (元) ↑', scale: true, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }, axisLabel: { color: '#64748b' } },
    series: [{
      type: 'scatter', data: scatterSeries,
      markLine: {
        symbol: ['none', 'none'], lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
        label: { formatter: '七日均价线', position: 'end', color: '#d97706', fontWeight: 'bold' },
        data: [{ yAxis: targetPrice }]
      }
    }]
  }, { notMerge: true })

  detailChart.resize()
}

// ─── 智能异步联动机制 ───
let renderTimer: ReturnType<typeof setTimeout> | null = null
const tryRender = () => {
  if (renderTimer) clearTimeout(renderTimer)
  if (props.selectedProduct) {
    if (detailChartRef.value && detailChartRef.value.clientWidth > 0 && !isDetailLoading.value) renderDetailChart()
    else renderTimer = setTimeout(tryRender, 30)
  } else {
    if (mainChartRef.value && mainChartRef.value.clientWidth > 0) renderMainChart()
    else renderTimer = setTimeout(tryRender, 30)
  }
}

watch(() => props.selectedProduct, async (newVal) => {
  if (newVal) {
    const [code, region] = newVal.split('-')
    isDetailLoading.value = true
    try {
      // 🌟 获取真实后端明细数据
      detailData.value = await getPriceDeviationDetails(code, region)
    } finally {
      isDetailLoading.value = false
      tryRender()
    }
  } else {
    detailData.value = []
    tryRender()
  }
}, { immediate: true })

watch(() => props.selectedProduct, async (newVal) => {
  if (newVal) {
    const [code, region] = newVal.split('-')
    isDetailLoading.value = true
    try { detailData.value = await getPriceDeviationDetails(code, region) } 
    finally { isDetailLoading.value = false; tryRender() }
  } else { detailData.value = []; tryRender() }
}, { immediate: true })

// 👇🌟🌟🌟 新增：监听表格过滤传来的数据变化，联动重绘图表 🌟🌟🌟👇
watch(() => props.data, () => {
  tryRender()
}, { deep: true })

onMounted(() => window.addEventListener('resize', () => { mainChart?.resize(); detailChart?.resize() }))
onUnmounted(() => {
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
            返回全局看板
          </button>
          <div class="kpi-box" v-if="data.find(d => `${d.productCode}-${d.region}` === selectedProduct)">
            <span class="kpi-label">当前盘面偏差率:</span>
            <span class="kpi-val" :class="data.find(d => `${d.productCode}-${d.region}` === selectedProduct)!.deviationRate < 0 ? 'text-red' : 'text-green'">
              {{ data.find(d => `${d.productCode}-${d.region}` === selectedProduct)!.deviationRateText }}
            </span>
          </div>
        </div>
        
        <div v-if="isDetailLoading" class="loading-placeholder">
          <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
          </svg>
          正在拉取底层业务对账台账...
        </div>

        <div v-else ref="detailChartRef" class="echarts-dom detail-dom"></div>
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
  background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0;
  margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.back-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;
  color: #334155; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.back-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; transform: translateY(-1px); }

.kpi-box { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.kpi-label { color: #64748b; font-weight: 500; }
.kpi-val { font-size: 20px; font-weight: 800; font-family: var(--font-family-num); }
.text-red { color: #dc2626; }
.text-green { color: #10b981; }

.loading-placeholder {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #94a3b8; font-size: 14px; font-weight: 500; gap: 12px; min-height: 340px;
}
.spin-icon { width: 24px; height: 24px; animation: spin 1.5s linear infinite; color: #3b82f6; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>