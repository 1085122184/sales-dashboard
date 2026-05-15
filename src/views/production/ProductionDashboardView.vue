<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useRouter } from 'vue-router'
import SectionTitle from '@/components/base/SectionTitle.vue'
import { BaseEChart, ChartSkeleton, DelayedSkeleton, TableSkeleton } from '@/components'
import {
  getProductionOverview,
  getProductionOutputByMaterialGroup,
  getProductionProductInventory,
  getProductionRawConsumptionByMaterial,
  getProductionThroughputByFactory,
} from '@/api/production-api'
import type { ProductionOverview, ProductionRankItem } from '@/types'

const store = useGlobalStore()
const { isMaxMd } = useBreakpoint()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const overview = ref<ProductionOverview | null>(null)
const outputItems = ref<ProductionRankItem[]>([])
const rawItems = ref<ProductionRankItem[]>([])
const inventoryItems = ref<ProductionRankItem[]>([])
const throughputItems = ref<ProductionRankItem[]>([])

const panelHeight = computed(() => isMaxMd.value ? '280px' : '360px')

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function formatNumber(value: number | string | null | undefined, digits = 2): string {
  const n = toNumber(value)
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: n % 1 === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  })
}

function formatMetric(value: number | string | null | undefined, unit?: string): string {
  return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`
}

function calcPercent(value: number | undefined, list: ProductionRankItem[]): number {
  const total = list.reduce((sum, item) => sum + toNumber(item.value), 0)
  if (!total) return 0
  return Math.min(100, (toNumber(value) / total) * 100)
}

function goDetail(type: 'output' | 'raw' | 'transport') {
  router.push({
    path: '/production-detail',
    query: { type, date: store.backendDateStr },
  })
}

const outputChartOption = computed(() => ({
  grid: { top: 18, right: 24, bottom: 28, left: 72 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#e5eef8' } },
    axisLabel: { color: '#64748b' },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: outputItems.value.slice(0, 10).map(item => item.name || '未分类'),
    axisTick: { show: false },
    axisLine: { show: false },
    axisLabel: { color: '#475569', width: 90, overflow: 'truncate' },
  },
  series: [{
    type: 'bar',
    data: outputItems.value.slice(0, 10).map(item => toNumber(item.value)),
    barWidth: 12,
    itemStyle: { color: '#2563eb', borderRadius: [0, 6, 6, 0] },
  }],
}))

const rawChartOption = computed(() => ({
  grid: { top: 18, right: 20, bottom: 36, left: 54 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: rawItems.value.slice(0, 8).map(item => item.name || '未命名'),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#dbeafe' } },
    axisLabel: { color: '#64748b', rotate: 28, width: 72, overflow: 'truncate' },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#e5eef8' } },
    axisLabel: { color: '#64748b' },
  },
  series: [{
    type: 'bar',
    data: rawItems.value.slice(0, 8).map(item => toNumber(item.value)),
    barWidth: 18,
    itemStyle: { color: '#0f9f7a', borderRadius: [6, 6, 0, 0] },
  }],
}))

const throughputChartOption = computed(() => ({
  grid: { top: 38, right: 18, bottom: 34, left: 52 },
  legend: { top: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b' } },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: throughputItems.value.map(item => item.factory || item.company || '未命名'),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#dbeafe' } },
    axisLabel: { color: '#64748b' },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#e5eef8' } },
    axisLabel: { color: '#64748b' },
  },
  series: [
    {
      name: '吞量',
      type: 'bar',
      data: throughputItems.value.map(item => toNumber(item.inbound)),
      barWidth: 14,
      itemStyle: { color: '#2563eb', borderRadius: [5, 5, 0, 0] },
    },
    {
      name: '吐量',
      type: 'bar',
      data: throughputItems.value.map(item => toNumber(item.outbound)),
      barWidth: 14,
      itemStyle: { color: '#f59e0b', borderRadius: [5, 5, 0, 0] },
    },
  ],
}))

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const date = store.backendDateStr
    const [overviewRes, outputRes, rawRes, inventoryRes, throughputRes] = await Promise.all([
      getProductionOverview(date),
      getProductionOutputByMaterialGroup(date),
      getProductionRawConsumptionByMaterial(date),
      getProductionProductInventory(date),
      getProductionThroughputByFactory(date),
    ])
    overview.value = overviewRes
    outputItems.value = outputRes
    rawItems.value = rawRes
    inventoryItems.value = inventoryRes
    throughputItems.value = throughputRes
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生产数据加载失败'
  } finally {
    loading.value = false
  }
}

watch(() => store.backendDateStr, refresh)

onMounted(refresh)
</script>

<template>
  <div class="production-dashboard">
    <section class="section section-header">
      <div class="header-card">
        <div class="header-left">
          <div class="header-accent" />
          <h1 class="header-title">生产运营指标大盘</h1>
        </div>
        <div class="header-right">
          <input type="date" v-model="store.queryDate" :max="store.yesterday" class="date-input" title="选择业务日期" />
          <button class="refresh-btn" :disabled="loading" @click="refresh">
            <svg class="icon" :class="{ spinning: loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span class="refresh-label">实时同步</span>
          </button>
        </div>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="error" class="error-bar">
        <span>{{ error }}</span>
        <button @click="refresh">重试</button>
      </div>
    </Transition>

    <section class="section">
      <div class="metrics-grid">
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <div class="metric-card output clickable-card" @click="goDetail('output')">
              <div class="metric-label">总产量（日）</div>
              <div class="metric-value">{{ formatMetric(overview?.totalOutput.value, overview?.totalOutput.unit) }}</div>
              <div class="metric-sub">物料组 {{ formatNumber(overview?.outputMaterialGroups.value, 0) }} 个</div>
            </div>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <div class="metric-card raw clickable-card" @click="goDetail('raw')">
              <div class="metric-label">主原料总耗用（日）</div>
              <div class="metric-value">{{ formatMetric(overview?.rawMaterialConsumption.value, overview?.rawMaterialConsumption.unit) }}</div>
              <div class="metric-sub">原料品种 {{ formatNumber(overview?.rawMaterialKinds.value, 0) }} 个</div>
            </div>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <div class="metric-card inventory">
              <div class="metric-label">主产品库存</div>
              <div class="metric-value">{{ formatMetric(overview?.productInventory.value, overview?.productInventory.unit) }}</div>
              <div class="metric-sub">最新快照 {{ overview?.latestInventoryTime || '-' }}</div>
            </div>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <div class="metric-card throughput clickable-card" @click="goDetail('transport')">
              <div class="metric-label">车辆吞吐量</div>
              <div class="throughput-lines">
                <span>吞量 <strong>{{ formatMetric(overview?.throughput?.inbound, overview?.throughput?.unit) }}</strong></span>
                <span>吐量 <strong>{{ formatMetric(overview?.throughput?.outbound, overview?.throughput?.unit) }}</strong></span>
                <span>车辆 <strong>{{ formatNumber(overview?.throughput?.vehicleCount, 0) }} 辆</strong></span>
              </div>
            </div>
          </template>
        </DelayedSkeleton>
      </div>
    </section>

    <section class="section section-two-col">
      <div class="panel">
        <SectionTitle title="产量按物料组排行" />
        <button class="panel-action" @click="goDetail('output')">查看明细</button>
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><ChartSkeleton :height="panelHeight" /></template>
          <template #content><BaseEChart :option="outputChartOption" :height="panelHeight" /></template>
        </DelayedSkeleton>
      </div>

      <div class="panel">
        <SectionTitle title="原料消耗排行" />
        <button class="panel-action" @click="goDetail('raw')">查看明细</button>
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><ChartSkeleton :height="panelHeight" /></template>
          <template #content><BaseEChart :option="rawChartOption" :height="panelHeight" /></template>
        </DelayedSkeleton>
      </div>
    </section>

    <section class="section section-two-col">
      <div class="panel table-panel">
        <SectionTitle title="主产品库存情况" />
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><TableSkeleton :height="panelHeight" :rows="6" :columns="4" /></template>
          <template #content>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>工厂</th>
                    <th>产品</th>
                    <th>库存</th>
                    <th>更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in inventoryItems" :key="`${item.factory}-${item.name}`">
                    <td>{{ item.factory || '-' }}</td>
                    <td>{{ item.name || '-' }}</td>
                    <td class="number-cell">{{ formatMetric(item.value, item.unit) }}</td>
                    <td>{{ item.updateTime || '-' }}</td>
                  </tr>
                  <tr v-if="inventoryItems.length === 0">
                    <td colspan="4" class="empty-cell">暂无库存数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </DelayedSkeleton>
      </div>

      <div class="panel">
        <SectionTitle title="车辆吞吐按工厂" />
        <button class="panel-action" @click="goDetail('transport')">查看明细</button>
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><ChartSkeleton :height="panelHeight" /></template>
          <template #content><BaseEChart :option="throughputChartOption" :height="panelHeight" /></template>
        </DelayedSkeleton>
      </div>
    </section>

    <section class="section">
      <div class="panel table-panel">
        <SectionTitle title="原料消耗明细排行" />
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><TableSkeleton height="320px" :rows="7" :columns="4" /></template>
          <template #content>
            <div class="raw-list">
              <div v-for="item in rawItems.slice(0, 10)" :key="item.name" class="raw-row">
                <div class="raw-main">
                  <span class="raw-name">{{ item.name || '-' }}</span>
                  <span class="raw-meta">覆盖工厂 {{ item.factoryCount || 0 }} 个</span>
                </div>
                <div class="raw-value">{{ formatMetric(item.value, item.unit || '吨') }}</div>
                <div class="raw-bar">
                  <div class="raw-bar-fill" :style="{ width: `${calcPercent(item.value, rawItems)}%` }" />
                </div>
              </div>
              <div v-if="rawItems.length === 0" class="empty-cell">暂无原料消耗数据</div>
            </div>
          </template>
        </DelayedSkeleton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.production-dashboard { min-height: 100vh; background: var(--color-bg-page); padding-bottom: 40px; }
.section { padding: 16px 24px 0; }
.section-header { padding-top: 20px; }

.header-card {
  background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%);
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 22px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-accent { width: 4px; height: 20px; background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%); border-radius: 2px; }
.header-title { color: #1e3a5f; font-size: var(--fs-md); font-weight: 700; margin: 0; }
.header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.date-input {
  background: rgba(255,255,255,0.85);
  border: 1px solid #93c5fd;
  border-radius: var(--radius-sm);
  color: #1e3a5f;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--fs-xs);
  font-weight: 600;
  outline: none;
  padding: 7px 12px;
}
.date-input:hover, .date-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.refresh-btn {
  align-items: center;
  background: rgba(255,255,255,0.75);
  border: 1px solid #93c5fd;
  border-radius: var(--radius-sm);
  color: #2563eb;
  cursor: pointer;
  display: flex;
  font-family: var(--font-family);
  font-size: var(--fs-xs);
  font-weight: 600;
  gap: 6px;
  padding: 8px 16px;
  white-space: nowrap;
}
.refresh-btn:hover { background: #2563eb; color: #fff; }
.refresh-btn:disabled { cursor: not-allowed; opacity: 0.55; }
.icon { width: 15px; height: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

.error-bar {
  align-items: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: var(--color-danger);
  display: flex;
  font-size: var(--fs-xs);
  justify-content: space-between;
  margin: 14px 24px 0;
  padding: 10px 16px;
}
.error-bar button { border: 0; background: transparent; color: var(--color-danger); cursor: pointer; font-weight: 700; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.metric-card {
  background: var(--color-bg-card);
  border: 1px solid #dbeafe;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  min-height: 152px;
  padding: 18px 20px;
}
.metric-card.output { border-top: 3px solid #2563eb; }
.metric-card.raw { border-top: 3px solid #0f9f7a; }
.metric-card.inventory { border-top: 3px solid #f59e0b; }
.metric-card.throughput { border-top: 3px solid #7c3aed; }
.clickable-card { cursor: pointer; transition: transform 0.16s ease, box-shadow 0.16s ease; }
.clickable-card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
.metric-label { color: #334155; font-size: var(--fs-xs); font-weight: 700; margin-bottom: 18px; }
.metric-value { color: #0f4fe6; font-size: var(--fs-xl); font-weight: 700; line-height: 1.15; }
.metric-sub { border-top: 1px solid #e2e8f0; color: #64748b; font-size: var(--fs-xs); margin-top: 16px; padding-top: 12px; }
.throughput-lines { display: grid; gap: 10px; color: #475569; font-size: var(--fs-xs); }
.throughput-lines strong { color: #0f4fe6; font-size: var(--fs-md); margin-left: 8px; }
.skeleton-card { background: linear-gradient(90deg, #eef2f7 25%, #e2e8f0 50%, #eef2f7 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.section-two-col {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}
.panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  min-width: 0;
  padding: 18px 20px 20px;
  position: relative;
}
.panel-action {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-sm);
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 5px 10px;
  position: absolute;
  right: 20px;
  top: 20px;
}
.panel-action:hover { background: #2563eb; color: #fff; }
.table-panel { overflow: hidden; }
.table-wrap { max-height: 360px; overflow: auto; }
table { border-collapse: collapse; width: 100%; }
th {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: var(--fs-xs);
  font-weight: 700;
  padding: 12px 14px;
  text-align: left;
  white-space: nowrap;
}
td {
  border-bottom: 1px solid #eef2f7;
  color: #1e293b;
  font-size: var(--fs-xs);
  padding: 12px 14px;
}
.number-cell { color: #0f4fe6; font-variant-numeric: tabular-nums; font-weight: 700; }
.empty-cell { color: #94a3b8; padding: 28px; text-align: center; }

.raw-list { display: grid; gap: 12px; }
.raw-row {
  align-items: center;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 16px;
}
.raw-main { min-width: 0; }
.raw-name { color: #1e293b; display: block; font-size: var(--fs-xs); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.raw-meta { color: #94a3b8; display: block; font-size: 12px; margin-top: 3px; }
.raw-value { color: #0f4fe6; font-size: var(--fs-xs); font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
.raw-bar {
  background: #edf4fb;
  border-radius: 999px;
  grid-column: 1 / -1;
  height: 7px;
  overflow: hidden;
}
.raw-bar-fill { background: linear-gradient(90deg, #0f9f7a, #34d399); border-radius: inherit; height: 100%; }

@media (max-width: 1199px) {
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1023px) {
  .section { padding: 12px 16px 0; }
  .section-two-col { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
  .production-dashboard { padding-bottom: 24px; }
  .section { padding: 10px 12px 0; }
  .section-header { padding-top: 12px; }
  .header-card { padding: 12px 14px; }
  .refresh-label { display: none; }
  .refresh-btn { padding: 8px 10px; }
  .metrics-grid { grid-template-columns: 1fr; gap: 10px; }
  .metric-card { min-height: 128px; padding: 16px; }
  .panel { padding: 14px 12px 16px; }
}
</style>
