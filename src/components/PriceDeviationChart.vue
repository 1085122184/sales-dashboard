<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  type GridComponentOption, type TooltipComponentOption, type LegendComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { PriceDeviationItem } from '@/types'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

type EChartsOption = echarts.ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>

const props = defineProps<{
  data: PriceDeviationItem[]
  selectedProduct?: string | null
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 取色尽量贴近您的截图
const COLOR_BLUE  = '#6e6df1' // 浅紫蓝色
const COLOR_GREEN = '#22d3a5' // 蓝绿色

const chartOption = computed<EChartsOption>(() => {
  const reversed  = [...props.data].reverse()
  const products  = reversed.map(d => d.product)
  
  const sevenDay  = reversed.map(d => ({
    value: d.sevenDayAvgPrice,
    name: d.product,
    itemStyle: { color: COLOR_BLUE, borderRadius: [0, 8, 8, 0] },
    label: { color: COLOR_BLUE },
  }))
  
  const today = reversed.map(d => ({
    value: d.todayAvgPrice,
    name: d.product,
    itemStyle: { color: COLOR_GREEN, borderRadius: [0, 8, 8, 0] },
    label: { color: COLOR_GREEN },
  }))

  return {
    legend: {
      top: 0,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 10,
      itemGap: 24,
      textStyle: { fontSize: 14, color: '#64748b' }, // 字体颜色优化
      data: [
        { name: '七日平均价格', itemStyle: { color: COLOR_BLUE } },
        { name: '当日平均价格', itemStyle: { color: COLOR_GREEN } },
      ],
    },

    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 15 },
      formatter(params: any) {
        const p  = params[0]
        const p2 = params[1]
        const item = props.data.find(d => d.product === p.name)
        const rateHtml = item
          ? `<div style="margin-top:6px;color:${item.deviationRate <= -0.1 ? '#dc2626' : item.deviationRate < -0.05 ? '#d97706' : '#6b7280'}">
               偏差率：${item.deviationRateText}
             </div>`
          : ''
        return `
          <div style="font-weight:600;margin-bottom:6px">${p.name}</div>
          <div style="margin-bottom:3px">${p.marker} 七日均价：${p.value?.toLocaleString('zh-CN')} 元</div>
          <div>${p2.marker} 当日均价：${p2.value?.toLocaleString('zh-CN')} 元</div>
          ${rateHtml}
        `
      },
    },

    // 加大 right 距离，为右侧文字留出展示空间
    grid: { top: 40, bottom: 0, left: 16, right: 60, containLabel: true },

    xAxis: { type: 'value', show: false, splitLine: { show: false } },

    yAxis: {
      type: 'category',
      data: products,
      axisLabel: { color: '#64748b', fontSize: 14, margin: 12 },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
    },

    series: [
      {
        name: '七日平均价格',
        type: 'bar',
        data: sevenDay,
        barCategoryGap: '35%', // 组间距
        barGap: '15%',         // 组内两根柱子的间距
        label: {
          show: true,
          position: 'right',
          fontSize: 13,
          fontWeight: 600,
          formatter: (params: any) => params.value?.toLocaleString('zh-CN') // 千分位带逗号
        },
      },
      {
        name: '当日平均价格',
        type: 'bar',
        data: today,
        label: {
          show: true,
          position: 'right',
          fontSize: 13,
          fontWeight: 600,
          formatter: (params: any) => params.value?.toLocaleString('zh-CN') // 千分位带逗号
        },
      },
    ],
  }
})

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(chartOption.value)
}

function resizeChart() { chartInstance?.resize() }

// 只监听 data 变化即可，去除了选中联动的重新渲染
watch(
  () => props.data,
  () => {
    if (chartInstance) {
      chartInstance.setOption(chartOption.value, { notMerge: true })
    }
  },
  { deep: true },
)

onMounted(() => { initChart(); window.addEventListener('resize', resizeChart) })
onUnmounted(() => { window.removeEventListener('resize', resizeChart); chartInstance?.dispose() })
</script>

<template>
  <div class="chart-wrap">
    <Transition name="slide-fade">
      <div v-if="selectedProduct" class="selected-summary">
        <template v-for="item in data" :key="item.product">
          <template v-if="item.product === selectedProduct">
            <span class="summary-product">{{ item.product }}</span>
            <span class="summary-divider">·</span>
            <span class="summary-label">偏差额</span>
            <span
              class="summary-value"
              :class="{
                'val-danger':  item.deviationRate <= -0.1,
                'val-warning': item.deviationRate > -0.1 && item.deviationRate < -0.05,
              }"
            >
              {{ item.deviationAmount.toLocaleString('zh-CN') }} 元
            </span>
            <span class="summary-divider">·</span>
            <span class="summary-label">偏差率</span>
            <span
              class="summary-badge"
              :class="{
                'badge-danger':  item.deviationRate <= -0.1,
                'badge-warning': item.deviationRate > -0.1 && item.deviationRate < -0.05,
                'badge-normal':  item.deviationRate >= -0.05,
              }"
            >
              {{ item.deviationRateText }}
            </span>
          </template>
        </template>
      </div>
    </Transition>

    <div ref="chartRef" class="chart" />
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
}

.chart {
  width: 100%;
  height: 360px; /* 稍微加高一点以容纳间隙 */
}

/* 选中摘要条 */
.selected-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8faff;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 8px;
  font-size: var(--fs-xs);
  flex-wrap: wrap;
}

.summary-product {
  font-weight: 700;
  color: #1e3a5f;
  font-size: var(--fs-sm);
}
.summary-divider { color: #cbd5e1; }
.summary-label { color: #6b7280; }
.summary-value { font-weight: 600; color: #111827; }
.summary-badge {
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 700;
  font-size: var(--fs-xs);
}
.badge-danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.badge-warning { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
.badge-normal  { background: #f1f5f9; color: #64748b; }

.val-danger  { color: #dc2626; }
.val-warning { color: #d97706; }

/* 过渡动画 */
.slide-fade-enter-active { transition: all 0.25s ease; }
.slide-fade-leave-active { transition: all 0.2s ease; }
.slide-fade-enter-from   { opacity: 0; transform: translateY(-6px); }
.slide-fade-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>