<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { useBreakpoint } from '@/composables/useBreakpoint'
import SectionTitle from '@/components/base/SectionTitle.vue'
import { MetricCardSkeleton, ChartSkeleton, DelayedSkeleton } from '@/components'
import EChart from '@/components/charts/BaseEChart.vue'

const store = useGlobalStore()
const { isMaxMd } = useBreakpoint()

const loading = ref(true)
const error = ref('')

// 辅助函数
function getRateClass(rate: number): string {
  if (rate > 90) return 'danger'
  if (rate > 75) return 'warning'
  return 'success'
}

// 费用数据接口
interface ExpenseData {
  financial: ExpenseMetric
  sales: ExpenseMetric
  management: ExpenseMetric
}

interface ExpenseMetric {
  label: string
  amount: number
  amountText: string
  budgetAmount: number
  budgetUsage: number
  budgetUsageText: string
  yoyChange: number
  yoyChangeText: string
  trend: number[]
}

const expenseData = ref<ExpenseData | null>(null)

// 模拟数据加载
async function fetchExpenseData() {
  loading.value = true
  error.value = ''
  try {
    // TODO: 替换为真实 API 调用
    // const res = await api.getExpenseData(store.queryDate)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    expenseData.value = {
      financial: {
        label: '财务费用',
        amount: 1258000,
        amountText: '125.8万',
        budgetAmount: 1500000,
        budgetUsage: 83.87,
        budgetUsageText: '83.87%',
        yoyChange: -12.5,
        yoyChangeText: '-12.5%',
        trend: [180, 165, 142, 138, 125, 118, 132, 128, 115, 120, 110, 125.8]
      },
      sales: {
        label: '销售费用',
        amount: 3680000,
        amountText: '368.0万',
        budgetAmount: 4200000,
        budgetUsage: 87.62,
        budgetUsageText: '87.62%',
        yoyChange: 8.3,
        yoyChangeText: '+8.3%',
        trend: [280, 295, 310, 305, 320, 335, 342, 328, 315, 338, 350, 368]
      },
      management: {
        label: '管理费用',
        amount: 2150000,
        amountText: '215.0万',
        budgetAmount: 2400000,
        budgetUsage: 89.58,
        budgetUsageText: '89.58%',
        yoyChange: -3.2,
        yoyChangeText: '-3.2%',
        trend: [195, 188, 182, 178, 175, 172, 180, 176, 170, 168, 175, 215]
      }
    }
  } catch (e) {
    error.value = '获取费用数据失败，请重试'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function refresh() {
  fetchExpenseData()
}

// 图表配置
const chartHeight = computed(() => isMaxMd.value ? 220 : 280)

function getChartOption(data: number[], color: string): any {
  return {
    grid: { top: 10, right: 10, bottom: 20, left: 10 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 2.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' }
          ]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: (params: any) => `${params[0].name}<br/>${params[0].value}万`
    }
  }
}

const financialColor = '#3b82f6'
const salesColor = '#f59e0b'
const managementColor = '#8b5cf6'

onMounted(() => {
  fetchExpenseData()
})
</script>

<template>
  <div class="expense-dashboard">
    <!-- Header -->
    <section class="section section-header">
      <div class="header-card">
        <div class="header-left">
          <div class="header-accent" />
          <h1 class="header-title">三项费用监控</h1>
        </div>
        <div class="header-right">
          <div class="date-picker-wrap">
            <input type="date" v-model="store.queryDate" :max="store.yesterday" class="date-input" title="选择业务日期" />
          </div>
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

    <!-- 错误提示 -->
    <Transition name="fade">
      <div v-if="error" class="error-bar">
        <span>⚠️ {{ error }}</span>
        <button @click="refresh">重试</button>
      </div>
    </Transition>

    <!-- 费用指标卡 -->
    <section class="section">
      <SectionTitle title="费用总览" />
      <div class="metrics-grid">
        <!-- 财务费用 -->
        <DelayedSkeleton :loading="loading" :delay="300">
          <template #skeleton>
            <MetricCardSkeleton variant="blue" />
          </template>
          <template #content>
            <div v-if="expenseData" class="expense-card financial">
              <div class="card-header">
                <div class="card-icon financial-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <span class="card-label">{{ expenseData.financial.label }}</span>
                <span class="yoy-badge" :class="expenseData.financial.yoyChange > 0 ? 'up' : 'down'">
                  {{ expenseData.financial.yoyChangeText }}
                </span>
              </div>
              <div class="card-amount">{{ expenseData.financial.amountText }}</div>
              <div class="card-divider" />
              <div class="card-budget">
                <span class="budget-label">预算执行率</span>
                <span class="budget-value">{{ expenseData.financial.budgetUsageText }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill financial-fill" :style="{ width: expenseData.financial.budgetUsage + '%' }" />
              </div>
              <div class="card-chart">
                <EChart :option="getChartOption(expenseData.financial.trend, financialColor)" :height="chartHeight + 'px'" autoresize />
              </div>
            </div>
          </template>
        </DelayedSkeleton>

        <!-- 销售费用 -->
        <DelayedSkeleton :loading="loading" :delay="300">
          <template #skeleton>
            <MetricCardSkeleton variant="amber" />
          </template>
          <template #content>
            <div v-if="expenseData" class="expense-card sales">
              <div class="card-header">
                <div class="card-icon sales-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <span class="card-label">{{ expenseData.sales.label }}</span>
                <span class="yoy-badge" :class="expenseData.sales.yoyChange > 0 ? 'up' : 'down'">
                  {{ expenseData.sales.yoyChangeText }}
                </span>
              </div>
              <div class="card-amount">{{ expenseData.sales.amountText }}</div>
              <div class="card-divider" />
              <div class="card-budget">
                <span class="budget-label">预算执行率</span>
                <span class="budget-value">{{ expenseData.sales.budgetUsageText }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill sales-fill" :style="{ width: expenseData.sales.budgetUsage + '%' }" />
              </div>
              <div class="card-chart">
                <EChart :option="getChartOption(expenseData.sales.trend, salesColor)" :height="chartHeight + 'px'" autoresize />
              </div>
            </div>
          </template>
        </DelayedSkeleton>

        <!-- 管理费用 -->
        <DelayedSkeleton :loading="loading" :delay="300">
          <template #skeleton>
            <MetricCardSkeleton variant="purple" />
          </template>
          <template #content>
            <div v-if="expenseData" class="expense-card management">
              <div class="card-header">
                <div class="card-icon management-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span class="card-label">{{ expenseData.management.label }}</span>
                <span class="yoy-badge" :class="expenseData.management.yoyChange > 0 ? 'up' : 'down'">
                  {{ expenseData.management.yoyChangeText }}
                </span>
              </div>
              <div class="card-amount">{{ expenseData.management.amountText }}</div>
              <div class="card-divider" />
              <div class="card-budget">
                <span class="budget-label">预算执行率</span>
                <span class="budget-value">{{ expenseData.management.budgetUsageText }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill management-fill" :style="{ width: expenseData.management.budgetUsage + '%' }" />
              </div>
              <div class="card-chart">
                <EChart :option="getChartOption(expenseData.management.trend, managementColor)" :height="chartHeight + 'px'" autoresize />
              </div>
            </div>
          </template>
        </DelayedSkeleton>
      </div>
    </section>

    <!-- 费用对比分析 -->
    <section class="section">
      <SectionTitle title="费用对比分析" />
      <div class="comparison-panel">
        <DelayedSkeleton :loading="loading" :delay="300">
          <template #skeleton>
            <ChartSkeleton :height="isMaxMd ? '280px' : '380px'" />
          </template>
          <template #content>
            <div v-if="expenseData" class="comparison-chart">
              <EChart :option="{
                grid: { top: 40, right: 30, bottom: 30, left: 60 },
                legend: { data: ['财务费用', '销售费用', '管理费用'], top: 0 },
                xAxis: {
                  type: 'category',
                  data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                  axisLine: { lineStyle: { color: '#e2e8f0' } },
                  axisLabel: { color: '#64748b' }
                },
                yAxis: {
                  type: 'value',
                  name: '金额(万)',
                  nameTextStyle: { color: '#64748b', fontSize: 12 },
                  axisLine: { show: false },
                  splitLine: { lineStyle: { color: '#f1f5f9' } },
                  axisLabel: { color: '#64748b' }
                },
                series: [
                  {
                    name: '财务费用',
                    type: 'line',
                    data: expenseData.financial.trend,
                    smooth: true,
                    itemStyle: { color: financialColor },
                    lineStyle: { width: 2.5 }
                  },
                  {
                    name: '销售费用',
                    type: 'line',
                    data: expenseData.sales.trend,
                    smooth: true,
                    itemStyle: { color: salesColor },
                    lineStyle: { width: 2.5 }
                  },
                  {
                    name: '管理费用',
                    type: 'line',
                    data: expenseData.management.trend,
                    smooth: true,
                    itemStyle: { color: managementColor },
                    lineStyle: { width: 2.5 }
                  }
                ],
                tooltip: {
                  trigger: 'axis',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderColor: '#e2e8f0',
                  borderWidth: 1,
                  textStyle: { color: '#1e293b' }
                }
              }" :height="isMaxMd ? '280px' : '380px'" autoresize />
            </div>
          </template>
        </DelayedSkeleton>
      </div>
    </section>

    <!-- 费用明细表格 -->
    <section class="section">
      <SectionTitle title="费用明细" />
      <div class="detail-panel">
        <DelayedSkeleton :loading="loading" :delay="300">
          <template #skeleton>
            <div class="table-skeleton">
              <div v-for="i in 5" :key="i" class="skeleton-row" />
            </div>
          </template>
          <template #content>
            <div v-if="expenseData" class="detail-table">
              <table>
                <thead>
                  <tr>
                    <th>费用类型</th>
                    <th>本年累计</th>
                    <th>年度预算</th>
                    <th>预算执行率</th>
                    <th>同比变化</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="financial-row">
                    <td>
                      <div class="type-cell">
                        <div class="type-dot financial-dot" />
                        {{ expenseData.financial.label }}
                      </div>
                    </td>
                    <td class="number-cell">{{ expenseData.financial.amountText }}</td>
                    <td class="number-cell">{{ (expenseData.financial.budgetAmount / 10000).toFixed(0) }}万</td>
                    <td>
                      <span class="rate-badge" :class="getRateClass(expenseData.financial.budgetUsage)">
                        {{ expenseData.financial.budgetUsageText }}
                      </span>
                    </td>
                    <td>
                      <span class="yoy-tag" :class="expenseData.financial.yoyChange > 0 ? 'up' : 'down'">
                        {{ expenseData.financial.yoyChangeText }}
                      </span>
                    </td>
                  </tr>
                  <tr class="sales-row">
                    <td>
                      <div class="type-cell">
                        <div class="type-dot sales-dot" />
                        {{ expenseData.sales.label }}
                      </div>
                    </td>
                    <td class="number-cell">{{ expenseData.sales.amountText }}</td>
                    <td class="number-cell">{{ (expenseData.sales.budgetAmount / 10000).toFixed(0) }}万</td>
                    <td>
                      <span class="rate-badge" :class="getRateClass(expenseData.sales.budgetUsage)">
                        {{ expenseData.sales.budgetUsageText }}
                      </span>
                    </td>
                    <td>
                      <span class="yoy-tag" :class="expenseData.sales.yoyChange > 0 ? 'up' : 'down'">
                        {{ expenseData.sales.yoyChangeText }}
                      </span>
                    </td>
                  </tr>
                  <tr class="management-row">
                    <td>
                      <div class="type-cell">
                        <div class="type-dot management-dot" />
                        {{ expenseData.management.label }}
                      </div>
                    </td>
                    <td class="number-cell">{{ expenseData.management.amountText }}</td>
                    <td class="number-cell">{{ (expenseData.management.budgetAmount / 10000).toFixed(0) }}万</td>
                    <td>
                      <span class="rate-badge" :class="getRateClass(expenseData.management.budgetUsage)">
                        {{ expenseData.management.budgetUsageText }}
                      </span>
                    </td>
                    <td>
                      <span class="yoy-tag" :class="expenseData.management.yoyChange > 0 ? 'up' : 'down'">
                        {{ expenseData.management.yoyChangeText }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </DelayedSkeleton>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 基础样式 */
.expense-dashboard {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding-bottom: 40px;
}

.section {
  padding: 16px 24px 0;
}

.section-header {
  padding-top: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Header 样式 */
.header-card {
  background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%);
  border-radius: var(--radius-lg);
  padding: 16px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: var(--shadow-card);
  border: 1px solid #bfdbfe;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-accent {
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%);
  border-radius: 2px;
  flex-shrink: 0;
}

.header-title {
  font-size: var(--fs-md);
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: 0.03em;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-picker-wrap {
  display: flex;
  align-items: center;
}

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

.date-input:hover,
.date-input:focus {
  border-color: #2563eb;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.7);
  color: #2563eb;
  border: 1px solid #93c5fd;
  border-radius: var(--radius-sm);
  font-size: var(--fs-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--font-family);
  white-space: nowrap;
}

.refresh-btn:hover {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

/* 错误条 */
.error-bar {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  margin: 14px 24px 0;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--fs-xs);
  color: var(--color-danger);
}

/* 费用指标卡网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: stretch;
}

/* 费用卡片 */
.expense-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid transparent;
}

.expense-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 20px;
  height: 20px;
}

.financial-icon {
  background: #dbeafe;
  color: #2563eb;
}

.sales-icon {
  background: #fef3c7;
  color: #d97706;
}

.management-icon {
  background: #ede9fe;
  color: #7c3aed;
}

.card-label {
  font-size: var(--fs-sm);
  color: #374151;
  font-weight: 600;
  flex: 1;
}

.yoy-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #64748b;
}

.yoy-badge.up {
  background: #fee2e2;
  color: #dc2626;
}

.yoy-badge.down {
  background: #dcfce7;
  color: #16a34a;
}

/* 金额 */
.card-amount {
  font-size: var(--fs-xl);
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

/* 分隔线 */
.card-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0 0 10px;
}

/* 预算信息 */
.card-budget {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.budget-label {
  font-size: var(--fs-xs);
  color: #6b7280;
}

.budget-value {
  font-size: var(--fs-xs);
  font-weight: 700;
  color: #1e293b;
}

/* 进度条 */
.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 14px;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.financial-fill {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.sales-fill {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.management-fill {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

/* 趋势图 */
.card-chart {
  flex: 1;
  min-height: 180px;
}

/* 对比分析面板 */
.comparison-panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px;
}

.comparison-chart {
  width: 100%;
}

/* 明细面板 */
.detail-panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.table-skeleton {
  padding: 16px 20px;
}

.skeleton-row {
  height: 40px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  margin-bottom: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.detail-table {
  overflow-x: auto;
}

.detail-table table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.detail-table td {
  padding: 14px 16px;
  font-size: var(--fs-xs);
  border-bottom: 1px solid #f1f5f9;
}

.type-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.financial-dot {
  background: #3b82f6;
}

.sales-dot {
  background: #f59e0b;
}

.management-dot {
  background: #8b5cf6;
}

.number-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #0f172a;
}

.rate-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.rate-badge.success {
  background: #dcfce7;
  color: #16a34a;
}

.rate-badge.warning {
  background: #fef3c7;
  color: #d97706;
}

.rate-badge.danger {
  background: #fee2e2;
  color: #dc2626;
}

.yoy-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.yoy-tag.up {
  background: #fee2e2;
  color: #dc2626;
}

.yoy-tag.down {
  background: #dcfce7;
  color: #16a34a;
}

/* 响应式设计 */
@media (max-width: 1199px) {
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .metrics-grid > :last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .section {
    padding: 10px 12px 0;
  }
  
  .section-header {
    padding-top: 12px;
  }
  
  .expense-dashboard {
    padding-bottom: 24px;
  }
  
  .header-card {
    padding: 12px 14px;
  }
  
  .error-bar {
    margin: 10px 12px 0;
  }
  
  .refresh-label {
    display: none;
  }
  
  .refresh-btn {
    padding: 8px 10px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .metrics-grid > :last-child {
    grid-column: auto;
  }
  
  .expense-card {
    padding: 16px;
  }
  
  .card-chart {
    min-height: 150px;
  }
}

@media (max-width: 420px) {
  .card-header {
    flex-wrap: wrap;
  }
  
  .card-amount {
    font-size: var(--fs-lg);
  }
}
</style>
