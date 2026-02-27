<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent, TitleComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, TitleComponent, LegendComponent, CanvasRenderer])

// ==========================================
// 1. 模拟数据层 (基于您提供的数据字段)
// 字段：产品、客户名称、销量、销量预算、销售额、销售额预算、单价
// ==========================================
interface OrderData {
  product: string
  customer: string
  volume: number
  volumeBudget: number
  amount: number
  amountBudget: number
  unitPrice: number
}

// 生成模拟数据
const rawData: OrderData[] = [
  // R32 正常指导价约 60000
  { product: 'R32', customer: '美的集团', volume: 500, volumeBudget: 450, amount: 29000000, amountBudget: 27000000, unitPrice: 58000 },
  { product: 'R32', customer: '格力电器', volume: 800, volumeBudget: 800, amount: 46400000, amountBudget: 48000000, unitPrice: 58000 },
  { product: 'R32', customer: '海尔智家', volume: 300, volumeBudget: 400, amount: 18600000, amountBudget: 24000000, unitPrice: 62000 },
  { product: 'R32', customer: '奥克斯', volume: 150, volumeBudget: 100, amount: 8250000, amountBudget: 6000000, unitPrice: 55000 }, // 违规低价
  { product: 'R32', customer: '长虹空调', volume: 50, volumeBudget: 60, amount: 3250000, amountBudget: 3600000, unitPrice: 65000 },
  // PTFE 正常指导价约 40000
  { product: 'PTFE悬浮', customer: '宁德时代', volume: 120, volumeBudget: 100, amount: 4800000, amountBudget: 4000000, unitPrice: 40000 },
  { product: 'PTFE悬浮', customer: '比亚迪', volume: 90, volumeBudget: 150, amount: 3420000, amountBudget: 6000000, unitPrice: 38000 }, // 流失风险
  { product: 'PTFE悬浮', customer: '中航锂电', volume: 40, volumeBudget: 30, amount: 1680000, amountBudget: 1200000, unitPrice: 42000 },
  { product: 'PTFE悬浮', customer: '某小微企业', volume: 5, volumeBudget: 5, amount: 150000, amountBudget: 200000, unitPrice: 30000 }, // 极端低价
]

// ==========================================
// 2. 全局大盘计算 (Top Metrics)
// ==========================================
const globalMetrics = computed(() => {
  let totalVol = 0, totalVolBudget = 0
  let totalAmt = 0, totalAmtBudget = 0

  rawData.forEach(d => {
    totalVol += d.volume; totalVolBudget += d.volumeBudget
    totalAmt += d.amount; totalAmtBudget += d.amountBudget
  })

  // 预算指导均价 = 总销售额预算 / 总销量预算
  const targetAvgPrice = totalAmtBudget / totalVolBudget
  const actualAvgPrice = totalAmt / totalVol
  const priceDeviationRate = (actualAvgPrice - targetAvgPrice) / targetAvgPrice

  return {
    volRate: totalVol / totalVolBudget,
    amtRate: totalAmt / totalAmtBudget,
    targetAvgPrice,
    actualAvgPrice,
    priceDeviationRate
  }
})

// ==========================================
// 3. 客户异动榜单计算
// ==========================================
const customerRankings = computed(() => {
  // 按销售额达成率排序
  const list = rawData.map(d => ({
    ...d,
    achievementRate: d.amount / d.amountBudget,
    targetPrice: d.amountBudget / d.volumeBudget,
    priceDeviation: d.unitPrice - (d.amountBudget / d.volumeBudget)
  }))

  const redList = [...list].filter(d => d.achievementRate < 0.8).sort((a, b) => a.achievementRate - b.achievementRate).slice(0, 5) // 进度严重落后
  const greenList = [...list].filter(d => d.achievementRate >= 1).sort((a, b) => b.achievementRate - a.achievementRate).slice(0, 5) // 超额完成

  return { redList, greenList }
})

// ==========================================
// 4. ECharts 散点图逻辑 (核心功能：抓违规低价)
// ==========================================
const products = computed(() => Array.from(new Set(rawData.map(d => d.product))))
const selectedProduct = ref(products.value[0])

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const scatterOption = computed(() => {
  const data = rawData.filter(d => d.product === selectedProduct.value)
  if (!data.length) return {}

  const targetPrice = data[0].amountBudget / data[0].volumeBudget

  const scatterSeries = data.map(d => {
    const isWarning = d.unitPrice < targetPrice * 0.95 // 偏离指导价超过 5% 标红
    return {
      name: d.customer,
      value: [d.volume, d.unitPrice, d],
      symbolSize: Math.max(15, (d.amount / 10000000) * 30), // 气泡大小代表销售额
      itemStyle: { 
        color: isWarning ? '#ef4444' : '#3b82f6',
        opacity: 0.8,
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.1)'
      }
    }
  })

  return {
    grid: { left: '10%', right: '10%', bottom: '15%', top: '15%', containLabel: true },
    tooltip: {
      backgroundColor: '#fff',
      padding: 16,
      textStyle: { color: '#1e293b' },
      borderColor: '#e2e8f0',
      formatter: (params: any) => {
        const d = params.value[2]
        const diff = d.unitPrice - targetPrice
        return `
          <div style="font-weight:700; font-size:16px; margin-bottom:8px">${d.customer}</div>
          <div style="color:#64748b; margin-bottom:4px">提货销量：<b style="color:#0f172a">${d.volume} 吨</b></div>
          <div style="color:#64748b; margin-bottom:4px">实际单价：<b style="color:#0f172a">¥${d.unitPrice.toLocaleString()}</b></div>
          <div style="color:#64748b">指导价偏离：<b style="color:${diff<0?'#ef4444':'#10b981'}">${diff>0?'+':''}${diff.toLocaleString()}元</b></div>
        `
      }
    },
    xAxis: {
      type: 'value',
      name: '提货量 (吨) →',
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: { show: false },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      name: '实际成交单价 (元) ↑',
      min: 'dataMin',
      max: 'dataMax',
      splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      type: 'scatter',
      data: scatterSeries,
      markLine: {
        symbol: ['none', 'none'],
        lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
        data: [
          { yAxis: targetPrice, label: { formatter: '预算指导均价: ¥{c}', position: 'end', color: '#d97706', fontWeight: 'bold' } }
        ]
      }
    }]
  }
})

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(scatterOption.value)
}

watch(scatterOption, () => chartInstance?.setOption(scatterOption.value), { deep: true })

onMounted(() => {
  setTimeout(initChart, 300)
  window.addEventListener('resize', () => chartInstance?.resize())
})
onUnmounted(() => {
  window.removeEventListener('resize', () => chartInstance?.resize())
  chartInstance?.dispose()
})

// 工具函数
const formatPct = (val: number) => (val * 100).toFixed(1) + '%'
const formatWan = (val: number) => (val / 10000).toFixed(0) + '万'
</script>

<template>
  <div class="exec-dashboard">
    <header class="exec-header">
      <div class="header-titles">
        <h1>集团业财融合指挥舱</h1>
        <p class="subtitle">Executive Financial & Sales Dashboard</p>
      </div>
    </header>

    <section class="global-metrics">
      <div class="metric-card">
        <div class="mc-title">大盘销售额达成率</div>
        <div class="mc-value">{{ formatPct(globalMetrics.amtRate) }}</div>
        <div class="progress-track"><div class="progress-fill" :style="{ width: Math.min(globalMetrics.amtRate * 100, 100) + '%' }"></div></div>
        <div class="mc-desc">
          <span>实际: ¥{{ formatWan(rawData.reduce((s,d)=>s+d.amount,0)) }}</span>
          <span>预算: ¥{{ formatWan(rawData.reduce((s,d)=>s+d.amountBudget,0)) }}</span>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="mc-title">大盘销量达成率</div>
        <div class="mc-value" style="color:#8b5cf6">{{ formatPct(globalMetrics.volRate) }}</div>
        <div class="progress-track"><div class="progress-fill bg-purple" :style="{ width: Math.min(globalMetrics.volRate * 100, 100) + '%' }"></div></div>
        <div class="mc-desc">
          <span>实际: {{ rawData.reduce((s,d)=>s+d.volume,0) }} 吨</span>
          <span>预算: {{ rawData.reduce((s,d)=>s+d.volumeBudget,0) }} 吨</span>
        </div>
      </div>

      <div class="metric-card" :class="{'alert-card': globalMetrics.priceDeviationRate < 0}">
        <div class="mc-title">全局均价健康度</div>
        <div class="mc-value" :class="globalMetrics.priceDeviationRate < 0 ? 'text-danger' : 'text-success'">
          {{ globalMetrics.priceDeviationRate > 0 ? '+' : '' }}{{ formatPct(globalMetrics.priceDeviationRate) }}
        </div>
        <div class="mc-desc mt-auto">
          <span>实际均价: ¥{{ globalMetrics.actualAvgPrice.toFixed(0) }}</span>
          <span>指导均价: ¥{{ globalMetrics.targetAvgPrice.toFixed(0) }}</span>
        </div>
        <div class="alert-tip" v-if="globalMetrics.priceDeviationRate < 0">⚠️ 均价已跌破预算基准线，利润流失！</div>
      </div>
    </section>

    <section class="investigation-zone">
      <div class="panel scatter-panel">
        <div class="panel-header">
          <div>
            <h2>客户价格散点矩阵</h2>
            <p class="panel-sub">辅助判定：是否大客杀熟，或小客恶意低价</p>
          </div>
          <select v-model="selectedProduct" class="product-select">
            <option v-for="p in products" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div class="scatter-chart" ref="chartRef"></div>
      </div>

      <div class="panel ranking-panel">
        <div class="panel-header">
          <h2>大客户异动预警榜</h2>
          <p class="panel-sub">基于销售额预算进度</p>
        </div>
        
        <div class="ranking-list">
          <h3 class="list-title danger"><span class="dot bg-red"></span> 流失/滞后风险 (Top 5)</h3>
          <div class="rank-item" v-for="item in customerRankings.redList" :key="item.customer">
            <div class="rank-info">
              <span class="rank-name">{{ item.customer }}</span>
              <span class="rank-prod">{{ item.product }}</span>
            </div>
            <div class="rank-data">
              <span class="text-danger font-bold">{{ formatPct(item.achievementRate) }}</span>
              <span class="rank-sub">缺口: {{ formatWan(item.amountBudget - item.amount) }}</span>
            </div>
          </div>

          <h3 class="list-title success" style="margin-top:24px"><span class="dot bg-green"></span> 增长黑马/超额 (Top 5)</h3>
          <div class="rank-item" v-for="item in customerRankings.greenList" :key="item.customer">
            <div class="rank-info">
              <span class="rank-name">{{ item.customer }}</span>
              <span class="rank-prod">{{ item.product }}</span>
            </div>
            <div class="rank-data">
              <span class="text-success font-bold">{{ formatPct(item.achievementRate) }}</span>
              <span class="rank-sub">超额: {{ formatWan(item.amount - item.amountBudget) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel ledger-panel">
      <div class="panel-header">
        <h2>底层数据明细台账</h2>
        <p class="panel-sub">用于追责与对账分析</p>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>产品</th>
              <th>客户名称</th>
              <th class="text-right">实际单价</th>
              <th class="text-right">预算指导价</th>
              <th class="text-right">均价偏差</th>
              <th class="text-right">实际销量</th>
              <th class="text-right">实际销售额</th>
              <th class="text-center">金额达成率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in customerRankings.redList.concat(customerRankings.greenList)" :key="idx">
              <td>{{ row.product }}</td>
              <td class="font-bold">{{ row.customer }}</td>
              <td class="text-right font-bold" :class="row.priceDeviation < 0 ? 'text-danger' : ''">¥{{ row.unitPrice.toLocaleString() }}</td>
              <td class="text-right text-muted">¥{{ row.targetPrice.toFixed(0) }}</td>
              <td class="text-right">
                <span class="pill" :class="row.priceDeviation < 0 ? 'bg-red-light text-danger' : 'bg-green-light text-success'">
                  {{ row.priceDeviation > 0 ? '+' : '' }}{{ row.priceDeviation.toFixed(0) }}
                </span>
              </td>
              <td class="text-right">{{ row.volume }} 吨</td>
              <td class="text-right">¥{{ row.amount.toLocaleString() }}</td>
              <td class="text-center font-bold">{{ formatPct(row.achievementRate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.exec-dashboard {
  --bg-page: #f1f5f9;
  --bg-card: #ffffff;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --border: #e2e8f0;
  --primary: #3b82f6;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;

  min-height: 100vh; background: var(--bg-page); padding: 24px 32px 60px;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header */
.exec-header { margin-bottom: 24px; }
.header-titles h1 { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0; }
.subtitle { font-size: 14px; color: var(--text-sub); margin: 0; text-transform: uppercase; letter-spacing: 1px; }

/* Metrics */
.global-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.metric-card {
  background: var(--bg-card); border-radius: 16px; padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; position: relative;
  overflow: hidden;
}
.alert-card { border: 1px solid #fecaca; background: #fff5f5; }
.mc-title { font-size: 16px; font-weight: 600; color: var(--text-sub); margin-bottom: 8px; }
.mc-value { font-size: 36px; font-weight: 800; color: var(--primary); margin-bottom: 16px; line-height: 1; }
.mc-desc { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-sub); font-weight: 500; }
.progress-track { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
.progress-fill { height: 100%; background: var(--primary); border-radius: 4px; }
.bg-purple { background: #8b5cf6; }
.text-danger { color: var(--danger); }
.text-success { color: var(--success); }
.mt-auto { margin-top: auto; }
.alert-tip { margin-top: 12px; font-size: 13px; color: #b91c1c; font-weight: 600; background: #fee2e2; padding: 6px 10px; border-radius: 6px; }

/* Panels */
.investigation-zone { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-bottom: 24px; }
.panel { background: var(--bg-card); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.panel-header h2 { font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0 0 4px 0; }
.panel-sub { font-size: 14px; color: var(--text-sub); margin: 0; }

/* Scatter */
.product-select {
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);
  font-size: 15px; font-weight: 600; background: #f8fafc; outline: none;
}
.scatter-chart { width: 100%; height: 400px; }

/* Rankings */
.list-title { font-size: 15px; font-weight: 700; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.bg-red { background: var(--danger); }
.bg-green { background: var(--success); }
.rank-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px dashed var(--border);
}
.rank-item:last-child { border-bottom: none; }
.rank-info { display: flex; flex-direction: column; gap: 4px; }
.rank-name { font-size: 16px; font-weight: 700; color: var(--text-main); }
.rank-prod { font-size: 13px; color: var(--text-sub); }
.rank-data { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.font-bold { font-weight: 700; }
.rank-sub { font-size: 13px; color: var(--text-sub); }

/* Table */
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; min-width: 900px; font-size: 15px; }
.data-table th { background: #f8fafc; color: var(--text-sub); font-weight: 600; padding: 12px 16px; text-align: left; border-bottom: 2px solid var(--border); white-space: nowrap; }
.data-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-main); }
.data-table tr:hover { background: #f8fafc; }
.text-right { text-align: right !important; }
.text-center { text-align: center !important; }
.text-muted { color: var(--text-sub); }
.pill { padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 14px; }
.bg-red-light { background: #fee2e2; }
.bg-green-light { background: #dcfce7; }
</style>