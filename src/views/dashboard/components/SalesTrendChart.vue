<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, ScatterChart, TreemapChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent, MarkLineComponent, DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { SalesTrendProduct } from '@/types'
import BaseEChart from '@/components/charts/BaseEChart.vue'
import { ChartTheme } from '@/config/chartTheme'
import { useBreakpoint } from '@/composables/useBreakpoint'

echarts.use([LineChart, BarChart, ScatterChart, DataZoomComponent, TreemapChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  data: SalesTrendProduct[]          // 列表数据 (大图)
  selectedProduct?: string | null
  yearData?: any[]                 // 🌟 新增：父组件发来的折线图点位数组
  loadingYear?: boolean            // 🌟 新增：父组件发来的加载状态
}>()

const emit = defineEmits<{
  (e: 'clear-selection'): void
  (e: 'tab-change', tab: 'month' | 'year'): void
}>()

// 🌟 使用响应式断点检测替代非响应式的 isMobile()
const { isMaxMd } = useBreakpoint()

// 当前的维度状态
const trendTab = ref<'month' | 'year'>('month')

// 切换 Tab 时触发事件
function switchTab(tab: 'month' | 'year') {
  if (trendTab.value === tab) return
  trendTab.value = tab
  emit('tab-change', tab)
}

watch(() => props.selectedProduct, (newVal) => {
  if (newVal) {
    trendTab.value = 'month'
    emit('tab-change', 'month')
  }
})

// 动态获取颜色
const getColor = (p: SalesTrendProduct) => {
  if (p.correlation >= 0.3 && p.volumeChange >= 0 && p.priceChange >= 0) return ChartTheme.colors.success
  if (p.correlation >= -0.2 && (p.volumeChange >= 0 || p.priceChange >= 0)) return ChartTheme.colors.primary
  if (p.correlation >= -0.6) return ChartTheme.colors.warning
  return ChartTheme.colors.danger
}

// 选中的商品实例 (默认从当月数组里拿，用于显示健康度徽章)
const selectedItem = computed(() => 
  props.data.find(d => `${d.productCode}-${d.region}` === props.selectedProduct)
)

// 策略状态
const strategyStatus = computed(() => {
  const item = selectedItem.value
  if (!item) return { label: '', color: '', icon: '' }
  if      (item.volumeChange >= 0 && item.priceChange >= 0) return { label: '量价齐升 (健康增长)', color: ChartTheme.colors.success, icon: '🚀' }
  else if (item.volumeChange >= 0 && item.priceChange < 0)  return { label: '以价换量 (利润稀释)', color: ChartTheme.colors.warning, icon: '⚠️' }
  else if (item.volumeChange < 0  && item.priceChange >= 0) return { label: '有价无市 (份额流失)', color: '#6366f1', icon: '📉' } 
  else                                                      return { label: '量价双杀 (极度危险)', color: ChartTheme.colors.danger, icon: '🚨' }
})

// 主图表 Option
const mainChartOption = computed(() => {
  const mobile = isMaxMd.value
  const sortedData = [...props.data].sort((a, b) => b.latestVolume - a.latestVolume)
  const showCount = mobile ? 6 : 10
  const total = sortedData.length
  const endPercent = total > showCount ? Math.floor((showCount / total) * 100) : 100

  return {
    title: {
      text: '全盘产品销量与健康度排行', left: 0, top: 0,
      textStyle: { fontSize: mobile ? 13 : 16, fontWeight: 700, color: ChartTheme.colors.textMain },
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
            <span style="font-size:11px;background:#f1f5f9;padding:2px 5px;border-radius:4px;color:${ChartTheme.colors.textSub};margin-right:5px">${t.region}</span>${t.product}
          </div>
          <div style="color:${ChartTheme.colors.textSub};margin-bottom:3px">近期销量：<b style="color:${ChartTheme.colors.textMain}">${Number(t.latestVolume).toFixed(2)} 吨</b></div>
          <div style="color:${ChartTheme.colors.textSub};margin-bottom:3px">销量环比：<b style="color:${t.volumeChange >= 0 ? ChartTheme.colors.success : ChartTheme.colors.danger}">${(t.volumeChange * 100).toFixed(2)}%</b></div>
          <div style="color:${ChartTheme.colors.textSub}">价格环比：<b style="color:${t.priceChange >= 0 ? ChartTheme.colors.success : ChartTheme.colors.danger}">${(t.priceChange * 100).toFixed(2)}%</b></div>
        `
      }
    },
    grid: { left: 10, right: 40, bottom: 10, top: mobile ? 45 : 65, containLabel: true },
    dataZoom: [
      { type: 'slider', yAxisIndex: 0, show: total > showCount, right: 0, width: 6, start: 0, end: endPercent, borderColor: 'transparent', backgroundColor: '#f1f5f9', fillerColor: '#cbd5e1', handleSize: 0, showDetail: false, zoomLock: true },
      { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true, moveOnMouseMove: true }
    ],
    xAxis: {
      type: 'value', name: '销量',
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      axisLabel: { color: ChartTheme.colors.textSub, fontSize: mobile ? 10 : 12, formatter: (value: number) => value.toFixed(2) }
    },
    yAxis: {
      type: 'category', inverse: true, data: sortedData.map(d => d.product),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: '#334155', fontWeight: 600, fontSize: mobile ? 11 : 13, interval: 0, width: mobile ? 70 : 90, overflow: 'truncate' }
    },
    series: [{
      type: 'bar', barWidth: mobile ? 14 : 20,
      data: sortedData.map(d => ({
        value: d.latestVolume, originalData: d,
        itemStyle: { color: getColor(d), borderRadius: [0, 4, 4, 0] }
      })),
      label: { show: !mobile, position: 'right', color: ChartTheme.colors.textSub, fontWeight: 600, fontSize: 12, formatter: (p: any) => Number(p.value).toFixed(2) }
    }]
  }
})

// 🌟 详情图表 Option
// 🌟 详情图表 Option
const detailChartOption = computed(() => {
  // 核心：根据当前的 Tab，决定去当月数组还是本年数组里捞数据！
  const item = selectedItem.value
  if (!item) return {}
  const sourceData = trendTab.value === 'year' ? (props.yearData || []) : (item.trend || [])
  if (sourceData.length === 0) return {}
  const mobile = isMaxMd.value

  // 🌟 新增：获取当前真实的年份和月份
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JS 月份是 0-11，需要 +1

  const days: string[] = []
  const volumes: (number | null)[] = []
  const prices: (number | null)[] = []

  // 🌟 修改：遍历数据并判断是否属于“未来月份”
  sourceData.forEach((t: any) => {
    let isFuture = false

    if (trendTab.value === 'year') {
      const dateStr = String(t.date)
      let year = currentYear
      let month = 0

      // 兼容解析各种日期格式，如 "2024-05", "5月", "05" 等
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-')
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10)
          month = parseInt(parts[1], 10)
        } else {
          month = parseInt(parts[0], 10)
        }
      } else {
        // 提取纯数字作为月份
        month = parseInt(dateStr.replace(/[^0-9]/g, ''), 10)
      }

      // 如果数据年份就是今年，并且月份大于当前月，则判定为未来数据
      if (year === currentYear && month > currentMonth) {
        isFuture = true
      }
    }

    days.push(t.date)
    // 🌟 核心：如果是未来月份，将数据置为 null，ECharts 就不会连线到 0
    volumes.push(isFuture ? null : t.volume)
    prices.push(isFuture ? null : t.price)
  })

  const isDomestic = item.region === '国内'
  const currencyName = isDomestic ? '人民币' : '美元'
  const currencySymbol = isDomestic ? '¥' : '$'
  const titlePrefix = trendTab.value === 'year' ? '本年' : '当月'

  return {
    title: {
      text: `${item.product} [${item.region}] ${titlePrefix}量价走势诊断`, left: 'center', top: 0,
      textStyle: { fontSize: mobile ? 13 : 16, fontWeight: 700, color: ChartTheme.colors.textMain }
    },
    legend: { bottom: 0, icon: 'roundRect', textStyle: { color: ChartTheme.colors.textSub, fontSize: mobile ? 11 : 13 } },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross',label: { precision: 2 } },
      backgroundColor: 'rgba(255,255,255,0.98)', padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
      formatter: (params: any[]) => {
        let html = `<div style="font-weight:700;font-size:14px;margin-bottom:8px;color:${ChartTheme.colors.textMain}">${params[0].axisValue}</div>`
        params.forEach(p => {
          // 防止 tooltip 读到 null 值报错，加一层判断
          if (p.value == null) return 
          
          if (p.seriesName === '成交单价') {
             html += `<div style="color:${ChartTheme.colors.textSub};margin-bottom:3px">${p.marker} ${p.seriesName}：<b style="color:${ChartTheme.colors.textMain}">${currencySymbol}${Number(p.value).toFixed(2)}</b></div>`
          } else {
             html += `<div style="color:${ChartTheme.colors.textSub};margin-bottom:3px">${p.marker} ${p.seriesName}：<b style="color:${ChartTheme.colors.textMain}">${Number(p.value).toFixed(2)} 吨</b></div>`
          }
        })
        return html === `<div style="font-weight:700;font-size:14px;margin-bottom:8px;color:${ChartTheme.colors.textMain}">${params[0].axisValue}</div>` ? html + '<div style="color:#94a3b8;font-size:12px;">暂无数据</div>' : html
      }
    },
    grid: { top: mobile ? 40 : 50, bottom: mobile ? 35 : 40, left: 10, right: 10, containLabel: true },
    xAxis: { type: 'category', data: days, axisLabel: { color: ChartTheme.colors.textSub, fontSize: mobile ? 10 : 12 }, axisPointer: { type: 'shadow' } },
    yAxis: [
      { type: 'value', name: '销量 (吨)', alignTicks: true, min: 0, axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { color: ChartTheme.colors.textSub, fontSize: mobile ? 10 : 12, formatter: (value: number) => value.toFixed(2) } },
      { type: 'value', name: `单价 (${currencyName})`, alignTicks: true, scale: true, min: (value: any) => value.min * 0.98, max: (value: any) => value.max * 1.02, axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: ChartTheme.colors.textSub, fontSize: mobile ? 10 : 12, formatter: (value: number) => value.toFixed(2) } }
    ],
    series: [
      { name: '实际销量', type: 'bar', data: volumes, itemStyle: { color: '#e2e8f0', borderRadius: [4, 4, 0, 0] }, emphasis: { itemStyle: { color: '#cbd5e1' } } },
      { name: '成交单价', type: 'line', yAxisIndex: 1, data: prices, smooth: true, symbolSize: mobile ? 6 : 8, itemStyle: { color: '#6366f1' }, lineStyle: { width: mobile ? 2.5 : 3, shadowColor: 'rgba(99,102,241,0.3)', shadowBlur: 8 } }
    ]
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
            返回全局矩阵
          </button>
          
          <div class="header-right">
            <div class="trend-tabs">
              <button :class="{ active: trendTab === 'month' }" @click="switchTab('month')">当月</button>
              <button :class="{ active: trendTab === 'year' }" @click="switchTab('year')">本年</button>
            </div>

            <div class="strategy-badge" :style="{ backgroundColor: strategyStatus.color + '15', color: strategyStatus.color, border: `1px solid ${strategyStatus.color}30` }">
              {{ strategyStatus.icon }} {{ strategyStatus.label }}
            </div>
          </div>
        </div>
        
        <div class="chart-inner-wrap">
          <BaseEChart :option="detailChartOption" class="echarts-dom detail-dom" />
          
          <div v-if="loadingYear && trendTab === 'year'" class="loading-overlay">
            <div class="spinner"></div>
            <span>正在检索年度数据...</span>
          </div>
        </div>

      </div>

    </Transition>
  </div>
</template>

<style scoped>
.chart-wrap { position: relative; width: 100%; height: 100%; min-height: 420px; display: flex; flex-direction: column; }
.view-container { flex: 1; display: flex; flex-direction: column; width: 100%; height: 100%; }
.chart-inner-wrap { position: relative; flex: 1; display: flex; flex-direction: column; }
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

.header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.trend-tabs { display: flex; background: #f1f5f9; padding: 3px; border-radius: 8px; }
.trend-tabs button {
  border: none; background: transparent; padding: 5px 14px; border-radius: 6px;
  font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s;
}
.trend-tabs button:hover { color: #334155; }
.trend-tabs button.active { background: #fff; color: #1d4ed8; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.strategy-badge { padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 5px; }

/* 🌟 Loading 遮罩层样式 */
.loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.7); backdrop-filter: blur(2px);
  display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;
  color: #3b82f6; font-size: 13px; font-weight: 600;
}
.spinner {
  width: 24px; height: 24px; border: 3px solid #bfdbfe; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 8px;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to   { opacity: 0; transform: translateX(-20px); }

@media (max-width: 767px) {
  .chart-wrap  { min-height: 300px; }
  .echarts-dom { min-height: 280px; }
  .detail-dom  { min-height: 260px; }
  .detail-header { padding: 10px 12px; }
  .back-btn { padding: 6px 10px; font-size: 12px; }
  .header-right { width: 100%; justify-content: space-between; gap: 8px; }
  .trend-tabs button { padding: 4px 10px; font-size: 12px; }
  .strategy-badge { font-size: 12px; padding: 4px 10px; }
}
</style>