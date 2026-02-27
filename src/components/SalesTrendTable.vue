<script setup lang="ts">
import { ref, computed } from 'vue'
import VirtualTable from './VirtualTable.vue'
import type { SalesTrendProduct } from '@/types'

const props = defineProps<{
  data: SalesTrendProduct[]
  selectedProduct: string
}>()

const emit = defineEmits<{
  (e: 'select', product: string): void
}>()

type Tab = 'all' | 'poor' | 'good'
const activeTab  = ref<Tab>('all')
const searchText = ref('')

type SortKey = 'default' | 'volume' | 'price' | 'correlation'
const sortKey = ref<SortKey>('default')
const sortAsc = ref(false)

function healthRating(p: SalesTrendProduct) {
  if (p.correlation >= 0.5 && p.volumeChange >= 0 && p.priceChange >= 0)
    return { label: '优', cls: 'he', rank: 0 }
  if (p.correlation >= 0 && (p.volumeChange >= 0 || p.priceChange >= 0))
    return { label: '良', cls: 'hg', rank: 1 }
  if (p.correlation >= -0.3)
    return { label: '中', cls: 'hm', rank: 2 }
  return { label: '差', cls: 'hp', rank: 3 }
}

const poorCount = computed(() => props.data.filter(p => healthRating(p).rank >= 2).length)

const tabCounts = computed(() => ({
  all:  props.data.length,
  poor: props.data.filter(p => healthRating(p).rank >= 2).length,
  good: props.data.filter(p => healthRating(p).rank <= 1).length,
}))

const processedData = computed(() => {
  let list = [...props.data]
  const kw = searchText.value.trim().toLowerCase()
  if (kw) list = list.filter(d => d.product.toLowerCase().includes(kw))
  if (activeTab.value === 'poor') list = list.filter(p => healthRating(p).rank >= 2)
  if (activeTab.value === 'good') list = list.filter(p => healthRating(p).rank <= 1)

  list.sort((a, b) => {
    let diff = 0
    if      (sortKey.value === 'default')     diff = healthRating(a).rank - healthRating(b).rank
    else if (sortKey.value === 'volume')      diff = a.latestVolume - b.latestVolume
    else if (sortKey.value === 'price')       diff = a.latestPrice - b.latestPrice
    else if (sortKey.value === 'correlation') diff = a.correlation - b.correlation
    return sortAsc.value ? diff : -diff
  })
  return list
})

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = false }
}

function si(key: SortKey) {
  if (sortKey.value !== key) return '↕'
  return sortAsc.value ? '↑' : '↓'
}

function fmtPct(v: number) { return (v > 0 ? '+' : '') + (v * 100).toFixed(1) + '%' }
function cc(v: number) { return v > 0.02 ? 'up' : v < -0.02 ? 'down' : 'flat' }
</script>

<template>
  <div class="panel">

    <!-- 健康度摘要横幅 -->
    <div v-if="poorCount > 0" class="alert-banner">
      <svg class="banner-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>
      </svg>
      <span class="banner-text">量价健康度预警：</span>
      <span class="banner-tag">{{ poorCount }} 个产品处于中/差状态，存在量价背离风险</span>
      <button class="banner-jump" @click="activeTab = 'poor'">仅看问题产品 →</button>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="tab-group">
        <button v-for="tab in (['all','poor','good'] as Tab[])" :key="tab"
          class="tab-btn" :class="{ active: activeTab === tab }"
          @click="activeTab = tab; searchText = ''">
          <span>{{ tab === 'all' ? '全部' : tab === 'poor' ? '⚠ 需关注' : '✦ 健康' }}</span>
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

    <!-- 固定表头 -->
    <div class="thead-wrap">
      <table class="base-table">
        <colgroup>
          <col style="width:16%"><col style="width:8%">
          <col style="width:11%"><col style="width:10%">
          <col style="width:13%"><col style="width:10%">
          <col style="width:13%"><col style="width:10%">
          <col style="width:9%">
        </colgroup>
        <thead>
          <tr>
            <th class="th-left">产品</th>
            <th>日期</th>
            <th class="sortable" :class="{sorted:sortKey==='volume'}" @click="toggleSort('volume')">
              销量（吨）<i>{{ si('volume') }}</i>
            </th>
            <th>销量环比</th>
            <th class="sortable" :class="{sorted:sortKey==='price'}" @click="toggleSort('price')">
              价格（元）<i>{{ si('price') }}</i>
            </th>
            <th>价格环比</th>
            <th class="sortable" :class="{sorted:sortKey==='correlation'}" @click="toggleSort('correlation')">
              相关系数<i>{{ si('correlation') }}</i>
            </th>
            <th>7日迷你图</th>
            <th>健康度</th>
          </tr>
        </thead>
      </table>
    </div>

    <!-- 虚拟滚动 -->
    <VirtualTable :rows="processedData" :row-height="44" :visible-count="9">
      <template #default="{ visibleRows }">
        <table class="base-table">
          <colgroup>
            <col style="width:16%"><col style="width:8%">
            <col style="width:11%"><col style="width:10%">
            <col style="width:13%"><col style="width:10%">
            <col style="width:13%"><col style="width:10%">
            <col style="width:9%">
          </colgroup>
          <tbody>
            <tr v-if="processedData.length === 0">
              <td colspan="9" class="empty-td">
                <div class="empty-box">
                  <svg viewBox="0 0 48 48" fill="none" stroke="#d1d5db" stroke-width="2" style="width:38px;height:38px">
                    <rect x="8" y="8" width="32" height="32" rx="4"/><path d="M16 20h16M16 28h10"/>
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
              :class="{
                'row-active':  selectedProduct === item.product,
                'row-stripe':  index % 2 === 1,
                'row-poor':    healthRating(item).rank >= 2,
              }"
              @click="emit('select', item.product)"
            >
              <td class="td-product">
                <div class="prod-cell">
                  <span class="lvbar" :class="`lb-${healthRating(item).cls}`" />
                  <span class="prod-name" :class="{ 'name-active': selectedProduct === item.product }">
                    {{ item.product }}
                  </span>
                </div>
              </td>
              <td class="td-c muted">{{ item.latestDate }}</td>
              <td class="td-c"><b>{{ item.latestVolume }}</b></td>
              <td class="td-c">
                <span class="pill" :class="cc(item.volumeChange)">
                  <svg v-if="item.volumeChange > 0.02" class="arr" viewBox="0 0 10 10"><path d="M5 1L9 9H1Z" fill="currentColor"/></svg>
                  <svg v-else-if="item.volumeChange < -0.02" class="arr" viewBox="0 0 10 10"><path d="M5 9L1 1H9Z" fill="currentColor"/></svg>
                  <span v-else>—</span>
                  <span v-if="item.volumeChange !== 0">{{ fmtPct(item.volumeChange) }}</span>
                </span>
              </td>
              <td class="td-c"><b>{{ item.latestPrice.toLocaleString('zh-CN') }}</b></td>
              <td class="td-c">
                <span class="pill ppill" :class="cc(item.priceChange)">
                  <svg v-if="item.priceChange > 0.02" class="arr" viewBox="0 0 10 10"><path d="M5 1L9 9H1Z" fill="currentColor"/></svg>
                  <svg v-else-if="item.priceChange < -0.02" class="arr" viewBox="0 0 10 10"><path d="M5 9L1 1H9Z" fill="currentColor"/></svg>
                  <span v-else>—</span>
                  <span v-if="item.priceChange !== 0">{{ fmtPct(item.priceChange) }}</span>
                </span>
              </td>
              <td class="td-c">
                <span class="corr" :class="item.correlation >= 0 ? 'c-pos' : 'c-neg'">
                  {{ item.correlation > 0 ? '+' : '' }}{{ item.correlation }}
                </span>
              </td>
              <!-- 内联迷你折线（SVG sparkline） -->
              <td class="td-c">
                <svg class="sparkline" viewBox="0 0 60 24" preserveAspectRatio="none">
                  <polyline
                    :points="item.trend.map((p, i) => {
                      const minV = Math.min(...item.trend.map(t => t.volume))
                      const maxV = Math.max(...item.trend.map(t => t.volume))
                      const x = i / (item.trend.length - 1) * 58 + 1
                      const y = maxV === minV ? 12 : 22 - (p.volume - minV) / (maxV - minV) * 20
                      return `${x},${y}`
                    }).join(' ')"
                    fill="none"
                    :stroke="healthRating(item).rank <= 1 ? '#3b82f6' : '#d97706'"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </td>
              <td class="td-c">
                <span class="hbadge" :class="`hb-${healthRating(item).cls}`">
                  {{ healthRating(item).label }}
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
      <span class="s-hint">↑↓ 滚动浏览 · 点击行切换趋势图</span>
    </div>

  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }

.alert-banner {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
  padding: 8px 14px; margin-bottom: 12px; font-size: 13px;
}
.banner-icon { width: 15px; height: 15px; color: #d97706; flex-shrink: 0; }
.banner-text { color: #92400e; font-weight: 600; white-space: nowrap; }
.banner-tag  { color: #92400e; font-size: 12px; flex: 1; min-width: 140px; }
.banner-jump {
  margin-left: auto; padding: 3px 10px; border: 1px solid #fbbf24; border-radius: 6px;
  background: #fff; color: #d97706; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s;
}
.banner-jump:hover { background: #d97706; color: #fff; }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 20px 12px; flex-wrap: wrap; }
.tab-group { display: flex; gap: 3px; background: #f1f5f9; border-radius: 8px; padding: 3px; }
.tab-btn {
  display: flex; align-items: center; gap: 5px; padding: 5px 11px;
  border: none; border-radius: 6px; background: transparent; color: #64748b;
  font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s;
}
.tab-btn:hover { background: rgba(255,255,255,.7); }
.tab-btn.active { background: #fff; color: #1e293b; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.tab-cnt { min-width: 18px; height: 18px; padding: 0 5px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; font-size: 11px; font-weight: 700; }
.cnt-all  { background: #e2e8f0; color: #64748b; }
.cnt-poor { background: #fee2e2; color: #dc2626; }
.cnt-good { background: #dcfce7; color: #16a34a; }

.search-wrap { position: relative; display: flex; align-items: center; }
.s-ico { position: absolute; left: 9px; width: 13px; height: 13px; color: #9ca3af; pointer-events: none; }
.s-input { width: 150px; padding: 6px 26px 6px 28px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #374151; background: #f8fafc; outline: none; transition: all .15s; font-family: inherit; }
.s-input:focus { border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(147,197,253,.2); }
.s-clear { position: absolute; right: 8px; border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 12px; padding: 2px; }
.s-clear:hover { color: #374151; }

.thead-wrap { padding: 0 20px; overflow: hidden; }
:deep(.vt-scroll) { padding: 0 20px; }

.base-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12.5px; }

thead th {
  padding: 10px 10px; font-size: 12px; font-weight: 600; color: #64748b;
  background: #f0f6ff; text-align: center; border-bottom: 2px solid #e2e8f0;
  white-space: nowrap; user-select: none;
}
th.th-left { text-align: left; }
th.sortable { cursor: pointer; }
th.sortable:hover { background: #e0ecff; color: #1d4ed8; }
th.sorted { background: #dbeafe; color: #1d4ed8; }
th i { font-style: normal; margin-left: 2px; font-size: 10px; opacity: .7; }

.data-row { cursor: pointer; transition: background .1s; }
.data-row td { padding: 0 10px; height: 44px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
.row-stripe { background: #fafbfd; }
.row-poor   { background: #fffbeb !important; }
.row-active { outline: 2px solid #3b82f6; outline-offset: -2px; background: #eff6ff !important; }
.data-row:not(.row-active):hover { filter: brightness(.97); }

.td-product { text-align: left !important; }
.prod-cell { display: flex; align-items: center; gap: 6px; min-width: 0; }
.lvbar { width: 3px; height: 16px; border-radius: 2px; flex-shrink: 0; }
.lb-he { background: #16a34a; }
.lb-hg { background: #1d4ed8; }
.lb-hm { background: #d97706; }
.lb-hp { background: #dc2626; }
.prod-name { font-weight: 500; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.name-active { font-weight: 700; color: #1d4ed8; }

.td-c { text-align: center; }
.muted { color: #9ca3af; font-size: 12px; }
b { font-weight: 600; color: #111827; }

.pill { display: inline-flex; align-items: center; gap: 2px; padding: 1px 6px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.pill.up   { background: #dcfce7; color: #16a34a; }
.pill.down { background: #fee2e2; color: #dc2626; }
.pill.flat { background: #f1f5f9; color: #64748b; }
.ppill.up   { background: #fef3c7; color: #d97706; }
.ppill.down { background: #dcfce7; color: #16a34a; }
.arr { width: 7px; height: 7px; }

.corr { font-weight: 700; font-size: 12px; }
.c-pos { color: #1d4ed8; }
.c-neg { color: #dc2626; }

/* 内联迷你折线 */
.sparkline { width: 60px; height: 24px; display: block; margin: 0 auto; }

.hbadge { display: inline-block; width: 26px; padding: 2px 0; text-align: center; border-radius: 5px; font-size: 12px; font-weight: 700; }
.hb-he { background: #dcfce7; color: #16a34a; }
.hb-hg { background: #dbeafe; color: #1d4ed8; }
.hb-hm { background: #fef3c7; color: #d97706; }
.hb-hp { background: #fee2e2; color: #dc2626; }

.empty-td { padding: 32px !important; text-align: center !important; }
.empty-box { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #9ca3af; font-size: 13px; }

.status-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 20px 4px; border-top: 1px solid #f1f5f9; }
.s-count { font-size: 12px; color: #9ca3af; }
.s-count b { color: #374151; font-weight: 600; }
.s-hint { font-size: 11px; color: #c4c9d4; }
</style>
