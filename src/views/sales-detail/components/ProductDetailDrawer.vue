<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import BaseEChart from '@/components/charts/BaseEChart.vue'
import { useProductDetail } from '@/composables/useProductDetail' // 🌟 引入刚写的 composable

const props = defineProps<{
  productCode: string
  productName: string
  companyName: string
  yesterday: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()
const isVisible = ref(false)
const trendTab = ref<'month' | 'year'>('month')

// 🌟 直接解构拿出所有状态和方法
const { loading, chartLoading, detailData, fetchDetail, clearData } = useProductDetail()

onMounted(() => {
  setTimeout(() => isVisible.value = true, 50)
  // 组件挂载时，去拉取真实的当月数据
  fetchDetail(props.companyName, props.productCode, 'month')
})

// 监听 Tab 切换，重新去拿真实数据
watch(trendTab, (newTab) => {
  fetchDetail(props.companyName, props.productCode, newTab)
})

function closeDrawer() {
  isVisible.value = false
  setTimeout(() => {
    clearData() // 关掉时清空数据，防止下次打开看到旧数据闪烁
    emit('close')
  }, 300)
}

// 🌟 图表配置
const chartOption = computed(() => {
  const trend = detailData.value?.trend || []
  if (trend.length === 0) return {}

  const dates = trend.map(d => d.date)
  const domesticVols = trend.map(d => d.domesticVolume)
  const intlVols = trend.map(d => d.intlVolume)
  const amounts = trend.map(d => d.amount)

  return {
    backgroundColor: 'transparent',
    grid: { left: 10, right: 10, top: 45, bottom: 0, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
      formatter: (params: any[]) => {
        let html = `<div style="font-weight:700;margin-bottom:8px;color:#1e293b">${params[0].axisValue}</div>`
        let totalVol = 0
        params.forEach(p => {
          if (p.seriesName.includes('销量')) {
            totalVol += p.value
            html += `<div style="color:#64748b;font-size:12px;margin-bottom:3px">${p.marker} ${p.seriesName}：<b style="color:#1e293b">${Math.round(p.value).toLocaleString()} 吨</b></div>`
          } else {
             // 销售额使用千分位
            html += `<div style="color:#64748b;font-size:12px;margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0">${p.marker} ${p.seriesName}：<b style="color:#f59e0b">${Math.round(p.value).toLocaleString()} 万元</b></div>`
          }
        })
        html = html.replace('</div><div style="color:#64748b;font-size:12px;margin-top:6px', 
               `</div><div style="color:#475569;font-size:12px;margin-bottom:3px;font-weight:600"><span style="display:inline-block;width:10px;margin-right:4px"></span>总销量：<b style="color:#1e293b">${Math.round(totalVol).toLocaleString()} 吨</b></div><div style="color:#64748b;font-size:12px;margin-top:6px`)
        return html
      }
    },
    legend: { data: ['国内销量', '国外销量', '销售额'], top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#64748b', fontSize: 12 } },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '销量 (吨)', position: 'left', alignTicks: true, nameTextStyle: { color: '#94a3b8', fontSize: 11, align: 'right', padding: [0, 6, 0, 0] }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
      { type: 'value', name: '销售额 (万元)', position: 'right', alignTicks: true, nameTextStyle: { color: '#94a3b8', fontSize: 11, align: 'left', padding: [0, 0, 0, 6] }, splitLine: { show: false }, axisLabel: { color: '#94a3b8', fontSize: 11 } }
    ],
    series: [
      { name: '国内销量', type: 'bar', stack: 'volume', barWidth: '40%', itemStyle: { color: '#3182ce' }, data: domesticVols },
      { name: '国外销量', type: 'bar', stack: 'volume', itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] }, data: intlVols },
      { name: '销售额', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#f59e0b' }, lineStyle: { width: 3, shadowColor: 'rgba(245,158,11,0.3)', shadowBlur: 8 }, data: amounts }
    ]
  }
})
</script>

<template>
  <div class="drawer-wrapper">
    <div class="drawer-mask" :class="{ 'mask-show': isVisible }" @click="closeDrawer"></div>
    
    <div class="drawer-panel" :class="{ 'panel-show': isVisible }">
      <header class="drawer-hd">
        <div class="hd-left">
          <div class="breadcrumb">{{ companyName }} / 产品穿透</div>
          <h2>{{ productName }} </h2>
        </div>
        <button class="close-btn" @click="closeDrawer">✕</button>
      </header>

      <div class="drawer-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载...</p>
        </div>
        
        <div v-else-if="detailData" class="content-scroll">
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="lbl">{{ trendTab === 'month' ? '本月' : '本年' }}累计销量</div>
              <div class="val">{{ Math.round(detailData.kpi.totalVolume).toLocaleString() }} <span>吨</span></div>
            </div>
            <div class="kpi-card">
              <div class="lbl">{{ trendTab === 'month' ? '本月' : '本年' }}累计销售额</div>
              <div class="val">{{ Math.round(detailData.kpi.totalVolume*detailData.kpi.avgPrice/10000).toLocaleString() }} <span>万元</span></div>
            </div>
            <div class="kpi-card">
              <div class="lbl">{{ trendTab === 'month' ? '本月' : '本年' }}均价</div>
              <div class="val">¥{{ Math.round(detailData.kpi.avgPrice).toLocaleString() }}</div>
            </div>
            <!-- <div class="kpi-card highlight">
              <div class="lbl">利润贡献预估</div>
              <div class="val" :class="detailData.kpi.profitEst.startsWith('-') ? 'c-red' : 'c-green'">{{ detailData.kpi.profitEst }}</div>
            </div> -->
          </div>

          <div class="chart-box">
            <div class="chart-box-hd">
              <h3>结构与走势分析</h3>
              <div class="trend-tabs">
                <button :class="{ active: trendTab === 'month' }" @click="trendTab = 'month'">本月</button>
                <button :class="{ active: trendTab === 'year' }" @click="trendTab = 'year'">本年</button>
              </div>
            </div>
            <div class="chart-container">
              <div v-if="chartLoading" class="chart-mask"><div class="spinner-small"></div></div>
              <BaseEChart :option="chartOption" height="280px" />
            </div>
          </div>

          <div class="chart-box">
            <h3>本年核心采购客户 Top 10</h3>
            <div class="customer-list">
              <div class="cust-item" v-for="(cust, i) in detailData.topCustomers" :key="i">
                <span class="rank">{{ i + 1 }}</span>
                <span class="c-name">{{ cust.name }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: detailData.topCustomers[0].volume > 0 ? (cust.volume / detailData.topCustomers[0].volume) * 100 + '%' : '0%' }"></div>
                </div>
                <span class="c-val">{{ Math.round(cust.volume).toLocaleString() }} 吨</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有基础布局样式 */
.drawer-wrapper { position: fixed; inset: 0; z-index: 1000; overflow: hidden; display: flex; justify-content: flex-end; }
.drawer-mask {
   position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); 
   /* backdrop-filter: blur(2px);  */
   opacity: 0; transition: opacity 0.3s ease; }
.drawer-mask.mask-show { opacity: 1; }
.drawer-panel { position: relative; width: 1080px; max-width: 90vw; background: #f8fafc; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: -10px 0 30px rgba(0,0,0,0.1);will-change: transform; }
.drawer-panel.panel-show { transform: translateX(0); }

/* 头部 */
.drawer-hd { padding: 24px 30px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
.breadcrumb { font-size: 13px; color: #64748b; margin-bottom: 6px; }
.drawer-hd h2 { font-size: 24px; color: #1e293b; font-weight: 800; display: flex; align-items: center; gap: 12px; }
.badge { font-size: 12px; background: #dcfce7; color: #16a34a; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
.close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; color: #64748b; cursor: pointer; transition: all 0.2s; }
.close-btn:hover { background: #e2e8f0; color: #1e293b; transform: rotate(90deg); }

/* 内容区与 KPI */
.drawer-body { flex: 1; overflow-y: auto; padding: 24px 30px; }
.content-scroll { display: flex; flex-direction: column; gap: 24px; }
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
.kpi-card.highlight { background: #eff6ff; border-color: #bfdbfe; }
.lbl { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.val { font-size: 24px; font-weight: 800; color: #1e293b; }
.val span { font-size: 14px; font-weight: 500; margin-left: 2px; }
.c-green { color: #10b981; }

/* 🌟 图表容器与切换 Tab 样式 */
.chart-box { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
.chart-box-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.chart-box h3 { font-size: 16px; font-weight: 700; color: #1e293b; padding-left: 10px; border-left: 4px solid #3182ce; }

.trend-tabs { display: flex; background: #f1f5f9; padding: 3px; border-radius: 6px; }
.trend-tabs button { border: none; background: transparent; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
.trend-tabs button:hover { color: #334155; }
.trend-tabs button.active { background: #fff; color: #3182ce; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

.chart-container { position: relative; min-height: 280px; }
.chart-mask { position: absolute; inset: 0; background: rgba(255,255,255,0.6); backdrop-filter: blur(1px); display: flex; align-items: center; justify-content: center; z-index: 10; }
.spinner-small { width: 24px; height: 24px; border: 2px solid #e2e8f0; border-top-color: #3182ce; border-radius: 50%; animation: spin 0.8s linear infinite; }

/* 客户列表 */
.customer-list { display: flex; flex-direction: column; gap: 16px; margin-top: 20px;}
.cust-item { display: flex; align-items: center; gap: 12px; }
.rank { width: 24px; height: 24px; background: #f1f5f9; color: #64748b; display: flex; justify-content: center; align-items: center; border-radius: 6px; font-weight: 700; font-size: 12px; }
.cust-item:nth-child(1) .rank { background: #fee2e2; color: #dc2626; }
.cust-item:nth-child(2) .rank { background: #fef3c7; color: #d97706; }
.cust-item:nth-child(3) .rank { background: #fef9c3; color: #ca8a04; }
.c-name { width: 180px; font-size: 13px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: #3182ce; border-radius: 4px; }
.c-val { width: 60px; text-align: right; font-size: 13px; font-weight: 600; color: #1e293b; }

/* Loading 状态 */
.loading-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }
.spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #3182ce; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
@keyframes spin { 100% { transform: rotate(360deg); } }

@media (max-width: 767px) {
  .drawer-panel { width: 100vw; max-width: 100vw; }
  .kpi-grid { grid-template-columns: 1fr; }
  .c-name { width: 100px; }
  .chart-box-hd { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>