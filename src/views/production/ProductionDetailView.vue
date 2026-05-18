<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
} from '@/api/production-api'
import type {
  ProductionDetailPage,
  ProductionDetailType,
  ProductionEnergyDetail,
  ProductionHighRiskWorkDetail,
  ProductionOutputDetail,
  ProductionRawConsumptionDetail,
  ProductionStartupShutdownDetail,
  ProductionToxicGasDetail,
  ProductionTransportDetail,
  ProductionWasteDetail,
  ProductionWaterGasDetail,
} from '@/types'

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
  placeholder: string
  columns: Column[]
}

const route = useRoute()
const router = useRouter()

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
    placeholder: '搜索车牌、物料、客户',
    columns: [
      ['weighingDate', '过磅日期'],
      ['category', '分类'],
      ['plateNo', '车牌号'],
      ['materialName', '物料'],
      ['customerName', '客户'],
      ['carrier', '承运商'],
      ['grossWeight', '组毛'],
      ['tareWeight', '组皮'],
      ['netWeight', '组净'],
    ],
  },
  energy: {
    label: '能源消耗',
    placeholder: '搜索订单、工厂',
    columns: [
      ['postingDate', '过账日期'],
      ['factory', '工厂'],
      ['orderNo', '订单'],
      ['water', '水'],
      ['waterUnit', '水单位'],
      ['electricity', '电'],
      ['electricityUnit', '电单位'],
      ['steam', '蒸汽'],
      ['steamUnit', '蒸汽单位'],
      ['naturalGas', '天然气'],
      ['naturalGasUnit', '天然气单位'],
      ['pureWater', '纯水'],
      ['pureWaterUnit', '纯水单位'],
    ],
  },
  startupShutdown: {
    label: '开停车',
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
    placeholder: '搜索公司',
    columns: [
      ['workDate', '作业日期'],
      ['companyName', '公司名称'],
      ['workCount', '作业数'],
    ],
  },
  toxicGas: {
    label: '有毒气体',
    placeholder: '搜索公司',
    columns: [
      ['alarmDate', '报警日期'],
      ['company', '公司'],
      ['alarmCount', '报警数'],
    ],
  },
  waste: {
    label: '危废产生',
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
const date = ref(String(route.query.date || ''))
const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const error = ref('')
const rows = ref<Array<Record<string, unknown>>>([])
const total = ref(0)

const currentConfig = computed(() => detailConfig[type.value])
const title = computed(() => currentConfig.value.label)
const columns = computed(() => currentConfig.value.columns)
const searchPlaceholder = computed(() => currentConfig.value.placeholder)

function normalizeType(value: unknown): ProductionDetailType {
  const text = Array.isArray(value) ? value[0] : value
  return detailTypes.includes(text as ProductionDetailType) ? text as ProductionDetailType : 'output'
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') {
    return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }
  return String(value)
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

async function fetchData() {
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

function switchType(nextType: ProductionDetailType) {
  if (type.value === nextType) return
  type.value = nextType
  keyword.value = ''
  page.value = 1
  router.replace({ path: '/production-detail', query: { type: nextType, date: date.value } })
  fetchData()
}

function search() {
  page.value = 1
  fetchData()
}

function prevPage() {
  if (page.value <= 1) return
  page.value -= 1
  fetchData()
}

function nextPage() {
  if (page.value * pageSize.value >= total.value) return
  page.value += 1
  fetchData()
}

watch(() => route.query, query => {
  type.value = normalizeType(query.type)
  date.value = String(query.date || date.value)
  keyword.value = ''
  page.value = 1
  fetchData()
})

onMounted(fetchData)
</script>

<template>
  <div class="detail-page">
    <section class="detail-header">
      <button class="back-btn" @click="router.push('/production-dashboard')">返回大盘</button>
      <div>
        <h1>{{ title }}</h1>
        <p>{{ date }}</p>
      </div>
    </section>

    <section class="toolbar">
      <div class="tabs">
        <button
          v-for="item in detailTypes"
          :key="item"
          :class="{ active: type === item }"
          @click="switchType(item)"
        >
          {{ detailConfig[item].label }}
        </button>
      </div>
      <div class="search-box">
        <input v-model="keyword" :placeholder="searchPlaceholder" @keyup.enter="search" />
        <button @click="search">查询</button>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="error" class="error-bar">{{ error }}</div>
    </Transition>

    <section class="table-panel">
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
  </div>
</template>

<style scoped>
.detail-page { min-height: 100vh; background: var(--color-bg-page); padding: 18px 24px 34px; }
.detail-header {
  align-items: center;
  background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%);
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  gap: 16px;
  padding: 16px 20px;
}
.detail-header h1 { color: #1e3a5f; font-size: var(--fs-md); margin: 0; }
.detail-header p { color: #64748b; font-size: var(--fs-xs); margin-top: 4px; }
.back-btn, .toolbar button, .pager button {
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--fs-xs);
  font-weight: 700;
  padding: 8px 12px;
}
.back-btn, .toolbar button { background: #fff; color: #2563eb; }
.back-btn:hover, .toolbar button:hover, .toolbar button.active { background: #2563eb; color: #fff; }
.toolbar {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin-top: 16px;
}
.tabs { display: flex; flex-wrap: wrap; gap: 8px; max-width: 920px; }
.search-box { display: flex; gap: 8px; }
.search-box input {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: var(--radius-sm);
  color: #1e293b;
  font-size: var(--fs-xs);
  min-width: 300px;
  outline: none;
  padding: 8px 10px;
}
.search-box input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.error-bar {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: var(--fs-xs);
  margin-top: 12px;
  padding: 10px 14px;
}
.table-panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  margin-top: 16px;
  overflow: hidden;
}
.loading { color: #64748b; padding: 40px; text-align: center; }
.table-wrap { overflow: auto; }
table { border-collapse: collapse; min-width: 980px; width: 100%; }
th {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: var(--fs-xs);
  font-weight: 700;
  padding: 13px 14px;
  text-align: left;
  white-space: nowrap;
}
td {
  border-bottom: 1px solid #eef2f7;
  color: #1e293b;
  font-size: var(--fs-xs);
  padding: 12px 14px;
  white-space: nowrap;
}
td.number { color: #0f4fe6; font-variant-numeric: tabular-nums; font-weight: 700; }
.empty-cell { color: #94a3b8; padding: 30px; text-align: center; }
.pager {
  align-items: center;
  color: #64748b;
  display: flex;
  font-size: var(--fs-xs);
  gap: 10px;
  justify-content: flex-end;
  margin-top: 14px;
}
.pager button { background: #fff; color: #2563eb; }
.pager button:disabled { color: #94a3b8; cursor: not-allowed; opacity: 0.6; }

@media (max-width: 767px) {
  .detail-page { padding: 12px; }
  .detail-header { align-items: flex-start; flex-direction: column; gap: 10px; }
  .toolbar { align-items: stretch; flex-direction: column; }
  .tabs { max-width: none; }
  .search-box input { min-width: 0; width: 100%; }
}
</style>
