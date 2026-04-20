<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import type { CompanySummaryMetric, CollectionDetailData } from '@/types/index'
import BaseEChart from '@/components/charts/BaseEChart.vue'

import DetailTopBar from '@/components/business/DetailTopBar.vue'
// 注意：引入你刚才拆分出来的纯净版回款 Banner
import CollectionBanner from './components/CollectionBanner.vue'
import CompanySidebar from '@/components/business/CompanySidebar.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

// 🌟 1. 引入我们刚才写好的正式 API
import { getCollectionCompanies, getCollectionCompanyDetail } from '@/api/dashboard-api'

echarts.use([BarChart, LineChart, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])

// 🌟 使用响应式断点检测替代非响应式的 isMobile()
const { isMaxMd } = useBreakpoint()

const route = useRoute()
const targetDate = ref((route.query.date as string) || dayjs().format('YYYY-MM-DD'))
const yesterday = dayjs(targetDate.value).subtract(1, 'day').format('YYYY-MM-DD')

const loading = ref(true)
const detailLoading = ref(false)

const companyList = ref<CompanySummaryMetric[]>([])
const selectedId = ref(0)
const sidebarOpen = ref(false)

// 🌟 2. 绑定正式的 Detail 类型
const currentDetail = ref<CollectionDetailData | null>(null)
const currentCompany = computed(() => companyList.value[selectedId.value] ?? null)

// 🌟 删除本地 isMobile()，使用响应式的 isMaxMd

// --- ECharts 图表配置 ---
const trendChartOption = computed(() => {
  if (!currentDetail.value || !currentCompany.value) return {}
  const mobile = isMaxMd.value
  const monthsXAxis = currentDetail.value.trendDate || []
  const actuals = currentDetail.value.trendActual || []
  const plans = currentDetail.value.trendPlan || []
  
  // 🌟 动态计算每月的达成率 (实际 / 计划 * 100)
  const rates = actuals.map((val, idx) => {
    const plan = plans[idx] || 0
    return plan === 0 ? 0 : Number(((val / plan) * 100).toFixed(1))
  })

  return {
    backgroundColor: 'transparent',
    grid: { left: 24, right: 24, top: 45, bottom: 20, containLabel: true },
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' }, // 柱状图用阴影指示器更好看
      backgroundColor: '#fff', borderColor: '#eef2f6', textStyle: { color: '#1e293b' },
      formatter: (params: any[]) => {
        let html = `<div style="font-weight:700;margin-bottom:6px;color:#1e293b">${params[0].name}</div>`
        params.forEach(p => {
          // 区分金额和百分比单位
          const unit = p.seriesName === '达成率' ? '%' : '万'
          const val = p.seriesName === '达成率' ? p.value : p.value.toLocaleString()
          html += `<div style="line-height:1.8;font-size:13px;display:flex;justify-content:space-between;min-width:140px;">
            <span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>
              ${p.seriesName}
            </span>
            <b style="color:#1e293b">${val} ${unit}</b>
          </div>`
        })
        return html
      }
    },
    legend: { top: 0, right: 0, data: ['实际回款', '计划回款', '达成率'], icon: 'circle', textStyle: { color: '#475569', fontSize: mobile ? 11 : 13 } },
    xAxis: { type: 'category', data: monthsXAxis, axisLine: { lineStyle: { color: '#eef2f6' } }, axisTick: { show: false }, axisLabel: { color: '#64748b' } },
    yAxis: [
      { 
        type: 'value', name: '金额 (万元)', position: 'left',
        nameTextStyle: { color: '#64748b', align: 'right', padding: [0, 5, 0, 0] }, 
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, 
        axisLabel: { color: '#94a3b8' } 
      },
      { 
        type: 'value', name: '达成率 (%)', position: 'right',
        nameTextStyle: { color: '#64748b', align: 'left', padding: [0, 0, 0, 5] }, 
        splitLine: { show: false }, // 隐藏右侧网格线防止重叠
        axisLabel: { color: '#94a3b8' } 
      }
    ],
    series: [
      // 实际回款：主色调绿色柱子
      { name: '实际回款', type: 'bar', yAxisIndex: 0, data: actuals, barWidth: mobile ? 10 : 16, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
      // 计划回款：浅灰色柱子（放在实际回款旁边对比）
      { name: '计划回款', type: 'bar', yAxisIndex: 0, data: plans, barWidth: mobile ? 10 : 16, itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] } },
      // 达成率：橙色折线，挂载在右侧 Y轴 (yAxisIndex: 1)
      { name: '达成率', type: 'line', yAxisIndex: 1, data: rates, smooth: true, symbolSize: 8, lineStyle: { color: '#f59e0b', width: 3 }, itemStyle: { color: '#f59e0b' } }
    ]
  }
})

const ageingOption = computed(() => {
  if (!currentDetail.value || !currentDetail.value.ageingData) return {}
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)', backgroundColor: '#fff', borderColor: '#eef2f6', textStyle: { color: '#1e293b' } },
    legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b' } },
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#1e293b' } },
      labelLine: { show: false },
      data: currentDetail.value.ageingData
    }]
  }
})

// --- 🌟 核心修改：正式的 API 调用逻辑 ---
async function fetchCompanyList() {
  loading.value = true
  try {
    // 调用正式接口，传入当前日期
    const res = await getCollectionCompanies(yesterday)
    companyList.value = res || []
    
    // 如果列表有数据，自动加载第一家公司的明细
    if (companyList.value.length > 0) {
      await handleSelectCompany(0)
    }
  } catch (error) {
    console.error('获取回款公司列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleSelectCompany(idx: number) {
  selectedId.value = idx
  sidebarOpen.value = false
  
  const targetCompany = companyList.value[idx]
  if (!targetCompany?.companyName) return

  detailLoading.value = true
  try {
    // 调用正式接口，传入公司名称和日期
    const res = await getCollectionCompanyDetail(targetCompany.companyName, yesterday)
    // 兜底处理：如果接口返回 null，给一个空结构防止前端报错白屏
    currentDetail.value = res || {
      trendDate: [], trendActual: [], trendPlan: [],
      ageingData: [], topDebtors: []
    }
  } catch (error) {
    console.error(`获取 [${targetCompany.companyName}] 回款明细失败:`, error)
    currentDetail.value = { trendDate: [], trendActual: [], trendPlan: [], ageingData: [], topDebtors: [] }
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => { fetchCompanyList() })
</script>

<template>
  <div class="exec-dash">
    <DetailTopBar pageTitle="回款数据" metricName="回款" :yesterday="yesterday" />

    <CollectionBanner v-if="!loading && currentCompany" :company="currentCompany" unit="万" :yesterday="yesterday" />

    <div class="body-wrap">
      <button v-if="!loading" class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? '✕' : '☰ 公司' }}
      </button>
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

      <CompanySidebar 
        v-if="!loading" 
        :companyList="companyList" 
        v-model:selectedId="selectedId" 
        v-model:sidebarOpen="sidebarOpen"
        unit="万" 
        @change="handleSelectCompany" 
      />

      <main class="canvas" v-if="!loading">
        <div v-if="detailLoading" class="detail-loading-box">
          <div class="spin"></div><p>正在拉取 <b>{{ currentCompany?.companyName }}</b> 回款穿透数据…</p>
        </div>
        
        <div class="viz-container" v-else-if="currentDetail && currentCompany" :key="currentCompany.companyName">
          
          <div class="viz-card">
            <div class="card-hd">
              <h3>{{ currentCompany.companyName }} · 本年回款目标达成趋势</h3>
              <span class="chip" :class="currentCompany.isAlert ? 'chip-red' : 'chip-green'">实时进度</span>
            </div>
            <BaseEChart :option="trendChartOption" class="chart-trend" />
          </div>

          <!-- <div class="grid-wrap">
            <div class="viz-card flex-col">
              <div class="card-hd">
                <h3>当前应收账龄结构</h3>
              </div>
              <BaseEChart :option="ageingOption" class="chart-ageing" />
            </div>

            <div class="viz-card flex-col">
              <div class="card-hd">
                <h3>逾期欠款排雷 (Top 5)</h3>
                <span class="chip chip-red">重点盯控</span>
              </div>
              <div class="table-wrap">
                <table class="risk-table">
                  <thead><tr><th>客户名称</th><th>欠款(万)</th><th>最长逾期</th></tr></thead>
                  <tbody>
                    <tr v-for="(debtor, i) in currentDetail.topDebtors" :key="i">
                      <td class="td-name">{{ debtor.name }}</td>
                      <td class="td-amount">{{ debtor.amount.toFixed(1) }}</td>
                      <td class="td-days">
                        <span class="tag-days" :class="debtor.days > 90 ? 'danger' : 'warn'">{{ debtor.days }} 天</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div> -->

        </div>
      </main>
    </div>

    <div v-if="loading" class="loading-screen">
      <div class="spin"></div><p>构建回款视图中…</p>
    </div>
  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.exec-dash { height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; color: #1e293b; font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }

.body-wrap { flex: 1; display: flex; overflow: hidden; position: relative; }
.sidebar-toggle  { display: none; }
.sidebar-overlay { display: none; }

/* --- 右侧画布基础统一样式 --- */
.canvas { flex: 1; padding: 26px 30px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; background: #f5f7fa; min-width: 0; }
.viz-container { display: flex; flex-direction: column; gap: 24px; width: 100%; }
.viz-card { background: #fff; border-radius: 20px; padding: 28px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.flex-col { display: flex; flex-direction: column; height: 100%; }

.card-hd  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
.card-hd h3 { font-size: 18px; font-weight: 800; color: #1e293b; border-left: 4px solid #10b981; padding-left: 10px; }
.chip     { font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 6px; flex-shrink: 0; }
.chip-green { background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0; }
.chip-red   { background: #fff5f5; color: #f56565; border: 1px solid #fecaca; }

/* 图表尺寸 */
.chart-trend  { height: 320px; width: 100%; }
.chart-ageing { height: 260px; width: 100%; }

/* 下半部分网格排版 */
.grid-wrap { display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; }

/* 风险大客户表格 */
.table-wrap { flex: 1; overflow-y: auto; }
.risk-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.risk-table th { text-align: left; padding: 12px 10px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.risk-table td { padding: 16px 10px; border-bottom: 1px solid #f8fafc; color: #334155; }
.risk-table tbody tr:hover { background: #f8fafc; }
.td-name { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.td-amount { font-family: monospace; font-size: 15px; font-weight: 700; color: #1e293b; }
.tag-days { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
.tag-days.warn { background: #fffbeb; color: #d97706; }
.tag-days.danger { background: #fef2f2; color: #ef4444; }

/* 加载状态 */
.detail-loading-box { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; border-radius: 20px; min-height: 400px; gap: 16px; }
.detail-loading-box p { font-size: 15px; color: #64748b; }
.detail-loading-box b { color: #10b981; }
.loading-screen { position: fixed; inset: 0; background: #f5f7fa; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 999; }
.spin { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-screen p { font-size: 15px; font-weight: 500; color: #94a3b8; }

/* 响应式调整 */
/* 🌟 平板端（<= 1023px）统一断点 */
@media (max-width: 1023px) {
  .grid-wrap { grid-template-columns: 1fr; }
  .canvas { padding: 16px 18px; gap: 16px; }
  .viz-card { padding: 20px 22px; border-radius: 14px; }
}

@media (max-width: 767px) {
  .sidebar-overlay { display: block; position: absolute; inset: 0; background: rgba(0,0,0,0.35); z-index: 199; }
  .sidebar-toggle { display: flex; align-items: center; position: absolute; top: 12px; left: 12px; z-index: 198; padding: 6px 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 600; color: #334155; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .canvas { padding: 50px 12px 16px; gap: 12px; }
  .viz-card { padding: 16px; border-radius: 12px; }
  .card-hd h3 { font-size: 15px; }
  .chart-trend { height: 240px; }
  .chart-ageing { height: 220px; }
  .td-name { max-width: 120px; }
}
</style>