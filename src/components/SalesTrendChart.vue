<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkPointComponent, MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { SalesTrendProduct } from '@/types'

echarts.use([
  LineChart, GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkPointComponent, MarkLineComponent, CanvasRenderer,
])

const props = defineProps<{
  product: SalesTrendProduct
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let inst: echarts.ECharts | null = null

const COLOR_VOL   = '#3b82f6'   // 销量 — 蓝色
const COLOR_PRICE = '#22d3a5'   // 价格 — 青绿

/** 量价相关系数的等级描述 */
function corrLabel(r: number): { text: string; color: string } {
  if (r >= 0.6)  return { text: '量价高度正相关 ✦ 健康增长', color: '#16a34a' }
  if (r >= 0.2)  return { text: '量价弱正相关 ✧ 基本稳健',  color: '#0284c7' }
  if (r >= -0.2) return { text: '量价无明显相关 — 独立波动', color: '#6b7280' }
  if (r >= -0.6) return { text: '量价弱负相关 ⚠ 价升量缩',  color: '#d97706' }
  return             { text: '量价高度负相关 ✖ 需重点关注',  color: '#dc2626' }
}

const option = computed(() => {
  const { trend, product } = props.product
  const dates  = trend.map(d => d.date)
  const vols   = trend.map(d => d.volume)
  const prices = trend.map(d => d.price)

  // 根据实际数据范围动态设置 Y 轴边界，使趋势变化更明显
  const priceMin    = Math.min(...prices)
  const priceMax    = Math.max(...prices)
  const priceRange  = priceMax - priceMin
  const priceBuffer = Math.round(priceRange * 0.5)  // 上下各留半个数据区间
  const yPriceMin   = priceMin - priceBuffer
  const yPriceMax   = priceMax + priceBuffer

  const volMin    = Math.min(...vols)
  const volMax    = Math.max(...vols)
  const volRange  = volMax - volMin
  const volBuffer = Math.round(volRange * 0.3)
  const yVolMin   = Math.max(0, volMin - volBuffer)
  const yVolMax   = volMax + volBuffer

  return {
    title: {
      text: `${product} 销售趋势`,
      left: 'center',
      top: 6,
      textStyle: { fontSize: 15, fontWeight: 700, color: '#1e3a5f' },
    },
    legend: {
      bottom: 6,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 20,
      textStyle: { fontSize: 12, color: '#6b7280' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#1e293b', fontSize: 13 },
      formatter(params: any) {
        const date = params[0].axisValue
        const vol  = params.find((p: any) => p.seriesName === '销量（吨）')
        const pri  = params.find((p: any) => p.seriesName === '销售价格（元）')
        return `
          <div style="font-weight:700;margin-bottom:8px;color:#1e3a5f">${date}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="width:8px;height:8px;border-radius:50%;background:${COLOR_VOL};display:inline-block"></span>
            <span style="color:#6b7280">销量：</span>
            <b style="color:${COLOR_VOL}">${vol?.value} 吨</b>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${COLOR_PRICE};display:inline-block"></span>
            <span style="color:#6b7280">价格：</span>
            <b style="color:${COLOR_PRICE}">${pri?.value?.toLocaleString('zh-CN')} 元</b>
          </div>
        `
      },
    },
    grid: { top: 52, bottom: 48, left: 8, right: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 12 },
    },
    yAxis: [
      {
        // 左轴 — 销量
        type: 'value',
        name: '销量（吨）',
        position: 'left',
        nameLocation: 'end',
        nameTextStyle: { color: COLOR_VOL, fontSize: 11, fontWeight: 600 },
        nameGap: 10,
        axisLabel: { color: COLOR_VOL, fontSize: 11 },
        axisLine: { show: true, lineStyle: { color: COLOR_VOL, width: 2 } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        min: yVolMin,
        max: yVolMax,
      },
      {
        // 右轴 — 价格
        type: 'value',
        name: '价格（元）',
        position: 'right',
        nameLocation: 'end',
        nameTextStyle: { color: COLOR_PRICE, fontSize: 11, fontWeight: 600 },
        nameGap: 10,
        axisLabel: {
          color: COLOR_PRICE,
          fontSize: 11,
          formatter: (v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v,
        },
        axisLine: { show: true, lineStyle: { color: COLOR_PRICE, width: 2 } },
        axisTick: { show: false },
        splitLine: { show: false },
        min: yPriceMin,
        max: yPriceMax,
      },
    ],
    series: [
      {
        name: '销量（吨）',
        type: 'line',
        yAxisIndex: 0,
        data: vols,
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: COLOR_VOL, width: 2.5 },
        itemStyle: { color: COLOR_VOL, borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59,130,246,0.18)' },
            { offset: 1, color: 'rgba(59,130,246,0.01)' },
          ]),
        },
        // 最高点标注
        markPoint: {
          symbol: 'pin',
          symbolSize: 36,
          data: [{ type: 'max', name: '最高' }],
          label: { fontSize: 11, color: '#fff' },
          itemStyle: { color: COLOR_VOL },
        },
      },
      {
        name: '销售价格（元）',
        type: 'line',
        yAxisIndex: 1,
        data: prices,
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: COLOR_PRICE, width: 2.5 },
        itemStyle: { color: COLOR_PRICE, borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34,211,165,0.14)' },
            { offset: 1, color: 'rgba(34,211,165,0.01)' },
          ]),
        },
      },
    ],
  }
})

function init() {
  if (!chartRef.value) return
  inst = echarts.init(chartRef.value)
  inst.setOption(option.value)
}

watch(() => props.product, () => {
  inst?.setOption(option.value, { notMerge: true })
}, { deep: true })

onMounted(() => { init(); window.addEventListener('resize', () => inst?.resize()) })
onUnmounted(() => { window.removeEventListener('resize', () => inst?.resize()); inst?.dispose() })
</script>

<template>
  <div class="chart-outer">
    <!-- 量价相关系数摘要条 -->
    <div class="corr-bar">
      <span class="corr-label">量价相关系数</span>
      <span class="corr-coef" :style="{ color: corrLabel(product.correlation).color }">
        {{ product.correlation > 0 ? '+' : '' }}{{ product.correlation }}
      </span>
      <span class="corr-desc" :style="{ color: corrLabel(product.correlation).color }">
        {{ corrLabel(product.correlation).text }}
      </span>
      <!-- 相关系数可视化轨道 -->
      <div class="corr-track">
        <div
          class="corr-fill"
          :style="{
            left:  product.correlation >= 0 ? '50%' : `${50 + product.correlation * 50}%`,
            width: `${Math.abs(product.correlation) * 50}%`,
            background: corrLabel(product.correlation).color,
          }"
        />
        <div class="corr-center" />
      </div>
    </div>

    <div ref="chartRef" class="chart" />
  </div>
</template>

<style scoped>
.chart-outer { width: 100%; }

/* 量价相关系数摘要条 */
.corr-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8faff;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 6px;
  font-size: 13px;
  flex-wrap: wrap;
}
.corr-label { color: #6b7280; white-space: nowrap; }
.corr-coef  { font-size: 16px; font-weight: 800; white-space: nowrap; }
.corr-desc  { font-weight: 600; font-size: 12px; flex: 1; min-width: 120px; }
.corr-track {
  position: relative;
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 9999px;
  flex-shrink: 0;
  margin-left: auto;
}
.corr-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 9999px;
  transition: all 0.4s ease;
  min-width: 3px;
}
.corr-center {
  position: absolute;
  left: 50%;
  top: -2px;
  width: 2px;
  height: 10px;
  background: #9ca3af;
  border-radius: 1px;
  transform: translateX(-50%);
}

.chart { width: 100%; height: 360px; }
</style>