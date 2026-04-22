import { ref, computed, watch } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import {
  getExpenseOverview,
  getExpenseCompanyComparison,
  getExpenseStructure,
  getExpenseTrend,
  getExpenseCompanyDetail,
  getExpenseDailyDetail,
  getBudgetExecution 
} from '@/api/expense-api'
import type { BudgetExecutionRecord } from '@/api/expense-api' 

// ==================== 类型定义 ====================

export interface ExpenseOverview {
  totalExpense: { amount: number; unit: string; yoyChange: number; yoyChangeText: string }
  salesExpense: { amount: number; unit: string; percent: number; yoyChange: number }
  managementExpense: { amount: number; unit: string; percent: number; yoyChange: number }
  financeExpense: { amount: number; unit: string; percent: number; yoyChange: number }
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
  
  const dailyDetailLoading = ref(false)
  const budgetExecutionLoading = ref(true) 
  const error = ref<string | null>(null)

  // 🌟 将预算加载状态纳入全局 loading 判定
  const isAnyLoading = computed(() =>
    overviewLoading.value || comparisonLoading.value || structureLoading.value || 
    trendLoading.value || detailLoading.value || budgetExecutionLoading.value
  )

  // 数据状态
  const overview = ref<ExpenseOverview | null>(null)
  const companyComparison = ref<CompanyExpense[]>([])
  const expenseStructure = ref<ExpenseStructure[]>([])
  const expenseTrend = ref<ExpenseTrend | null>(null)
  const companyDetail = ref<CompanyDetailList>({ list: [], total: 0, page: 1, pageSize: 10 })
  const dailyDetailList = ref<any[]>([])
  
  const budgetExecutionList = ref<BudgetExecutionRecord[]>([]) 

  // 搜索、筛选、分页及图表维度
  const detailMonth = ref(store.backendDateStr ? store.backendDateStr.slice(0, 7) : new Date().toISOString().slice(0, 7))
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const timeDimension = ref<'month' | 'year'>('month') 

  /** 加载总览数据 */
  async function loadOverview() { 
    overviewLoading.value = true
    try {
      const data = await getExpenseOverview(store.backendDateStr)
      overview.value = data
    } catch (e: any) {
      error.value = e.message || '获取总览数据失败'
      console.error('获取总览数据失败:', e)
    } finally { overviewLoading.value = false }
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
    } finally { comparisonLoading.value = false }
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
    } finally { structureLoading.value = false }
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
    } finally { trendLoading.value = false }
  }

  /** 加载公司明细列表 */
  async function loadCompanyDetail() {
    detailLoading.value = true
    try {
      const queryDate = `${detailMonth.value}-01`
      const data = await getExpenseCompanyDetail({
        date: queryDate,
        keyword: searchKeyword.value || undefined,
        page: currentPage.value,
        pageSize: pageSize.value
      })
      companyDetail.value = data
    } catch (e: any) {
      error.value = e.message || '获取公司明细数据失败'
      console.error('获取公司明细数据失败:', e)
    } finally { detailLoading.value = false }
  }

  /** 加载特定公司按天的明细 */
  async function loadDailyDetail(companyName: string, date: string) { 
    dailyDetailLoading.value = true;
    try {
      const rawData = await getExpenseDailyDetail({ companyName, date });
      dailyDetailList.value = (rawData || []).map((item: any) => ({
        COMPANY_NAME: item.companyName,
        TYPES: item.types,
        AMOUNT: item.amount,
        TEXT: item.text
      }));
    } catch (e: any) {
      console.error('获取日明细失败:', e);
      dailyDetailList.value = [];
    } finally { dailyDetailLoading.value = false; }
  }

  /** 🌟 新增：加载预算执行数据 */
  async function loadBudgetExecution() {
    budgetExecutionLoading.value = true
    try {
      const data = await getBudgetExecution({
        date: store.backendDateStr,
        dimension: timeDimension.value
      })
      budgetExecutionList.value = data || []
    } catch (e: any) {
      error.value = e.message || '获取预算执行数据失败'
      console.error('获取预算执行数据失败:', e)
    } finally {
      budgetExecutionLoading.value = false
    }
  }

  /** 刷新所有数据 */
  function refreshAll() {
    loadOverview()
    loadComparison()
    loadStructure()
    loadTrend()
    loadCompanyDetail()
    loadBudgetExecution() 
  }

  function handleSearch(keyword: string) {
    searchKeyword.value = keyword
    currentPage.value = 1
    loadCompanyDetail()
  }

  function handlePageChange(page: number) {
    currentPage.value = page
    loadCompanyDetail()
  }

  // 监听全局日期变化
  watch(() => store.backendDateStr, (newDate) => {
    if (newDate) {
      const newMonth = newDate.slice(0, 7)
      if (detailMonth.value !== newMonth) {
        detailMonth.value = newMonth
      }
      refreshAll()
    }
  }, { immediate: true })

  // 监听列表月份变化
  watch(detailMonth, (newVal) => {
    if (newVal) {
      currentPage.value = 1
      loadCompanyDetail()
    }
  })

 
  watch(timeDimension, () => {
    loadBudgetExecution()
  })

  return {
    overviewLoading,
    comparisonLoading,
    structureLoading,
    trendLoading,
    detailLoading,
    dailyDetailLoading,
    budgetExecutionLoading, 
    isAnyLoading,
    error,

    overview,
    companyComparison,
    expenseStructure,
    expenseTrend,
    companyDetail,
    dailyDetailList,
    budgetExecutionList, 

    detailMonth,
    searchKeyword,
    currentPage,
    pageSize,
    timeDimension, 

    refreshAll,
    handleSearch,
    handlePageChange,
    loadOverview,
    loadComparison,
    loadStructure,
    loadTrend,
    loadCompanyDetail,
    loadDailyDetail,
    loadBudgetExecution
  }
}