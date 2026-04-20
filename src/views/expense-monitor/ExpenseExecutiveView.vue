<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EChart from '@/components/charts/BaseEChart.vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/store/useGlobalStore'
import { useExpenseExecutive } from '@/composables/useExpenseExecutive'

const router = useRouter()
const store = useGlobalStore()

// 使用 composables
const {
  overviewLoading,
  comparisonLoading,
  structureLoading,
  trendLoading,
  detailLoading,
  isAnyLoading,
  error,
  overview,
  companyComparison,
  expenseStructure,
  expenseTrend,
  companyDetail,
  searchKeyword,
  refreshAll,
  handleSearch
} = useExpenseExecutive()

// ==================== 图表类型切换 ====================
const leftChartType = ref<'bar' | 'radar'>('bar')
const rightChartType = ref<'donut' | 'pie'>('donut')

// ==================== 搜索功能 ====================
const searchQuery = computed({
  get: () => searchKeyword.value,
  set: (val: string) => handleSearch(val)
})

// 颜色配置
const colors = {
  sales: '#3b82f6',
  management: '#a855f7',
  finance: '#06b6d4'
}

// ==================== 路由跳转 ====================
function goToDetail(companyName: string) {
  // TODO: 跳转到对应公司的详情页面
  console.log('跳转到:', companyName)
}


// ==================== 图表配置 ====================

// 三费趋势分析图表
const trendChartOption = computed(() => {
  if (!expenseTrend.value) return {}
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#94a3b8' },
        lineStyle: { color: '#94a3b8', type: 'dashed' }
      },
      formatter: (params: any) => {
        let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].name}</div>`
        params.forEach((p: any) => {
          result += `<div style="display: flex; align-items: center; gap: 6px; margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color};"></span>
            <span>${p.seriesName}: ¥${p.value.toFixed(2)}万</span>
          </div>`
        })
        return result
      }
    },
    legend: {
      data: ['销售费用', '管理费用', '财务费用'],
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      textStyle: { color: '#64748b', fontSize: 12 }
    },
    grid: {
      top: 50,
      right: 30,
      bottom: 50,
      left: 80
    },
    xAxis: {
      type: 'category',
      data: expenseTrend.value.months,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 12, margin: 12 },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '万元',
      nameTextStyle: { color: '#64748b', fontSize: 12, padding: [0, 0, 0, 10] },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        margin: 12,
        formatter: (value: number) => `¥${value.toFixed(1)}万`,
        width: 60,
        align: 'right'
      },
      min: 0,
      max: 0.6
    },
    series: [
      {
        name: '销售费用',
        type: 'line',
        data: expenseTrend.value.sales,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: colors.sales, width: 2.5 },
        itemStyle: { color: colors.sales },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
            ]
          }
        }
      },
      {
        name: '管理费用',
        type: 'line',
        data: expenseTrend.value.management,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: colors.management, width: 2.5 },
        itemStyle: { color: colors.management },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168, 85, 247, 0.2)' },
              { offset: 1, color: 'rgba(168, 85, 247, 0.02)' }
            ]
          }
        }
      },
      {
        name: '财务费用',
        type: 'line',
        data: expenseTrend.value.finance,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: colors.finance, width: 2.5 },
        itemStyle: { color: colors.finance },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6, 182, 212, 0.2)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.02)' }
            ]
          }
        }
      }
    ]
  }
})

// 左侧图表：各公司三费对比
const leftChartOption = computed(() => {
  if (!companyComparison.value.length) return {}
  
  if (leftChartType.value === 'bar') {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 12 },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 0, 0, 0.05)' } }
      },
      legend: {
        data: ['销售费用', '管理费用', '财务费用'],
        top: 0,
        right: 0,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      grid: { top: 40, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: 'category',
        data: companyComparison.value.map(d => d.name),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        name: '万元',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      series: [
        {
          name: '销售费用',
          type: 'bar',
          data: companyComparison.value.map(d => d.sales),
          barWidth: '20%',
          itemStyle: { color: colors.sales, borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '管理费用',
          type: 'bar',
          data: companyComparison.value.map(d => d.management),
          barWidth: '20%',
          itemStyle: { color: colors.management, borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '财务费用',
          type: 'bar',
          data: companyComparison.value.map(d => d.finance),
          barWidth: '20%',
          itemStyle: { color: colors.finance, borderRadius: [4, 4, 0, 0] }
        }
      ]
    }
  } else {
    // 雷达图
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 12 }
      },
      legend: {
        data: companyComparison.value.map(d => d.name),
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      radar: {
        indicator: [
          { name: '销售费用', max: 2 },
          { name: '管理费用', max: 2 },
          { name: '财务费用', max: 1 }
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        splitArea: { show: true, areaStyle: { color: ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.04)'] } },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      series: [{
        type: 'radar',
        data: companyComparison.value.map((d, i) => ({
          value: [d.sales, d.management, d.finance],
          name: d.name,
          lineStyle: { width: 2 },
          itemStyle: { color: ['#3b82f6', '#a855f7', '#06b6d4', '#f59e0b'][i] },
          areaStyle: { opacity: 0.15 }
        }))
      }]
    }
  }
})

// 右侧图表：费用结构分析
const rightChartOption = computed(() => {
  if (!expenseStructure.value.length) return {}
  
  const isDonut = rightChartType.value === 'donut'
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: '{b}: {c}万 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '8%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12,
      textStyle: { color: '#64748b', fontSize: 12 }
    },
    series: [{
      type: 'pie',
      radius: isDonut ? ['45%', '70%'] : '70%',
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: isDonut ? 8 : 0,
        borderColor: '#ffffff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#1e293b'
        }
      },
      data: expenseStructure.value.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: { color: [colors.sales, colors.management, colors.finance][index] }
      }))
    }]
  }
})
</script>

<template>
  <div class="executive-dashboard">
    <!-- ── Header ── -->
    <section class="section section-header">
      <div class="header-card">
        <div class="header-left">
          <div class="header-accent" />
          <h1 class="header-title">集团三费监控</h1>
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

    <!-- 顶部指标卡片区 -->
    <section class="section">
      <div class="metrics-grid">
        <!-- 三费总额 -->
        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span class="trend-badge" :class="overview?.totalExpense.yoyChange > 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
              {{ Math.abs(overview?.totalExpense.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">三费总额</div>
          <div class="card-amount">¥<span class="number">{{ overview?.totalExpense.amount || 0 }}</span>{{ overview?.totalExpense.unit || '万' }}</div>
          <div class="card-subtitle">{{ overview?.totalExpense.yoyChangeText || '' }}</div>
        </div>

        <!-- 销售费用 -->
        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span class="trend-badge" :class="overview?.salesExpense.yoyChange > 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
              {{ Math.abs(overview?.salesExpense.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">销售费用</div>
          <div class="card-amount">¥<span class="number">{{ overview?.salesExpense.amount || 0 }}</span>{{ overview?.salesExpense.unit || '万' }}</div>
          <div class="card-subtitle">占比 {{ overview?.salesExpense.percent || 0 }}%</div>
        </div>

        <!-- 管理费用 -->
        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span class="trend-badge" :class="overview?.managementExpense.yoyChange > 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
              {{ Math.abs(overview?.managementExpense.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">管理费用</div>
          <div class="card-amount">¥<span class="number">{{ overview?.managementExpense.amount || 0 }}</span>{{ overview?.managementExpense.unit || '万' }}</div>
          <div class="card-subtitle">占比 {{ overview?.managementExpense.percent || 0 }}%</div>
        </div>

        <!-- 财务费用 -->
        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span class="trend-badge" :class="overview?.financeExpense.yoyChange > 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
              {{ Math.abs(overview?.financeExpense.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">财务费用</div>
          <div class="card-amount">¥<span class="number">{{ overview?.financeExpense.amount || 0 }}</span>{{ overview?.financeExpense.unit || '万' }}</div>
          <div class="card-subtitle">占比 {{ overview?.financeExpense.percent || 0 }}%</div>
        </div>
      </div>
    </section>

    <!-- 图表区域 -->
    <section class="section charts-section">
      <div class="charts-grid">
        <!-- 左侧：各公司三费对比 -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <h3 class="chart-title">各公司三费对比</h3>
              <span class="chart-subtitle">单位：万元</span>
            </div>
            <div class="chart-switcher">
              <button class="switch-btn active" :class="{ active: leftChartType === 'bar' }" @click="leftChartType = 'bar'">柱状图</button>
              <!-- <button class="switch-btn" :class="{ active: leftChartType === 'radar' }" @click="leftChartType = 'radar'">雷达图</button> -->
            </div>
          </div>
          <div class="chart-body">
            <EChart :option="leftChartOption" height="100%" autoresize class="absolute-chart" />
          </div>
        </div>

        <!-- 右侧：费用结构分析 -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <h3 class="chart-title">费用结构分析</h3>
              <span class="chart-subtitle">2024年度占比</span>
            </div>
            <div class="chart-switcher">
              <button class="switch-btn active" :class="{ active: rightChartType === 'donut' }" @click="rightChartType = 'donut'">环形图</button>
              <button class="switch-btn" :class="{ active: rightChartType === 'pie' }" @click="rightChartType = 'pie'">饼图</button>
            </div>
          </div>
          <div class="chart-body">
            <EChart :option="rightChartOption" height="100%" autoresize class="absolute-chart" />
          </div>
        </div>
      </div>
    </section>

    <!-- 三费趋势分析 -->
    <section class="section trend-section">
      <div class="trend-card-full">
        <div class="chart-header">
          <div class="chart-title-wrap">
            <h3 class="chart-title">三费趋势分析</h3>
            <span class="chart-subtitle">近12个月变化趋势</span>
          </div>
        </div>
        <div class="trend-chart-body">
          <EChart :option="trendChartOption" height="100%" autoresize class="absolute-chart"/>
        </div>
      </div>
    </section>

    <!-- 各公司三费明细 -->
    <!-- <section class="section detail-section">
      <div class="detail-card-full">
        <div class="detail-header-row">
          <div class="detail-title-wrap">
            <h3 class="detail-card-title">各公司三费明细</h3>
            <span class="detail-subtitle">点击查看详细数据</span>
          </div>
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索公司..."
              class="search-input"
            />
          </div>
        </div>
        <div class="table-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                <th>公司名称</th>
                <th>销售费用</th>
                <th>管理费用</th>
                <th>财务费用</th>
                <th>合计</th>
                <th>同比</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(company, index) in companyDetail.list" :key="company.name">
                <td>
                  <div class="company-cell">
                    <span class="company-rank">{{ index + 1 }}</span>
                    <span class="company-name">{{ company.name }}</span>
                  </div>
                </td>
                <td class="number-cell">¥{{ company.sales }}万</td>
                <td class="number-cell">¥{{ company.management }}万</td>
                <td class="number-cell">¥{{ company.finance }}万</td>
                <td class="number-cell total-cell">¥{{ company.total }}万</td>
                <td>
                  <span class="yoy-badge-table" :class="company.yoy > 0 ? 'up' : 'down'">
                    {{ company.yoy > 0 ? '+' : '' }}{{ company.yoy }}%
                  </span>
                </td>
                <td>
                  <button class="detail-btn" @click="goToDetail(company.name)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section> -->
  </div>
</template>

<style scoped>

.executive-dashboard {
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

/* ── Header ── */
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

.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  transition: 0.2s;
}

.date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
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

/* ==================== 顶部指标卡片区 ==================== */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.icon-blue {
  background: #dbeafe;
  color: #2563eb;
}

.icon-purple {
  background: #ede9fe;
  color: #7c3aed;
}

.icon-cyan {
  background: #cffafe;
  color: #0891b2;
}

.icon-orange {
  background: #fef3c7;
  color: #d97706;
}

.card-label {
  font-size: var(--fs-sm);
  color: #374151;
  font-weight: 500;
  margin-bottom: 8px;
}

.card-amount {
  font-size: var(--fs-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.card-amount .number {
  font-variant-numeric: tabular-nums;
}

.card-subtitle {
  font-size: var(--fs-xs);
  color: var(--color-text-secondary);
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.trend-badge.up {
  background: #dcfce7;
  color: #16a34a;
}

.trend-badge.down {
  background: #fee2e2;
  color: #dc2626;
}

.arrow-icon {
  width: 14px;
  height: 14px;
}

/* ==================== 图表区域 ==================== */
.charts-section {
  margin-top: 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.chart-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.chart-title {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.chart-subtitle {
  font-size: var(--fs-xs);
  color: var(--color-text-secondary);
}

.chart-switcher {
  display: flex;
  gap: 8px;
}

.switch-btn {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  background: #f1f5f9;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.switch-btn:hover {
  background: #e2e8f0;
  color: var(--color-text-primary);
}

.switch-btn.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.chart-body,
.trend-chart-body {
  flex: 1;
  position: relative;
  min-height: 280px;
  width: 100%;
}

.absolute-chart {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* ==================== 趋势分析区域 ==================== */
.trend-section {
  margin-top: 0;
}

.trend-card-full {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

/* ==================== 明细表格区域 ==================== */
.detail-section {
  margin-top: 0;
}

.detail-card-full {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

.detail-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.detail-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.detail-card-title {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.detail-subtitle {
  font-size: var(--fs-xs);
  color: var(--color-text-secondary);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  padding: 7px 14px 7px 36px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--fs-xs);
  outline: none;
  transition: all 0.2s;
  width: 220px;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  border-color: #2563eb;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.table-wrapper {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.table-wrapper::-webkit-scrollbar {
  height: 6px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.detail-table thead {
  background: #f8fafc;
}

.detail-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.detail-table td {
  padding: 14px 16px;
  font-size: var(--fs-xs);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.detail-table tbody tr {
  transition: background 0.2s;
}

.detail-table tbody tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

.company-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.company-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.company-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.number-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.total-cell {
  font-weight: 700;
  color: var(--color-text-primary);
}

.yoy-badge-table {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.yoy-badge-table.up {
  background: #fee2e2;
  color: #dc2626;
}

.yoy-badge-table.down {
  background: #dcfce7;
  color: #16a34a;
}

.detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.detail-btn svg {
  width: 14px;
  height: 14px;
}

.detail-btn:hover {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1199px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1023px) {
  .section {
    padding: 12px 16px 0;
  }

  .chart-card,
  .trend-card-full,
  .detail-card-full {
    padding: 16px 18px;
    min-height: 360px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 767px) {
  .section {
    padding: 10px 12px 0;
  }

  .section-header {
    padding-top: 12px;
  }

  .executive-dashboard {
    padding-bottom: 24px;
  }

  .header-card {
    padding: 12px 14px;
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

  .metric-card {
    padding: 16px;
  }

  .card-amount {
    font-size: var(--fs-lg);
  }

  .chart-card,
  .trend-card-full,
  .detail-card-full {
    padding: 16px;
    min-height: 320px;
  }

  .chart-body,
  .trend-chart-body {
    min-height: 260px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .detail-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-box {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .detail-table th,
  .detail-table td {
    padding: 10px 12px;
    font-size: 12px;
  }

  .company-rank {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .detail-btn {
    padding: 5px 10px;
    font-size: 11px;
  }
}

@media (max-width: 420px) {
  .card-amount {
    font-size: 22px;
  }

  .card-icon {
    width: 36px;
    height: 36px;
  }

  .card-icon svg {
    width: 20px;
    height: 20px;
  }

  .trend-card-full,
  .detail-card-full {
    min-height: 300px;
  }
}
</style>
