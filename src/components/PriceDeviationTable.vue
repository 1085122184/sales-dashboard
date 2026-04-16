<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import VirtualTable from './VirtualTable.vue'
import type { PriceDeviationItem } from '@/types'

const props = defineProps<{
  data: PriceDeviationItem[]
  selectedProduct?: string | null
}>()

const emit = defineEmits<{
  (e: 'select', uniqueId: string | null): void
  (e: 'filter-change', data: PriceDeviationItem[]): void
}>()

type Tab      = 'all' | 'alert' | 'normal'
type SortKey  = 'default' | 'sevenDay' | 'today' | 'amount' | 'rate'

const activeTab  = ref<Tab>('alert')
const searchText = ref('')
const sortKey    = ref<SortKey>('default')
const sortAsc    = ref(false)

// 缓存计算结果以提高性能
const rateLevels = new Map<number, 'danger' | 'warning' | 'normal'>()
function getRateLevel(rate: number): 'danger' | 'warning' | 'normal' {
  if (rate <= -0.1)  return 'danger'
  if (rate < -0.05)  return 'warning'
  return 'normal'
}

// 提高性能：使用缓存
const getRateLevelCached = (rate: number) => {
  if (!rateLevels.has(rate)) {
    rateLevels.set(rate, getRateLevel(rate))
  }
  return rateLevels.get(rate)!
}

// 格式化数字为保留两位小数的字符串
const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const tabCounts = computed(() => {
  // 预先计算所有分类以减少重复遍历
  let allCount = 0
  let alertCount = 0
  let normalCount = 0
  
  for (const d of props.data) {
    allCount++
    const level = getRateLevelCached(d.deviationRate)
    if (level !== 'normal') {
      alertCount++
    } else {
      normalCount++
    }
  }
  
  return { all: allCount, alert: alertCount, normal: normalCount }
})

const alertSummary = computed(() => {
  let dangerCount = 0
  let warningCount = 0
  
  for (const d of props.data) {
    const level = getRateLevelCached(d.deviationRate)
    if (level === 'danger') {
      dangerCount++
    } else if (level === 'warning') {
      warningCount++
    }
  }
  
  return { danger: dangerCount, warning: warningCount }
})

const processedData = computed(() => {
  let list = [...props.data]
  const kw = searchText.value.trim().toLowerCase()
  
  if (kw) {
    list = list.filter(d => d.product.toLowerCase().includes(kw))
  }
  
  if (activeTab.value === 'alert') {
    list = list.filter(d => getRateLevelCached(d.deviationRate) !== 'normal')
  } else if (activeTab.value === 'normal') {
    list = list.filter(d => getRateLevelCached(d.deviationRate) === 'normal')
  }
  
  if (sortKey.value !== 'default') {
    list.sort((a, b) => {
      let diff = 0
      if      (sortKey.value === 'sevenDay') diff = a.sevenDayAvgPrice - b.sevenDayAvgPrice
      else if (sortKey.value === 'today')    diff = a.todayAvgPrice    - b.todayAvgPrice
      else if (sortKey.value === 'amount')   diff = a.deviationAmount  - b.deviationAmount
      else if (sortKey.value === 'rate')     diff = a.deviationRate    - b.deviationRate
      
      return sortAsc.value ? diff : -diff
    })
  }
  
  return list
})

watch(processedData, newVal => { 
  emit('filter-change', newVal) 
}, { immediate: true, deep: true })

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else { 
    sortKey.value = key
    sortAsc.value = false
  }
}

function sortIcon(key: SortKey) {
  if (sortKey.value !== key) return '↕'
  return sortAsc.value ? '↑' : '↓'
}

function handleRowClick(item: PriceDeviationItem) {
  const uniqueId = `${item.productCode}-${item.region}`
  emit('select', props.selectedProduct === uniqueId ? null : uniqueId)
}

// 添加清空所有筛选条件的方法
function clearFilters() {
  searchText.value = ''
  activeTab.value = 'all'
  sortKey.value = 'default'
  sortAsc.value = false
}

function formatPrice(item: PriceDeviationItem, field: 'sevenDay' | 'today' | 'amount') {
  const symbol = item.region === '国内' ? '¥' : '$'
  let val = 0
  if (field === 'sevenDay') val = item.sevenDayAvgPrice
  else if (field === 'today') val = item.todayAvgPrice
  else if (field === 'amount') val = item.deviationAmount

  // 偏差金额处理：正数带+, 负数把-号放在货币符号前面 (如 -$100)
  if (field === 'amount') {
    if (val > 0) return `+${symbol}${val.toLocaleString('zh-CN')}`
    if (val < 0) return `-${symbol}${Math.abs(val).toLocaleString('zh-CN')}`
    return `${symbol}0`
  }
  return `${symbol}${val.toLocaleString('zh-CN')}`
}
</script>

<template>
  <div class="panel">

    <!-- ── 告警横幅 ── -->
    <div v-if="alertSummary.danger > 0 || alertSummary.warning > 0" class="alert-banner">
      <svg class="banner-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
      </svg>
      <span class="banner-text">价格偏差预警：</span>
      <span v-if="alertSummary.danger  > 0" class="banner-tag danger" >严重 {{ alertSummary.danger }}  个（≤ -10%）</span>
      <span v-if="alertSummary.warning > 0" class="banner-tag warning">警告 {{ alertSummary.warning }} 个（-10%~-5%）</span>
      <button class="banner-jump" @click="activeTab = 'alert'">仅看告警 →</button>
    </div>

    <!-- ── 工具栏 ── -->
    <div class="toolbar">
      <div class="tab-group">
        <button v-for="tab in (['all','alert','normal'] as Tab[])" :key="tab"
          class="tab-btn" :class="{ active: activeTab === tab }"
          @click="activeTab = tab; searchText = ''">
          <span>{{ tab === 'all' ? '全部' : tab === 'alert' ? '⚠ 告警' : '✓ 正常' }}</span>
          <span class="tab-cnt" :class="`cnt-${tab}`">{{ tabCounts[tab] }}</span>
        </button>
      </div>
      <div class="search-wrap">
        <svg class="s-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/></svg>
        <input v-model="searchText" class="s-input" placeholder="搜索产品…" />
        <button v-if="searchText" class="s-clear" @click="searchText = ''">✕</button>
      </div>
      <button class="clear-btn" @click="clearFilters" v-if="searchText || activeTab !== 'all' || sortKey !== 'default'">清空筛选</button>
    </div>

    <!-- ── 桌面端：表头 + VirtualTable ── -->
    <div class="desktop-only">
      <div class="thead-wrap">
        <table class="base-table">
          <colgroup>
            <col style="width:28%"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:21%">
          </colgroup>
          <thead>
            <tr>
              <th class="th-left">产品</th>
              <th class="sortable" :class="{sorted:sortKey==='sevenDay'}" @click="toggleSort('sevenDay')">七日均价<i>{{ sortIcon('sevenDay') }}</i></th>
              <th class="sortable" :class="{sorted:sortKey==='today'}"   @click="toggleSort('today')">当日均价<i>{{ sortIcon('today') }}</i></th>
              <th class="sortable" :class="{sorted:sortKey==='amount'}"  @click="toggleSort('amount')">偏差金额<i>{{ sortIcon('amount') }}</i></th>
              <th class="sortable" :class="{sorted:sortKey==='rate'}"    @click="toggleSort('rate')">偏差率<i>{{ sortIcon('rate') }}</i></th>
            </tr>
          </thead>
        </table>
      </div>

      <VirtualTable :rows="processedData" :row-height="52" :visible-count="8">
        <template #default="{ visibleRows }">
          <table class="base-table">
            <colgroup>
              <col style="width:28%"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:21%">
            </colgroup>
            <tbody>
              <tr v-if="processedData.length === 0">
                <td colspan="5" class="empty-td">
                  <div class="empty-box">
                    <svg viewBox="0 0 48 48" fill="none" stroke="#d1d5db" stroke-width="2" style="width:36px;height:36px"><rect x="8" y="8" width="32" height="32" rx="4"/><path d="M16 20h16M16 28h10"/></svg>
                    暂无匹配数据
                  </div>
                </td>
              </tr>
              <tr
                v-for="{ row: item, index } in visibleRows"
                :key="`${item.productCode}-${item.region}`"
                class="data-row" :style="{ height: '52px' }"
                :class="[`row-${getRateLevelCached(item.deviationRate)}`, { 'row-selected': selectedProduct === `${item.productCode}-${item.region}`, 'row-stripe': index % 2 === 1 }]"
                @click="handleRowClick(item)"
              >
                <td class="td-product">
                  <div class="prod-cell">
                    <span class="lvbar" :class="`lvbar-${getRateLevelCached(item.deviationRate)}`" />
                    <span class="region-tag" :class="item.region === '国内' ? 'tag-dom' : 'tag-intl'">{{ item.region }}</span>
                    <span class="prod-name" :class="`txt-${getRateLevelCached(item.deviationRate)}`">{{ item.product }}</span>
                    <span v-if="getRateLevelCached(item.deviationRate) !== 'normal'" class="pulse-dot" :class="`pdot-${getRateLevelCached(item.deviationRate)}`" />
                  </div>
                </td>
                <td class="td-num">{{ formatPrice(item, 'sevenDay') }}</td>
                <td class="td-num">{{ formatPrice(item, 'today') }}</td>
                <td class="td-num" :class="`txt-${getRateLevelCached(item.deviationRate)}`">{{ formatPrice(item, 'amount')}}</td>
                <td class="td-rate">
                  <span class="rate-pill" :class="`pill-${getRateLevelCached(item.deviationRate)}`">{{ item.deviationRateText }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </VirtualTable>
    </div>

    <!-- ── 手机端：卡片列表 ── -->
    <div class="mobile-only mobile-list">
      <div v-if="processedData.length === 0" class="empty-box">
        <svg viewBox="0 0 48 48" fill="none" stroke="#d1d5db" stroke-width="2" style="width:36px;height:36px"><rect x="8" y="8" width="32" height="32" rx="4"/><path d="M16 20h16M16 28h10"/></svg>
        暂无匹配数据
      </div>
      <div
        v-for="item in processedData"
        :key="`m-${item.productCode}-${item.region}`"
        class="m-card"
        :class="[`mcard-${getRateLevelCached(item.deviationRate)}`, { 'mcard-selected': selectedProduct === `${item.productCode}-${item.region}` }]"
        @click="handleRowClick(item)"
      >
        <!-- 卡片头：产品名 + 偏差率 -->
        <div class="m-card-hd">
          <div class="m-prod-info">
            <span class="lvbar" :class="`lvbar-${getRateLevelCached(item.deviationRate)}`" />
            <span class="region-tag" :class="item.region === '国内' ? 'tag-dom' : 'tag-intl'">{{ item.region }}</span>
            <span class="prod-name" :class="`txt-${getRateLevelCached(item.deviationRate)}`">{{ item.product }}</span>
          </div>
          <span class="rate-pill" :class="`pill-${getRateLevelCached(item.deviationRate)}`">{{ item.deviationRateText }}</span>
        </div>
        <!-- 卡片体：3列数据 -->
        <div class="m-card-body">
          <div class="m-metric">
            <span class="m-label">七日均价</span>
            <span class="m-val">{{ formatPrice(item, 'sevenDay') }}</span>
          </div>
          <div class="m-metric">
            <span class="m-label">当日均价</span>
            <span class="m-val">{{ formatPrice(item, 'today') }}</span>
          </div>
          <div class="m-metric">
            <span class="m-label">偏差金额</span>
            <span class="m-val" :class="`txt-${getRateLevelCached(item.deviationRate)}`">{{ formatPrice(item,'amount') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 状态栏 ── -->
    <div class="status-bar">
      <span class="s-count">显示 <b>{{ processedData.length }}</b> / <b>{{ data.length }}</b> 条</span>
      <span class="s-hint">点击行联动图表</span>
    </div>

  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }

/* ── 桌面/手机互斥显示 ── */
.desktop-only { display: block; }
.mobile-only  { display: none !important; }
@media (max-width: 767px) {
  .desktop-only { display: none !important; }
  .mobile-only  { display: block!important; }
}

/* ── 告警横幅 ── */
.alert-banner { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 14px; margin-bottom: 12px; font-size: var(--fs-xs); }
.banner-icon { width: 15px; height: 15px; color: #d97706; flex-shrink: 0; }
.banner-text { color: #92400e; font-weight: 600; white-space: nowrap; }
.banner-tag  { padding: 2px 8px; border-radius: 20px; font-size: var(--fs-xs); font-weight: 600; white-space: nowrap; }
.banner-tag.danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.banner-tag.warning { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
.banner-jump { margin-left: auto; padding: 3px 10px; border: 1px solid #fbbf24; border-radius: 6px; background: #fff; color: #d97706; font-size: var(--fs-xs); font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s; }
.banner-jump:hover { background: #d97706; color: #fff; }

/* ── 工具栏 ── */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 20px 12px; flex-wrap: wrap; }
.tab-group { display: flex; gap: 3px; background: #f1f5f9; border-radius: 8px; padding: 3px; }
.tab-btn { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border: none; border-radius: 6px; background: transparent; color: #64748b; font-size: var(--fs-xs); font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s; }
.tab-btn:hover  { background: rgba(255,255,255,.7); }
.tab-btn.active { background: #fff; color: #1e293b; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.tab-cnt { min-width: 18px; height: 18px; padding: 0 5px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; font-size: var(--fs-xs); font-weight: 700; }
.cnt-all    { background: #e2e8f0; color: #64748b; }
.cnt-alert  { background: #fee2e2; color: #dc2626; }
.cnt-normal { background: #dcfce7; color: #16a34a; }
.search-wrap { position: relative; display: flex; align-items: center; }
.s-ico   { position: absolute; left: 9px; width: 13px; height: 13px; color: #9ca3af; pointer-events: none; }
.s-input { width: 140px; padding: 6px 26px 6px 28px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: var(--fs-xs); color: #374151; background: #f8fafc; outline: none; transition: all .15s; font-family: inherit; }
.s-input:focus { border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(147,197,253,.2); }
.s-clear { position: absolute; right: 8px; border: none; background: none; color: #9ca3af; cursor: pointer; font-size: var(--fs-xs); padding: 2px; }
.clear-btn { padding: 5px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; color: #64748b; font-size: var(--fs-xs); cursor: pointer; font-family: inherit; }
.clear-btn:hover { background: #f1f5f9; }

/* ── 桌面端表格 ── */
.thead-wrap { padding: 0 20px; overflow: hidden; }
:deep(.vt-scroll) { padding: 0 20px; }
.base-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: var(--fs-base); }
thead th { padding: 10px 12px; font-size: var(--fs-sm); font-weight: 600; color: #64748b; background: #f0f6ff; text-align: center; border-bottom: 2px solid #e2e8f0; white-space: nowrap; letter-spacing: .02em; user-select: none; }
th.th-left { text-align: left; }
th.sortable { cursor: pointer; }
th.sortable:hover { background: #e0ecff; color: #1d4ed8; }
th.sorted { background: #dbeafe; color: #1d4ed8; }
th i { font-style: normal; margin-left: 3px; font-size: var(--fs-xs); opacity: .7; }
.data-row { cursor: pointer; transition: background .1s; }
.data-row td { padding: 0 14px; height: 52px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
.row-stripe  { background: #fafbfd; }
.row-warning { background: #fffbeb !important; }
.row-danger  { background: #fff5f5 !important; }
.row-selected { outline: 2px solid #6366f1; outline-offset: -2px; background: #eff6ff !important; }
.data-row:not(.row-selected):hover { filter: brightness(0.97); }
.td-product { text-align: left !important; }
.prod-cell  { display: flex; align-items: center; gap: 6px; min-width: 0; }
.lvbar { width: 3px; height: 16px; border-radius: 2px; flex-shrink: 0; }
.lvbar-danger  { background: #dc2626; }
.lvbar-warning { background: #d97706; }
.lvbar-normal  { background: #d1d5db; }
.region-tag { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; line-height: 1.1; flex-shrink: 0; }
.tag-dom  { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.tag-intl { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
.prod-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.txt-normal  { color: #374151; }
.txt-warning { color: #d97706; font-weight: 600; }
.txt-danger  { color: #dc2626; font-weight: 600; }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; animation: pulse 1.8s infinite; }
.pdot-danger  { background: #dc2626; }
.pdot-warning { background: #d97706; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(220,38,38,.5); } 70% { box-shadow: 0 0 0 5px rgba(220,38,38,0); } 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); } }
.td-num  { text-align: center; font-weight: 500; color: #111827; }
.td-rate { text-align: center; white-space: nowrap; }
.rate-pill { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: var(--fs-xs); font-weight: 700; }
.pill-normal  { background: transparent; color: #64748b; }
.pill-warning { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
.pill-danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }

/* ── 手机端卡片 ── */
.mobile-list { padding: 0 12px; display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; }
.m-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 12px 14px; cursor: pointer; transition: all .15s;
}
.m-card:active { transform: scale(0.99); }
.mcard-warning  { background: #fffbeb; border-color: #fde68a; }
.mcard-danger   { background: #fff5f5; border-color: #fecaca; }
.mcard-selected { outline: 2px solid #6366f1; outline-offset: -1px; background: #eff6ff !important; border-color: #a5b4fc !important; }
.m-card-hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.m-prod-info { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; }
.m-card-body { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.m-metric { display: flex; flex-direction: column; gap: 2px; }
.m-label  { font-size: 11px; color: #94a3b8; font-weight: 500; }
.m-val    { font-size: 13px; font-weight: 600; color: #1e293b; }

/* ── 共用 ── */
.empty-td { padding: 32px !important; text-align: center !important; }
.empty-box { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #9ca3af; font-size: var(--fs-xs); }
.status-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 20px 4px; border-top: 1px solid #f1f5f9; }
.s-count { font-size: var(--fs-xs); color: #9ca3af; }
.s-count b { color: #374151; font-weight: 600; }
.s-hint { font-size: var(--fs-xs); color: #c4c9d4; }
</style>