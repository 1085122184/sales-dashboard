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

const selectedProduct = ref<string | null>(null)
function handleProductSelect(product: string | null) {
  selectedProduct.value = product
}

const deviationChartOpen = ref(true)
const trendChartOpen = ref(true)
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
      <div class="section-title-row">
        <SectionTitle title="价格偏差" />
        <button class="chart-toggle" @click="deviationChartOpen = !deviationChartOpen">
          <svg class="toggle-icon" :class="{ rotated: !deviationChartOpen }" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 8l5 5 5-5"/>
          </svg>
          {{ deviationChartOpen ? '收起图表' : '展开图表' }}
        </button>
      </div>
      <div class="module-card">
        <Transition name="chart-collapse">
          <div v-if="deviationChartOpen" class="chart-cell">
            <LoadingSkeleton v-if="loading" height="300px" border-radius="10px" />
            <PriceDeviationChart v-else :data="priceDeviations" :selected-product="selectedProduct" />
          </div>
        </Transition>
        <div v-if="!deviationChartOpen" class="chart-collapsed-bar">
          <span class="collapsed-label">📊 价格偏差图表已收起</span>
          <span v-if="priceDeviations.length" class="collapsed-stats">
            <span class="cstat danger">严重 {{ priceDeviations.filter(d => d.deviationRate <= -0.1).length }} 个</span>
            <span class="cstat warning">警告 {{ priceDeviations.filter(d => d.deviationRate > -0.1 && d.deviationRate < -0.05).length }} 个</span>
            <span class="cstat normal">正常 {{ priceDeviations.filter(d => d.deviationRate >= -0.05).length }} 个</span>
          </span>
          <button class="collapsed-btn" @click="deviationChartOpen = true">展开 ↑</button>
        </div>
        <div v-if="deviationChartOpen" class="cell-divider" />
        <div class="table-cell">
          <LoadingSkeleton v-if="loading" height="300px" border-radius="10px" />
          <PriceDeviationTable v-else :data="priceDeviations" :selected-product="selectedProduct" @select="handleProductSelect" />
        </div>
      </div>
    </section>

    <!-- 销售趋势区 -->
    <section class="section">
      <div class="section-title-row">
        <SectionTitle title="销售趋势" />
        <button class="chart-toggle" @click="trendChartOpen = !trendChartOpen">
          <svg class="toggle-icon" :class="{ rotated: !trendChartOpen }" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 8l5 5 5-5"/>
          </svg>
          {{ trendChartOpen ? '收起图表' : '展开图表' }}
        </button>
      </div>
      <div class="module-card">
        <Transition name="chart-collapse">
          <div v-if="trendChartOpen" class="chart-cell">
            <LoadingSkeleton v-if="trendLoading" height="300px" border-radius="10px" />
            <SalesTrendChart v-else-if="selectedTrend" :product="selectedTrend" />
          </div>
        </Transition>
        <div v-if="!trendChartOpen" class="chart-collapsed-bar">
          <span class="collapsed-label">📈 销售趋势图表已收起</span>
          <span v-if="selectedTrend" class="collapsed-stats">
            当前查看：<b>{{ selectedTrend.product }}</b>
            <span class="cstat" :class="selectedTrend.correlation >= 0 ? 'normal' : 'danger'">
              相关系数 {{ selectedTrend.correlation > 0 ? '+' : '' }}{{ selectedTrend.correlation }}
            </span>
          </span>
          <button class="collapsed-btn" @click="trendChartOpen = true">展开 ↑</button>
        </div>
        <div v-if="trendChartOpen" class="cell-divider" />
        <div class="table-cell">
          <LoadingSkeleton v-if="trendLoading" height="300px" border-radius="10px" />
          <SalesTrendTable
            v-else
            :data="trends"
            :selected-product="selectedTrend?.product ?? ''"
            @select="(p) => { const t = trends.find(x => x.product === p); if (t) selectedTrend = t }"
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
.header-title { font-size: var(--fs-md); font-weight: 700; color: #1e3a5f; letter-spacing: 0.03em; }

.refresh-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.7); color: #2563eb;
  border: 1px solid #93c5fd; border-radius: var(--radius-sm);
  font-size: var(--fs-xs); font-weight: 500; cursor: pointer;
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
  justify-content: space-between; font-size: var(--fs-xs); color: var(--color-danger);
}
.error-bar button {
  padding: 4px 12px; background: var(--color-danger); color: #fff;
  border: none; border-radius: 4px; cursor: pointer; font-family: var(--font-family);
}

/* 指标卡片网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: minmax(0, 260px) minmax(0, 260px) minmax(0, 260px) 1fr;
  gap: 14px;
  align-items: stretch;
}
.skel-cell { min-height: 180px; }
.order-col { display: flex; flex-direction: column; gap: 12px; height: 100%; }

/* 模块卡片 */
.module-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* 标题行 */
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 2px;
}

/* 收起/展开按钮 */
.chart-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  color: #64748b;
  font-size: var(--fs-xs);
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}
.chart-toggle:hover { background: #f0f6ff; color: #2563eb; border-color: #93c5fd; }
.toggle-icon { width: 14px; height: 14px; flex-shrink: 0; transition: transform 0.3s ease; }
.toggle-icon.rotated { transform: rotate(-180deg); }

/* 图表区：限制最大宽度避免条形图过长 */
.chart-cell {
  padding: 20px 28px 16px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 分割线 */
.cell-divider { height: 1px; background: #f1f5f9; margin: 0 20px; }

/* 表格区 */
.table-cell { padding: 20px 0 12px; }

/* 收起摘要条 */
.chart-collapsed-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background: #f8faff;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.collapsed-label { font-size: var(--fs-xs); color: #6b7280; }
.collapsed-stats { display: flex; align-items: center; gap: 10px; font-size: var(--fs-xs); }
.cstat { padding: 2px 10px; border-radius: 20px; font-weight: 600; font-size: var(--fs-xs); }
.cstat.danger  { background: #fee2e2; color: #dc2626; }
.cstat.warning { background: #fef3c7; color: #d97706; }
.cstat.normal  { background: #dcfce7; color: #16a34a; }
.collapsed-btn {
  margin-left: auto; padding: 3px 12px; border: 1px solid #e2e8f0; border-radius: 6px;
  background: #fff; color: #2563eb; font-size: var(--fs-xs); font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.collapsed-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

/* 折叠动画 */
.chart-collapse-enter-active { transition: all 0.3s ease; overflow: hidden; }
.chart-collapse-leave-active { transition: all 0.25s ease; overflow: hidden; }
.chart-collapse-enter-from, .chart-collapse-leave-to { opacity: 0; max-height: 0; padding: 0; }
.chart-collapse-enter-to, .chart-collapse-leave-from { opacity: 1; max-height: 500px; }

/* 响应式 */
@media (max-width: 1100px) {
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .metrics-grid > :nth-child(3) { grid-column: 1 / 2; }
  .order-col { grid-column: 2 / 3; grid-row: 2 / 3; flex-direction: column; height: auto; }
}
@media (max-width: 860px) {
  .section { padding: 14px 16px 0; }
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .metrics-grid > :nth-child(3), .order-col { grid-column: auto; grid-row: auto; }
  .order-col { flex-direction: row; height: auto; }
  .chart-cell { padding: 16px 16px 12px; }
}
@media (max-width: 600px) {
  .section { padding: 12px 12px 0; }
  .header-card { padding: 12px 16px; }
  .header-title { font-size: var(--fs-base); }
  .refresh-label { display: none; }
  .refresh-btn { padding: 7px 10px; }
  .metrics-grid { grid-template-columns: 1fr; gap: 10px; }
  .metrics-grid > :nth-child(3), .order-col { grid-column: 1; grid-row: auto; }
  .order-col { flex-direction: row; height: auto; gap: 10px; }
  .chart-cell { padding: 14px 12px 10px; }
}
@media (max-width: 380px) {
  .order-col { flex-direction: column; }
}
</style>