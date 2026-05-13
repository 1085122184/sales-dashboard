import { ref, watch } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { getSalesTrends, getSalesTrendYearDetail } from '@/api/dashboard-api'
import type { SalesTrendProduct } from '@/types'

export function useSalesTrend() {
  const store = useGlobalStore()

  const trends = ref<SalesTrendProduct[]>([])
  const selectedTrend = ref<SalesTrendProduct | null>(null)
  const trendLoading = ref(true)
  const trendError = ref<string | null>(null) // 🌟 新增错误状态

  // 🌟 专用于存放当前选中产品的"年度"折线数据
  const yearDetailData = ref<any[]>([])
  const yearDetailLoading = ref(false)
  const yearDetailError = ref<string | null>(null) // 🌟 新增错误状态

  // 加载月度全量数据
  async function loadData() {
    trendLoading.value = true
    trendError.value = null
    try {
      trends.value = await getSalesTrends(store.backendDateStr)
    } catch (error: any) {
      trendError.value = error.message || '获取量价趋势数据失败'
      console.error('获取量价趋势数据失败:', error)
    } finally {
      trendLoading.value = false
    }
  }

  // 加载单产品的年度明细
  async function loadYearDetail() {
    if (!selectedTrend.value || yearDetailData.value.length > 0) return

    yearDetailLoading.value = true
    yearDetailError.value = null
    try {
      const { productCode, region } = selectedTrend.value
      yearDetailData.value = await getSalesTrendYearDetail(productCode, region, store.backendDateStr)
    } catch (error: any) {
      yearDetailError.value = error.message || '获取年度趋势明细失败'
      console.error('获取年度趋势明细失败:', error)
    } finally {
      yearDetailLoading.value = false
    }
  }

  watch(() => store.backendDateStr, () => {
    yearDetailData.value = [] // 日期改变，清空年度缓存
    yearDetailError.value = null
    if (selectedTrend.value) selectedTrend.value = null
    loadData()
  }, { immediate: true })

  return {
    trends, selectedTrend, trendLoading, trendError, // 🌟 暴露错误状态
    yearDetailData, yearDetailLoading, yearDetailError, loadYearDetail, // 🌟 暴露错误状态
    refresh: loadData
  }
}