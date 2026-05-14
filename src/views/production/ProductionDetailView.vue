<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getProductionOutputDetails,
  getProductionRawConsumptionDetails,
  getProductionTransportDetails,
} from '@/api/production-api'
import type {
  ProductionDetailPage,
  ProductionDetailType,
  ProductionOutputDetail,
  ProductionRawConsumptionDetail,
  ProductionTransportDetail,
} from '@/types'

const route = useRoute()
const router = useRouter()

const type = ref<ProductionDetailType>(normalizeType(route.query.type))
const date = ref(String(route.query.date || ''))
const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const error = ref('')
const rows = ref<Array<Record<string, unknown>>>([])
const total = ref(0)

const title = computed(() => {
  if (type.value === 'raw') return '原料消耗明细'
  if (type.value === 'transport') return '车辆运输明细'
  return '产量明细'
})

const columns = computed(() => {
  if (type.value === 'raw') {
    return [
      ['postingDate', '过账日期'],
      ['factoryName', '工厂'],
      ['materialName', '物料'],
      ['materialGroupName', '物料组'],
      ['workCenterName', '工作中心'],
      ['orderNo', '订单'],
      ['batchNo', '批次'],
      ['quantity', '数量'],
      ['unit', '单位'],
    ]
  }
  if (type.value === 'transport') {
    return [
      ['weighingDate', '过磅日期'],
      ['category', '分类'],
      ['plateNo', '车牌号'],
      ['materialName', '物料'],
      ['customerName', '客户'],
      ['carrier', '承运商'],
      ['grossWeight', '组毛'],
      ['tareWeight', '组皮'],
      ['netWeight', '组净'],
    ]
  }
  return [
    ['postingDate', '过账日期'],
    ['company', '公司'],
    ['materialName', '物料'],
    ['materialGroupName', '物料组'],
    ['workCenter', '工作中心'],
    ['output', '产量'],
  ]
})

function normalizeType(value: unknown): ProductionDetailType {
  return value === 'raw' || value === 'transport' ? value : 'output'
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') {
    return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }
  return String(value)
}

async function fetchData() {
  if (!date.value) return
  loading.value = true
  error.value = ''
  try {
    const common = { date: date.value, keyword: keyword.value || undefined, page: page.value, pageSize: pageSize.value }
    let result: ProductionDetailPage<ProductionOutputDetail | ProductionRawConsumptionDetail | ProductionTransportDetail>
    if (type.value === 'raw') {
      result = await getProductionRawConsumptionDetails(common)
    } else if (type.value === 'transport') {
      result = await getProductionTransportDetails(common)
    } else {
      result = await getProductionOutputDetails(common)
    }
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
        <button :class="{ active: type === 'output' }" @click="switchType('output')">产量明细</button>
        <button :class="{ active: type === 'raw' }" @click="switchType('raw')">原料消耗</button>
        <button :class="{ active: type === 'transport' }" @click="switchType('transport')">车辆运输</button>
      </div>
      <div class="search-box">
        <input v-model="keyword" placeholder="搜索物料、订单、车牌、客户" @keyup.enter="search" />
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
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin-top: 16px;
}
.tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.search-box { display: flex; gap: 8px; }
.search-box input {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: var(--radius-sm);
  color: #1e293b;
  font-size: var(--fs-xs);
  min-width: 260px;
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
table { border-collapse: collapse; min-width: 920px; width: 100%; }
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
  .search-box input { min-width: 0; width: 100%; }
}
</style>
