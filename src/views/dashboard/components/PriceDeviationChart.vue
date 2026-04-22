<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, TitleComponent, DataZoomComponent, MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { PriceDeviationItem, PriceDeviationDetail } from '@/types'
import { getPriceDeviationDetails } from '@/api/dashboard-api'
import BaseEChart from '@/components/charts/BaseEChart.vue'
import { ChartTheme } from '@/config/chartTheme'
import { useBreakpoint } from '@/composables/useBreakpoint'

echarts.use([BarChart, ScatterChart, GridComponent, TooltipComponent, TitleComponent, DataZoomComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  data: PriceDeviationItem[]
  selectedProduct?: string | null
}>()

const emit = defineEmits<{ (e: 'clear-selection'): void }>()

const detailData = ref<PriceDeviationDetail[]>([])
const isDetailLoading = ref(false)

// 🌟 使用响应式断点检测替代非响应式的 isMobile()
const { isMaxMd } = useBreakpoint()

const selectedItem = computed(() =>
  props.data.find(d => `${d.productCode}_${d.region}` === props.selectedProduct)
)

// 🌟 监听切换，异步请求详细对账数据
watch(() => props.selectedProduct, async (newVal) => {
  if (newVal) {
    const [code, region] = newVal.split('_')
    isDetailLoading.value = true
    try { 
      detailData.value = await getPriceDeviationDetails(code, region) 
    } finally { 
      isDetailLoading.value = false 
    }
  } else {
    detailData.value = []
  }
}, { immediate: true })

// 🌟 主图表 Option
const mainChartOption = computed(() => {
  if (!props.data || props.data.length === 0) {
    return {
      title: { text: '全盘产品价格涨跌幅排行', left: '0', top: 0, textStyle: { fontSize: 16, fontWeight: 700, color: ChartTheme.colors.textMain } },
      graphic: { type: 'text', left: 'center', top: 'center', style: { text: '暂无匹配数据', fill: ChartTheme.colors.textSub, fontSize: 14 } }
    }
  }

  const mobile = isMaxMd.value
  const sortedData = [...props.data].sort((a, b) => a.deviationRate - b.deviationRate)
  const yAxisData = sortedData.map(d => `${d.product} (${d.region})`)

  const seriesData = sortedData.map(d => {
    const isDrop = d.deviationRate < 0
    let color = ChartTheme.colors.textSub
    if (d.deviationRate <= -0.1)  color = ChartTheme.colors.danger
    else if (d.deviationRate < -0.05) color = '#f87171' 
    else if (d.deviationRate < 0)     color = '#fca5a5' 
    else if (d.deviationRate > 0)     color = ChartTheme.colors.success
    return {
      // 🌟 强转整数
      value: Math.round(d.deviationRate * 100), name: `${d.product} (${d.region})`,
      itemStyle: { color, borderRadius: isDrop ? [4, 0, 0, 4] : [0, 4, 4, 0] }, raw: d
    }
  })

  const endValue = Math.max(0, Math.min(yAxisData.length - 1, mobile ? 5 : 7))

  return {
    title: {
      text: '全盘产品价格涨跌幅排行', left: '0', top: 0,
      textStyle: { fontSize: mobile ? 14 : 16, fontWeight: 700, color: ChartTheme.colors.textMain },
      subtext: mobile ? '' : '支持鼠标滚轮上下滑动查看更多',
    },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)', padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
      formatter: (params: any[]) => {
        const d = params[0].data.raw
        const isDrop = d.deviationRate < 0
        const symbol = d.region === '国内' ? '¥' : '¥'
        
        // 🌟 内部所有金额和百分比全部使用 Math.round 取整
        return `
          <div style="font-weight:700; font-size:15px; margin-bottom:8px; color:${ChartTheme.colors.textMain}">
            <span style="font-size:12px; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:${ChartTheme.colors.textSub}; margin-right:6px">${d.region}</span>${d.product}
          </div>
          <div style="color:${ChartTheme.colors.textSub}; margin-bottom:4px">七日均价：${symbol}${Math.round(d.sevenDayAvgPrice).toLocaleString()}</div>
          <div style="color:${ChartTheme.colors.textSub}; margin-bottom:4px">当日均价：<b style="color:${ChartTheme.colors.textMain}">${symbol}${Math.round(d.todayAvgPrice).toLocaleString()}</b></div>
          <div style="color:${ChartTheme.colors.textSub}; margin-top:8px; border-top:1px solid #e2e8f0; padding-top:8px;">
            偏差额：<b style="color:${isDrop ? ChartTheme.colors.danger : ChartTheme.colors.success}">${isDrop ? '' : '+'}${symbol}${Math.round(d.deviationAmount).toLocaleString()}</b>
          </div>
          <div style="color:${ChartTheme.colors.textSub}">偏差率：<b style="color:${isDrop ? ChartTheme.colors.danger : ChartTheme.colors.success}">${Math.round(d.deviationRate * 100)}%</b></div>
        `
      }
    },
    grid: { top: mobile ? 40 : 60, bottom: 20, left: 10, right: 40, containLabel: true },
    dataZoom: [
      { type: 'slider', yAxisIndex: 0, right: 10, width: 6, startValue: 0, endValue: endValue, showDetail: false, fillerColor: 'rgba(148,163,184,0.4)', borderColor: 'transparent', backgroundColor: 'rgba(241,245,249,0.5)', handleSize: '0%', borderRadius: 10 },
      { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true }
    ],
    xAxis: {
      type: 'value', position: 'top', splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
      axisLabel: { formatter: '{value}%', color: ChartTheme.colors.textSub, fontSize: mobile ? 10 : 12 }
    },
    yAxis: {
      type: 'category', data: yAxisData, inverse: true, axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { fontSize: mobile ? 11 : 13, fontWeight: 600, color: '#334155', margin: 8, width: mobile ? 80 : 120, overflow: 'truncate' }
    },
    series: [{
      name: '涨跌幅', type: 'bar', barWidth: mobile ? 12 : 16, data: seriesData,
      label: { show: !mobile, position: (value: any) => value < 0 ? 'left' : 'right', formatter: '{c}%', fontWeight: 700, fontSize: 12, color: 'inherit' }
    }]
  }
})

// 🌟 详情图表 Option
const detailChartOption = computed(() => {
  const item = selectedItem.value
  if (!item) return {}

  const mobile = isMaxMd.value
  const targetPrice = item.sevenDayAvgPrice
  const isDomestic = item.region === '国内'
  const currencyName = isDomestic ? '人民币' : '美元'
  const currencySymbol = isDomestic ? '¥' : '¥'  

  const scatterSeries = detailData.value.map(d => {
    const isWarning = d.price < targetPrice * 0.95
    return {
      name: d.customer,
      value: [d.volume, d.price, d],
      symbolSize: Math.max(15, (d.volume / 100) * 12 + 10),
      itemStyle: {
        color: isWarning ? ChartTheme.colors.danger : ChartTheme.colors.primary, opacity: 0.8,
        shadowBlur: isWarning ? 15 : 5,
        shadowColor: isWarning ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.1)'
      }
    }
  })

  return {
    title: {
      text: `${item.product} [${item.region}] 客户成交分布`, left: 'center', top: 0,
      textStyle: { fontSize: mobile ? 13 : 16, fontWeight: 700, color: ChartTheme.colors.textMain }
    },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)', padding: 16, borderColor: '#e2e8f0', textStyle: { color: ChartTheme.colors.textMain },
      formatter: (params: any) => {
        const d = params.value[2]
        const diff = d.price - targetPrice
        // 🌟 将销量、单价、偏差、偏差率都套用 Math.round 取整
        const diffPct = Math.round((diff / targetPrice) * 100)
        return `
          <div style="font-weight:800;font-size:15px;margin-bottom:8px">${d.customer}</div>
          <div style="color:${ChartTheme.colors.textSub};margin-bottom:4px">提货销量：<b style="color:${ChartTheme.colors.textMain}">${Math.round(d.volume).toLocaleString()} 吨</b></div>
          <div style="color:${ChartTheme.colors.textSub};margin-bottom:4px">实际单价：<b style="color:${ChartTheme.colors.textMain}">${currencySymbol}${Math.round(d.price).toLocaleString()}</b></div>
          <div style="color:${ChartTheme.colors.textSub};margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9">
            均价偏离：<b style="color:${diff < 0 ? ChartTheme.colors.danger : ChartTheme.colors.success}">${diff > 0 ? '+' : ''}${currencySymbol}${Math.round(diff).toLocaleString()} (${diffPct}%)</b>
          </div>
        `
      }
    },
    grid: { top: mobile ? 40 : 60, bottom: 20, left: 10, right: 30, containLabel: true },
    xAxis: { type: 'value', name: '提货量 (吨) →', nameLocation: 'middle', nameGap: 25, splitLine: { show: false }, axisLabel: { color: ChartTheme.colors.textSub, fontSize: mobile ? 10 : 12 } },
    yAxis: { type: 'value', name: `实际单价 (${currencyName}) ↑`, scale: true, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }, axisLabel: { color: ChartTheme.colors.textSub, fontSize: mobile ? 10 : 12 } },
    series: [{
      type: 'scatter', data: scatterSeries,
      markLine: {
        symbol: ['none', 'none'], lineStyle: { color: ChartTheme.colors.warning, type: 'dashed', width: 2 },
        label: { formatter: '七日均价线', position: 'end', color: ChartTheme.colors.warning, fontWeight: 'bold' },
        data: [{ yAxis: targetPrice }]
      }
    }]
  }
})
</script>

<template>
  <div class="chart-wrap">
    <Transition name="fade-slide" mode="out-in">

      <div v-if="!selectedProduct" class="view-container" key="main">
        <BaseEChart :option="mainChartOption" class="echarts-dom" />
      </div>

      <div v-else class="view-container" key="detail">
        <div class="detail-header">
          <button class="back-btn" @click="emit('clear-selection')">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M15 18l-6-6 6-6"/></svg>
            返回全局看板
          </button>
          <div class="kpi-box" v-if="selectedItem">
            <span class="kpi-label">偏差率:</span>
            <span class="kpi-val" :class="selectedItem.deviationRate < 0 ? 'text-red' : 'text-green'">
              {{ selectedItem.deviationRateText }}
            </span>
          </div>
        </div>

        <div v-if="isDetailLoading" class="loading-placeholder">
          <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
          </svg>
          正在拉取底层业务对账台账...
        </div>

        <BaseEChart v-else :option="detailChartOption" class="echarts-dom detail-dom" />
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
  background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0;
  margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.back-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: #fff; border: 1px solid #cbd5e1; border-radius: 8px;
  color: #334155; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.back-btn:hover { background: #f1f5f9; color: #0f172a; }
.kpi-box   { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.kpi-label { color: #64748b; font-weight: 500; }
.kpi-val   { font-size: 18px; font-weight: 800; }
.text-red  { color: #dc2626; }
.text-green { color: #10b981; }

.loading-placeholder {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #94a3b8; font-size: 14px; font-weight: 500; gap: 12px; min-height: 300px;
}
.spin-icon { width: 24px; height: 24px; animation: spin 1.5s linear infinite; color: #3b82f6; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to   { opacity: 0; transform: translateX(-20px); }

@media (max-width: 767px) {
  .chart-wrap  { min-height: 300px; }
  .echarts-dom { min-height: 280px; }
  .detail-dom  { min-height: 260px; }
  .detail-header { padding: 10px 12px; }
  .back-btn { padding: 6px 10px; font-size: 13px; }
}
</style>