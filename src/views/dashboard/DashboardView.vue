<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { useRouter } from 'vue-router'
import { useDashboard } from '@/composables/useDashboard'
import { useSalesTrend } from '@/composables/useSalesTrend'
import { useBreakpoint } from '@/composables/useBreakpoint'
import SectionTitle from '@/components/base/SectionTitle.vue'
import MetricCard from './components/MetricCard.vue'
import CollectionCard from './components/CollectionCard.vue'
import OrderCard from './components/OrderCard.vue'
import PriceDeviationChart from './components/PriceDeviationChart.vue'
import PriceDeviationTable from './components/PriceDeviationTable.vue'
import SalesTrendChart from './components/SalesTrendChart.vue'
import SalesTrendTable from './components/SalesTrendTable.vue'
import { MetricCardSkeleton, ChartSkeleton, TableSkeleton, DelayedSkeleton } from '@/components'
import AIInsightPanel from '@/components/business/AIInsightPanel.vue'

const store = useGlobalStore()
const { isMaxMd } = useBreakpoint()

// 🌟 响应式骨架屏高度：手机端降低
const skeletonChartHeight = computed(() => isMaxMd.value ? '280px' : '420px')

const {
  metricsLoading, ordersLoading, deviationsLoading, isAnyLoading,
  error, salesVolume, salesAmount, collection, monthOrders, yearOrders,
  priceDeviations, refresh: refreshDashboard,
} = useDashboard()

const { trendLoading, trends, selectedTrend, yearDetailData, yearDetailLoading, loadYearDetail, refresh: refreshTrends } = useSalesTrend()

const router = useRouter()
function goToSalesDetail(type: 'volume' | 'amount', title: string) {
  const cleanTitle = title.replace(/（日）|\(日\)/g, '')
  router.push({ path: '/details/sales', query: { type, cleanTitle, date: store.backendDateStr } })
}

function goToOrderDetail(type: 'month' | 'year', title: string) {
  router.push({ 
    path: '/details/order', 
    query: { type, cleanTitle: title, date: store.backendDateStr } 
  })
}

function goToCollectionDetail() {
  router.push({ 
    path: '/details/collection', 
    query: { date: store.backendDateStr } 
  })
}
function refreshAll() { refreshDashboard(); refreshTrends() }

const selectedProduct = ref<string | null>(null)
const selectedTrendId = ref<string | null>(null)
const filteredPriceDeviations = ref<any[]>([])

function handleProductSelect(uniqueId: string | null) { selectedProduct.value = uniqueId }
function handleDeviationFilter(filteredData: any[]) { filteredPriceDeviations.value = filteredData }
function handleTrendSelect(uniqueId: string | null) {
  if (!uniqueId) { 
    selectedTrend.value = null
    selectedTrendId.value = null
    return 
  }
  const t = trends.value.find(x => `${x.productCode}-${x.region}` === uniqueId)
  if (t) {
    selectedTrend.value = t
    selectedTrendId.value = uniqueId
    yearDetailData.value = [] 
  }
}
function handleTrendTabChange(tab: 'month' | 'year') {
  if (tab === 'year') {
    loadYearDetail()
  }
}
</script>

<template>
  <div class="dashboard">

    <section class="section section-header">
      <div class="header-card">
        <div class="header-left">
          <div class="header-accent" />
          <h1 class="header-title">销售指标大盘</h1>
        </div>
        <div class="header-right">
          <div class="date-picker-wrap">
            <input type="date" v-model="store.queryDate" :max="store.yesterday" class="date-input" title="选择业务日期" />
          </div>
          <button class="refresh-btn" :disabled="isAnyLoading" @click="refreshAll">
            <svg class="icon" :class="{ spinning: isAnyLoading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        <span>⚠️ {{ error }}</span>
        <button @click="refreshAll">重试</button>
      </div>
    </Transition>

    <section class="section">
      <div class="metrics-grid">
        <DelayedSkeleton :loading="metricsLoading" :delay="300">
          <template #skeleton>
            <MetricCardSkeleton variant="blue" />
          </template>
          <template #content>
            <MetricCard v-if="salesVolume" :data="salesVolume" clickable @card-click="goToSalesDetail('volume', salesVolume.label)" />
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="metricsLoading" :delay="300">
          <template #skeleton>
            <MetricCardSkeleton variant="purple" />
          </template>
          <template #content>
            <MetricCard v-if="salesAmount" :data="salesAmount" variant="purple" clickable @card-click="goToSalesDetail('amount', salesAmount.label)" />
          </template>
        </DelayedSkeleton>

        <DelayedSkeleton :loading="metricsLoading" :delay="300">
          <template #skeleton>
            <MetricCardSkeleton variant="green" />
          </template>
          <template #content>
            <CollectionCard v-if="collection" :data="collection" clickable @click="goToCollectionDetail" />
          </template>
        </DelayedSkeleton>

        <div class="order-col">
          <DelayedSkeleton :loading="ordersLoading" :delay="300">
            <template #skeleton>
              <MetricCardSkeleton variant="amber" />
            </template>
            <template #content>
              <OrderCard v-if="monthOrders" :data="monthOrders" clickable @click="goToOrderDetail('month', '本月未关订单')" />
            </template>
          </DelayedSkeleton>
          <DelayedSkeleton :loading="ordersLoading" :delay="300">
            <template #skeleton>
              <MetricCardSkeleton variant="amber" />
            </template>
            <template #content>
              <OrderCard v-if="yearOrders" :data="yearOrders" clickable @click="goToOrderDetail('year', '本年未关订单')" />
            </template>
          </DelayedSkeleton>
        </div>
      </div>
    </section>

    <section class="section">
      <SectionTitle title="价格偏差追踪" />
      <div class="panel-grid">
        <div class="panel-chart-cell">
          <DelayedSkeleton :loading="deviationsLoading" :delay="300">
            <template #skeleton>
              <ChartSkeleton :height="skeletonChartHeight" />
            </template>
            <template #content>
              <PriceDeviationChart
                :data="filteredPriceDeviations"
                :selected-product="selectedProduct"
                @clear-selection="selectedProduct = null"
              />
            </template>
          </DelayedSkeleton>
        </div>
        <div class="panel-divider" />
        <div class="panel-table-cell">
          <DelayedSkeleton :loading="deviationsLoading" :delay="300">
            <template #skeleton>
              <TableSkeleton :height="skeletonChartHeight" :rows="6" :columns="5" />
            </template>
            <template #content>
              <div class="table-scroll-wrap">
                <PriceDeviationTable
                  :data="priceDeviations"
                  :selected-product="selectedProduct"
                  @select="handleProductSelect"
                  @filter-change="handleDeviationFilter"
                />
              </div>
            </template>
          </DelayedSkeleton>
        </div>
      </div>
    </section>

    <section class="section">
      <SectionTitle title="量价趋势分析" />
      <div class="panel-grid">
        <div class="panel-chart-cell">
          <DelayedSkeleton :loading="trendLoading" :delay="300">
            <template #skeleton>
              <ChartSkeleton :height="skeletonChartHeight" />
            </template>
            <template #content>
              <SalesTrendChart
                :data="trends"
                :selected-product="selectedTrendId"
                :year-data="yearDetailData" :loading-year="yearDetailLoading" @tab-change="handleTrendTabChange" @clear-selection="handleTrendSelect(null)"
              />
            </template>
          </DelayedSkeleton>
        </div>
        <div class="panel-divider" />
        <div class="panel-table-cell">
          <DelayedSkeleton :loading="trendLoading" :delay="300">
            <template #skeleton>
              <TableSkeleton :height="skeletonChartHeight" :rows="6" :columns="5" />
            </template>
            <template #content>
              <div class="table-scroll-wrap">
                <SalesTrendTable
                  :data="trends"
                  :selected-product="selectedTrendId"
                  @select="handleTrendSelect"
                />
              </div>
            </template>
          </DelayedSkeleton>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.dashboard { min-height: 100vh; background: var(--color-bg-page); padding-bottom: 40px; }
.section { padding: 16px 24px 0; }
.section-header { padding-top: 20px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.header-card {
  background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%);
  border-radius: var(--radius-lg); padding: 16px 22px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  box-shadow: var(--shadow-card); border: 1px solid #bfdbfe;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-accent { width: 4px; height: 20px; background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%); border-radius: 2px; flex-shrink: 0; }
.header-title { font-size: var(--fs-md); font-weight: 700; color: #1e3a5f; letter-spacing: 0.03em; margin: 0; }
.header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.date-picker-wrap { display: flex; align-items: center; }
.date-input {
  padding: 7px 12px; border: 1px solid #93c5fd; border-radius: var(--radius-sm);
  color: #1e3a5f; background-color: rgba(255,255,255,0.8); outline: none;
  font-family: inherit; font-size: var(--fs-xs); font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.date-input:hover, .date-input:focus { border-color: #2563eb; background-color: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.date-input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: 0.2s; }
.date-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }

.refresh-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: rgba(255,255,255,0.7); color: #2563eb; border: 1px solid #93c5fd;
  border-radius: var(--radius-sm); font-size: var(--fs-xs); font-weight: 600;
  cursor: pointer; transition: all 0.15s ease; font-family: var(--font-family); white-space: nowrap;
}
.refresh-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.icon { width: 15px; height: 15px; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

.error-bar {
  background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md);
  margin: 14px 24px 0; padding: 10px 16px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: var(--fs-xs); color: var(--color-danger);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1.2fr 1fr;
  gap: 16px;
  align-items: stretch;
}
.skel-cell { min-height: 180px; }
.order-col { display: flex; flex-direction: column; justify-content: space-between; gap: 12px; height: 100%; }

.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;   /* 图表 | 竖线 | 表格 */
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.panel-chart-cell { padding: 20px 24px; min-width: 0; }
.panel-divider    { background: #f1f5f9; }           /* 竖向分隔线 */
.panel-table-cell { padding: 20px 0; min-width: 0; }

.table-scroll-wrap {
  width: 100%; overflow-x: auto;
  scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
}
.table-scroll-wrap::-webkit-scrollbar { height: 6px; }
.table-scroll-wrap::-webkit-scrollbar-track { background: transparent; }
.table-scroll-wrap::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.table-scroll-wrap > * { min-width: 600px; }

@media (max-width: 1199px) {
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .order-col {
    flex-direction: row;
    height: auto;
  }
}

@media (max-width: 1023px) {
  .section { padding: 12px 16px 0; }
  .section-header { padding-top: 14px; }

  .panel-grid {
    grid-template-columns: 1fr;
  }
  .panel-divider {
    height: 1px;    /* 横向分隔线 */
    width: auto;
  }
  .panel-chart-cell { padding: 16px 18px; }
  .panel-table-cell { padding: 12px 0; }
}

@media (max-width: 767px) {
  .section { padding: 10px 12px 0; }
  .section-header { padding-top: 12px; }
  .dashboard { padding-bottom: 24px; }

  .header-card  { padding: 12px 14px; }
  .error-bar    { margin: 10px 12px 0; }

  .refresh-label { display: none; }
  .refresh-btn { padding: 8px 10px; }

  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .metrics-grid > :nth-child(3) { grid-column: 1 / -1; }
  .order-col {
    grid-column: 1 / -1;
    flex-direction: row;
    height: auto;
    gap: 10px;
  }
  .skel-cell { min-height: 140px; }

  .panel-chart-cell { padding: 12px 12px; }
}

@media (max-width: 420px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .metrics-grid > :nth-child(3) { grid-column: auto; }
  .order-col { flex-direction: column; }
}
</style>