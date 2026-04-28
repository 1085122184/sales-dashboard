import { ref, computed, watch } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import {
  getExpenseOverview,
  getExpenseCompanyComparison,
  getExpenseStructure,
  getExpenseTrend,
  getExpenseCompanyDetail,
  getExpenseDailyDetail,
  getBudgetExecution,
  getCompanyGrowthData
} from '@/api/expense-api'
import type { BudgetExecutionRecord } from '@/api/expense-api' 

// 🌟 核心规范：所有业务类型全部从统一的类型契约中心引入
import type { 
  CompanyGrowthPoint, 
  ExpenseOverview, 
  CompanyExpense, 
  ExpenseStructure, 
  ExpenseTrend, 
  CompanyDetailList 
} from '@/types' 

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
  const growthLoading = ref(true) 
  
  const error = ref<string | null>(null)

  const isAnyLoading = computed(() =>
    overviewLoading.value || comparisonLoading.value || structureLoading.value || 
    trendLoading.value || detailLoading.value || budgetExecutionLoading.value || growthLoading.value
  )

  const overview = ref<ExpenseOverview | null>(null)
  const companyComparison = ref<CompanyExpense[]>([])
  const expenseStructure = ref<ExpenseStructure[]>([])
  const expenseTrend = ref<ExpenseTrend | null>(null)
  const companyDetail = ref<CompanyDetailList>({ list: [], total: 0, page: 1, pageSize: 10 })
  const dailyDetailList = ref<any[]>([])
  
  const budgetExecutionList = ref<BudgetExecutionRecord[]>([]) 
  const companyGrowthData = ref<CompanyGrowthPoint[]>([])

  const detailMonth = ref(store.backendDateStr ? store.backendDateStr.slice(0, 7) : new Date().toISOString().slice(0, 7))
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const timeDimension = ref<'month' | 'year'>('month') 

  async function loadOverview() { 
    overviewLoading.value = true
    try {
      const data = await getExpenseOverview(store.backendDateStr)
      overview.value = data
    } catch (e: any) {
      error.value = e.message || '获取总览数据失败'
    } finally { overviewLoading.value = false }
  }

  async function loadComparison() { 
    comparisonLoading.value = true
    try {
      const data = await getExpenseCompanyComparison(store.backendDateStr)
      companyComparison.value = data
    } catch (e: any) {
      error.value = e.message || '获取公司对比数据失败'
    } finally { comparisonLoading.value = false }
  }

  async function loadStructure() {
    structureLoading.value = true
    try {
      const currentYear = new Date().getFullYear()
      const data = await getExpenseStructure(store.backendDateStr, currentYear)
      expenseStructure.value = data
    } catch (e: any) {
      error.value = e.message || '获取费用结构数据失败'
    } finally { structureLoading.value = false }
  }

  async function loadTrend() {
    trendLoading.value = true
    try {
      const data = await getExpenseTrend(store.backendDateStr)
      expenseTrend.value = data
    } catch (e: any) {
      error.value = e.message || '获取趋势数据失败'
    } finally { trendLoading.value = false }
  }

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
    } finally { detailLoading.value = false }
  }

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
      dailyDetailList.value = [];
    } finally { dailyDetailLoading.value = false; }
  }

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
    } finally {
      budgetExecutionLoading.value = false
    }
  }

  async function loadGrowthData() {
    growthLoading.value = true
    try {
      const data = await getCompanyGrowthData({ date: store.backendDateStr })
      companyGrowthData.value = data || []
    } catch (e: any) {
      console.error('获取同环比增长数据失败:', e)
    } finally {
      growthLoading.value = false
    }
  }

  function refreshAll() {
    loadOverview()
    loadComparison()
    loadStructure()
    loadTrend()
    loadCompanyDetail()
    loadBudgetExecution() 
    loadGrowthData() 
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

  watch(() => store.backendDateStr, (newDate) => {
    if (newDate) {
      const newMonth = newDate.slice(0, 7)
      if (detailMonth.value !== newMonth) {
        detailMonth.value = newMonth
      }
      refreshAll()
    }
  }, { immediate: true })

  watch(detailMonth, (newMonth) => {
    if (newMonth && store.backendDateStr) {
      const currentBackendMonth = store.backendDateStr.slice(0, 7)
      if (newMonth === currentBackendMonth) {
        currentPage.value = 1
        loadCompanyDetail()
      }
    }
  })

  watch(timeDimension, () => {
    loadBudgetExecution()
  })

  return {
    overviewLoading, comparisonLoading, structureLoading, trendLoading,
    detailLoading, dailyDetailLoading, budgetExecutionLoading, growthLoading, 
    isAnyLoading, error,
    overview, companyComparison, expenseStructure, expenseTrend,
    companyDetail, dailyDetailList, budgetExecutionList, companyGrowthData, 
    detailMonth, searchKeyword, currentPage, pageSize, timeDimension, 
    refreshAll, handleSearch, handlePageChange, loadOverview, loadComparison,
    loadStructure, loadTrend, loadCompanyDetail, loadDailyDetail,
    loadBudgetExecution, loadGrowthData
  }
}