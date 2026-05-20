<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import BaseEChart from '@/components/charts/BaseEChart.vue'
import DetailTopBar from '@/components/business/DetailTopBar.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useGlobalStore } from '@/store/useGlobalStore'
import {
  getProductionEnergyDetails,
  getProductionHighRiskWorkDetails,
  getProductionOutputDetails,
  getProductionRawConsumptionDetails,
  getProductionStartupShutdownDetails,
  getProductionToxicGasDetails,
  getProductionTransportDetails,
  getProductionWasteDetails,
  getProductionWaterGasDetails,
  getProductionWorkbench,
} from '@/api/production-api'
import type {
  ProductionDetailPage,
  ProductionDetailType,
  ProductionEnergyDetail,
  ProductionHighRiskWorkDetail,
  ProductionMetric,
  ProductionOutputDetail,
  ProductionRawConsumptionDetail,
  ProductionStartupShutdownDetail,
  ProductionToxicGasDetail,
  ProductionTransportDetail,
  ProductionWasteDetail,
  ProductionWaterGasDetail,
  ProductionWorkbench,
  ProductionWorkbenchCard,
} from '@/types'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

type DetailRow =
  | ProductionOutputDetail
  | ProductionRawConsumptionDetail
  | ProductionTransportDetail
  | ProductionEnergyDetail
  | ProductionStartupShutdownDetail
  | ProductionHighRiskWorkDetail
  | ProductionToxicGasDetail
  | ProductionWasteDetail
  | ProductionWaterGasDetail

type Column = readonly [string, string]

interface DetailConfig {
  label: string
  title: string
  metricName: string
  unit: string
  primaryLabel: string
  secondaryLabel: string
  thirdLabel: string
  placeholder: string
  columns: Column[]
}

const route = useRoute()
const router = useRouter()
const { isMaxMd } = useBreakpoint()
const store = useGlobalStore()

const detailTypes: ProductionDetailType[] = [
  'output',
  'raw',
  'transport',
  'energy',
  'startupShutdown',
  'highRisk',
  'toxicGas',
  'waste',
  'waterGas',
]

const detailConfig: Record<ProductionDetailType, DetailConfig> = {
  output: {
    label: '产量明细',
    title: '总产量',
    metricName: '产量',
    unit: '吨',
    primaryLabel: '产量',
    secondaryLabel: '物料组数',
    thirdLabel: '工厂数',
    placeholder: '搜索物料、工作中心',
    columns: [
      ['postingDate', '过账日期'],
      ['company', '公司'],
      ['materialName', '物料'],
      ['materialGroupName', '物料组'],
      ['workCenter', '工作中心'],
      ['output', '产量'],
    ],
  },
  raw: {
    label: '原料消耗',
    title: '原料消耗',
    metricName: '消耗',
    unit: '吨',
    primaryLabel: '消耗量',
    secondaryLabel: '原料数',
    thirdLabel: '工作中心数',
    placeholder: '搜索物料、订单、批次',
    columns: [
      ['postingDate', '过账日期'],
      ['factoryName', '工厂'],
      ['materialName', '物料'],
      ['materialGroupName', '物料组'],
      ['workCenterName', '工作中心'],
      ['orderNo', '订单'],
      ['batchNo', '批次'],
      ['quantity', '数量'],
      ['unit', '单位'],
    ],
  },
  transport: {
    label: '车辆运输',
    title: '吞吐量车辆数',
    metricName: '吞吐',
    unit: '吨',
    primaryLabel: '吞量',
    secondaryLabel: '吐量',
    thirdLabel: '车辆数',
    placeholder: '搜索车牌、物料、客户',
    columns: [
      ['weighingDate', '过磅日期'],
      ['category', '分类'],
      ['plateNo', '车牌号'],
      ['materialName', '物料'],
      ['customerName', '客户'],
      ['carrier', '承运商'],
      ['grossWeight', '毛重'],
      ['tareWeight', '皮重'],
      ['netWeight', '净重'],
    ],
  },
  energy: {
    label: '能源消耗',
    title: '能源消耗',
    metricName: '能源',
    unit: '',
    primaryLabel: '点位数',
    secondaryLabel: '介质数',
    thirdLabel: '累积量',
    placeholder: '搜索介质、点位、区域、公司',
    columns: [
      ['postingDate', '过账日期'],
      ['medium', '介质'],
      ['point', '点位'],
      ['pointStatus', '点位状态'],
      ['cumulativeValue', '累积量'],
      ['area', '区域'],
      ['company', '公司'],
      ['companyCode', '公司编码'],
    ],
  },
  startupShutdown: {
    label: '开停车',
    title: '开停车',
    metricName: '开停车',
    unit: '次',
    primaryLabel: '开车数',
    secondaryLabel: '停车数',
    thirdLabel: '总数',
    placeholder: '搜索公司、装置、指标',
    columns: [
      ['time', '时间'],
      ['company', '公司'],
      ['device', '装置'],
      ['dev', 'DEV'],
      ['standard', '标准'],
      ['sort', '排序'],
      ['value', '值'],
    ],
  },
  highRisk: {
    label: '高危作业',
    title: '安全',
    metricName: '安全',
    unit: '日',
    primaryLabel: '高危作业',
    secondaryLabel: '整改率',
    thirdLabel: '有毒报警',
    placeholder: '搜索公司',
    columns: [
      ['workDate', '作业日期'],
      ['companyName', '公司名称'],
      ['workCount', '作业数'],
    ],
  },
  toxicGas: {
    label: '有毒气体',
    title: '安全',
    metricName: '安全',
    unit: '次',
    primaryLabel: '高危作业',
    secondaryLabel: '整改率',
    thirdLabel: '有毒报警',
    placeholder: '搜索公司',
    columns: [
      ['alarmDate', '报警日期'],
      ['company', '公司'],
      ['alarmCount', '报警数'],
    ],
  },
  waste: {
    label: '危废产生',
    title: '危废产生',
    metricName: '危废',
    unit: '吨',
    primaryLabel: '产生量',
    secondaryLabel: '危废代码数',
    thirdLabel: '危废名称数',
    placeholder: '搜索公司、危废代码、危废名称',
    columns: [
      ['postingDate', '过账日期'],
      ['companyCode', '公司编码'],
      ['companyName', '公司名称'],
      ['company', '公司'],
      ['wasteCode', '危废代码'],
      ['wasteName', '危废名称'],
      ['output', '产生量'],
    ],
  },
  waterGas: {
    label: '废气废水',
    title: '废气废水',
    metricName: '异常点',
    unit: '个',
    primaryLabel: '异常点',
    secondaryLabel: '废气点',
    thirdLabel: '废水点',
    placeholder: '搜索点位、子点位、指标',
    columns: [
      ['pointCode', '点位编码'],
      ['pointName', '点位名称'],
      ['subName', '子点位'],
      ['itemDesc', '指标描述'],
      ['generateTime', '生成时间'],
      ['groupTime', '集团时间'],
    ],
  },
}

const type = ref<ProductionDetailType>(normalizeType(route.query.type))
const date = ref(String(route.query.date || store.yesterdayStr))
const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const workbenchLoading = ref(false)
const error = ref('')
const workbenchError = ref('')
const rows = ref<Array<Record<string, unknown>>>([])
const total = ref(0)
const workbench = ref<ProductionWorkbench | null>(null)
const selectedScope = ref('')
const sidebarOpen = ref(false)

const currentConfig = computed(() => detailConfig[type.value])
const columns = computed(() => currentConfig.value.columns)
const searchPlaceholder = computed(() => currentConfig.value.placeholder)
const pageTitle = computed(() => workbench.value?.title || currentConfig.value.title)
const yesterday = computed(() => date.value)
const cards = computed(() => workbench.value?.cards || [])
const summary = computed(() => workbench.value?.summary || [])
const rankings = computed(() => workbench.value?.rankings || [])
const trendPoints = computed(() => workbench.value?.dailyTrends || [])
const activeCard = computed(() => cards.value.find(item => item.id === selectedScope.value) || cards.value[0] || null)
const selectedScopeLabel = computed(() => selectedScope.value || activeCard.value?.name || '全部')
const timeline = computed(() => workbench.value?.timeline)

const chartHeight = computed(() => isMaxMd.value ? '260px' : '330px')
const rankChartHeight = computed(() => {
  const count = Math.max(5, rankings.value.length)
  return `${Math.min(520, Math.max(280, count * (isMaxMd.value ? 34 : 38) + 90))}px`
})

function normalizeType(value: unknown): ProductionDetailType {
  const text = Array.isArray(value) ? value[0] : value
  return detailTypes.includes(text as ProductionDetailType) ? text as ProductionDetailType : 'output'
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return formatNumber(value)
  return String(value)
}

function formatNumber(value?: number | null, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

function formatMetric(metric?: ProductionMetric | null): string {
  if (!metric) return '-'
  const value = formatNumber(metric.value)
  return value === '-' ? '-' : `${value}${metric.unit || ''}`
}

function metricUnit(metric?: ProductionMetric | null): string {
  return metric?.unit || ''
}

function metricValue(metric?: ProductionMetric | null): string {
  return formatNumber(metric?.value)
}

function cardMetric(card: ProductionWorkbenchCard | null, index: number): ProductionMetric | null {
  return card?.metrics?.[index] || null
}

async function loadByType(params: { date: string; keyword?: string; page: number; pageSize: number }): Promise<ProductionDetailPage<DetailRow>> {
  if (type.value === 'raw') return getProductionRawConsumptionDetails(params)
  if (type.value === 'transport') return getProductionTransportDetails(params)
  if (type.value === 'energy') return getProductionEnergyDetails(params)
  if (type.value === 'startupShutdown') return getProductionStartupShutdownDetails(params)
  if (type.value === 'highRisk') return getProductionHighRiskWorkDetails(params)
  if (type.value === 'toxicGas') return getProductionToxicGasDetails(params)
  if (type.value === 'waste') return getProductionWasteDetails(params)
  if (type.value === 'waterGas') return getProductionWaterGasDetails(params)
  return getProductionOutputDetails(params)
}

async function fetchWorkbench(keepScope = true) {
  if (!date.value) return
  workbenchLoading.value = true
  workbenchError.value = ''
  try {
    const scope = keepScope ? selectedScope.value : ''
    const result = await getProductionWorkbench({
      type: type.value,
      date: date.value,
      scope: scope || undefined,
    })
    workbench.value = result
    if (!keepScope) {
      selectedScope.value = ''
    }
  } catch (e) {
    workbenchError.value = e instanceof Error ? e.message : '工作台数据加载失败'
    workbench.value = null
  } finally {
    workbenchLoading.value = false
  }
}

async function fetchTable() {
  if (!date.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await loadByType({
      date: date.value,
      keyword: keyword.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    rows.value = result.list as Array<Record<string, unknown>>
    total.value = result.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '明细数据加载失败'
  } finally {
    loading.value = false
  }
}

function fetchAll(keepScope = true) {
  fetchWorkbench(keepScope)
  fetchTable()
}

function switchType(nextType: ProductionDetailType) {
  if (type.value === nextType) return
  type.value = nextType
  selectedScope.value = ''
  keyword.value = ''
  page.value = 1
  router.replace({ path: '/production-detail', query: { type: nextType, date: date.value } })
  fetchAll(false)
}

function selectScope(card: ProductionWorkbenchCard) {
  const nextScope = card.id || card.name || ''
  if (selectedScope.value === nextScope) return
  selectedScope.value = nextScope
  sidebarOpen.value = false
  fetchWorkbench(true)
}

function clearScope() {
  if (!selectedScope.value) return
  selectedScope.value = ''
  fetchWorkbench(false)
}

function search() {
  page.value = 1
  fetchTable()
}

function prevPage() {
  if (page.value <= 1) return
  page.value -= 1
  fetchTable()
}

function nextPage() {
  if (page.value * pageSize.value >= total.value) return
  page.value += 1
  fetchTable()
}

function trendSeriesMap() {
  const map = new Map<string, { labels: string[]; values: number[] }>()
  trendPoints.value.forEach(point => {
    const series = point.series || '趋势'
    if (!map.has(series)) map.set(series, { labels: [], values: [] })
    const item = map.get(series)!
    item.labels.push(point.label || point.date || '-')
    item.values.push(Number(point.value) || 0)
  })
  return map
}

const trendChartOption = computed(() => {
  const seriesMap = trendSeriesMap()
  const labels = Array.from(new Set(trendPoints.value.map(item => item.label || item.date || '-')))
  if (!labels.length) return {}
  const hasMulti = seriesMap.size > 1
  const palette = ['#3182ce', '#f97316', '#10b981', '#8b5cf6', '#06b6d4', '#ef4444']
  const series = Array.from(seriesMap.entries()).map(([name, item], index) => {
    const valueByLabel = new Map<string, number>()
    item.labels.forEach((label, labelIndex) => valueByLabel.set(label, item.values[labelIndex] || 0))
    const data = labels.map(label => valueByLabel.get(label) || 0)
    const isVehicle = name.includes('车辆')
    const isBar = !hasMulti || isVehicle || name.includes('日产') || name.includes('消耗') || name.includes('产生')
    return {
      name,
      type: isBar ? 'bar' : 'line',
      smooth: true,
      barWidth: isMaxMd.value ? 12 : 18,
      symbol: isBar ? 'none' : 'circle',
      symbolSize: 6,
      data,
      itemStyle: { color: palette[index % palette.length], borderRadius: isBar ? [4, 4, 0, 0] : 0 },
      lineStyle: { width: 3, color: palette[index % palette.length] },
      areaStyle: isBar ? undefined : { opacity: 0.08 },
    }
  })
  return {
    backgroundColor: 'transparent',
    color: palette,
    grid: { left: 18, right: 24, top: hasMulti ? 46 : 28, bottom: 18, containLabel: true },
    legend: {
      show: hasMulti,
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: '#64748b', fontSize: isMaxMd.value ? 11 : 12 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: '#fff',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b', fontSize: 12 },
      valueFormatter: (value: number) => formatNumber(value),
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: isMaxMd.value ? 10 : 12 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: isMaxMd.value ? 10 : 12 },
      splitLine: { lineStyle: { color: '#eef2f6', type: 'dashed' } },
    },
    series,
  }
})

const rankingChartOption = computed(() => {
  if (!rankings.value.length) return {}
  const data = [...rankings.value].slice(0, 12).reverse()
  return {
    backgroundColor: 'transparent',
    grid: { left: 12, right: 36, top: 18, bottom: 20, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b', fontSize: 12 },
      valueFormatter: (value: number) => formatNumber(value),
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: isMaxMd.value ? 10 : 12 },
      splitLine: { lineStyle: { color: '#eef2f6' } },
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name || '-'),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#334155', fontSize: isMaxMd.value ? 10 : 12, width: isMaxMd.value ? 72 : 120, overflow: 'truncate' },
    },
    series: [
      {
        name: currentConfig.value.metricName,
        type: 'bar',
        data: data.map(item => Number(item.value) || 0),
        barWidth: isMaxMd.value ? 12 : 18,
        itemStyle: { color: '#3182ce', borderRadius: [0, 6, 6, 0] },
        label: {
          show: !isMaxMd.value,
          position: 'right',
          color: '#64748b',
          fontSize: 12,
          formatter: (params: { value: number; dataIndex: number }) => {
            const unit = data[params.dataIndex]?.unit || currentConfig.value.unit
            return `${formatNumber(params.value)}${unit || ''}`
          },
        },
      },
    ],
  }
})

const hasTrendChart = computed(() => Object.keys(trendChartOption.value).length > 0)
const hasRankingChart = computed(() => Object.keys(rankingChartOption.value).length > 0)

watch(() => route.query, query => {
  type.value = normalizeType(query.type)
  date.value = String(query.date || store.yesterdayStr)
  selectedScope.value = ''
  keyword.value = ''
  page.value = 1
  fetchAll(false)
})

onMounted(() => fetchAll(false))
</script>

<template>
  <div class="production-workbench">
    <DetailTopBar :pageTitle="pageTitle" :metricName="currentConfig.metricName" :yesterday="yesterday" />

    <section class="workbench-hero">
      <div class="hero-main">
        <div class="crumb">分析主体 <span>●</span> {{ selectedScopeLabel }}</div>
        <h2>{{ selectedScopeLabel }}</h2>
        <div class="hero-metrics">
          <div v-for="item in summary.slice(0, 3)" :key="item.label" class="hero-metric">
            <strong>{{ metricValue(item) }}</strong>
            <span>{{ item.unit }}</span>
            <em>{{ item.label }}</em>
          </div>
          <div v-if="summary.length === 0" class="hero-metric">
            <strong>-</strong>
            <span>{{ currentConfig.unit }}</span>
            <em>{{ currentConfig.metricName }}</em>
          </div>
        </div>
      </div>
      <div class="hero-note">
        <p>当前工作台按所选日期统计，左侧卡片切换分析主体，底部明细表保持分页查询。</p>
        <b v-if="selectedScope">已筛选：{{ selectedScope }}</b>
        <button v-if="selectedScope" @click="clearScope">查看全部</button>
      </div>
      <div class="timeline-panel">
        <div class="timeline-title">月度时间进度 — {{ timeline?.dayOfMonth || '-' }}/{{ timeline?.daysInMonth || '-' }} 日</div>
        <div class="timeline-track">
          <span :style="{ width: Math.min(100, timeline?.progress || 0) + '%' }"></span>
        </div>
        <div class="timeline-meta">
          <span>时间进度 {{ formatNumber(timeline?.progress, 1) }}%</span>
          <strong>今天</strong>
          <span>剩余 {{ timeline?.remainingDays ?? '-' }} 天</span>
        </div>
      </div>
    </section>

    <section class="type-tabs">
      <button
        v-for="item in detailTypes"
        :key="item"
        :class="{ active: type === item }"
        @click="switchType(item)"
      >
        {{ detailConfig[item].label }}
      </button>
    </section>

    <Transition name="fade">
      <div v-if="workbenchError" class="error-bar">{{ workbenchError }}</div>
    </Transition>

    <div class="body-wrap">
      <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? '收起' : '主体' }}
      </button>
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />
      <aside class="subject-sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-title">园区四大公司</div>
        <div v-if="workbenchLoading" class="sidebar-loading">加载中...</div>
        <button
          v-for="card in cards"
          v-else
          :key="card.id || card.name"
          class="subject-card"
          :class="{ active: selectedScope === (card.id || card.name) }"
          @click="selectScope(card)"
        >
          <div class="card-top">
            <strong>{{ card.name || '-' }}</strong>
            <span>{{ formatMetric(cardMetric(card, 0)) }}</span>
          </div>
          <div class="metric-grid">
            <div>
              <em>{{ cardMetric(card, 0)?.label || currentConfig.primaryLabel }}</em>
              <b>{{ metricValue(cardMetric(card, 0)) }}</b>
              <span>{{ metricUnit(cardMetric(card, 0)) }}</span>
            </div>
            <div>
              <em>{{ cardMetric(card, 1)?.label || currentConfig.secondaryLabel }}</em>
              <b>{{ metricValue(cardMetric(card, 1)) }}</b>
              <span>{{ metricUnit(cardMetric(card, 1)) }}</span>
            </div>
            <div>
              <em>{{ cardMetric(card, 2)?.label || currentConfig.thirdLabel }}</em>
              <b>{{ metricValue(cardMetric(card, 2)) }}</b>
              <span>{{ metricUnit(cardMetric(card, 2)) }}</span>
            </div>
          </div>
        </button>
        <div v-if="!workbenchLoading && cards.length === 0" class="sidebar-empty">暂无主体数据</div>
      </aside>

      <main class="canvas">
        <section class="chart-card primary-chart">
          <div class="card-hd">
            <div>
              <h3>{{ selectedScopeLabel }} · 月度趋势</h3>
              <p>{{ date }} 以前的月内累计分析</p>
            </div>
            <span>{{ currentConfig.metricName }}</span>
          </div>
          <div v-if="workbenchLoading" class="chart-loading">加载中...</div>
          <BaseEChart v-else-if="hasTrendChart" :option="trendChartOption" :height="chartHeight" />
          <div v-else class="empty-state">{{ workbench?.emptyReason || '暂无趋势数据' }}</div>
        </section>

        <section class="chart-card">
          <div class="card-hd">
            <div>
              <h3>{{ selectedScopeLabel }} · 结构排行</h3>
              <p>按当前类型的关键维度排序</p>
            </div>
            <span>Top {{ Math.min(rankings.length, 12) }}</span>
          </div>
          <div v-if="workbenchLoading" class="chart-loading">加载中...</div>
          <BaseEChart v-else-if="hasRankingChart" :option="rankingChartOption" :height="rankChartHeight" />
          <div v-else class="empty-state">暂无排行数据</div>
        </section>

        <Transition name="fade">
          <div v-if="error" class="error-bar">{{ error }}</div>
        </Transition>

        <section class="detail-table-card">
          <div class="table-head">
            <div>
              <h3>{{ currentConfig.label }}</h3>
              <p>共 {{ total }} 条，按所选日期查询</p>
            </div>
            <div class="search-box">
              <input v-model="keyword" :placeholder="searchPlaceholder" @keyup.enter="search" />
              <button @click="search">查询</button>
            </div>
          </div>

          <div v-if="loading" class="loading">加载中...</div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="[key, label] in columns" :key="key">{{ label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in rows" :key="index">
                  <td v-for="[key] in columns" :key="key" :class="{ number: typeof row[key] === 'number' }">
                    {{ formatCell(row[key]) }}
                  </td>
                </tr>
                <tr v-if="rows.length === 0">
                  <td :colspan="columns.length" class="empty-cell">暂无明细数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="pager">
          <span>共 {{ total }} 条</span>
          <button :disabled="page <= 1 || loading" @click="prevPage">上一页</button>
          <span>第 {{ page }} 页</span>
          <button :disabled="page * pageSize >= total || loading" @click="nextPage">下一页</button>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; }
.production-workbench {
  background: #f5f7fa;
  color: #1e293b;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}
.workbench-hero {
  align-items: stretch;
  background: #fff;
  border-bottom: 1px solid #eef2f6;
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(280px, 1fr) minmax(260px, 360px) minmax(300px, 520px);
  padding: 24px 42px 26px;
}
.crumb {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
}
.crumb span { color: #1e293b; margin: 0 4px; }
.hero-main h2 {
  color: #0f172a;
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0 0 12px;
}
.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 28px;
}
.hero-metric {
  align-items: baseline;
  display: flex;
  gap: 7px;
  min-width: 120px;
}
.hero-metric strong {
  color: #0f172a;
  font-size: 22px;
  font-weight: 800;
}
.hero-metric span {
  color: #94a3b8;
  font-size: 13px;
}
.hero-metric em {
  color: #64748b;
  font-size: 13px;
  font-style: normal;
}
.hero-note {
  border: 1px solid #9bd3ff;
  border-radius: 8px;
  color: #334155;
  font-size: 12px;
  line-height: 1.65;
  padding: 16px 18px;
}
.hero-note p { margin: 0; }
.hero-note b {
  color: #3182ce;
  display: block;
  margin-top: 8px;
}
.hero-note button {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #3182ce;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  margin-top: 10px;
  padding: 4px 10px;
}
.timeline-panel {
  border-left: 1px solid #eef2f6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 36px;
}
.timeline-title {
  color: #94a3b8;
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 18px;
}
.timeline-track {
  background: #eff4f9;
  border-radius: 99px;
  height: 10px;
  overflow: visible;
  position: relative;
}
.timeline-track span {
  background: linear-gradient(90deg, #3182ce, #63b3ed);
  border-radius: 99px;
  display: block;
  height: 100%;
  position: relative;
}
.timeline-track span::after {
  background: #3182ce;
  border-radius: 99px;
  content: '';
  height: 22px;
  position: absolute;
  right: -2px;
  top: -6px;
  width: 3px;
}
.timeline-meta {
  align-items: center;
  color: #94a3b8;
  display: flex;
  font-size: 15px;
  font-weight: 700;
  justify-content: space-between;
  margin-top: 12px;
}
.timeline-meta strong {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #3182ce;
  padding: 3px 10px;
}
.type-tabs {
  background: #fff;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 42px;
}
.type-tabs button {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
}
.type-tabs button.active,
.type-tabs button:hover {
  background: #eff6ff;
  border-color: #3182ce;
  color: #3182ce;
}
.body-wrap {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
.subject-sidebar {
  background: #fff;
  border-right: 1px solid #eef2f6;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 24px 22px;
  width: 360px;
}
.sidebar-title {
  border-bottom: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 16px;
  padding-bottom: 12px;
}
.subject-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  margin-bottom: 14px;
  padding: 16px;
  text-align: left;
  transition: all .2s ease;
  width: 100%;
}
.subject-card:hover,
.subject-card.active {
  background: #f0f7ff;
  border-color: #3182ce;
  box-shadow: 0 4px 14px rgba(49, 130, 206, 0.1);
}
.card-top {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}
.card-top strong {
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
}
.card-top span {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}
.metric-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.metric-grid em {
  color: #64748b;
  display: block;
  font-size: 12px;
  font-style: normal;
  margin-bottom: 6px;
}
.metric-grid b {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}
.metric-grid span {
  color: #94a3b8;
  font-size: 11px;
  margin-left: 4px;
}
.sidebar-loading,
.sidebar-empty {
  color: #94a3b8;
  font-size: 13px;
  padding: 20px 0;
  text-align: center;
}
.canvas {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
  overflow-y: auto;
  padding: 26px 30px 34px;
}
.chart-card,
.detail-table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  padding: 24px 28px;
}
.card-hd,
.table-head {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 18px;
}
.card-hd h3,
.table-head h3 {
  color: #0f172a;
  font-size: 17px;
  font-weight: 800;
  margin: 0;
}
.card-hd p,
.table-head p {
  color: #94a3b8;
  font-size: 12px;
  margin: 5px 0 0;
}
.card-hd > span {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #3182ce;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
}
.chart-loading,
.empty-state,
.loading {
  align-items: center;
  color: #94a3b8;
  display: flex;
  font-size: 14px;
  justify-content: center;
  min-height: 220px;
}
.search-box {
  display: flex;
  gap: 8px;
}
.search-box input {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  color: #1e293b;
  font-size: 13px;
  min-width: 300px;
  outline: none;
  padding: 9px 11px;
}
.search-box input:focus {
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.12);
}
.search-box button,
.pager button {
  background: #3182ce;
  border: 1px solid #3182ce;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 9px 14px;
}
.table-wrap { overflow: auto; }
table {
  border-collapse: collapse;
  min-width: 980px;
  width: 100%;
}
th {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  padding: 13px 14px;
  text-align: left;
  white-space: nowrap;
}
td {
  border-bottom: 1px solid #eef2f7;
  color: #1e293b;
  font-size: 12px;
  padding: 12px 14px;
  white-space: nowrap;
}
td.number {
  color: #0f4fe6;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}
.empty-cell {
  color: #94a3b8;
  padding: 30px;
  text-align: center;
}
.pager {
  align-items: center;
  color: #64748b;
  display: flex;
  font-size: 13px;
  gap: 10px;
  justify-content: flex-end;
}
.pager button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.error-bar {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  margin: 12px 42px 0;
  padding: 10px 14px;
}
.sidebar-toggle,
.sidebar-overlay {
  display: none;
}

@media (max-width: 1200px) {
  .workbench-hero {
    grid-template-columns: 1fr;
    padding: 20px 24px;
  }
  .timeline-panel {
    border-left: 0;
    border-top: 1px solid #eef2f6;
    padding: 20px 0 0;
  }
}

@media (max-width: 1023px) {
  .subject-sidebar { width: 300px; }
  .canvas { padding: 18px; }
  .chart-card,
  .detail-table-card { padding: 20px; }
}

@media (max-width: 767px) {
  .workbench-hero { padding: 16px 14px; }
  .type-tabs { padding: 10px 14px; }
  .hero-main h2 { font-size: 24px; }
  .hero-metrics { gap: 12px; }
  .timeline-meta { font-size: 12px; }
  .sidebar-toggle {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #334155;
    cursor: pointer;
    display: block;
    font-size: 13px;
    font-weight: 800;
    left: 12px;
    padding: 7px 12px;
    position: absolute;
    top: 12px;
    z-index: 198;
  }
  .sidebar-overlay {
    background: rgba(15, 23, 42, 0.32);
    display: block;
    inset: 0;
    position: absolute;
    z-index: 199;
  }
  .subject-sidebar {
    bottom: 0;
    box-shadow: 4px 0 20px rgba(15, 23, 42, 0.16);
    left: 0;
    position: absolute;
    top: 0;
    transform: translateX(-100%);
    transition: transform .25s ease;
    width: 290px;
    z-index: 200;
  }
  .subject-sidebar.open { transform: translateX(0); }
  .canvas { padding: 56px 12px 18px; }
  .card-hd,
  .table-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .search-box {
    width: 100%;
  }
  .search-box input {
    min-width: 0;
    width: 100%;
  }
  .metric-grid { gap: 8px; }
}
</style>
