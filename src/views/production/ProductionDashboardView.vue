<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/store/useGlobalStore'
import SectionTitle from '@/components/base/SectionTitle.vue'
import { DelayedSkeleton, TableSkeleton } from '@/components'
import {
  getProductionOverview,
  getProductionOutputByMaterialGroup,
  getProductionProductInventory,
  getProductionRawConsumptionByMaterial,
} from '@/api/production-api'
import type { ProductionMetric, ProductionOverview, ProductionRankItem } from '@/types'

type DetailTarget = 'output' | 'raw' | 'transport' | 'energy' | 'startupShutdown' | 'highRisk' | 'toxicGas' | 'waste' | 'waterGas'

interface MetricLine {
  label: string
  value?: number | string | null
  unit?: string
  empty?: boolean
}

const store = useGlobalStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const overview = ref<ProductionOverview | null>(null)
const outputItems = ref<ProductionRankItem[]>([])
const rawItems = ref<ProductionRankItem[]>([])
const inventoryItems = ref<ProductionRankItem[]>([])

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function hasValue(value: number | string | null | undefined): boolean {
  return value !== null && value !== undefined && value !== ''
}

function formatNumber(value: number | string | null | undefined, digits = 2): string {
  if (!hasValue(value)) return '-'
  const n = toNumber(value)
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: n % 1 === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  })
}

function formatMetric(value: number | string | null | undefined, unit?: string): string {
  if (!hasValue(value)) return '-'
  return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`
}

function metricLine(metric?: ProductionMetric | null): MetricLine {
  return {
    label: metric?.label || '-',
    value: metric?.value,
    unit: metric?.unit,
    empty: !metric || !hasValue(metric.value),
  }
}

function formatValueLine(line: MetricLine): string {
  if (line.label.includes('整改率')) {
    return hasValue(line.value) ? `${formatNumber(line.value, 2)}%` : '-'
  }
  return formatMetric(line.value, line.unit)
}

function goDetail(type: DetailTarget) {
  router.push({
    path: '/production-detail',
    query: { type, date: store.backendDateStr },
  })
}

function calcPercent(value: number | undefined, list: ProductionRankItem[]): number {
  const total = list.reduce((sum, item) => sum + toNumber(item.value), 0)
  if (!total) return 0
  return Math.min(100, (toNumber(value) / total) * 100)
}

const energyLines = computed<MetricLine[]>(() => [
  metricLine(overview.value?.energy?.water),
  metricLine(overview.value?.energy?.steam),
  metricLine(overview.value?.energy?.electricity),
  metricLine(overview.value?.energy?.refrigeration),
  metricLine(overview.value?.energy?.naturalGas),
  metricLine(overview.value?.energy?.hydrogen),
  metricLine(overview.value?.energy?.pureWater),
])

const safetyLines = computed<MetricLine[]>(() => [
  metricLine(overview.value?.safety?.processAlarm),
  metricLine(overview.value?.safety?.equipmentAlarm),
  metricLine(overview.value?.safety?.highRiskWork),
  metricLine(overview.value?.safety?.toxicGasAlarm),
  {
    label: '隐患按期整改率(%)',
    value: overview.value?.safety?.rectificationRate,
    unit: '%',
    empty: !hasValue(overview.value?.safety?.rectificationRate),
  },
])

const environmentLines = computed<MetricLine[]>(() => [
  metricLine(overview.value?.environment?.exhaustEmissionPoints),
  metricLine(overview.value?.environment?.wastewaterEmissionPoints),
  metricLine(overview.value?.environment?.hazardousWaste),
])

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const date = store.backendDateStr
    const [overviewRes, outputRes, rawRes, inventoryRes] = await Promise.all([
      getProductionOverview(date),
      getProductionOutputByMaterialGroup(date),
      getProductionRawConsumptionByMaterial(date),
      getProductionProductInventory(date),
    ])
    overview.value = overviewRes
    outputItems.value = outputRes
    rawItems.value = rawRes
    inventoryItems.value = inventoryRes
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生产及安全环保数据加载失败'
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
          <h1 class="header-title">生产及安全环保指标大盘</h1>
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
            <button class="metric-card metric-card-blue clickable-card" @click="goDetail('output')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="metric-card-head">
                <div>
                  <div class="metric-label">总产量（日）</div>
                  <div class="metric-value">{{ formatMetric(overview?.totalOutput.value, overview?.totalOutput.unit) }}</div>
                </div>
                <div class="metric-chip">物料组 {{ formatNumber(overview?.outputMaterialGroups.value, 0) }}</div>
              </div>
              <div class="progress-block">
                <div class="progress-head">
                  <span>预算比</span>
                  <span>70%</span>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width: 70%" /></div>
                <div class="progress-foot"><span>主原料总耗用</span><span>{{ formatMetric(overview?.rawMaterialConsumption.value, overview?.rawMaterialConsumption.unit) }}</span></div>
                <div class="progress-foot"><span>本月目标</span><span>-</span></div>
              </div>
            </button>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <button class="metric-card metric-card-purple clickable-card" @click="goDetail('raw')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="metric-label">主产品库存</div>
              <div class="metric-value">{{ formatMetric(overview?.productInventory.value, overview?.productInventory.unit) }}</div>
              <div class="metric-divider" />
              <div class="sub-row">
                <span>大宗原材料耗用</span>
                <strong>{{ formatMetric(overview?.rawMaterialConsumption.value, overview?.rawMaterialConsumption.unit) }}</strong>
              </div>
              <div class="sub-row">
                <span>最新库存快照</span>
                <strong>{{ overview?.latestInventoryTime || '-' }}</strong>
              </div>
            </button>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <button class="metric-card metric-card-white clickable-card compact-card" @click="goDetail('startupShutdown')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="metric-label">主装置开车数</div>
              <div class="metric-value">{{ formatNumber(overview?.startupShutdown?.startupCount, 0) }}</div>
              <div class="metric-label">主装置停车数</div>
              <div class="metric-value">{{ formatNumber(overview?.startupShutdown?.shutdownCount, 0) }}</div>
              <div class="metric-label">主装置总数</div>
              <div class="metric-value">{{ formatNumber(overview?.startupShutdown?.totalCount, 0) }}</div>
            </button>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <button class="metric-card metric-card-white clickable-card compact-card" @click="goDetail('transport')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="metric-label">吞量（吨）</div>
              <div class="metric-value">{{ formatNumber(overview?.throughput?.inbound) }}</div>
              <div class="metric-label">吐量（吨）</div>
              <div class="metric-value">{{ formatNumber(overview?.throughput?.outbound) }}</div>
              <div class="metric-label">车辆数</div>
              <div class="metric-value">{{ formatNumber(overview?.throughput?.vehicleCount, 0) }}</div>
            </button>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <button class="metric-card metric-card-green clickable-card compact-card" @click="goDetail('energy')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="card-section-label">能源消耗</div>
              <div v-for="line in energyLines.slice(0, 3)" :key="line.label" class="metric-line">
                <span class="metric-label">{{ line.label }}</span>
                <strong class="metric-value">{{ formatValueLine(line) }}</strong>
              </div>
            </button>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <button class="metric-card metric-card-green clickable-card compact-card" @click="goDetail('energy')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="card-section-label">公用工程</div>
              <div v-for="line in energyLines.slice(3)" :key="line.label" class="metric-line">
                <span class="metric-label">{{ line.label }}</span>
                <strong class="metric-value">{{ formatValueLine(line) }}</strong>
              </div>
            </button>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <button class="metric-card metric-card-amber clickable-card compact-card" @click="goDetail('highRisk')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="card-section-label">安全指标</div>
              <div v-for="line in safetyLines" :key="line.label" class="metric-line">
                <span class="metric-label">{{ line.label }}</span>
                <strong class="metric-value">{{ formatValueLine(line) }}</strong>
              </div>
            </button>
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><div class="metric-card skeleton-card" /></template>
          <template #content>
            <button class="metric-card metric-card-red clickable-card compact-card" @click="goDetail('waterGas')">
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
              <div class="card-section-label">环保指标</div>
              <div v-for="line in environmentLines" :key="line.label" class="metric-line">
                <span class="metric-label">{{ line.label }}</span>
                <strong class="metric-value">{{ formatValueLine(line) }}</strong>
              </div>
            </button>
          </template>
        </DelayedSkeleton>
      </div>
    </section>

    <section class="section section-two-col">
      <div class="panel table-panel">
        <SectionTitle title="产量按物料组排行" />
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><TableSkeleton height="320px" :rows="7" :columns="4" /></template>
          <template #content>
            <div class="raw-list">
              <div v-for="item in outputItems.slice(0, 8)" :key="item.name" class="raw-row">
                <div class="raw-main">
                  <span class="raw-name">{{ item.name || '-' }}</span>
                  <span class="raw-meta">覆盖工厂 {{ item.factoryCount || 0 }} 个</span>
                </div>
                <div class="raw-value">{{ formatMetric(item.value, item.unit || '吨') }}</div>
                <div class="raw-bar">
                  <div class="raw-bar-fill blue" :style="{ width: `${calcPercent(item.value, outputItems)}%` }" />
                </div>
              </div>
              <div v-if="outputItems.length === 0" class="empty-cell">暂无产量数据</div>
            </div>
          </template>
        </DelayedSkeleton>
      </div>

      <div class="panel table-panel">
        <SectionTitle title="主产品库存情况" />
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><TableSkeleton height="320px" :rows="7" :columns="4" /></template>
          <template #content>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>工厂</th>
                    <th>产品名称</th>
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
    </section>

    <section class="section">
      <div class="panel table-panel">
        <SectionTitle title="原料消耗排行" />
        <DelayedSkeleton :loading="loading" :delay="250">
          <template #skeleton><TableSkeleton height="260px" :rows="6" :columns="4" /></template>
          <template #content>
            <div class="raw-list compact-list">
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
  align-items: center;
  background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%);
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  padding: 16px 22px;
}
.header-left { align-items: center; display: flex; gap: 12px; }
.header-accent { background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%); border-radius: 2px; height: 20px; width: 4px; }
.header-title { color: #1e3a5f; font-size: var(--fs-md); font-weight: 700; letter-spacing: 0; margin: 0; }
.header-right { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; }
.date-input {
  background-color: rgba(255,255,255,0.8);
  border: 1px solid #93c5fd;
  border-radius: var(--radius-sm);
  color: #1e3a5f;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--fs-xs);
  font-weight: 600;
  outline: none;
  padding: 7px 12px;
  transition: all 0.2s;
}
.date-input:hover, .date-input:focus { background-color: #fff; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.refresh-btn {
  align-items: center;
  background: rgba(255,255,255,0.7);
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
  transition: all 0.15s ease;
  white-space: nowrap;
}
.refresh-btn:hover { background: #2563eb; border-color: #2563eb; color: #fff; }
.refresh-btn:disabled { cursor: not-allowed; opacity: 0.55; }
.icon { flex-shrink: 0; height: 15px; width: 15px; }
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
.error-bar button { background: transparent; border: 0; color: var(--color-danger); cursor: pointer; font-weight: 700; }

.metrics-grid {
  align-items: stretch;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.metric-card {
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  color: inherit;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  min-height: 212px;
  overflow: hidden;
  padding: 18px 20px 16px;
  position: relative;
  text-align: left;
  transition: all 0.3s ease;
  width: 100%;
}
.metric-card-blue { background: #dbeafe; border-color: #bfdbfe; }
.metric-card-purple { background: linear-gradient(to right, #dbeafe 0%, #ede9fe 100%); border-color: #c4b5fd; }
.metric-card-green { background: linear-gradient(to right, #dcfce7 0%, #ecfdf5 100%); border-color: #bbf7d0; }
.metric-card-amber { background: linear-gradient(to right, #fef3c7 0%, #fff7ed 100%); border-color: #fde68a; }
.metric-card-red { background: linear-gradient(to right, #fee2e2 0%, #fff1f2 100%); border-color: #fecaca; }
.metric-card-white { background: #fff; border-color: #f0f4f8; }
.clickable-card { cursor: pointer; }
.clickable-card:hover { box-shadow: 0 8px 25px rgba(59,130,246,0.15); transform: translateY(-3px); }
.card-arrow {
  color: #2563eb;
  height: 18px;
  opacity: 0;
  position: absolute;
  right: 14px;
  top: 14px;
  transform: translate(-6px, 6px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 18px;
}
.card-arrow svg { height: 100%; opacity: 0.8; width: 100%; }
.clickable-card:hover .card-arrow { opacity: 1; transform: translate(0, 0); }
.metric-card-head { display: flex; gap: 12px; justify-content: space-between; }
.metric-chip {
  align-self: flex-start;
  background: rgba(255,255,255,0.65);
  border: 1px solid rgba(147,197,253,0.7);
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  white-space: nowrap;
}
.card-section-label {
  color: #334155;
  font-size: var(--fs-sm);
  font-weight: 700;
  margin-bottom: 14px;
}
.metric-label { color: #374151; display: block; font-size: var(--fs-sm); font-weight: 500; line-height: 1.35; margin-bottom: 8px; }
.metric-value { color: #1d4ed8; font-size: var(--fs-xl); font-weight: 700; line-height: 1.2; }
.metric-card-purple .metric-value { color: #5b21b6; }
.metric-card-green .metric-value { color: #047857; }
.metric-card-amber .metric-value { color: #b45309; }
.metric-card-red .metric-value { color: #be123c; }
.metric-card-white .metric-value { color: #111827; }
.metric-divider { background: rgba(196,181,253,0.75); height: 1px; margin: 16px 0 12px; }
.sub-row {
  align-items: center;
  color: #6b7280;
  display: flex;
  font-size: var(--fs-xs);
  gap: 12px;
  justify-content: space-between;
  margin-top: 8px;
}
.sub-row strong { color: #111827; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.metric-line {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 12px;
}
.metric-line .metric-label { font-size: var(--fs-xs); margin: 0; min-width: 0; }
.metric-line .metric-value { font-size: var(--fs-md); text-align: right; white-space: nowrap; }
.compact-card .metric-value { display: block; margin-bottom: 8px; }
.progress-block { flex-shrink: 0; margin-top: auto; padding-top: 18px; }
.progress-head, .progress-foot {
  align-items: center;
  color: #374151;
  display: flex;
  font-size: var(--fs-xs);
  justify-content: space-between;
}
.progress-track { background: rgba(147,197,253,0.45); border-radius: 999px; height: 7px; margin: 7px 0; overflow: hidden; }
.progress-fill { background: #3b82f6; height: 100%; }
.progress-foot { margin-top: 6px; }

.section-two-col {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  min-width: 0;
  padding: 20px 24px;
}
.table-panel { overflow: hidden; }
.table-wrap { max-height: 340px; overflow: auto; }
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
.compact-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.raw-row {
  align-items: center;
  display: grid;
  gap: 8px 16px;
  grid-template-columns: minmax(0, 1fr) auto;
}
.raw-main { min-width: 0; }
.raw-name { color: #1e293b; display: block; font-size: var(--fs-xs); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.raw-meta { color: #94a3b8; display: block; font-size: 12px; margin-top: 3px; }
.raw-value { color: #0f4fe6; font-size: var(--fs-xs); font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
.raw-bar { background: #edf4fb; border-radius: 999px; grid-column: 1 / -1; height: 7px; overflow: hidden; }
.raw-bar-fill { background: linear-gradient(90deg, #0f9f7a, #34d399); border-radius: inherit; height: 100%; }
.raw-bar-fill.blue { background: linear-gradient(90deg, #2563eb, #60a5fa); }
.skeleton-card { background: linear-gradient(90deg, #eef2f7 25%, #e2e8f0 50%, #eef2f7 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 1199px) {
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .compact-list { grid-template-columns: 1fr; }
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
  .metric-card { min-height: auto; padding: 14px 14px 12px; }
  .metric-line { align-items: center; }
  .panel { padding: 16px 14px; }
  .clickable-card:hover { box-shadow: var(--shadow-card); transform: none; }
  .clickable-card:active { transform: scale(0.98); }
}
</style>
