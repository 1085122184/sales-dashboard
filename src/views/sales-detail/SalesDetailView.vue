<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getSalesCompanies, getSalesCompanyDetail } from '@/api/dashboard-api'
import type { CompanySummaryMetric, CompanyDetailData } from '@/types/index'
import BaseEChart from '@/components/charts/BaseEChart.vue'
import ProductDetailDrawer from './components/ProductDetailDrawer.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ChartSkeleton } from '@/components'

// 🌟 引入刚拆分出来的四个核心模块
import DetailTopBar from '@/components/business/DetailTopBar.vue'
import DetailBanner from './components/DetailBanner.vue'
import CompanySidebar from '@/components/business/CompanySidebar.vue'
import ProductStructureTable from './components/ProductStructureTable.vue'

echarts.use([BarChart, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])

// 🌟 使用响应式断点检测替代非响应式的 isMobile()
const { isMaxMd } = useBreakpoint()

const route  = useRoute()

const pageTitle  = ref(route.query.cleanTitle || '明细数据')
const detailType = ref((route.query.type as string) || 'amount')
const targetDate = ref((route.query.date as string) || '2025-06-15')
const yesterday = dayjs(targetDate.value).subtract(1, 'day').format('YYYY-MM-DD')

const unit       = computed(() => detailType.value === 'volume' ? '吨' : '万')
const metricName = computed(() => detailType.value === 'volume' ? '销量' : '销售额')

const loading       = ref(true)
const detailLoading = ref(false)
const companyList   = ref<CompanySummaryMetric[]>([])
const currentDetail = ref<CompanyDetailData | null>(null)
const selectedId    = ref(0)
const sidebarOpen   = ref(false)
// 🌟 抽屉状态与数据
const showProductDrawer = ref(false)
const selectedProductCode = ref('')
const selectedProductName = ref('')

const currentCompany = computed(() => companyList.value[selectedId.value] ?? null)

// 🌟 删除本地 isMobile()，使用响应式的 isMaxMd

// 🌟 处理柱状图点击事件
function handleProductClick(params: any) {
  // params 里面装了刚才点击那个条形图的所有上下文信息
  if (!params || !params.name) return
  
  selectedProductCode.value = params.data.productCode
  // params.name 就是产品的名字，比如 "氟硅橡胶"
  selectedProductName.value = params.name
  // 弹出我们刚才写好的高大上 L3 抽屉
  showProductDrawer.value = true 
}

// ── API 数据抓取逻辑 ──
// 公司固定排序顺序
const COMPANY_ORDER = ['绿冷', '高分子', '氟硅', '有机硅']

async function fetchCompanyList() {
  loading.value = true
  try {
    const companies = await getSalesCompanies(detailType.value, targetDate.value)
    // 按照固定顺序排序: 绿冷 > 高分子 > 氟硅 > 有机硅
    companyList.value = companies.sort((a, b) => {
      const indexA = COMPANY_ORDER.findIndex(name => a.companyName.includes(name))
      const indexB = COMPANY_ORDER.findIndex(name => b.companyName.includes(name))
      // 如果公司名称不在固定列表中,保持在原位置
      const orderA = indexA === -1 ? COMPANY_ORDER.length : indexA
      const orderB = indexB === -1 ? COMPANY_ORDER.length : indexB
      return orderA - orderB
    })
  } finally { loading.value = false }

  if (companyList.value.length > 0) await handleSelectCompany(0)
}

async function handleSelectCompany(idx: number) {
  selectedId.value = idx
  const targetCompany = companyList.value[idx]
  if (!targetCompany?.companyName) return

  detailLoading.value = true
  try {
    currentDetail.value = await getSalesCompanyDetail(targetCompany.companyName, detailType.value, targetDate.value, targetCompany.target)
  } finally { detailLoading.value = false }
}

const trendChartHeight = computed(() => isMaxMd.value ? '220px' : '320px')
// ── ECharts 配置逻辑 ──
const productChartHeight = computed(() => {
  if (!currentDetail.value) return '220px'
  const productCount = new Set(currentDetail.value.products.map(p => p.productName)).size
  return `${Math.max(220, productCount * (isMaxMd.value ? 40 : 50) + 80)}px`
})
// 🌟 1. 产品结构图表 (全部取整)
const productChartOption = computed(() => {
  if (!currentDetail.value) return {}
  const mobile = isMaxMd.value
  const productMap = new Map<string, { code: string; name: string; domestic: number; intl: number; total: number }>()
  
  currentDetail.value.products.forEach(p => {
    if (!productMap.has(p.productCode)) {
      productMap.set(p.productCode, { code: p.productCode, name: p.productName, domestic: 0, intl: 0, total: 0 })
    }
    const item = productMap.get(p.productCode)!
    if (p.region === '国外') item.intl += p.value; else item.domestic += p.value 
    item.total += p.value
  })

  const sorted = Array.from(productMap.values()).sort((a, b) => a.total - b.total)
  
  return {
    backgroundColor: 'transparent',
    grid: { left: '2%', right: mobile ? '10%' : '14%', bottom: 40, top: 20, containLabel: true },
    legend: { data: ['国内', '国外'], bottom: 0, icon: 'circle', itemWidth: 10, textStyle: { color: '#64748b', fontSize: mobile ? 11 : 13 } },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: '#fff', borderColor: '#eef2f6', textStyle: { color: '#1e293b', fontSize: 13 },
      formatter: (params: any[]) => {
        let html = `<b style="font-size:14px">${params[0].name}</b><br/>`
        let sum = 0
        params.forEach(p => {
          if (p.value > 0) {
            // 🌟 tooltip 的具体数值强转整数
            html += `<div style="display:flex; justify-content:space-between; margin-top:6px; min-width: 120px;">
                       <span>${p.marker} ${p.seriesName}</span><b style="color:#3182ce; margin-left: 12px;">${Math.round(p.value).toLocaleString()} ${unit.value}</b>
                     </div>`
            sum += p.value
          }
        })
        // 🌟 tooltip 的合计数值强转整数
        return html + `<div style="border-top:1px dashed #e2e8f0; margin-top:8px; padding-top:6px; display:flex; justify-content:space-between;"><span style="color:#64748b">总计</span><b style="color:#1e293b">${Math.round(sum).toLocaleString()} ${unit.value}</b></div>`
      }
    },
    // 🌟 X轴强转整数，避免出现小数刻度
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#94a3b8', fontSize: mobile ? 10 : 13, formatter: (val: number) => Math.round(val) }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'category', data: sorted.map(d => d.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#334155', fontSize: mobile ? 11 : 14, fontWeight: 500, interval: 0, width: mobile ? 70 : 100, overflow: 'truncate' } },
    series: [
      // 🌟 数据传给 ECharts 时全部 Math.round 取整
      { name: '国内', type: 'bar', stack: 'total', barWidth: mobile ? 14 : 22, itemStyle: { color: '#3182ce', borderRadius: 0 }, data: sorted.map(d => ({ value: Math.round(d.domestic), productCode: d.code })) },
      { name: '国外', type: 'bar', stack: 'total', barWidth: mobile ? 14 : 22, itemStyle: { color: '#93c5fd', borderRadius: [0, 6, 6, 0] }, data: sorted.map(d => ({ value: Math.round(d.intl), productCode: d.code })),label: { show: !mobile, position: 'right', color: '#64748b', fontSize: 13, fontWeight: 'bold', formatter: (p: any) => sorted[p.dataIndex].total > 0 ? `${Math.round(sorted[p.dataIndex].total)}${unit.value}` : '' } }
    ]
  }
})

// 🌟 2. 目标趋势图表 (全部取整)
const trendChartOption = computed(() => {
  if (!currentDetail.value || !currentCompany.value) return {}
  const c = currentCompany.value
  
  // 🌟 数据洗脱时直接全部 Math.round 取整
  const daily = (currentDetail.value.dailySales || []).map(v => Math.round(Number(v) || 0))
  const mobile = isMaxMd.value
  const daysXAxis = Array.from({ length: new Date(new Date(yesterday).getFullYear(), new Date(yesterday).getMonth() + 1, 0).getDate() }, (_, i) => `${i + 1}日`)

  let sum = 0
  const cumulativeData = currentDetail.value.dailySales.map(val => {
    sum += Number(val) || 0
    return Math.round(sum) // 累计也取整
  })
  // 理想进度线也取整
  const idealPaceData = Array.from({ length: daysXAxis.length }, (_, i) => Math.round((c.target / daysXAxis.length) * (i + 1)))

  const primaryColor = c.isAlert ? '#f56565' : '#3182ce'
  const barColor = c.isAlert ? '#fca5a5' : '#93c5fd'

  return {
    backgroundColor: 'transparent',
    grid: { left: 24, right: 24, top: mobile ? 40 : 50, bottom: 20, containLabel: true },
    tooltip: { 
      trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: '#fff', borderColor: '#eef2f6', textStyle: { color: '#1e293b', fontSize: 13 },
      // 🌟 增加定制 formatter 强制显示千分位整数
      formatter: (params: any[]) => {
        let html = `<div style="font-weight:700;margin-bottom:6px;color:#1e293b">${params[0].name}</div>`
        params.forEach(p => {
          html += `<div style="line-height:1.8;font-size:12px;"><span style="display:inline-block;width:8px;height:8px;border-radius:${p.seriesName === '当日销量' ? '2px' : '50%'};background:${p.color};margin-right:6px"></span>${p.seriesName}：<b style="color:#1e293b">${Math.round(p.value).toLocaleString()} ${unit.value}</b></div>`
        })
        return html
      }
    },
    legend: { top: 0, right: 0, data: ['当日销量', '累计达成', '理想目标进度'], itemWidth: 14, itemHeight: 8, textStyle: { color: '#475569', fontSize: mobile ? 11 : 13, fontWeight: 500 } },
    xAxis: { type: 'category', data: daysXAxis, axisLine: { lineStyle: { color: '#eef2f6' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: mobile ? 10 : 13 } },
    yAxis: [
      { 
        type: 'value', name: `单日(${unit.value})`, position: 'left', minInterval: 1, // 🌟 强制刻度为整数
        nameTextStyle: { color: '#64748b', fontSize: mobile ? 10 : 13, align: 'right', padding: [0, 10, 0, 0] }, 
        axisLabel: { color: '#94a3b8', fontSize: mobile ? 10 : 13, formatter: (val: number) => Math.round(val) }, // 🌟 标签强转整数
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } 
      },
      { 
        type: 'value', name: `累计(${unit.value})`, position: 'right', minInterval: 1, 
        nameTextStyle: { color: '#64748b', fontSize: mobile ? 10 : 13, align: 'left', padding: [0, 0, 0, 10] }, 
        axisLabel: { color: '#94a3b8', fontSize: mobile ? 10 : 13, formatter: (val: number) => Math.round(val) }, 
        splitLine: { show: false }, min: 0, max: Math.ceil(Math.max(c.target, c.value) * 1.1) 
      }
    ],
    series: [
      { name: '当日销量', type: 'bar', yAxisIndex: 0, data: daily, barWidth: '45%', itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] } },
      { name: '理想目标进度', type: 'line', yAxisIndex: 1, data: idealPaceData, symbol: 'none', lineStyle: { color: '#cbd5e1', type: 'dashed', width: 2.5 }, itemStyle: { color: '#cbd5e1' } },
      { name: '累计达成', type: 'line', yAxisIndex: 1, data: cumulativeData, smooth: true, symbol: 'circle', symbolSize: mobile ? 5 : 7, lineStyle: { color: primaryColor, width: 3.5 }, itemStyle: { color: primaryColor }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [ { offset: 0, color: c.isAlert ? 'rgba(245,101,101,0.15)' : 'rgba(49,130,206,0.15)' }, { offset: 1, color: 'rgba(255,255,255,0)' } ] } } }
    ]
  }
})

onMounted(() => fetchCompanyList())
</script>

<template>
  <div class="exec-dash">
    
    <DetailTopBar :pageTitle="pageTitle as string" :metricName="metricName" :yesterday="yesterday" />

    <DetailBanner v-if="!loading && currentCompany" :company="currentCompany" :unit="unit" :yesterday="yesterday" mode="sales" />

    <div class="body-wrap">
      <button v-if="!loading" class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? '✕' : '☰ 公司' }}
      </button>

      <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

      <CompanySidebar 
        v-if="!loading" 
        :companyList="companyList" 
        v-model:selectedId="selectedId" 
        v-model:sidebarOpen="sidebarOpen"
        :unit="unit" 
        @change="handleSelectCompany" 
      />

      <main class="canvas" v-if="!loading">
        <!-- 加载中：显示骨架屏 -->
        <template v-if="detailLoading">
          <div class="skeleton-grid">
            <ChartSkeleton height="300px" :show-legend="false" />
            <ChartSkeleton height="350px" :show-legend="true" />
          </div>
        </template>
        <!-- 有数据：显示真实内容 -->
        <div v-else-if="currentDetail && currentCompany" class="viz-container" :key="currentCompany.companyName">
          <div class="viz-card">
            <div class="card-hd">
              <h3>{{ currentCompany.companyName }} · 目标追踪与{{ metricName }}趋势</h3>
              <div class="trend-meta">
                <span class="tm-item">目标进度 <b :class="currentCompany.isAlert ? 'c-red' : 'c-blue'">{{ (currentCompany.value / currentCompany.target * 100).toFixed(1) }}%</b></span>
                <span class="tm-sep">·</span>
                <span class="tm-item">日均产出 <b class="c-muted">{{ (currentCompany.value / new Date(yesterday).getDate()).toFixed(1) }} {{ unit }}</b></span>
              </div>
            </div>
            <BaseEChart :option="trendChartOption" :height="trendChartHeight" class="chart-trend" />
          </div>

          <div class="viz-card">
            <div class="card-hd">
              <h3>{{ currentCompany.companyName }} · 产品{{ metricName }}结构明细</h3>
              <span class="chip" :class="currentCompany.isAlert ? 'chip-red' : ''">核心产品排位</span>
            </div>
            <BaseEChart :option="productChartOption" :height="productChartHeight" class="chart-product" @click="handleProductClick"/>
            <ProductStructureTable :detailData="currentDetail" :unit="unit" :metricName="metricName" />
          </div>
        </div>
        <!-- 无数据：显示空状态 -->
        <div v-else class="empty-state">
          <p>请选择一个公司查看详情</p>
        </div>
      </main>
    </div>

    <div v-if="loading" class="loading-screen">
      <div class="spin"></div><p>构建决策视图中…</p>
    </div>

    <Teleport to="body">
      <ProductDetailDrawer 
        v-if="showProductDrawer" 
        :productCode="selectedProductCode" 
        :product-name="selectedProductName" 
        :company-name="currentCompany?.companyName || ''" 
        :yesterday="yesterday" 
        @close="showProductDrawer = false"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.viz-container { display: flex; flex-direction: column; gap: 24px; width: 100%; }
.skeleton-grid { display: flex; flex-direction: column; gap: 24px; width: 100%; }
.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 400px; }
.empty-state p { font-size: 16px; color: #94a3b8; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.exec-dash { height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; color: #1e293b; font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }

.body-wrap { flex: 1; display: flex; overflow: hidden; position: relative; }
.sidebar-toggle  { display: none; }
.sidebar-overlay { display: none; }

.canvas { flex: 1; padding: 26px 30px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; background: #f5f7fa; min-width: 0; }
.viz-card { background: #fff; border-radius: 20px; padding: 28px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.card-hd  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
.card-hd h3 { font-size: 18px; font-weight: 800; color: #1e293b; }
.chip     { font-size: 13px; font-weight: 600; background: #eff6ff; color: #3182ce; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 6px; flex-shrink: 0; }
.chip-red { background: #fff5f5; color: #f56565; border-color: #fecaca; }

.chart-trend   { width: 100%; }
.chart-product { width: 100%; }

.trend-meta { display: flex; align-items: center; gap: 10px; }
.tm-item { font-size: 14px; color: #64748b; }
.tm-item b { font-weight: 700; margin-left: 6px; font-size: 15px; }
.tm-sep  { color: #e2e8f0; }
.c-red   { color: #f56565 !important; }
.c-blue  { color: #3182ce !important; }
.c-muted { color: #94a3b8 !important; }

.detail-loading-box { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; border-radius: 20px; min-height: 400px; gap: 16px; }
.detail-loading-box p { font-size: 15px; color: #64748b; }
.detail-loading-box b { color: #3182ce; }
.loading-screen { position: fixed; inset: 0; background: #f5f7fa; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 999; }
.spin { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #3182ce; border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-screen p { font-size: 15px; font-weight: 500; color: #94a3b8; }

@media (max-width: 1023px) {
  .canvas { padding: 16px 18px; gap: 16px; }
  .viz-card { padding: 20px 22px; border-radius: 14px; }
}

@media (max-width: 767px) {
  .sidebar-overlay {
    display: block; position: absolute; inset: 0;
    background: rgba(0,0,0,0.35); z-index: 199;
  }
  .sidebar-toggle {
    display: flex; align-items: center;
    position: absolute; top: 12px; left: 12px; z-index: 198;
    padding: 6px 12px; background: #fff; border: 1px solid #e2e8f0;
    border-radius: 8px; font-size: 13px; font-weight: 600; color: #334155;
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .canvas { padding: 50px 12px 16px; gap: 12px; width: 100%; }
  .viz-card { padding: 14px 14px; border-radius: 12px; }
  .card-hd { margin-bottom: 12px; }
  .card-hd h3 { font-size: 14px; }
}
</style>