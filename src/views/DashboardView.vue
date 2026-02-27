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

const {
  loading, error,
  salesVolume, salesAmount, collection,
  monthOrders, yearOrders,
  priceDeviations,
  refresh,
} = useDashboard()

const { trendLoading, trends, selectedTrend } = useSalesTrend()

/** 当前选中的产品名，null 表示无选中 */
const selectedProduct = ref<string | null>(null)

function handleProductSelect(product: string | null) {
  selectedProduct.value = product
}
</script>

<template>
  <div class="dashboard">

    <!-- 标题卡片 -->
    <section class="section section-header">
      <div class="header-card">
        <div class="header-left">
          <div class="header-accent" />
          <h1 class="header-title">销售指标</h1>
        </div>
        <button class="refresh-btn" :disabled="loading" @click="refresh">
          <svg class="icon" :class="{ spinning: loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span class="refresh-label">刷新</span>
        </button>
      </div>
    </section>

    <!-- 错误提示 -->
    <Transition name="fade">
      <div v-if="error" class="error-bar">
        <span>⚠️ {{ error }}</span>
        <button @click="refresh">重试</button>
      </div>
    </Transition>

    <!-- 指标卡片区 -->
    <section class="section">
      <div class="metrics-grid">
        <LoadingSkeleton v-if="loading" height="100%" border-radius="14px" class="skel-cell" />
        <MetricCard v-else-if="salesVolume" :data="salesVolume" />

        <LoadingSkeleton v-if="loading" height="100%" border-radius="14px" class="skel-cell" />
        <MetricCard v-else-if="salesAmount" :data="salesAmount" variant="purple" />

        <LoadingSkeleton v-if="loading" height="100%" border-radius="14px" class="skel-cell" />
        <CollectionCard v-else-if="collection" :data="collection" />

        <div class="order-col">
          <template v-if="loading">
            <LoadingSkeleton height="50%" border-radius="14px" />
            <LoadingSkeleton height="50%" border-radius="14px" />
          </template>
          <template v-else>
            <OrderCard v-if="monthOrders" :data="monthOrders" />
            <OrderCard v-if="yearOrders" :data="yearOrders" />
          </template>
        </div>
      </div>
    </section>

    <!-- 价格偏差区 -->
    <section class="section">
      <SectionTitle title="价格偏差" />
      <div class="deviation-grid">
        <div class="deviation-cell">
          <LoadingSkeleton v-if="loading" height="420px" border-radius="10px" />
          <PriceDeviationChart
            v-else
            :data="priceDeviations"
            :selected-product="selectedProduct"
          />
        </div>
        <div class="deviation-cell">
          <LoadingSkeleton v-if="loading" height="420px" border-radius="10px" />
          <PriceDeviationTable
            v-else
            :data="priceDeviations"
            :selected-product="selectedProduct"
            @select="handleProductSelect"
          />
        </div>
      </div>
    </section>

    <!-- 销售趋势区 -->
    <section class="section">
      <SectionTitle title="销售趋势" />
      <div class="trend-grid">
        <!-- 左：趋势折线图 -->
        <div class="trend-chart-cell">
          <LoadingSkeleton v-if="trendLoading" height="420px" border-radius="10px" />
          <SalesTrendChart v-else-if="selectedTrend" :product="selectedTrend" />
        </div>
        <!-- 右：产品列表表格 -->
        <div class="trend-table-cell">
          <LoadingSkeleton v-if="trendLoading" height="420px" border-radius="10px" />
          <SalesTrendTable
            v-else
            :data="trends"
            :selected-product="selectedTrend?.product ?? ''"
            @select="(p) => { const t = trends.find(x => x.product === p); if(t) selectedTrend = t }"
          />
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding-bottom: 40px;
}

.section { padding: 16px 24px 0; }
.section-header { padding-top: 20px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 标题卡片 */
.header-card {
  background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%);
  border-radius: var(--radius-lg);
  padding: 16px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-card);
  border: 1px solid #bfdbfe;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-accent {
  width: 4px; height: 20px;
  background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%);
  border-radius: 2px; flex-shrink: 0;
}
.header-title { font-size: 17px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.03em; }

.refresh-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.7); color: #2563eb;
  border: 1px solid #93c5fd; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.15s ease; font-family: var(--font-family); white-space: nowrap;
}
.refresh-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.icon { width: 14px; height: 14px; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

/* 错误栏 */
.error-bar {
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: var(--radius-md); margin: 14px 24px 0;
  padding: 10px 16px; display: flex; align-items: center;
  justify-content: space-between; font-size: 13px; color: var(--color-danger);
}
.error-bar button {
  padding: 4px 12px; background: var(--color-danger); color: #fff;
  border: none; border-radius: 4px; cursor: pointer; font-family: var(--font-family);
}

/* 指标卡片网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: minmax(0, 326px) minmax(0, 326px) minmax(0, 326px) 1fr;
  grid-template-rows: 1fr;
  gap: 14px;
  align-items: stretch;
}
.skel-cell { min-height: 180px; }
.order-col { display: flex; flex-direction: column; gap: 12px; height: 100%; }

/* 价格偏差区 */
.deviation-grid {
  display: grid;
  grid-template-columns: 0.7fr 1fr;
  gap: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.deviation-cell { min-width: 0; padding: 20px 24px; }
.deviation-cell:first-child { border-right: 1px solid #f1f5f9; }

/* 销售趋势区 */
.trend-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.trend-chart-cell { min-width: 0; padding: 20px 24px; border-right: 1px solid #f1f5f9; }
.trend-table-cell { min-width: 0; padding: 20px 0 20px 0; }

/* 响应式 */
@media (max-width: 1100px) {
  .metrics-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
  .metrics-grid > :nth-child(3) { grid-column: 1 / 2; }
  .order-col { grid-column: 2 / 3; grid-row: 2 / 3; flex-direction: column; height: auto; }
}
@media (max-width: 860px) {
  .section { padding: 14px 16px 0; }
  .section-header { padding-top: 14px; }
  .metrics-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
  .metrics-grid > :nth-child(3), .order-col { grid-column: auto; grid-row: auto; }
  .order-col { flex-direction: row; height: auto; }
  .deviation-grid { grid-template-columns: 1fr; }
  .deviation-cell:first-child { border-right: none; border-bottom: 1px solid #f1f5f9; }
  .trend-grid { grid-template-columns: 1fr; }
  .trend-chart-cell { border-right: none; border-bottom: 1px solid #f1f5f9; }
}
@media (max-width: 600px) {
  .section { padding: 12px 12px 0; }
  .section-header { padding-top: 12px; }
  .header-card { padding: 12px 16px; }
  .header-title { font-size: 15px; }
  .refresh-label { display: none; }
  .refresh-btn { padding: 7px 10px; }
  .metrics-grid { grid-template-columns: 1fr; grid-template-rows: none; gap: 10px; }
  .metrics-grid > :nth-child(3), .order-col { grid-column: 1; grid-row: auto; }
  .order-col { flex-direction: row; height: auto; gap: 10px; }
  .deviation-grid { grid-template-columns: 1fr; }
  .deviation-cell { padding: 14px 16px; }
  .deviation-cell:first-child { border-right: none; border-bottom: 1px solid #f1f5f9; }
}
@media (max-width: 380px) {
  .order-col { flex-direction: column; }
}
</style>
