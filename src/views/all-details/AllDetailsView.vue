<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import { getSalesDetails } from '@/api/dashboard-api'
import type { SalesDetailRecord } from '@/types'
import * as XLSX from 'xlsx'

// 查询条件
const companyName = ref('')
const date = ref(dayjs().format('YYYY-MM-DD'))

// 公司选项
const companyOptions = [
  { label: '全部公司', value: '' },
  { label: '绿冷', value: '绿冷' },
  { label: '高分子', value: '高分子' },
  { label: '氟硅', value: '氟硅' },
  { label: '有机硅', value: '有机硅' }
]

// 数据类型选择
const activeType = ref('sales')

// 表格数据
const loading = ref(false)
const tableData = ref<SalesDetailRecord[]>([])

// 类型选项
const typeOptions = [
  { label: '销售明细', value: 'sales' }
  // { label: '订单明细', value: 'order' },
  // { label: '回款明细', value: 'collection' }
]

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      companyName: companyName.value,
      date: date.value
    }

    const result = await getSalesDetails(params)
    console.log('获取到的数据:', result)
    tableData.value = result || []
    total.value = tableData.value.length
    currentPage.value = 1
    console.log('表格数据长度:', tableData.value.length)
    console.log('分页数据:', paginatedData.value)
  } catch (error) {
    console.error('获取销售明细失败:', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 重置查询
function handleReset() {
  companyName.value = ''
  date.value = dayjs().format('YYYY-MM-DD')
  fetchData()
}

// 分页变化
function handlePageChange(page: number) {
  currentPage.value = page
}

function handleSizeChange() {
  currentPage.value = 1
}

// 导出数据
function handleExport() {
  if (tableData.value.length === 0) {
    alert('没有数据可导出')
    return
  }

  // 准备导出数据
  const exportData = tableData.value.map(row => ({
    '日期': row.businessDate,
    '公司': row.companyName,
    '渠道': row.region,
    '物料': row.productName,
    '物料组': row.groupName,
    '销量': Number(row.sales),
    '销售额': Number(row.amount),
    '单价': Number(row.price)
  }))

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(exportData)
  
  // 设置列宽
  ws['!cols'] = [
    { wch: 12 },  // 日期
    { wch: 10 },  // 公司
    { wch: 8 },   // 渠道
    { wch: 35 },  // 物料
    { wch: 12 },  // 物料组
    { wch: 10 },  // 销量
    { wch: 12 },  // 销售额
    { wch: 12 }   // 单价
  ]

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '销售明细')

  // 生成文件名
  const fileName = `销售明细_${companyName.value || '全部公司'}_${date.value}_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`

  // 下载文件
  XLSX.writeFile(wb, fileName)
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="all-details-container">
    <!-- 页面标题 -->
    <header class="page-header">
      <h1 class="page-title">明细数据查询</h1>
    </header>

    <div class="main-content">
      <!-- 左侧类型选择 -->
      <aside class="type-sidebar">
        <h2 class="sidebar-title">数据类型</h2>
        <ul class="type-list">
          <li
            v-for="type in typeOptions"
            :key="type.value"
            class="type-item"
            :class="{ active: activeType === type.value }"
            @click="activeType = type.value"
          >
            {{ type.label }}
          </li>
        </ul>
      </aside>

      <!-- 右侧表格区域 -->
      <main class="table-main">
        <!-- 查询条件 -->
        <div class="query-form">
          <div class="form-item">
            <label class="form-label">公司</label>
            <select v-model="companyName" class="form-select">
              <option v-for="option in companyOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">日期</label>
            <input
              v-model="date"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="fetchData" :disabled="loading">
              {{ loading ? '查询中...' : '查询' }}
            </button>
            <button class="btn btn-default" @click="handleReset">重置</button>
            <button class="btn btn-success" @click="handleExport" :disabled="loading || tableData.length === 0">
              导出Excel
            </button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="table-wrapper">
          <table class="data-table" v-if="!loading && paginatedData.length > 0">
            <thead>
              <tr>
                <th>日期</th>
                <th>公司</th>
                <th>渠道</th>
                <th>物料</th>
                <th>物料组</th>
                <th>销量</th>
                <th>销售额</th>
                <th>单价</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedData" :key="index">
                <td>{{ row.businessDate }}</td>
                <td>{{ row.companyName }}</td>
                <td>{{ row.region }}</td>
                <td>{{ row.productName }}</td>
                <td>{{ row.groupName }}</td>
                <td>{{ Number(row.sales).toLocaleString() }}</td>
                <td>{{ Number(row.amount).toLocaleString() }}</td>
                <td>{{ Number(row.price).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 空状态 -->
          <div v-else-if="!loading" class="empty-state">
            <p>暂无数据</p>
          </div>

          <!-- 加载中 -->
          <div v-else class="loading-state">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="total > 0">
          <div class="pagination-info">
            共 {{ total }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
          </div>
          <div class="pagination-controls">
            <select v-model.number="pageSize" @change="handleSizeChange" class="page-size-select">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
              <option :value="100">100条/页</option>
            </select>
            <button
              class="page-btn"
              :disabled="currentPage <= 1"
              @click="handlePageChange(currentPage - 1)"
            >
              上一页
            </button>
            <button
              class="page-btn"
              :disabled="currentPage >= totalPages"
              @click="handlePageChange(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.all-details-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.main-content {
  display: flex;
  gap: 24px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 左侧类型选择 */
.type-sidebar {
  width: 200px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 20px 0;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 16px 0;
  padding: 0 20px;
}

.type-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.type-item {
  padding: 12px 20px;
  cursor: pointer;
  color: #475569;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.type-item:hover {
  background: #e0e7ff;
  color: #3182ce;
}

.type-item.active {
  background: #eff6ff;
  color: #3182ce;
  border-left-color: #3182ce;
  font-weight: 600;
}

/* 右侧表格区域 */
.table-main {
  flex: 1;
  padding: 24px;
  min-width: 0;
}

/* 查询表单 */
.query-form {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  min-width: 180px;
}

.form-input:focus {
  outline: none;
  border-color: #3182ce;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  min-width: 180px;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #3182ce;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3182ce;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2c5282;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-default:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-success {
  background: #10b981;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 表格 */
.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background: #f8fafc;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #334155;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
  color: #94a3b8;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 加载状态 */
.loading-state {
  padding: 80px 20px;
  text-align: center;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #3182ce;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px 0;
}

.pagination-info {
  font-size: 14px;
  color: #64748b;
}

.pagination-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-size-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  background: #fff;
  cursor: pointer;
}

.page-btn {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #3182ce;
  color: #3182ce;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .all-details-container {
    padding: 16px;
  }

  .main-content {
    flex-direction: column;
  }

  .type-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 0;
  }

  .type-list {
    display: flex;
    gap: 8px;
    padding: 0 16px;
    overflow-x: auto;
  }

  .type-item {
    padding: 8px 16px;
    border-left: none;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
  }

  .type-item.active {
    border-left-color: transparent;
    border-bottom-color: #3182ce;
  }

  .query-form {
    flex-direction: column;
    align-items: stretch;
  }

  .form-input {
    min-width: auto;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    flex: 1;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
