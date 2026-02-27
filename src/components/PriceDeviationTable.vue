<script setup lang="ts">
import { ref, computed } from 'vue'
import VirtualTable from './VirtualTable.vue'
import type { PriceDeviationItem } from '@/types'

const props = defineProps<{
  data: PriceDeviationItem[]
  selectedProduct?: string | null
}>()

const emit = defineEmits<{
  (e: 'select', product: string | null): void
}>()

// ── 筛选 & 排序 ──────────────────────────────────────────────
type Tab = 'all' | 'alert' | 'normal'
const activeTab  = ref<Tab>('all')
const searchText = ref('')

type SortKey = 'default' | 'sevenDay' | 'today' | 'amount' | 'rate'
const sortKey = ref<SortKey>('default')
const sortAsc = ref(false)

function getRateLevel(rate: number): 'danger' | 'warning' | 'normal' {
  if (rate <= -0.1) return 'danger'
  if (rate < -0.05) return 'warning'
  return 'normal'
}

const tabCounts = computed(() => ({
  all:    props.data.length,
  alert:  props.data.filter(d => getRateLevel(d.deviationRate) !== 'normal').length,
  normal: props.data.filter(d => getRateLevel(d.deviationRate) === 'normal').length,
}))

// 异常摘要（顶部横幅）
const alertSummary = computed(() => ({
  danger:  props.data.filter(d => getRateLevel(d.deviationRate) === 'danger').length,
  warning: props.data.filter(d => getRateLevel(d.deviationRate) === 'warning').length,
}))

const processedData = computed(() => {
  let list = [...props.data]
  const kw = searchText.value.trim().toLowerCase()
  if (kw) list = list.filter(d => d.product.toLowerCase().includes(kw))
  if (activeTab.value === 'alert')  list = list.filter(d => getRateLevel(d.deviationRate) !== 'normal')
  if (activeTab.value === 'normal') list = list.filter(d => getRateLevel(d.deviationRate) === 'normal')

  const lvRank = { danger: 0, warning: 1, normal: 2 }
  list.sort((a, b) => {
    let diff = 0
    if (sortKey.value === 'default') diff = lvRank[getRateLevel(a.deviationRate)] - lvRank[getRateLevel(b.deviationRate)]
    else if (sortKey.value === 'sevenDay') diff = a.sevenDayAvgPrice - b.sevenDayAvgPrice
    else if (sortKey.value === 'today')    diff = a.todayAvgPrice - b.todayAvgPrice
    else if (sortKey.value === 'amount')   diff = a.deviationAmount - b.deviationAmount
    else if (sortKey.value === 'rate')     diff = a.deviationRate - b.deviationRate
    if (diff === 0) diff = lvRank[getRateLevel(a.deviationRate)] - lvRank[getRateLevel(b.deviationRate)]
    return sortAsc.value ? diff : -diff
  })
  return list
})

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = false }
}

function sortIcon(key: SortKey) {
  if (sortKey.value !== key) return '↕'
  return sortAsc.value ? '↑' : '↓'
}


function handleRowClick(product: string) {
  emit('select', props.selectedProduct === product ? null : product)
}
</script>

<template>
  <div class="panel">

    <!-- 异常摘要横幅 -->
    <div v-if="alertSummary.danger > 0 || alertSummary.warning > 0" class="alert-banner">
      <svg class="banner-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
      </svg>
      <span class="banner-text">价格偏差预警：</span>
      <span v-if="alertSummary.danger > 0" class="banner-tag danger">
        严重 {{ alertSummary.danger }} 个（偏差率 ≤ -10%）
      </span>
      <span v-if="alertSummary.warning > 0" class="banner-tag warning">
        警告 {{ alertSummary.warning }} 个（-10% ~ -5%）
      </span>
      <button class="banner-jump" @click="activeTab = 'alert'">仅查看告警 →</button>
    </div>

    <!-- 工具栏 -->
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
        <svg class="s-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/>
        </svg>
        <input v-model="searchText" class="s-input" placeholder="搜索产品名称…" />
        <button v-if="searchText" class="s-clear" @click="searchText = ''">✕</button>
      </div>
    </div>

    <!-- 表头（固定，不随虚拟滚动移动） -->
    <div class="thead-wrap">
      <table class="base-table">
        <colgroup>
          <col style="width:26%">
          <col style="width:18%">
          <col style="width:18%">
          <col style="width:17%">
          <col style="width:21%">
        </colgroup>
        <thead>
          <tr>
            <th class="th-left">产品</th>
            <th class="sortable" :class="{sorted: sortKey==='sevenDay'}" @click="toggleSort('sevenDay')">
              七日均价（元）<i>{{ sortIcon('sevenDay') }}</i>
            </th>
            <th class="sortable" :class="{sorted: sortKey==='today'}" @click="toggleSort('today')">
              当日均价（元）<i>{{ sortIcon('today') }}</i>
            </th>
            <th class="sortable" :class="{sorted: sortKey==='amount'}" @click="toggleSort('amount')">
              偏差金额<i>{{ sortIcon('amount') }}</i>
            </th>
            <th class="sortable" :class="{sorted: sortKey==='rate'}" @click="toggleSort('rate')">
              偏差率<i>{{ sortIcon('rate') }}</i>
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <!-- 虚拟滚动区域 -->
    <VirtualTable ref="vtRef" :rows="processedData" :row-height="44" :visible-count="9">
      <template #default="{ visibleRows }">
        <table class="base-table">
          <colgroup>
            <col style="width:26%">
            <col style="width:18%">
            <col style="width:18%">
            <col style="width:17%">
            <col style="width:21%">
          </colgroup>
          <tbody>
            <tr v-if="processedData.length === 0">
              <td colspan="5" class="empty-td">
                <div class="empty-box">
                  <svg viewBox="0 0 48 48" fill="none" stroke="#d1d5db" stroke-width="2" style="width:38px;height:38px">
                    <rect x="8" y="8" width="32" height="32" rx="4"/>
                    <path d="M16 20h16M16 28h10"/>
                  </svg>
                  暂无匹配数据
                </div>
              </td>
            </tr>
            <tr
              v-for="{ row: item, index } in visibleRows"
              :key="item.product"
              class="data-row"
              :style="{ height: '44px' }"
              :class="[
                `row-${getRateLevel(item.deviationRate)}`,
                {
                  'row-selected': selectedProduct === item.product,
                  'row-dimmed':   selectedProduct !== null && selectedProduct !== item.product,
                  'row-stripe':   index % 2 === 1,
                }
              ]"
              @click="handleRowClick(item.product)"
            >
              <td class="td-product">
                <div class="prod-cell">
                  <span class="lvbar" :class="`lvbar-${getRateLevel(item.deviationRate)}`" />
                  <span class="prod-name" :class="`txt-${getRateLevel(item.deviationRate)}`">{{ item.product }}</span>
                  <span v-if="getRateLevel(item.deviationRate) !== 'normal'"
                    class="pulse-dot" :class="`pdot-${getRateLevel(item.deviationRate)}`" />
                </div>
              </td>
              <td class="td-num">{{ item.sevenDayAvgPrice.toLocaleString('zh-CN') }}</td>
              <td class="td-num">{{ item.todayAvgPrice.toLocaleString('zh-CN') }}</td>
              <td class="td-num" :class="`txt-${getRateLevel(item.deviationRate)}`">
                {{ item.deviationAmount.toLocaleString('zh-CN') }}
              </td>
              <td class="td-rate">
                <span class="rate-pill" :class="`pill-${getRateLevel(item.deviationRate)}`">
                  {{ item.deviationRateText }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </VirtualTable>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="s-count">显示 <b>{{ processedData.length }}</b> / <b>{{ data.length }}</b> 条</span>
      <span class="s-hint">↑↓ 滚动浏览 · 点击行联动图表</span>
    </div>

  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }

/* 异常横幅 */
.alert-banner {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
  padding: 8px 14px; margin-bottom: 12px; font-size: 13px;
}
.banner-icon { width: 16px; height: 16px; color: #d97706; flex-shrink: 0; }
.banner-text { color: #92400e; font-weight: 600; white-space: nowrap; }
.banner-tag  {
  padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.banner-tag.danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.banner-tag.warning { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
.banner-jump {
  margin-left: auto; padding: 3px 10px; border: 1px solid #fbbf24; border-radius: 6px;
  background: #fff; color: #d97706; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s;
}
.banner-jump:hover { background: #d97706; color: #fff; border-color: #d97706; }

/* 工具栏 */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 0 20px 12px; flex-wrap: wrap;
}
.tab-group { display: flex; gap: 3px; background: #f1f5f9; border-radius: 8px; padding: 3px; }
.tab-btn {
  display: flex; align-items: center; gap: 5px; padding: 5px 11px;
  border: none; border-radius: 6px; background: transparent; color: #64748b;
  font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s;
}
.tab-btn:hover { background: rgba(255,255,255,.7); }
.tab-btn.active { background: #fff; color: #1e293b; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.tab-cnt {
  min-width: 18px; height: 18px; padding: 0 5px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9999px; font-size: 11px; font-weight: 700;
}
.cnt-all    { background: #e2e8f0; color: #64748b; }
.cnt-alert  { background: #fee2e2; color: #dc2626; }
.cnt-normal { background: #dcfce7; color: #16a34a; }

.search-wrap { position: relative; display: flex; align-items: center; }
.s-ico { position: absolute; left: 9px; width: 14px; height: 14px; color: #9ca3af; pointer-events: none; }
.s-input {
  width: 160px; padding: 6px 26px 6px 30px; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 13px; color: #374151; background: #f8fafc;
  outline: none; transition: all .15s; font-family: inherit;
}
.s-input:focus { border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(147,197,253,.2); }
.s-clear { position: absolute; right: 8px; border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 12px; padding: 2px; }
.s-clear:hover { color: #374151; }

/* 固定表头 */
.thead-wrap { padding: 0 20px; overflow: hidden; }

/* 虚拟滚动外层 */
:deep(.vt-scroll) { padding: 0 20px; }

/* 共用 table 样式 */
.base-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }

thead th {
  padding: 10px 12px; font-size: 12px; font-weight: 600; color: #64748b;
  background: #f0f6ff; text-align: center; border-bottom: 2px solid #e2e8f0;
  white-space: nowrap; letter-spacing: .02em; user-select: none;
}
th.th-left { text-align: left; }
th.sortable { cursor: pointer; }
th.sortable:hover { background: #e0ecff; color: #1d4ed8; }
th.sorted { background: #dbeafe; color: #1d4ed8; }
th i { font-style: normal; margin-left: 3px; font-size: 11px; opacity: .7; }

/* 数据行 */
.data-row { cursor: pointer; transition: opacity .2s, background .1s; }
.data-row td { padding: 0 12px; height: 44px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }

.row-stripe  { background: #fafbfd; }
.row-warning { background: #fffbeb !important; }
.row-danger  { background: #fff5f5 !important; }
.row-stripe.row-warning { background: #fff8e1 !important; }
.row-stripe.row-danger  { background: #fff0f0 !important; }

.row-selected { outline: 2px solid #6366f1; outline-offset: -2px; background: #eff6ff !important; }
.row-dimmed   { opacity: 0.25; }
.row-dimmed:hover { opacity: 0.55; }

.data-row:not(.row-dimmed):not(.row-selected):hover { filter: brightness(0.97); }

/* 产品列 */
.td-product { text-align: left !important; }
.prod-cell  { display: flex; align-items: center; gap: 7px; min-width: 0; }
.lvbar { width: 3px; height: 18px; border-radius: 2px; flex-shrink: 0; }
.lvbar-danger  { background: #dc2626; }
.lvbar-warning { background: #d97706; }
.lvbar-normal  { background: #d1d5db; }
.prod-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.txt-normal  { color: #374151; }
.txt-warning { color: #d97706; font-weight: 600; }
.txt-danger  { color: #dc2626; font-weight: 600; }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; animation: pulse 1.8s infinite; }
.pdot-danger  { background: #dc2626; }
.pdot-warning { background: #d97706; }
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(220,38,38,.5); }
  70%  { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
  100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
}

/* 数字列 */
.td-num { text-align: center; font-weight: 500; color: #111827; }
.td-rate { text-align: center; white-space: nowrap; }
.rate-pill {
  display: inline-block; padding: 2px 9px; border-radius: 20px;
  font-size: 12px; font-weight: 700;
}
.pill-normal  { background: transparent; color: #64748b; }
.pill-warning { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
.pill-danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }

/* 空状态 */
.empty-td { padding: 32px !important; text-align: center !important; }
.empty-box { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #9ca3af; font-size: 13px; }

/* 状态栏 */
.status-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 20px 4px; border-top: 1px solid #f1f5f9;
}
.s-count { font-size: 12px; color: #9ca3af; }
.s-count b { color: #374151; font-weight: 600; }
.s-hint { font-size: 11px; color: #c4c9d4; }
</style>
