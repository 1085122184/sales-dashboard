<script setup lang="ts">
import { ref } from 'vue'
import { useDashboard } from '@/composables/useDashboard'
import { useSalesTrend } from '@/composables/useSalesTrend'
import SectionTitle from '@/components/SectionTitle.vue'
import MetricCard from '@/components/MetricCard.vue'
import CollectionCard from '@/components/CollectionCard.vue'
import OrderCard from '@/components/OrderCard.vue'
import PriceDeviationChart from '@/components/PriceDeviationChart.vue'
import PriceDeviationTable from '@/components/PriceDeviationTable.vue'
import SalesTrendChart from '@/components/SalesTrendChart.vue'
import SalesTrendTable from '@/components/SalesTrendTable.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'


const queryDate = ref(new Date().toISOString().split('T')[0])
const {
  metricsLoading, ordersLoading, deviationsLoading, isAnyLoading,
  error, salesVolume, salesAmount, collection, monthOrders, yearOrders,
  priceDeviations, refresh: refreshDashboard,
} = useDashboard(queryDate)

const { trendLoading, trends, selectedTrend, refresh: refreshTrends } = useSalesTrend(queryDate)
function refreshAll() {
  refreshDashboard()
  refreshTrends()
}
const selectedProduct = ref<string | null>(null)
const filteredPriceDeviations = ref<any[]>([])


function handleProductSelect(uniqueId: string | null) {
  selectedProduct.value = uniqueId
}
function handleDeviationFilter(filteredData: any[]) {
  filteredPriceDeviations.value = filteredData
}

function handleTrendSelect(uniqueId: string | null) {
  if (!uniqueId) { selectedTrend.value = null; return }
  const t = trends.value.find(x => `${x.productCode}-${x.region}` === uniqueId)
  if (t) selectedTrend.value = t
}
</script>

<template>
  <div class="dashboard">
    <section class="section section-header">
      <div class="header-card">
        <div class="header-left">
          <div class="header-accent" />
          <h1 class="header-title">业务指标明细大盘</h1>
        </div>
        
        <div class="header-right">
          <div class="date-picker-wrap">
            <input type="date" v-model="queryDate" class="date-input" title="选择业务日期" />
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
        <LoadingSkeleton v-if="metricsLoading" height="100%" border-radius="14px" class="skel-cell" />
        <MetricCard v-else-if="salesVolume" :data="salesVolume" />

        <LoadingSkeleton v-if="metricsLoading" height="100%" border-radius="14px" class="skel-cell" />
        <MetricCard v-else-if="salesAmount" :data="salesAmount" variant="purple" />

        <LoadingSkeleton v-if="metricsLoading" height="100%" border-radius="14px" class="skel-cell" />
        <CollectionCard v-else-if="collection" :data="collection" />

        <div class="order-col">
          <template v-if="ordersLoading">
            <LoadingSkeleton height="48%" border-radius="14px" />
            <LoadingSkeleton height="48%" border-radius="14px" />
          </template>
          <template v-else>
            <OrderCard v-if="monthOrders" :data="monthOrders" />
            <OrderCard v-if="yearOrders" :data="yearOrders" />
          </template>
        </div>
      </div>
    </section>

    <section class="section">
      <SectionTitle title="价格偏差追踪" />
      <div class="deviation-grid">
        <div class="deviation-cell chart-cell">
          <LoadingSkeleton v-if="deviationsLoading" height="420px" border-radius="10px" />
          <PriceDeviationChart
            v-else
            :data="filteredPriceDeviations"
            :selected-product="selectedProduct"
            @clear-selection="selectedProduct = null"
          />
        </div>
        <div class="deviation-cell table-cell">
          <LoadingSkeleton v-if="deviationsLoading" height="420px" border-radius="10px" />
          <div v-else class="table-scroll-wrap">
            <PriceDeviationTable
              :data="priceDeviations"
              :selected-product="selectedProduct"
              @select="handleProductSelect"
              @filter-change="handleDeviationFilter"
            />
          </div>
        </div>
      </div>
    </section>

<section class="section">
  <SectionTitle title="量价趋势分析" />
  <div class="trend-grid">
  <div class="trend-chart-cell">
    <LoadingSkeleton v-if="trendLoading" height="420px" border-radius="10px" />
    <SalesTrendChart
      v-else
      :data="trends"
      :selected-product="selectedTrend ? `${selectedTrend.productCode}-${selectedTrend.region}` : null"
      @clear-selection="handleTrendSelect(null)"
    />
  </div>
    <div class="trend-table-cell">
    <LoadingSkeleton v-if="trendLoading" height="420px" border-radius="10px" />
    <div v-else class="table-scroll-wrap">
      <SalesTrendTable
        :data="trends"
        :selected-product="selectedTrend ? `${selectedTrend.productCode}-${selectedTrend.region}` : ''"
        @select="handleTrendSelect"
      />
    </div>
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
.header-card { background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%); border-radius: var(--radius-lg); padding: 16px 22px; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--shadow-card); border: 1px solid #bfdbfe; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-accent { width: 4px; height: 20px; background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%); border-radius: 2px; flex-shrink: 0; }
.header-title { font-size: var(--fs-md); font-weight: 700; color: #1e3a5f; letter-spacing: 0.03em; margin: 0; }
.refresh-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.7); color: #2563eb; border: 1px solid #93c5fd; border-radius: var(--radius-sm); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: var(--font-family); white-space: nowrap; }
.refresh-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.icon { width: 15px; height: 15px; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }
.error-bar { background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); margin: 14px 24px 0; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; font-size: var(--fs-xs); color: var(--color-danger); }
.metrics-grid { display: grid; grid-template-columns: 1.2fr 1.2fr 1.2fr 1fr; gap: 16px; align-items: stretch; }
.skel-cell { min-height: 180px; }
.order-col { display: flex; flex-direction: column; justify-content: space-between; gap: 12px; height: 100%; }
.deviation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; background: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden; }
.deviation-cell { min-width: 0; }
.deviation-cell.chart-cell { padding: 20px 24px; border-right: 1px solid #f1f5f9; }
.deviation-cell.table-cell { padding: 20px 0; }
.trend-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 0; background: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden; }
.trend-chart-cell { min-width: 0; padding: 20px 24px; border-right: 1px solid #f1f5f9; }
.trend-table-cell { min-width: 0; padding: 20px 0; }
.table-scroll-wrap { width: 100%; overflow-x: auto; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
.table-scroll-wrap::-webkit-scrollbar { height: 6px; }
.table-scroll-wrap::-webkit-scrollbar-track { background: transparent; }
.table-scroll-wrap::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.table-scroll-wrap > * { min-width: 680px; }
@media (max-width: 1200px) { .metrics-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; } .metrics-grid > :nth-child(3) { grid-column: 1 / 2; } .order-col { grid-column: 2 / 3; grid-row: 2 / 3; flex-direction: row; height: auto; } }
@media (max-width: 960px) { .deviation-grid, .trend-grid { grid-template-columns: 1fr; } .deviation-cell.chart-cell, .trend-chart-cell { border-right: none; border-bottom: 1px solid #f1f5f9; } }
@media (max-width: 768px) { .section { padding: 14px 16px 0; } .metrics-grid { grid-template-columns: 1fr; } .metrics-grid > :nth-child(3), .order-col { grid-column: auto; grid-row: auto; } .order-col { flex-direction: row; height: auto; gap: 12px; } }
@media (max-width: 480px) { .order-col { flex-direction: column; } }
.header-right { display: flex; align-items: center; gap: 12px; }
.date-picker-wrap { display: flex; align-items: center; }
.date-input {
  padding: 7px 12px;
  border: 1px solid #93c5fd;
  border-radius: var(--radius-sm);
  color: #1e3a5f;
  background-color: rgba(255, 255, 255, 0.8);
  outline: none;
  font-family: inherit;
  font-size: var(--fs-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.date-input:hover, .date-input:focus {
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
/* 隐藏原生日期输入框的默认轮廓，让它看起来更 SaaS 化 */
.date-input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: 0.2s; }
.date-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }

</style>