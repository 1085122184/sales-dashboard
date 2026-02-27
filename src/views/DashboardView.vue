<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDashboard } from '@/composables/useDashboard'
import { useSalesTrend } from '@/composables/useSalesTrend'
import MetricCard from '@/components/MetricCard.vue'
import CollectionCard from '@/components/CollectionCard.vue'
import OrderCard from '@/components/OrderCard.vue'
import SalesTrendChart from '@/components/SalesTrendChart.vue'
import PriceDeviationChart from '@/components/PriceDeviationChart.vue'
import PriceDeviationTable from '@/components/PriceDeviationTable.vue'
import SalesTrendTable from '@/components/SalesTrendTable.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'

// 引入 ECharts 散点图相关
import * as echarts from 'echarts/core'
import { ScatterChart, EffectScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, EffectScatterChart, GridComponent, TooltipComponent, MarkLineComponent, TitleComponent, CanvasRenderer])

const {
  loading, error,
  salesVolume, salesAmount, collection,
  monthOrders, yearOrders,
  priceDeviations,
  refresh: refreshDashboard,
} = useDashboard()

const { trendLoading, trends } = useSalesTrend()

function refreshAll() {
  refreshDashboard()
}

// ==============================
// 智能战况播报 (Weather Report)
// ==============================
const weatherReport = computed(() => {
  if (priceDeviations.value.length === 0 || trends.value.length === 0) return null

  const worstPrice = priceDeviations.value.reduce((min, curr) => curr.deviationRate < min.deviationRate ? curr : min, priceDeviations.value[0])
  const bestTrend = trends.value.reduce((max, curr) => (curr.volumeChange + curr.priceChange) > (max.volumeChange + max.priceChange) ? curr : max, trends.value[0])

  return { worstPrice, bestTrend }
})

// ==============================
// 战略四象限矩阵 (ECharts)
// ==============================
const quadrantChartRef = ref<HTMLDivElement | null>(null)
let quadrantChart: echarts.ECharts | null = null

const quadrantOption = computed(() => {
  if (trends.value.length === 0) return {}

  const maxRev = Math.max(...trends.value.map(t => t.latestVolume * t.latestPrice))

  const scatterData = trends.value.map(t => {
    const rev = t.latestVolume * t.latestPrice
    const symbolSize = Math.max(15, (rev / maxRev) * 50)
    
    let color = '#3b82f6'
    if (t.volumeChange >= 0 && t.priceChange >= 0) color = '#10b981'
    if (t.volumeChange < 0 && t.priceChange < 0) color = '#ef4444'
    if ((t.volumeChange >= 0 && t.priceChange < 0) || (t.volumeChange < 0 && t.priceChange >= 0)) color = '#f59e0b'

    return {
      name: t.product,
      value: [
        Number((t.volumeChange * 100).toFixed(2)), 
        Number((t.priceChange * 100).toFixed(2)), 
        rev, 
        t
      ],
      symbolSize,
      itemStyle: { color, opacity: 0.8, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' }
    }
  })

  return {
    grid: { left: '8%', right: '8%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: {
      backgroundColor: '#fff',
      padding: 16,
      textStyle: { color: '#1e293b' },
      borderColor: '#e2e8f0',
      formatter: (params: any) => {
        const t = params.value[3]
        return `
          <div style="font-weight:700; font-size:16px; margin-bottom:8px">${t.product}</div>
          <div style="color:#64748b; margin-bottom:4px">销量环比：<b style="color:${t.volumeChange>=0?'#10b981':'#ef4444'}">${(t.volumeChange*100).toFixed(1)}%</b></div>
          <div style="color:#64748b">价格环比：<b style="color:${t.priceChange>=0?'#10b981':'#ef4444'}">${(t.priceChange*100).toFixed(1)}%</b></div>
          <div style="margin-top:8px; font-size:12px; color:#94a3b8">点击查看深度分析</div>
        `
      }
    },
    xAxis: {
      type: 'value',
      name: '销量环比变动 (%)',
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: { show: false },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      name: '价格环比变动 (%)',
      splitLine: { show: false },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      type: 'scatter',
      data: scatterData,
      markLine: {
        symbol: ['none', 'none'],
        lineStyle: { color: '#cbd5e1', type: 'dashed' },
        data: [
          { xAxis: 0, label: { formatter: '销量持平', position: 'end', color: '#94a3b8' } },
          { yAxis: 0, label: { formatter: '价格持平', position: 'end', color: '#94a3b8' } }
        ]
      }
    }]
  }
})

function initQuadrantChart() {
  if (!quadrantChartRef.value) return
  quadrantChart = echarts.init(quadrantChartRef.value)
  quadrantChart.setOption(quadrantOption.value)
  
  quadrantChart.on('click', (params: any) => {
    openDrawer(params.data.name, 'trend')
  })
}

watch(quadrantOption, () => {
  quadrantChart?.setOption(quadrantOption.value)
}, { deep: true })

onMounted(() => {
  setTimeout(() => { initQuadrantChart() }, 500)
  window.addEventListener('resize', () => quadrantChart?.resize())
})
onUnmounted(() => {
  window.removeEventListener('resize', () => quadrantChart?.resize())
  quadrantChart?.dispose()
})


// ==============================
// 交互状态 (Tab切换 & 抽屉下钻)
// ==============================
type DetailTab = 'deviation' | 'trend'
const activeTab = ref<DetailTab>('deviation')

const showDrawer = ref(false)
const drawerType = ref<DetailTab>('trend')
const selectedProduct = ref<string | null>(null)
const selectedTrend = computed(() => trends.value.find(t => t.product === selectedProduct.value) || null)

// 打开抽屉 (自动匹配对应的图表类型)
function openDrawer(productName: string | null, type: DetailTab) {
  if (!productName) return
  selectedProduct.value = productName
  drawerType.value = type
  showDrawer.value = true
}

// 辅助函数
function getStatusColor(val: number) {
  if (val > 0.02) return '#10b981'
  if (val < -0.02) return '#ef4444'
  return '#64748b'
}
function formatPct(val: number) {
  return (val > 0 ? '+' : '') + (val * 100).toFixed(1) + '%'
}
</script>

<template>
  <div class="dashboard-executive">
    
    <header class="exec-header">
      <div class="header-titles">
        <h1>集团销售战情指挥舱</h1>
        <p class="subtitle">Executive Sales Intelligence Dashboard</p>
      </div>
      <button class="refresh-btn" :disabled="loading" @click="refreshAll">
        <svg class="icon" :class="{ spinning: loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <span>实时同步</span>
      </button>
    </header>

    <Transition name="fade">
      <div v-if="error" class="error-bar">⚠️ {{ error }} <button @click="refreshAll">重试</button></div>
    </Transition>

    <section class="section metrics-zone">
      <LoadingSkeleton v-if="loading" height="130px" border-radius="14px" />
      <MetricCard v-else-if="salesVolume" :data="salesVolume" />

      <LoadingSkeleton v-if="loading" height="130px" border-radius="14px" />
      <MetricCard v-else-if="salesAmount" :data="salesAmount" variant="purple" />

      <LoadingSkeleton v-if="loading" height="130px" border-radius="14px" />
      <CollectionCard v-else-if="collection" :data="collection" />

      <div class="order-col">
        <template v-if="loading">
          <LoadingSkeleton height="48%" border-radius="14px" />
          <LoadingSkeleton height="48%" border-radius="14px" />
        </template>
        <template v-else>
          <OrderCard v-if="monthOrders" :data="monthOrders" />
          <OrderCard v-if="yearOrders" :data="yearOrders" />
        </template>
      </div>
    </section>

    <section class="section weather-report" v-if="weatherReport">
      <div class="alert-card danger-alert" @click="openDrawer(weatherReport.worstPrice.product, 'deviation')">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <span class="alert-title">高危预警：{{ weatherReport.worstPrice.product }}</span>
          <span class="alert-desc">当日均价大幅跳水，偏差率达 <b>{{ weatherReport.worstPrice.deviationRateText }}</b>，存在利润击穿风险。</span>
        </div>
        <div class="alert-action">查看诊断 →</div>
      </div>

      <div class="alert-card success-alert" @click="openDrawer(weatherReport.bestTrend.product, 'trend')">
        <div class="alert-icon">🚀</div>
        <div class="alert-content">
          <span class="alert-title">利好情报：{{ weatherReport.bestTrend.product }}</span>
          <span class="alert-desc">呈现量价齐升态势 (销量 {{ formatPct(weatherReport.bestTrend.volumeChange) }}，价格 {{ formatPct(weatherReport.bestTrend.priceChange) }})。</span>
        </div>
        <div class="alert-action">查看诊断 →</div>
      </div>
    </section>

    <section class="section strategic-zone">
      <div class="quadrant-card">
        <div class="card-header">
          <h2>产品战略四象限矩阵</h2>
          <span class="header-tip">点击气泡查看量价走势</span>
        </div>
        <div class="quadrant-body">
          <LoadingSkeleton v-if="trendLoading" height="400px" />
          <div v-else ref="quadrantChartRef" class="quadrant-chart"></div>
        </div>
      </div>

      <div class="assets-card">
        <div class="card-header">
          <h2>核心资产异动监控</h2>
        </div>
        <div class="assets-grid">
          <LoadingSkeleton v-if="trendLoading" height="100%" />
          <template v-else>
            <div 
              v-for="item in trends" 
              :key="item.product"
              class="asset-mini-card"
              @click="openDrawer(item.product, 'trend')"
            >
              <div class="asset-top">
                <span class="asset-name">{{ item.product }}</span>
                <span class="asset-price">¥{{ item.latestPrice.toLocaleString('zh-CN') }}</span>
              </div>
              <div class="asset-mid">
                <span class="asset-tag" :style="{ color: getStatusColor(item.volumeChange), background: getStatusColor(item.volumeChange)+'15' }">
                  量 {{ formatPct(item.volumeChange) }}
                </span>
                <span class="asset-tag" :style="{ color: getStatusColor(item.priceChange), background: getStatusColor(item.priceChange)+'15' }">
                  价 {{ formatPct(item.priceChange) }}
                </span>
              </div>
              <svg class="asset-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                <polyline
                  :points="item.trend.map((p, i) => {
                    const minV = Math.min(...item.trend.map(t => t.volume)); const maxV = Math.max(...item.trend.map(t => t.volume));
                    const x = i / (item.trend.length - 1) * 98 + 1;
                    const y = maxV === minV ? 12 : 22 - (p.volume - minV) / (maxV - minV) * 20;
                    return `${x},${y}`
                  }).join(' ')"
                  fill="none" :stroke="item.correlation >= 0 ? '#3b82f6' : '#94a3b8'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                />
              </svg>
            </div>
          </template>
        </div>
      </div>
    </section>

    <section class="section details-zone">
      <div class="details-card">
        <div class="details-header">
          <h2 class="details-title">底层数据明细台账</h2>
          <div class="tabs-container">
            <button class="tab-btn" :class="{ active: activeTab === 'deviation' }" @click="activeTab = 'deviation'">
              价格偏差台账
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'trend' }" @click="activeTab = 'trend'">
              销售趋势台账
            </button>
          </div>
        </div>
        
        <div class="details-body">
          <Transition name="fade-slide" mode="out-in">
            <div v-if="activeTab === 'deviation'" class="table-wrapper" key="dev-table">
              <LoadingSkeleton v-if="loading" height="400px" />
              <PriceDeviationTable 
                v-else 
                :data="priceDeviations" 
                :selected-product="selectedProduct"
                @select="(p) => openDrawer(p, 'deviation')" 
              />
            </div>
            <div v-else-if="activeTab === 'trend'" class="table-wrapper" key="trend-table">
              <LoadingSkeleton v-if="trendLoading" height="400px" />
              <SalesTrendTable 
                v-else 
                :data="trends" 
                :selected-product="selectedTrend?.product ?? ''"
                @select="(p) => openDrawer(p, 'trend')" 
              />
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDrawer" class="drawer-overlay" @click="showDrawer = false"></div>
      </Transition>
      
      <Transition name="slide-right">
        <div v-if="showDrawer" class="exec-drawer">
          <div class="drawer-header">
            <div>
              <h2 class="drawer-title">{{ selectedProduct }} · 深度诊断图表</h2>
              <p class="drawer-sub">
                {{ drawerType === 'trend' ? '核心走势还原 (量价对比)' : '价格异动排查 (均价偏移量)' }}
              </p>
            </div>
            <button class="drawer-close" @click="showDrawer = false">✕ 收起</button>
          </div>
          
          <div class="drawer-body">
            <div class="drawer-chart-box">
              <SalesTrendChart v-if="drawerType === 'trend' && selectedTrend" :product="selectedTrend" />
              <PriceDeviationChart v-else-if="drawerType === 'deviation'" :data="priceDeviations" :selected-product="selectedProduct" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.dashboard-executive {
  --bg-color: #f4f7fb;
  --card-bg: #ffffff;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --border-color: #e2e8f0;
  
  min-height: 100vh;
  background: var(--bg-color);
  padding: 24px 32px 60px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 顶部控制台 */
.exec-header {
  display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;
}
.header-titles h1 { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0; }
.subtitle { font-size: 14px; color: var(--text-sub); margin: 0; text-transform: uppercase; letter-spacing: 1px; }
.refresh-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px;
  background: var(--card-bg); border: 1px solid var(--border-color);
  color: var(--text-main); font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.refresh-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 宏观指标区 (含订单) */
.metrics-zone {
  display: grid;
  /* grid-template-columns: minmax(0, 260px) minmax(0, 260px) minmax(0, 260px) 1fr; */
  grid-template-columns: 0.75fr 0.75fr 0.75fr 0.95fr;
  gap: 20px;
  margin-bottom: 24px;
  align-items: stretch;
}
.order-col { display: flex; flex-direction: column; justify-content: space-between; gap: 12px; height: 100%; }

/* 智能战况播报 */
.weather-report { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.alert-card {
  display: flex; align-items: center; gap: 16px; padding: 18px 24px; border-radius: 12px;
  cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
}
.alert-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.06); }
.danger-alert { background: #fef2f2; border: 1px solid #fecaca; }
.success-alert { background: #f0fdf4; border: 1px solid #bbf7d0; }
.alert-icon { font-size: 24px; }
.alert-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.alert-title { font-size: 16px; font-weight: 700; color: var(--text-main); }
.alert-desc { font-size: 13px; color: var(--text-sub); line-height: 1.4; }
.danger-alert .alert-title { color: #b91c1c; }
.success-alert .alert-title { color: #15803d; }
.alert-action { font-size: 13px; font-weight: 600; opacity: 0.6; }

/* 战略区 (四象限 + 资产网格) */
.strategic-zone { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; margin-bottom: 24px; }
.quadrant-card, .assets-card {
  background: var(--card-bg); border-radius: 16px; padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column;
}
.card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.card-header h2 { font-size: 18px; font-weight: 700; margin: 0; }
.header-tip { font-size: 12px; color: var(--text-sub); }
.quadrant-body { flex: 1; min-height: 400px; }
.quadrant-chart { width: 100%; height: 420px; }

/* 资产小卡片 */
.assets-card .card-header { margin-bottom: 20px; }
.assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; align-content: start; }
.asset-mini-card {
  background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 14px;
  cursor: pointer; transition: all 0.2s;
}
.asset-mini-card:hover { background: #ffffff; border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,0.1); transform: translateY(-2px); }
.asset-top { display: flex; justify-content: space-between; margin-bottom: 10px; }
.asset-name { font-weight: 700; font-size: 14px; }
.asset-price { font-weight: 800; font-size: 13px; }
.asset-mid { display: flex; gap: 6px; margin-bottom: 10px; }
.asset-tag { padding: 3px 6px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.asset-sparkline { width: 100%; height: 26px; }

/* ============================================== */
/* 数据明细台账区 (新)                                */
/* ============================================== */
.details-card {
  background: var(--card-bg); border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 20px;
}
.details-header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 16px;
}
.details-title { font-size: 18px; font-weight: 700; margin: 0; }
.tabs-container {
  display: flex; background: #f1f5f9; padding: 4px; border-radius: 8px; gap: 4px;
}
.tab-btn {
  padding: 6px 16px; border: none; background: transparent; border-radius: 6px;
  font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s;
}
.tab-btn:hover { color: #0f172a; }
.tab-btn.active { background: #ffffff; color: #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.table-wrapper { width: 100%; min-height: 400px; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.25s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* 抽屉区 */
.drawer-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 999;
}
.exec-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 680px; max-width: 100vw;
  background: #f8fafc; box-shadow: -10px 0 30px rgba(0,0,0,0.15); z-index: 1000; display: flex; flex-direction: column;
}
.drawer-header {
  padding: 24px 32px; background: #ffffff; border-bottom: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
}
.drawer-title { font-size: 22px; font-weight: 800; margin: 0 0 6px 0; }
.drawer-sub { font-size: 13px; color: var(--text-sub); margin: 0; }
.drawer-close {
  padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 8px;
  font-weight: 600; color: var(--text-sub); cursor: pointer; transition: all 0.2s;
}
.drawer-close:hover { background: #e2e8f0; color: var(--text-main); }
.drawer-body { flex: 1; padding: 32px; overflow-y: auto; }
.drawer-chart-box { background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }

/* 响应式 */
@media (max-width: 1200px) {
  .metrics-zone { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
  .metrics-zone > :nth-child(3) { grid-column: 1 / 2; }
  .order-col { grid-column: 2 / 3; grid-row: 2 / 3; flex-direction: row; }
  .strategic-zone { grid-template-columns: 1fr; } 
}
@media (max-width: 768px) {
  .dashboard-executive { padding: 16px 16px 40px; }
  .exec-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .metrics-zone { grid-template-columns: 1fr; }
  .metrics-zone > :nth-child(3), .order-col { grid-column: auto; grid-row: auto; }
  .weather-report { grid-template-columns: 1fr; }
  .exec-drawer { width: 100%; }
}
</style>