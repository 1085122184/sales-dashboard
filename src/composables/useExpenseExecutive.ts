import { ref, computed, watch } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import {
  getExpenseOverview,
  getExpenseCompanyComparison,
  getExpenseStructure,
  getExpenseTrend,
  getExpenseCompanyDetail
} from '@/api/expense-api'

// ==================== 类型定义 ====================

export interface ExpenseOverview {
  totalExpense: {
    amount: number
    unit: string
    yoyChange: number
    yoyChangeText: string
  }
  salesExpense: {
    amount: number
    unit: string
    percent: number
    yoyChange: number
  }
  managementExpense: {
    amount: number
    unit: string
    percent: number
    yoyChange: number
  }
  financeExpense: {
    amount: number
    unit: string
    percent: number
    yoyChange: number
  }
}

export interface CompanyExpense {
  name: string
  sales: number
  management: number
  finance: number
  total: number
  yoy: number
}

export interface ExpenseStructure {
  name: string
  value: number
  percent: number
}

export interface ExpenseTrend {
  months: string[]
  sales: number[]
  management: number[]
  finance: number[]
}

export interface CompanyDetailList {
  list: CompanyExpense[]
  total: number
  page: number
  pageSize: number
}

// ==================== Composable ====================

export function useExpenseExecutive() {
  const store = useGlobalStore()

  const overviewLoading = ref(true)
  const comparisonLoading = ref(true)
  const structureLoading = ref(true)
  const trendLoading = ref(true)
  const detailLoading = ref(true)
  const error = ref<string | null>(null)

  const isAnyLoading = computed(() =>
    overviewLoading.value || comparisonLoading.value || structureLoading.value || trendLoading.value || detailLoading.value
  )

  // 数据状态
  const overview = ref<ExpenseOverview | null>(null)
  const companyComparison = ref<CompanyExpense[]>([])
  const expenseStructure = ref<ExpenseStructure[]>([])
  const expenseTrend = ref<ExpenseTrend | null>(null)
  const companyDetail = ref<CompanyDetailList>({ list: [], total: 0, page: 1, pageSize: 10 })

  // 搜索和分页
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)

  /** 加载总览数据 */
  async function loadOverview() {
    overviewLoading.value = true
    try {
      const data = await getExpenseOverview(store.backendDateStr)
      overview.value = data
    } catch (e: any) {
      error.value = e.message || '获取总览数据失败'
      console.error('获取总览数据失败:', e)
    } finally {
      overviewLoading.value = false
    }
  }

  /** 加载公司对比数据 */
  async function loadComparison() {
    comparisonLoading.value = true
    try {
      const data = await getExpenseCompanyComparison(store.backendDateStr)
      companyComparison.value = data
    } catch (e: any) {
      error.value = e.message || '获取公司对比数据失败'
      console.error('获取公司对比数据失败:', e)
    } finally {
      comparisonLoading.value = false
    }
  }

  /** 加载费用结构数据 */
  async function loadStructure() {
    structureLoading.value = true
    try {
      const currentYear = new Date().getFullYear()
      const data = await getExpenseStructure(store.backendDateStr, currentYear)
      expenseStructure.value = data
    } catch (e: any) {
      error.value = e.message || '获取费用结构数据失败'
      console.error('获取费用结构数据失败:', e)
    } finally {
      structureLoading.value = false
    }
  }

  /** 加载趋势数据 */
  async function loadTrend() {
    trendLoading.value = true
    try {
      const data = await getExpenseTrend(store.backendDateStr)
      expenseTrend.value = data
    } catch (e: any) {
      error.value = e.message || '获取趋势数据失败'
      console.error('获取趋势数据失败:', e)
    } finally {
      trendLoading.value = false
    }
  }

  /** 加载公司明细列表 */
  async function loadCompanyDetail() {
    detailLoading.value = true
    try {
      const data = await getExpenseCompanyDetail({
        date: store.backendDateStr,
        keyword: searchKeyword.value || undefined,
        page: currentPage.value,
        pageSize: pageSize.value
      })
      companyDetail.value = data
    } catch (e: any) {
      error.value = e.message || '获取公司明细数据失败'
      console.error('获取公司明细数据失败:', e)
    } finally {
      detailLoading.value = false
    }
  }

  /** 刷新所有数据 */
  function refreshAll() {
    loadOverview()
    loadComparison()
    loadStructure()
    loadTrend()
    loadCompanyDetail()
  }

  /** 处理搜索 */
  function handleSearch(keyword: string) {
    searchKeyword.value = keyword
    currentPage.value = 1
    loadCompanyDetail()
  }

  /** 处理分页 */
  function handlePageChange(page: number) {
    currentPage.value = page
    loadCompanyDetail()
  }

  // 🌟 监听日期变化自动刷新数据
  watch(() => store.backendDateStr, () => {
    refreshAll()
  }, { immediate: true })

  return {
    // 加载状态
    overviewLoading,
    comparisonLoading,
    structureLoading,
    trendLoading,
    detailLoading,
    isAnyLoading,
    error,

    // 数据
    overview,
    companyComparison,
    expenseStructure,
    expenseTrend,
    companyDetail,

    // 搜索和分页
    searchKeyword,
    currentPage,
    pageSize,

    // 方法
    refreshAll,
    handleSearch,
    handlePageChange,
    loadOverview,
    loadComparison,
    loadStructure,
    loadTrend,
    loadCompanyDetail
  }
}
