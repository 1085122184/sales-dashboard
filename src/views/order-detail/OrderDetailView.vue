<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSalesCompanies, getOrderCompanyDetail } from '@/api/dashboard-api'
import type { CompanySummaryMetric, OrderRecord } from '@/types/index'
import { ChartSkeleton } from '@/components'

import DetailTopBar from '@/components/business/DetailTopBar.vue'
import CompanySidebar from '@/components/business/CompanySidebar.vue'

const route = useRoute()

const pageTitle = ref(route.query.cleanTitle || '未关订单明细')
const detailType = ref((route.query.type as string) || 'month')
const targetDate = ref((route.query.date as string) || '')
const yesterday = ref(targetDate.value || new Date().toISOString().split('T')[0])

const loading = ref(true)
const tableLoading = ref(false)
const companyList = ref<CompanySummaryMetric[]>([])
const orderList = ref<OrderRecord[]>([])
const selectedId = ref(0)
const sidebarOpen = ref(false)

const currentCompany = computed(() => companyList.value[selectedId.value] ?? null)

// 🌟 筛选和排序状态
type SortKey = keyof OrderRecord | ''
const sortKey = ref<SortKey>('')
const sortAsc = ref(true)

// 搜索关键词
const searchText = ref('')

// 交货状态筛选
const statusFilter = ref<'all' | '部分交货' | '待交货'>('all')

// 渠道筛选
const channelFilter = ref('all')
const availableChannels = computed(() => {
  const channels = new Set(orderList.value.map(r => r.channel).filter(Boolean))
  return ['all', ...Array.from(channels)]
})

// 🌟 分页状态
const currentPage = ref(1)
const pageSize = ref(15)

// 🌟 处理后的数据（筛选、排序、分页）
const processedData = computed(() => {
  let list = [...orderList.value]
  
  // 1. 搜索过滤
  const kw = searchText.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(r => 
      r.orderNo.toLowerCase().includes(kw) ||
      r.materialDesc.toLowerCase().includes(kw) ||
      r.customer.toLowerCase().includes(kw) ||
      r.salesPerson.toLowerCase().includes(kw) ||
      r.office.toLowerCase().includes(kw)
    )
  }
  
  // 2. 状态过滤
  if (statusFilter.value !== 'all') {
    list = list.filter(r => r.deliveryStatus === statusFilter.value)
  }
  
  // 3. 渠道过滤
  if (channelFilter.value !== 'all') {
    list = list.filter(r => r.channel === channelFilter.value)
  }
  
  // 4. 排序
  if (sortKey.value) {
    const key = sortKey.value
    list.sort((a, b) => {
      const valA = a[key] ?? ''
      const valB = b[key] ?? ''
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0
      return sortAsc.value ? cmp : -cmp
    })
  }
  
  return list
})

// 总条数
const totalCount = computed(() => processedData.value.length)

// 当前页数据
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return processedData.value.slice(start, start + pageSize.value)
})

// 总页数
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

// 🌟 统计信息
const stats = computed(() => {
  const total = orderList.value.length
  const partial = orderList.value.filter(r => r.deliveryStatus === '部分交货').length
  const pending = orderList.value.filter(r => r.deliveryStatus === '待交货').length
  return { total, partial, pending }
})

// 监听数据变化，重置分页
watch([processedData], () => {
  currentPage.value = 1
})

// 🌟 排序切换
function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

// 🌟 获取排序图标
function sortIcon(key: SortKey) {
  if (sortKey.value !== key) return '↕'
  return sortAsc.value ? '↑' : '↓'
}

// 🌟 清除所有筛选
function clearFilters() {
  searchText.value = ''
  statusFilter.value = 'all'
  channelFilter.value = 'all'
  sortKey.value = ''
  sortAsc.value = true
}

// 🌟 导出 CSV
function exportToCSV() {
  const headers = ['日期', '订单号', '物料组', '交货状态', '销售组织', '办事处', '业务员', '客户', '渠道']
  const rows = processedData.value.map(r => [
    r.orderDate,
    r.orderNo,
    r.materialDesc,
    r.deliveryStatus,
    r.salesOrg,
    r.office,
    r.salesPerson,
    r.customer,
    r.channel
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${currentCompany.value?.companyName || '订单明细'}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

async function fetchCompanyList() {
  loading.value = true
  try {
    companyList.value = await getSalesCompanies(detailType.value, targetDate.value)
  } finally { loading.value = false }

  if (companyList.value.length > 0) await handleSelectCompany(0)
}

async function handleSelectCompany(idx: number) {
  selectedId.value = idx
  const targetCompany = companyList.value[idx]
  if (!targetCompany?.companyName) return

  tableLoading.value = true
  // 重置筛选
  clearFilters()
  try {
    orderList.value = await getOrderCompanyDetail(targetCompany.companyName, targetDate.value)
  } finally { tableLoading.value = false }
}

onMounted(() => fetchCompanyList())
</script>

<template>
  <div class="exec-dash">
    <DetailTopBar :pageTitle="pageTitle as string" metricName="订单" :yesterday="yesterday" />

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
        unit="单"
        hide-target
        @change="handleSelectCompany"
      />

      <main class="canvas" v-if="!loading">
        <!-- 加载中：骨架屏 -->
        <template v-if="tableLoading">
          <div class="skeleton-wrapper">
            <ChartSkeleton height="500px" :rows="8" :columns="9" />
          </div>
        </template>

        <!-- 有数据：表格 -->
        <div v-else-if="currentCompany" class="viz-container" :key="currentCompany.companyName">
          <div class="viz-card table-card">
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="header-left">
                <h3>{{ currentCompany.companyName }} · {{ pageTitle }}</h3>
                <!-- <div class="stats-bar">
                  <span class="stat-item">共 <b>{{ stats.total }}</b> 笔</span>
                  <span class="stat-divider">|</span>
                  <span class="stat-item text-amber">部分交货 <b>{{ stats.partial }}</b></span>
                  <span class="stat-divider">|</span>
                  <span class="stat-item text-red">待交货 <b>{{ stats.pending }}</b></span>
                </div> -->
              </div>
              <button class="btn-export" @click="exportToCSV" :disabled="totalCount === 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                导出 CSV
              </button>
            </div>

            <!-- 筛选工具栏 -->
            <div class="filter-toolbar">
              <div class="filter-group">
                <!-- 搜索框 -->
                <div class="search-box">
                  <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                  </svg>
                  <input 
                    v-model="searchText" 
                    class="search-input" 
                    placeholder="搜索订单号、客户、业务员..." 
                  />
                  <button v-if="searchText" class="search-clear" @click="searchText = ''">✕</button>
                </div>

                <!-- 状态筛选 -->
                <!-- <select v-model="statusFilter" class="filter-select">
                  <option value="all">全部状态</option>
                  <option value="部分交货">部分交货</option>
                  <option value="待交货">待交货</option>
                </select> -->

                <!-- 渠道筛选 -->
                <select v-model="channelFilter" class="filter-select" v-if="availableChannels.length > 2">
                  <option v-for="ch in availableChannels" :key="ch" :value="ch">
                    {{ ch === 'all' ? '全部渠道' : ch }}
                  </option>
                </select>
              </div>

              <!-- 清除筛选按钮 -->
              <button 
                v-if="searchText || statusFilter !== 'all' || channelFilter !== 'all' || sortKey" 
                class="btn-clear-filters" 
                @click="clearFilters"
              >
                清除筛选
              </button>
            </div>

            <!-- 表格区域 -->
            <div class="table-wrap">
              <table class="order-table">
                <thead>
                  <tr>
                    <th class="sortable" @click="toggleSort('orderDate')">
                      日期 <i class="sort-icon">{{ sortIcon('orderDate') }}</i>
                    </th>
                    <th class="sortable" @click="toggleSort('orderNo')">
                      订单号 <i class="sort-icon">{{ sortIcon('orderNo') }}</i>
                    </th>
                    <th>物料组</th>
                    <th class="sortable" @click="toggleSort('deliveryStatus')">
                      交货状态 <i class="sort-icon">{{ sortIcon('deliveryStatus') }}</i>
                    </th>
                    <th>销售组织</th>
                    <th>办事处</th>
                    <th>业务员</th>
                    <th class="sortable" @click="toggleSort('customer')">
                      客户 <i class="sort-icon">{{ sortIcon('customer') }}</i>
                    </th>
                    <th>渠道</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="totalCount === 0">
                    <td colspan="9" class="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      <p>未找到匹配的订单</p>
                      <button class="btn-reset" @click="clearFilters">清除筛选条件</button>
                    </td>
                  </tr>
                  <tr v-for="row in pagedData" :key="row.orderNo">
                    <td class="td-date">{{ row.orderDate }}</td>
                    <td class="td-order mono">{{ row.orderNo }}</td>
                    <td class="td-material">{{ row.materialDesc }}</td>
                    <td>
                      <span class="status-tag" :class="row.deliveryStatus === '待交货' ? 's-pending' : 's-partial'">
                        {{ row.deliveryStatus }}
                      </span>
                    </td>
                    <td>{{ row.salesOrg }}</td>
                    <td>{{ row.office }}</td>
                    <td>{{ row.salesPerson }}</td>
                    <td class="td-customer" :title="row.customer">{{ row.customer }}</td>
                    <td><span class="channel-tag">{{ row.channel }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 分页器 -->
            <div v-if="totalPages > 1" class="pagination">
              <span class="pagination-info">
                显示 {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalCount) }} 条，共 {{ totalCount }} 条
              </span>
              <div class="pagination-controls">
                <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
                <span class="page-numbers">
                  <button 
                    v-for="page in totalPages" 
                    :key="page" 
                    class="page-number" 
                    :class="{ active: page === currentPage }"
                    @click="currentPage = page"
                  >
                    {{ page }}
                  </button>
                </span>
                <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
              </div>
              <select v-model.number="pageSize" class="page-size-select">
                <option :value="10">10 条/页</option>
                <option :value="15">15 条/页</option>
                <option :value="25">25 条/页</option>
                <option :value="50">50 条/页</option>
              </select>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div v-if="loading" class="loading-screen">
      <div class="spin"></div><p>构建订单视图中…</p>
    </div>
  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.exec-dash { 
  height: 100vh; 
  display: flex; 
  flex-direction: column; 
  background: #f8fafc; 
  color: #1e293b; 
  font-family: 'Inter', system-ui, -apple-system, sans-serif; 
  overflow: hidden; 
}

.body-wrap { flex: 1; display: flex; overflow: hidden; position: relative; }
.sidebar-toggle, .sidebar-overlay { display: none; }

.canvas { 
  flex: 1; 
  padding: 24px 28px; 
  overflow-y: auto; 
  background: #f8fafc; 
  min-width: 0; 
}

.skeleton-wrapper { 
  background: #fff; 
  border-radius: 16px; 
  padding: 24px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.viz-container { height: 100%; display: flex; flex-direction: column; }

.viz-card { 
  background: #fff; 
  border-radius: 16px; 
  padding: 24px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06); 
  display: flex; 
  flex-direction: column; 
  flex: 1; 
  min-height: 0; 
  border: 1px solid #e2e8f0;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.header-left { flex: 1; }

.card-header h3 { 
  font-size: 18px; 
  font-weight: 700; 
  color: #0f172a; 
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h3::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 20px;
  background: #3b82f6;
  border-radius: 2px;
}

/* 统计条 */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.stat-item b {
  color: #0f172a;
  font-weight: 600;
  margin: 0 2px;
}

.stat-divider { color: #cbd5e1; }

.text-amber { color: #d97706; }
.text-red { color: #dc2626; }

/* 导出按钮 */
.btn-export {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-export:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 筛选工具栏 */
.filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 240px;
  padding: 8px 32px 8px 34px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  transition: all 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border: none;
  border-radius: 50%;
  font-size: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.search-clear:hover {
  background: #d1d5db;
}

/* 筛选下拉框 */
.filter-select {
  padding: 8px 32px 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

/* 清除筛选按钮 */
.btn-clear-filters {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-clear-filters:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* 表格 */
.table-wrap { 
  flex: 1; 
  overflow: auto; 
  border: 1px solid #e2e8f0; 
  border-radius: 10px; 
  background: #fff;
}

.order-table { 
  width: 100%; 
  border-collapse: collapse; 
  text-align: left; 
  min-width: 900px; 
  font-size: 14px;
}

.order-table th { 
  position: sticky; 
  top: 0; 
  background: #f8fafc; 
  padding: 12px 14px; 
  color: #475569; 
  font-size: 12px; 
  font-weight: 600; 
  border-bottom: 2px solid #e2e8f0; 
  z-index: 10; 
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.order-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.order-table th.sortable:hover {
  background: #f1f5f9;
}

.sort-icon {
  font-style: normal;
  margin-left: 4px;
  color: #94a3b8;
  font-size: 11px;
}

.order-table td { 
  padding: 12px 14px; 
  color: #334155; 
  border-bottom: 1px solid #f1f5f9; 
  vertical-align: middle;
}

.order-table tbody tr {
  transition: background 0.1s;
}

.order-table tbody tr:hover { 
  background: #f8fafc; 
}

.td-date { 
  color: #64748b; 
  font-size: 13px; 
  white-space: nowrap; 
}

.mono { 
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; 
  font-size: 13px; 
  font-weight: 600; 
  color: #0f172a; 
}

.td-material {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-customer { 
  max-width: 150px; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  font-weight: 500; 
}

/* 状态标签 */
.status-tag { 
  display: inline-flex;
  align-items: center;
  padding: 3px 10px; 
  border-radius: 9999px; 
  font-size: 12px; 
  font-weight: 500; 
}

.s-pending { 
  background: #fef3c7; 
  color: #92400e; 
}

.s-partial { 
  background: #dbeafe; 
  color: #1e40af; 
}

.channel-tag { 
  background: #f1f5f9; 
  color: #475569; 
  padding: 2px 8px; 
  border-radius: 4px; 
  font-size: 12px; 
  font-weight: 500; 
  white-space: nowrap;
}

/* 空状态 */
.empty-state { 
  text-align: center; 
  padding: 60px 20px !important; 
  color: #94a3b8; 
}

.empty-state svg {
  margin: 0 auto 12px;
  color: #cbd5e1;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 12px;
}

.btn-reset {
  padding: 6px 14px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-reset:hover {
  background: #2563eb;
}

/* 分页器 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  gap: 16px;
}

.pagination-info {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.page-number:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.page-number.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
  font-weight: 600;
}

.page-size-select {
  padding: 6px 28px 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 6px center;
  background-repeat: no-repeat;
  background-size: 14px;
}

/* 加载状态 */
.detail-loading-box, .loading-screen { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  background: #fff; 
  gap: 16px; 
  height: 100%; 
  border-radius: 16px; 
}

.spin { 
  width: 36px; 
  height: 36px; 
  border: 3px solid #e2e8f0; 
  border-top-color: #3b82f6; 
  border-radius: 50%; 
  animation: spin .75s linear infinite; 
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-screen { position: fixed; inset: 0; background: #f8fafc; z-index: 999; }
.loading-screen p { font-size: 15px; font-weight: 500; color: #94a3b8; }

/* 移动端适配 */
@media (max-width: 1023px) {
  .canvas { padding: 20px; }
  .viz-card { padding: 20px; }
  .card-header { flex-direction: column; gap: 12px; }
  .btn-export { width: 100%; justify-content: center; }
  .filter-toolbar { flex-direction: column; align-items: stretch; }
  .filter-group { justify-content: flex-start; }
  .search-input { width: 200px; }
}

@media (max-width: 767px) {
  .sidebar-overlay { display: block; position: absolute; inset: 0; background: rgba(0,0,0,0.35); z-index: 199; }
  .sidebar-toggle { 
    display: flex; 
    align-items: center; 
    position: absolute; 
    top: 12px; 
    left: 12px; 
    z-index: 198; 
    padding: 6px 12px; 
    background: #fff; 
    border: 1px solid #e2e8f0; 
    border-radius: 8px; 
    font-size: 13px; 
    font-weight: 600; 
    color: #334155; 
    cursor: pointer; 
  }
  
  .canvas { padding: 50px 12px 16px; }
  .viz-card { padding: 16px 12px; }
  
  .card-header h3 { font-size: 16px; }
  .stats-bar { font-size: 12px; flex-wrap: wrap; }
  
  .filter-toolbar { padding: 10px 12px; }
  .filter-group { gap: 8px; }
  .search-input { width: 160px; padding: 7px 30px 7px 32px; font-size: 12px; }
  .filter-select { padding: 7px 30px 7px 10px; font-size: 12px; }
  
  .pagination { flex-direction: column; gap: 12px; align-items: center; }
  .pagination-info { font-size: 12px; }
  .page-btn { padding: 5px 10px; font-size: 12px; }
  .page-number { min-width: 28px; height: 28px; font-size: 12px; }
}
</style>
