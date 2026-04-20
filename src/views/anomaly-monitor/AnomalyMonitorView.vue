<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { ScatterChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent, TitleComponent, LegendComponent, MarkAreaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { debounce } from '@/utils'

echarts.use([ScatterChart, BarChart, GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent, TitleComponent, LegendComponent, CanvasRenderer])

// ==========================================
// 1. 数据模拟与衍生指标计算
// 包含您拥有的 6 个字段：产品、客户、实际销量、销量预算、实际销售额、销售额预算、单价
// ==========================================
interface RawData {
  product: string; customer: string; 
  volume: number; volumeBudget: number; 
  amount: number; amountBudget: number; 
  unitPrice: number;
}

const mockData: RawData[] = [
  // PTFE (指导价约 40,000)
  { product: 'PTFE', customer: '宁德时代', volume: 150, volumeBudget: 150, amount: 6000000, amountBudget: 6000000, unitPrice: 40000 },
  { product: 'PTFE', customer: '比亚迪', volume: 20, volumeBudget: 200, amount: 840000, amountBudget: 8000000, unitPrice: 42000 }, // 异常3: 严重掉队(缺口巨大)
  { product: 'PTFE', customer: '某贸易商A', volume: 5, volumeBudget: 10, amount: 140000, amountBudget: 400000, unitPrice: 28000 }, // 异常1: 买得极少，价格极低(恶意破价)
  { product: 'PTFE', customer: '中航锂电', volume: 80, volumeBudget: 120, amount: 2880000, amountBudget: 4800000, unitPrice: 36000 }, // 异常2: 量价双杀(降价了也没达标)
  { product: 'PTFE', customer: '国轩高科', volume: 130, volumeBudget: 100, amount: 4940000, amountBudget: 4000000, unitPrice: 38000 }, // 以价换量成功
  
  // R32 (指导价约 60,000)
  { product: 'R32', customer: '格力电器', volume: 500, volumeBudget: 500, amount: 30000000, amountBudget: 30000000, unitPrice: 60000 },
  { product: 'R32', customer: '美的集团', volume: 450, volumeBudget: 500, amount: 26550000, amountBudget: 30000000, unitPrice: 59000 },
  { product: 'R32', customer: '海信空调', volume: 100, volumeBudget: 300, amount: 5500000, amountBudget: 18000000, unitPrice: 55000 }, // 量价双杀 + 大缺口
  { product: 'R32', customer: '某小经销商', volume: 10, volumeBudget: 10, amount: 450000, amountBudget: 600000, unitPrice: 45000 }, // 恶意破价
]

const productList = computed(() => Array.from(new Set(mockData.map(d => d.product))))
const selectedProduct = ref(productList.value[0])

// 核心过滤与计算逻辑
const processedData = computed(() => {
  const data = mockData.filter(d => d.product === selectedProduct.value)
  if (!data.length) return []

  // 基于预算计算出的理论基准指导价
  const targetPrice = data[0].amountBudget / data[0].volumeBudget

  return data.map(d => {
    const volRate = d.volume / d.volumeBudget
    const priceDeviation = (d.unitPrice - targetPrice) / targetPrice
    const gapAmount = d.amountBudget - d.amount
    return { ...d, targetPrice, volRate, priceDeviation, gapAmount }
  })
})

// ==========================================
// 异常 1 & 2：四象限图与散点矩阵 (ECharts)
// ==========================================
const chartRef = ref<HTMLDivElement | null>(null)
let chartInst: echarts.ECharts | null = null

const chartOption = computed(() => {
  const data = processedData.value
  if (!data.length) return {}
  const targetPrice = data[0].targetPrice

  // 四象限图数据 (量价关系)
  const quadrantData = data.map(d => ({
    name: d.customer,
    value: [d.volRate * 100, d.priceDeviation * 100, d],
    symbolSize: Math.max(10, (d.amountBudget / 1000000) * 5), // 气泡大小：预算盘子
    itemStyle: { 
      color: (d.volRate < 1 && d.priceDeviation < -0.05) ? '#ef4444' : // 量价双杀(红)
             (d.volRate >= 1 && d.priceDeviation < 0) ? '#f59e0b' : '#3b82f6'
    }
  }))

  // 价格散点图数据 (抓破价)
  const scatterData = data.map(d => ({
    name: d.customer,
    value: [d.volume, d.unitPrice, d],
    symbolSize: 20,
    itemStyle: { 
      // 提货量少于预算30%，且价格低于指导价15%，极其可疑的破价
      color: (d.volume < 50 && d.unitPrice < targetPrice * 0.85) ? '#dc2626' : '#64748b'
    }
  }))

  return {
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.95)', padding: 16, borderColor: '#e2e8f0',
      textStyle: { color: '#0f172a' },
      formatter: (params: any) => {
        const d = params.value[2]
        return `<div style="font-weight:700;font-size:16px;margin-bottom:8px">${d.customer}</div>
                <div>实际销量：${d.volume} 吨 (达标率 ${(d.volRate*100).toFixed(1)}%)</div>
                <div>实际单价：<b style="color:${d.priceDeviation<0?'#ef4444':'#10b981'}">¥${d.unitPrice.toLocaleString()}</b></div>
                <div>指导价偏离：${(d.priceDeviation*100).toFixed(1)}%</div>`
      }
    },
    grid: [
      { left: '5%', right: '55%', top: '15%', bottom: '15%', containLabel: true }, // 左侧四象限
      { left: '55%', right: '5%', top: '15%', bottom: '15%', containLabel: true }  // 右侧散点
    ],
    xAxis: [
      { gridIndex: 0, type: 'value', name: '销量达成率 (%)', nameLocation: 'middle', nameGap: 25, splitLine: {show: false} },
      { gridIndex: 1, type: 'value', name: '绝对提货量 (吨)', nameLocation: 'middle', nameGap: 25, splitLine: {show: false} }
    ],
    yAxis: [
      { gridIndex: 0, type: 'value', name: '均价偏离度 (%)', splitLine: {show: false} },
      { gridIndex: 1, type: 'value', name: '实际单价 (元)', scale: true, splitLine: {lineStyle: {type: 'dashed', color: '#e2e8f0'}} }
    ],
    series: [
      {
        name: '四象限', type: 'scatter', xAxisIndex: 0, yAxisIndex: 0, data: quadrantData,
        markLine: {
          symbol: ['none', 'none'], lineStyle: { type: 'dashed', color: '#94a3b8' },
          data: [{ xAxis: 100, label: {formatter: '达标线'} }, { yAxis: 0, label: {formatter: '均价线'} }]
        },
        markArea: {
          itemStyle: { color: 'rgba(239, 68, 68, 0.05)' }, // 红色危险区背景
          data: [[{ name: '量价双杀区', xAxis: 'min', yAxis: 'min' }, { xAxis: 100, yAxis: 0 }]]
        }
      },
      {
        name: '破价分布', type: 'scatter', xAxisIndex: 1, yAxisIndex: 1, data: scatterData,
        markLine: {
          symbol: ['none', 'none'], lineStyle: { type: 'solid', color: '#f59e0b', width: 2 },
          data: [{ yAxis: targetPrice, label: {formatter: '预算指导价', position: 'start'} }]
        }
      }
    ]
  }
})

// ==========================================
// 异常 3：流失榜单计算
// ==========================================
const gapRanking = computed(() => {
  return [...processedData.value]
    .filter(d => d.gapAmount > 0) // 只看没达标的
    .sort((a, b) => b.gapAmount - a.gapAmount) // 按缺口金额降序排
    .slice(0, 5)
})

const formatWan = (v: number) => (v / 10000).toFixed(0) + '万'

// 🌟 使用防抖优化 resize 事件
const handleResize = debounce(() => {
  chartInst?.resize()
}, 150)

// 🌟 移除 deep: true，优化 watch 性能
watch(chartOption, () => chartInst?.setOption(chartOption.value, {notMerge: true}))

onMounted(() => {
  chartInst = echarts.init(chartRef.value!)
  chartInst.setOption(chartOption.value)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInst?.dispose()
})
</script>

<template>
  <div class="anomaly-monitor">
    <header class="page-header">
      <div class="titles">
        <h1>🚨 业务异常预警雷达</h1>
        <p>基于预算基准线的量价偏离深度诊断</p>
      </div>
      <div class="filter">
        <label>监测产品族：</label>
        <select v-model="selectedProduct" class="select-box">
          <option v-for="p in productList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
    </header>

    <div class="alert-bar">
      <div class="alert-item danger">
        <span class="icon">⚠️</span>
        <div class="text">
          <b>量价双杀预警：</b> 
          发现 {{ processedData.filter(d => d.volRate < 1 && d.priceDeviation < -0.05).length }} 个客户降价后仍未达标，策略可能失效！
        </div>
      </div>
      <div class="alert-item warning">
        <span class="icon">🕵️‍♂️</span>
        <div class="text">
          <b>破价窜货嫌疑：</b> 
          发现 {{ processedData.filter(d => d.volume < 50 && d.unitPrice < d.targetPrice * 0.85).length }} 个客户提货极少却拿到底价，建议严查渠道！
        </div>
      </div>
    </div>

    <div class="chart-section">
      <div class="chart-header">
        <div class="ch-left">
          <h2>战略量价偏离矩阵 <span>(左图)</span></h2>
          <p class="sub">识别“以价换量”是否成功，警惕左下角红色危险区</p>
        </div>
        <div class="ch-right">
          <h2>底线价格击穿雷达 <span>(右图)</span></h2>
          <p class="sub">识别小客违规拿低价，警惕黄线下方红色气泡</p>
        </div>
      </div>
      <div ref="chartRef" class="echarts-container"></div>
    </div>

    <div class="bottom-section">
      <div class="list-card">
        <div class="card-title">
          <h2>🔥 核心基本盘缺口榜 (Top 5)</h2>
          <p>不要只看达标率，盯着绝对缺口打！</p>
        </div>
        <div class="list-content">
          <div class="list-item" v-for="(item, idx) in gapRanking" :key="item.customer">
            <div class="rank-num" :class="`top-${idx+1}`">{{ idx + 1 }}</div>
            <div class="cust-info">
              <div class="c-name">{{ item.customer }}</div>
              <div class="c-status">
                <span :class="item.priceDeviation < 0 ? 'text-red' : ''">
                  单价: ¥{{ item.unitPrice.toLocaleString() }} (偏离 {{(item.priceDeviation*100).toFixed(1)}}%)
                </span>
              </div>
            </div>
            <div class="gap-info">
              <div class="gap-val">缺口 ¥{{ formatWan(item.gapAmount) }}</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{width: `${Math.max(item.volRate*100, 5)}%`}"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.anomaly-monitor {
  min-height: 100vh; background: #f1f5f9; padding: 24px 32px; font-family: 'Inter', sans-serif;
}
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.titles h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
.titles p { margin: 0; color: #64748b; font-size: 16px; }
.select-box { padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; font-weight: 600; outline: none; }

.alert-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.alert-item { display: flex; gap: 16px; padding: 16px 24px; border-radius: 12px; align-items: center; }
.alert-item.danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
.alert-item.warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
.alert-item .icon { font-size: 24px; }
.alert-item .text { font-size: 16px; line-height: 1.5; }

.chart-section { background: #fff; padding: 24px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 24px; }
.chart-header { display: flex; margin-bottom: 10px; }
.ch-left, .ch-right { flex: 1; }
.ch-right { padding-left: 5%; }
.chart-header h2 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; color: #1e293b; }
.chart-header span { font-weight: normal; color: #94a3b8; font-size: 14px; }
.chart-header .sub { margin: 0; font-size: 14px; color: #64748b; }
.echarts-container { width: 100%; height: 400px; }

.bottom-section { display: grid; grid-template-columns: 1fr; gap: 24px; }
.list-card { background: #fff; padding: 24px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.card-title h2 { font-size: 20px; font-weight: 700; margin: 0 0 6px 0; color: #0f172a; }
.card-title p { margin: 0 0 20px 0; color: #64748b; font-size: 14px; }

.list-item { display: flex; align-items: center; gap: 20px; padding: 16px 0; border-bottom: 1px dashed #e2e8f0; }
.list-item:last-child { border-bottom: none; }
.rank-num { width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; }
.rank-num.top-1 { background: #fee2e2; color: #dc2626; }
.rank-num.top-2 { background: #ffedd5; color: #ea580c; }
.rank-num.top-3 { background: #fef3c7; color: #d97706; }
.cust-info { flex: 1; }
.c-name { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.c-status { font-size: 14px; color: #64748b; }
.text-red { color: #dc2626; font-weight: 600; }

.gap-info { width: 300px; text-align: right; }
.gap-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #ef4444; border-radius: 4px; }

/* 🌟 移动端响应式适配 */
/* 平板端（<= 1023px） */
@media (max-width: 1023px) {
  .anomaly-monitor { padding: 20px 24px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .titles h1 { font-size: 24px; }
  .titles p { font-size: 14px; }
  
  .alert-bar { gap: 16px; }
  .alert-item { padding: 14px 18px; }
  .alert-item .text { font-size: 14px; }
  
  .chart-section { padding: 20px; }
  .chart-header { flex-direction: column; gap: 12px; }
  .ch-right { padding-left: 0; }
  .echarts-container { height: 350px; }
}

/* 手机端（<= 767px） */
@media (max-width: 767px) {
  .anomaly-monitor { padding: 16px 12px; }
  .titles h1 { font-size: 20px; }
  .titles p { font-size: 13px; }
  
  /* 页头改为纵向布局 */
  .page-header { gap: 12px; }
  .filter { width: 100%; }
  .filter label { display: block; font-size: 13px; margin-bottom: 4px; }
  .select-box { width: 100%; font-size: 14px; padding: 6px 12px; }
  
  /* 警告栏纵向堆叠 */
  .alert-bar { grid-template-columns: 1fr; gap: 12px; }
  .alert-item { padding: 12px 14px; gap: 12px; }
  .alert-item .icon { font-size: 20px; }
  .alert-item .text { font-size: 13px; line-height: 1.4; }
  
  /* 图表区域 */
  .chart-section { padding: 16px 12px; border-radius: 12px; margin-bottom: 16px; }
  .chart-header h2 { font-size: 16px; }
  .chart-header .sub { font-size: 12px; }
  .echarts-container { height: 280px; }
  
  /* 底部缺口榜 */
  .bottom-section { gap: 16px; }
  .list-card { padding: 16px 12px; border-radius: 12px; }
  .card-title h2 { font-size: 16px; }
  .card-title p { font-size: 12px; margin-bottom: 16px; }
  
  /* 列表项移动端优化 */
  .list-item { flex-wrap: wrap; gap: 12px; padding: 12px 0; }
  .rank-num { width: 28px; height: 28px; font-size: 16px; }
  .cust-info { flex: 1 1 100%; order: 2; }
  .c-name { font-size: 15px; }
  .c-status { font-size: 12px; }
  
  /* 缺口信息全宽显示 */
  .gap-info { width: 100%; text-align: left; order: 3; margin-top: 8px; }
  .gap-val { font-size: 16px; margin-bottom: 6px; }
  .progress-bar { height: 6px; }
}

/* 超小屏（<= 420px） */
@media (max-width: 420px) {
  .anomaly-monitor { padding: 12px 8px; }
  .titles h1 { font-size: 18px; }
  .echarts-container { height: 240px; }
  .list-card { padding: 12px 8px; }
  .c-name { font-size: 14px; }
  .gap-val { font-size: 14px; }
}
</style>