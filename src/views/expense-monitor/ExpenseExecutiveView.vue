<script setup lang="ts">
import { ref, computed } from 'vue'
import EChart from '@/components/charts/BaseEChart.vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { useExpenseExecutive } from '@/composables/useExpenseExecutive'
import { CHART_COLORS } from '@/config/chartTheme'

const store = useGlobalStore()

const {
  isAnyLoading,
  budgetExecutionLoading,
  growthLoading,        
  companyGrowthData,    
  overview,
  companyComparison,
  expenseStructure,
  expenseTrend,
  budgetExecutionList,    
  timeDimension,          
  refreshAll
} = useExpenseExecutive()

const growthViewType = ref<'yoy' | 'mom'>('yoy')
const leftChartType = ref<'bar' | 'radar'>('bar')
const rightChartType = ref<'donut' | 'pie'>('donut')

// 🌟 核心修复区：手动同步并强制刷新
const monthValue = computed({
  get: () => store.queryDate ? store.queryDate.slice(0, 7) : '',
  set: (val: string) => {
    if (val) {
      // 1. 更新全局 Store
      store.queryDate = `${val}-01`

      // 2. 手动触发全局数据的重新获取，解决 Pinia 侦听丢失的问题
      refreshAll()
    }
  }
})

// ==================== 图表配置 ====================

// 🌟 各公司同环比分析图表配置 (双柱状对比，带圆角与间距优化)
const growthChartOption = computed(() => {
  if (!companyGrowthData.value || companyGrowthData.value.length === 0) return {}
  
  const isYoy = growthViewType.value === 'yoy'
  const currentName = isYoy ? '本年累计' : '本期金额'
  const compareName = isYoy ? '去年累计' : '上月同期'

  const categories = companyGrowthData.value.map(d => d.companyName)
  const currentData = companyGrowthData.value.map(d => isYoy ? d.currentYtdValue : d.currentValue)
  const compareData = companyGrowthData.value.map(d => isYoy ? d.yoyYtdValue : d.momValue)
  const rates = companyGrowthData.value.map(d => isYoy ? d.yoyYtd : d.mom)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } },
      backgroundColor: CHART_COLORS.tooltipBg,
      borderColor: CHART_COLORS.axisLine,
      borderWidth: 1,
      formatter: (params: any) => {
        const current = params.find((p: any) => p.seriesName === currentName)
        const compare = params.find((p: any) => p.seriesName === compareName)
        const dataIndex = params[0].dataIndex
        const rate = rates[dataIndex]
        
        const rateColor = rate >= 0 ? CHART_COLORS.success : CHART_COLORS.alert
        const sign = rate > 0 ? '+' : ''

        return `
          <div style="color: #fff; font-size: 13px;">
            <div style="font-weight:700; border-bottom:1px solid #475569; padding-bottom:4px; margin-bottom:6px;">${params[0].name}</div>
            <div style="display:flex; justify-content:space-between; min-width: 150px;">
              <span>${current.marker} ${currentName}:</span> <b>${current.value} 万</b>
            </div>
            <div style="display:flex; justify-content:space-between; min-width: 150px; margin-bottom:4px;">
              <span>${compare.marker} ${compareName}:</span> <b>${compare.value} 万</b>
            </div>
            <div style="display:flex; justify-content:space-between; min-width: 150px; border-top:1px dashed #475569; padding-top:6px; margin-top:4px;">
              <span style="color:#cbd5e1;">${isYoy ? '累计同比' : '环比'}变化:</span> 
              <b style="color: ${rateColor}">${sign}${rate}%</b>
            </div>
          </div>
        `
      }
    },
    legend: {
      data: [currentName, compareName],
      top: 0,
      right: 0,
      textStyle: { color: CHART_COLORS.axisLabel },
      itemWidth: 12,
      itemHeight: 12,
      icon: 'circle'
    },
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: CHART_COLORS.axisLabel, fontSize: 11, interval: 0, rotate: 25 },
      axisLine: { lineStyle: { color: CHART_COLORS.axisLine } }
    },
    yAxis: {
      type: 'value',
      name: '金额(万)',
      nameTextStyle: { color: CHART_COLORS.axisLabel, fontSize: 11, padding: [0, 20, 0, 0] },
      axisLabel: { color: CHART_COLORS.axisLabel },
      splitLine: { lineStyle: { color: CHART_COLORS.splitLine, type: 'dashed' } },
      axisLine: { show: false }
    },
    series: [
      {
        name: currentName,
        type: 'bar',
        barWidth: '26%',
        barGap: '15%',
        data: currentData,
        itemStyle: { color: CHART_COLORS.sales, borderRadius: [6, 6, 0, 0] } 
      },
      {
        name: compareName,
        type: 'bar',
        barWidth: '26%',
        data: compareData,
        itemStyle: { color: '#94a3b8', borderRadius: [6, 6, 0, 0] } 
      }
    ]
  }
})

// 🌟 分公司各维度预算执行监控
const budgetExecutionOption = computed(() => {
  if (!budgetExecutionList.value || !budgetExecutionList.value.length) return {}
  
  const rawData = budgetExecutionList.value
  const categories = rawData.map(d => d.companyName)

  const s_normal: number[] = [], s_exceed: number[] = [], s_unused: number[] = []
  const m_normal: number[] = [], m_exceed: number[] = [], m_unused: number[] = []
  const f_normal: number[] = [], f_exceed: number[] = [], f_unused: number[] = []

  const tooltipRawData: Record<string, any> = {}

  rawData.forEach(d => {
    const calcStack = (act: number, bud: number) => {
      let normal: number
      let exceed: number
      let unused: number
      
      if (act >= 0 && bud >= 0) {
        normal = Math.min(act, bud);
        exceed = Math.max(0, act - bud);
        unused = Math.max(0, bud - act);
      } else if (bud < 0 && act >= 0) {
        normal = 0; 
        exceed = act; 
        unused = bud; 
      } else if (bud < 0 && act < 0) {
        if (act <= bud) { 
          normal = bud;
          exceed = 0;
          unused = act - bud; 
        } else { 
          normal = act;
          exceed = 0;
          unused = bud - act; 
        }
      } else { 
        normal = 0; exceed = 0; unused = bud;
      }
      
      return { act, bud, normal, exceed, unused };
    }

    const salesRes = calcStack(Number(d.salesActual || 0), Number(d.salesBudget || 0))
    s_normal.push(salesRes.normal); s_exceed.push(salesRes.exceed); s_unused.push(salesRes.unused)

    const mgmtRes = calcStack(Number(d.mgmtActual || 0), Number(d.mgmtBudget || 0))
    m_normal.push(mgmtRes.normal); m_exceed.push(mgmtRes.exceed); m_unused.push(mgmtRes.unused)

    const finRes = calcStack(Number(d.finActual || 0), Number(d.finBudget || 0))
    f_normal.push(finRes.normal); f_exceed.push(finRes.exceed); f_unused.push(finRes.unused)

    tooltipRawData[d.companyName] = { sales: salesRes, mgmt: mgmtRes, fin: finRes }
  })

  const createSeriesGroup = (namePrefix: string, stackName: string, color: string, norm: number[], exc: number[], un: number[]) => [
    { name: `${namePrefix}正常`, type: 'bar', stack: stackName, data: norm, barWidth: '25%', itemStyle: { color: color, borderRadius: [4, 4, 0, 0] } },
    { name: `${namePrefix}超支`, type: 'bar', stack: stackName, data: exc, itemStyle: { color: CHART_COLORS.alert, borderRadius: [4, 4, 0, 0] } },
    { name: `${namePrefix}结余`, type: 'bar', stack: stackName, data: un, itemStyle: { color: 'rgba(255,255,255,0)', borderColor: color, borderType: 'dashed', borderWidth: 1.5, borderRadius: [4, 4, 0, 0] } }
  ]

  return {
    tooltip: { 
      trigger: 'axis', 
      backgroundColor: CHART_COLORS.tooltipBg, 
      borderColor: CHART_COLORS.axisLine, 
      borderWidth: 1, 
      textStyle: { color: '#fff' },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } },
      formatter: (params: any) => {
        const companyName = params[0].name
        const data = tooltipRawData[companyName]
        if (!data) return ''

        const renderLine = (title: string, color: string, d: any) => {
          const diff = d.act - d.bud;
          let excessRate = 0;
          if (d.bud !== 0) {
              excessRate = (diff / Math.abs(d.bud)) * 100;
          }
          
          const rateStr = d.bud === 0 ? '--' : Math.abs(excessRate).toFixed(1) + '%';
          const diffHtml = diff > 0 
            ? `<span style="color:${CHART_COLORS.alert};font-weight:bold;">↑ 超支 ${diff.toFixed(2)}万 <small>(超额 ${rateStr})</small></span>` 
            : `<span style="color:${CHART_COLORS.success};">↓ 结余 ${(-diff).toFixed(2)}万 <small>(节省 ${rateStr})</small></span>`;
          return `
            <div style="margin-top: 8px; border-left: 4px solid ${color}; padding-left: 8px;">
              <div style="color:#94a3b8; font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between;">
                <span>${title}</span>
               
              </div>
              <div style="font-size:13px; color:#f8fafc; display:flex; justify-content:space-between; align-items:center; gap: 16px;">
                <span>实际: <b>${d.act.toFixed(2)}</b> / 预算: ${d.bud.toFixed(2)}</span>
                ${diffHtml}
              </div>
            </div>
          `
        }

        return `
          <div style="padding: 4px; min-width: 290px;">
            <div style="font-weight:700; color:#fff; font-size:14px; margin-bottom:8px; border-bottom:1px solid #475569; padding-bottom:6px;">${companyName}</div>
            ${renderLine('销售费用', CHART_COLORS.sales, data.sales)}
            ${renderLine('管理费用', CHART_COLORS.management, data.mgmt)}
            ${renderLine('财务费用', CHART_COLORS.finance, data.fin)}
          </div>
        `
      }
    },
    grid: { top: 30, right: 20, bottom: 40, left: 60 },
    xAxis: { 
      type: 'category', data: categories, 
      axisLine: { lineStyle: { color: CHART_COLORS.axisLine } }, 
      axisLabel: { color: CHART_COLORS.axisLabel, fontSize: 11, interval: 0, rotate: 25 } 
    },
    yAxis: { 
      type: 'value', name: '金额 (万元)', 
      nameTextStyle: { color: CHART_COLORS.axisLabel, fontSize: 11, padding: [0, 20, 0, 0] }, 
      axisLine: { show: false }, 
      splitLine: { lineStyle: { color: CHART_COLORS.splitLine, type: 'dashed' } }, 
      axisLabel: { color: CHART_COLORS.axisLabel } 
    },
    series: [
      ...createSeriesGroup('销售', 'sales', CHART_COLORS.sales, s_normal, s_exceed, s_unused),
      ...createSeriesGroup('管理', 'mgmt', CHART_COLORS.management, m_normal, m_exceed, m_unused),
      ...createSeriesGroup('财务', 'fin', CHART_COLORS.finance, f_normal, f_exceed, f_unused)
    ]
  }
})

const trendChartOption = computed(() => {
  if (!expenseTrend.value) return {}
  return {
    tooltip: { trigger: 'axis', backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.axisLine, borderWidth: 1, textStyle: { color: '#fff', fontSize: 12 }, axisPointer: { type: 'cross' } },
    legend: { data: ['销售费用', '管理费用', '财务费用'], top: 0, right: 0, itemWidth: 12, itemHeight: 12, itemGap: 20, textStyle: { color: CHART_COLORS.axisLabel, fontSize: 12 } },
    grid: { top: 50, right: 30, bottom: 50, left: 80 },
    xAxis: { type: 'category', data: expenseTrend.value.months, axisLine: { lineStyle: { color: CHART_COLORS.axisLine } }, axisLabel: { color: CHART_COLORS.axisLabel, fontSize: 12, margin: 12 }, boundaryGap: false },
    yAxis: { type: 'value', name: '万元', nameTextStyle: { color: CHART_COLORS.axisLabel, fontSize: 12, padding: [0, 0, 0, 10] }, splitLine: { lineStyle: { color: CHART_COLORS.splitLine, type: 'dashed' } }, axisLabel: { color: CHART_COLORS.axisLabel, fontSize: 12 } },
    series: [
      { name: '销售费用', type: 'line', data: expenseTrend.value.sales, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: CHART_COLORS.sales, width: 2.5 }, itemStyle: { color: CHART_COLORS.sales }, areaStyle: { opacity: 0.1 } },
      { name: '管理费用', type: 'line', data: expenseTrend.value.management, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: CHART_COLORS.management, width: 2.5 }, itemStyle: { color: CHART_COLORS.management }, areaStyle: { opacity: 0.1 } },
      { name: '财务费用', type: 'line', data: expenseTrend.value.finance, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: CHART_COLORS.finance, width: 2.5 }, itemStyle: { color: CHART_COLORS.finance }, areaStyle: { opacity: 0.1 } }
    ]
  }
})

const leftChartOption = computed(() => {
  if (!companyComparison.value.length) return {}
  if (leftChartType.value === 'bar') {
    return {
      tooltip: { trigger: 'axis', backgroundColor: CHART_COLORS.tooltipBg, textStyle: { color: '#fff' } },
      legend: { data: ['销售费用', '管理费用', '财务费用'], top: 0, right: 0, textStyle: { color: CHART_COLORS.axisLabel } },
      grid: { top: 40, right: 20, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: companyComparison.value.map(d => d.name), axisLabel: { color: CHART_COLORS.axisLabel } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: CHART_COLORS.splitLine } }, axisLabel: { color: CHART_COLORS.axisLabel } },
      series: [
        { name: '销售费用', type: 'bar', data: companyComparison.value.map(d => d.sales), barWidth: '25%', itemStyle: { color: CHART_COLORS.sales, borderRadius: [4, 4, 0, 0] } },
        { name: '管理费用', type: 'bar', data: companyComparison.value.map(d => d.management), barWidth: '25%', itemStyle: { color: CHART_COLORS.management, borderRadius: [4, 4, 0, 0] } },
        { name: '财务费用', type: 'bar', data: companyComparison.value.map(d => d.finance), barWidth: '25%', itemStyle: { color: CHART_COLORS.finance, borderRadius: [4, 4, 0, 0] } }
      ]
    }
  } else {
    return {
      tooltip: { trigger: 'item', backgroundColor: CHART_COLORS.tooltipBg, textStyle: { color: '#fff' } },
      legend: { data: companyComparison.value.map(d => d.name), bottom: 0, textStyle: { color: CHART_COLORS.axisLabel } },
      radar: { indicator: [ { name: '销售费用', max: 2 }, { name: '管理费用', max: 2 }, { name: '财务费用', max: 1 } ], splitLine: { lineStyle: { color: CHART_COLORS.splitLine } }, axisName: { color: CHART_COLORS.axisLabel } },
      series: [{ type: 'radar', data: companyComparison.value.map((d, i) => ({ value: [d.sales, d.management, d.finance], name: d.name, itemStyle: { color: [CHART_COLORS.sales, CHART_COLORS.management, CHART_COLORS.finance, CHART_COLORS.warning][i] }, areaStyle: { opacity: 0.15 } })) }]
    }
  }
})

const rightChartOption = computed(() => {
  if (!expenseStructure.value.length) return {}
  const isDonut = rightChartType.value === 'donut'
  return {
    tooltip: { trigger: 'item', backgroundColor: CHART_COLORS.tooltipBg, textStyle: { color: '#fff' }, formatter: '{b}: {c}万 ({d}%)' },
    legend: { orient: 'vertical', right: '8%', top: 'center', textStyle: { color: CHART_COLORS.axisLabel } },
    series: [{ type: 'pie', radius: isDonut ? ['45%', '70%'] : '70%', center: ['40%', '50%'], itemStyle: { borderRadius: isDonut ? 8 : 0, borderColor: '#fff', borderWidth: 2 }, label: { show: false }, data: expenseStructure.value.map((item, index) => ({ value: item.value, name: item.name, itemStyle: { color: [CHART_COLORS.sales, CHART_COLORS.management, CHART_COLORS.finance][index] } })) }]
  }
})

void leftChartOption
void rightChartOption
</script>

<template>
  <div class="executive-dashboard">
    <section class="section section-header">
      <div class="header-card">
        <div class="header-left">
          <div class="header-accent" />
          <h1 class="header-title">集团三费监控</h1>
        </div>
        <div class="header-right">
          <div class="date-picker-wrap">
            <input type="month" v-model="monthValue" :max="store.yesterday" class="date-input" title="选择业务日期" />
          </div>
          <button class="refresh-btn" :disabled="isAnyLoading" @click="refreshAll">
            <svg class="icon" :class="{ spinning: isAnyLoading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span class="refresh-label">刷新</span>
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span class="trend-badge" :class="(overview?.totalExpense?.yoyChange || 0) >= 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path :d="(overview?.totalExpense?.yoyChange || 0) >= 0 ? 'M12 5v14M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'"/>
              </svg>
              {{ Math.abs(overview?.totalExpense?.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">三费总额</div>
        <div class="card-amount">￥<span class="number">{{ overview?.totalExpense?.amount || 0 }}</span>{{ overview?.totalExpense?.unit || '万' }}</div>
          <div class="card-subtitle">{{ overview?.totalExpense?.yoyChangeText || '' }}</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span class="trend-badge" :class="(overview?.salesExpense?.yoyChange || 0) >= 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path :d="(overview?.salesExpense?.yoyChange || 0) >= 0 ? 'M12 5v14M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'"/>
              </svg>
              {{ Math.abs(overview?.salesExpense?.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">销售费用</div>
        <div class="card-amount">￥<span class="number">{{ overview?.salesExpense?.amount || 0 }}</span>{{ overview?.salesExpense?.unit || '万' }}</div>
          <div class="card-subtitle">占比 {{ overview?.salesExpense?.percent || 0 }}%</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <span class="trend-badge" :class="(overview?.managementExpense?.yoyChange || 0) >= 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path :d="(overview?.managementExpense?.yoyChange || 0) >= 0 ? 'M12 5v14M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'"/>
              </svg>
              {{ Math.abs(overview?.managementExpense?.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">管理费用</div>
        <div class="card-amount">￥<span class="number">{{ overview?.managementExpense?.amount || 0 }}</span>{{ overview?.managementExpense?.unit || '万' }}</div>
          <div class="card-subtitle">占比 {{ overview?.managementExpense?.percent || 0 }}%</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <div class="card-icon icon-orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span class="trend-badge" :class="(overview?.financeExpense?.yoyChange || 0) >= 0 ? 'up' : 'down'">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path :d="(overview?.financeExpense?.yoyChange || 0) >= 0 ? 'M12 5v14M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'"/>
              </svg>
              {{ Math.abs(overview?.financeExpense?.yoyChange || 0) }}%
            </span>
          </div>
          <div class="card-label">财务费用</div>
        <div class="card-amount">￥<span class="number">{{ overview?.financeExpense?.amount || 0 }}</span>{{ overview?.financeExpense?.unit || '万' }}</div>
          <div class="card-subtitle">占比 {{ overview?.financeExpense?.percent || 0 }}%</div>
        </div>
      </div>
    </section>

    <section class="section budget-section">
      <div class="budget-growth-grid">
        
        <div class="trend-card-full">
          <div class="chart-header" style="padding-bottom: 0; border-bottom: none;">
            <div class="chart-title-wrap">
              <h3 class="chart-title">各公司预算情况</h3>
              <span class="chart-subtitle">各费用的预算水位及超支情况</span>
            </div>
            <div class="chart-switcher">
              <button class="switch-btn" :class="{ active: timeDimension === 'month' }" @click="timeDimension = 'month'">当月预算</button>
              <button class="switch-btn" :class="{ active: timeDimension === 'year' }" @click="timeDimension = 'year'">年度预算</button>
            </div>
          </div>
          
          <div class="custom-chart-legend">
            <div class="legend-group">
              <span class="legend-title">实际支出：</span>
              <div class="legend-item"><i class="box" :style="{ background: CHART_COLORS.sales }"></i>销售</div>
              <div class="legend-item"><i class="box" :style="{ background: CHART_COLORS.management }"></i>管理</div>
              <div class="legend-item"><i class="box" :style="{ background: CHART_COLORS.finance }"></i>财务</div>
            </div>
            <div class="legend-divider"></div>
            <div class="legend-group">
              <span class="legend-title">预算健康度：</span>
              <div class="legend-item"><i class="box" :style="{ background: CHART_COLORS.alert }"></i>超出预算部分 (标红预警)</div>
              <div class="legend-item"><i class="box-dashed"></i>未使用的预算结余</div>
            </div>
          </div>

          <div class="trend-chart-body" style="min-height: 340px;" v-loading="budgetExecutionLoading">
            <EChart :option="budgetExecutionOption" height="100%" autoresize class="absolute-chart"/>
          </div>
        </div>

        <div class="trend-card-full">
          <div class="chart-header" style="padding-bottom: 0; border-bottom: none; margin-bottom: 16px;">
            <div class="chart-title-wrap">
              <h3 class="chart-title">各公司同环比分析</h3>
              <span class="chart-subtitle">本期与同期金额对比</span>
            </div>
            <div class="chart-switcher">
              <button class="switch-btn" :class="{ active: growthViewType === 'yoy' }" @click="growthViewType = 'yoy'">同比</button>
              <button class="switch-btn" :class="{ active: growthViewType === 'mom' }" @click="growthViewType = 'mom'">环比</button>
            </div>
          </div>
          
          <div class="trend-chart-body" style="min-height: 340px;" v-loading="growthLoading">
            <EChart :option="growthChartOption" height="100%" autoresize class="absolute-chart"/>
          </div>
        </div>

      </div>
    </section>

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

  </div>
</template>

<style scoped>
/* 基础与整体容器 */
.executive-dashboard { min-height: 100vh; background: var(--color-bg-page); padding-bottom: 40px; }
.section { padding: 16px 24px 0; }
.section-header { padding-top: 20px; }

/* Header 样式 */
.header-card { background: linear-gradient(120deg, #dbeafe 0%, #eff6ff 55%, #e0f2fe 100%); border-radius: var(--radius-lg); padding: 16px 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; box-shadow: var(--shadow-card); border: 1px solid #bfdbfe; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-accent { width: 4px; height: 20px; background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%); border-radius: 2px; flex-shrink: 0; }
.header-title { font-size: var(--fs-md); font-weight: 700; color: #1e3a5f; letter-spacing: 0.03em; margin: 0; }
.header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.date-picker-wrap { display: flex; align-items: center; }
.date-input { padding: 7px 12px; border: 1px solid #93c5fd; border-radius: var(--radius-sm); color: #1e3a5f; background-color: rgba(255, 255, 255, 0.8); outline: none; font-family: inherit; font-size: var(--fs-xs); font-weight: 600; cursor: pointer; transition: all 0.2s; }
.date-input:hover, .date-input:focus { border-color: #2563eb; background-color: #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.refresh-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255, 255, 255, 0.7); color: #2563eb; border: 1px solid #93c5fd; border-radius: var(--radius-sm); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: var(--font-family); white-space: nowrap; }
.refresh-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.icon { width: 15px; height: 15px; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

/* 指标卡片网格 */
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.metric-card { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: 20px 22px; border: 1px solid var(--color-border); box-shadow: var(--shadow-card); transition: all 0.3s ease; }
.metric-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-card-hover); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-icon svg { width: 24px; height: 24px; }
.icon-blue { background: #dbeafe; color: #2563eb; }
.icon-purple { background: #ede9fe; color: #7c3aed; }
.icon-cyan { background: #cffafe; color: #0891b2; }
.icon-orange { background: #fef3c7; color: #d97706; }
.card-label { font-size: var(--fs-sm); color: #374151; font-weight: 500; margin-bottom: 8px; }
.card-amount { font-size: var(--fs-xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; letter-spacing: -0.02em; }
.card-amount .number { font-variant-numeric: tabular-nums; }
.card-subtitle { font-size: var(--fs-xs); color: var(--color-text-secondary); }
.trend-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.trend-badge.up { background: #fee2e2; color: #dc2626; }
.trend-badge.down { background: #dcfce7; color: #16a34a; }
.arrow-icon { width: 14px; height: 14px; }

/* 🌟 两列等宽 1:1 分布 */
.budget-growth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* 图表与卡片容器通用 */
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card, .trend-card-full { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: 20px 24px; border: 1px solid var(--color-border); box-shadow: var(--shadow-card); display: flex; flex-direction: column; min-height: 420px; }
.chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.chart-title-wrap { display: flex; align-items: baseline; gap: 12px; }
.chart-title { font-size: var(--fs-sm); font-weight: 700; color: var(--color-text-primary); margin: 0; }
.chart-subtitle { font-size: var(--fs-xs); color: var(--color-text-secondary); }
.chart-switcher { display: flex; gap: 8px; }
.switch-btn { padding: 6px 14px; border-radius: 20px; font-size: var(--fs-xs); font-weight: 600; color: var(--color-text-secondary); background: #f1f5f9; border: 1px solid transparent; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
.switch-btn:hover { background: #e2e8f0; color: var(--color-text-primary); }
.switch-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); }

/* 图表容器与 ECharts 绝对定位 (防止高度塌陷) */
.chart-body, .trend-chart-body { flex: 1; position: relative; min-height: 280px; width: 100%; }
.absolute-chart { position: absolute !important; top: 0; left: 0; right: 0; bottom: 0; }

/* 预算监控图例 */
.custom-chart-legend { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding: 0 0 16px 0; margin-bottom: 8px; border-bottom: 1px solid var(--color-border); }
.legend-group { display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 6px 12px; border-radius: 6px; }
.legend-divider { width: 1px; height: 20px; background: var(--color-border); }
.legend-title { font-size: 12px; font-weight: 600; color: #475569; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #334155; }
.box { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
.box-dashed { width: 12px; height: 12px; border: 1.5px dashed #94a3b8; border-radius: 2px; display: inline-block; background: transparent; }

/* 响应式设计 */
@media (max-width: 1199px) { 
  .metrics-grid { grid-template-columns: repeat(2, 1fr); } 
  .charts-grid { grid-template-columns: 1fr; } 
}
@media (max-width: 1023px) { 
  .section { padding: 12px 16px 0; } 
  .chart-card, .trend-card-full { padding: 16px 18px; min-height: 360px; } 
  .chart-header { flex-direction: column; align-items: flex-start; gap: 12px; } 
  .budget-growth-grid { grid-template-columns: 1fr; } 
}
@media (max-width: 767px) { 
  .section { padding: 10px 12px 0; } 
  .section-header { padding-top: 12px; } 
  .executive-dashboard { padding-bottom: 24px; } 
  .header-card { padding: 12px 14px; } 
  .refresh-label { display: none; } 
  .refresh-btn { padding: 8px 10px; } 
  .metrics-grid { grid-template-columns: 1fr; gap: 10px; } 
  .metric-card { padding: 16px; } 
  .card-amount { font-size: var(--fs-lg); } 
  .chart-card, .trend-card-full { padding: 16px; min-height: 320px; } 
  .chart-body, .trend-chart-body { min-height: 260px; } 
  .chart-header { flex-direction: column; align-items: flex-start; gap: 12px; } 
}
@media (max-width: 420px) { .card-amount { font-size: 22px; } .card-icon { width: 36px; height: 36px; } .card-icon svg { width: 20px; height: 20px; } .trend-card-full { min-height: 300px; } }
</style>
