import { ref, watch, type Ref } from 'vue'
import dayjs from 'dayjs'
import { getSalesTrends as fetchSalesTrends } from '@/api/dashboard-api'
import type { SalesTrendProduct } from '@/types'

// 🌟 接收外部传入的响应式日期
export function useSalesTrend(queryDate: Ref<string>) {
  const trends = ref<SalesTrendProduct[]>([])
  const selectedTrend = ref<SalesTrendProduct | null>(null)
  const trendLoading = ref(true)

  async function loadData() {
    trendLoading.value = true
    try { 
      const backendDateStr = dayjs(queryDate.value).add(1, 'day').format('YYYY-MM-DD')
      // 🌟 传入日期拉取数据
      trends.value = await fetchSalesTrends(backendDateStr) 
    } 
    catch (error) { console.error('获取量价趋势数据失败:', error) } 
    finally { trendLoading.value = false }
  }

  // 🌟 监听日期变化自动拉取
  watch(queryDate, loadData, { immediate: true })

  return { trends, selectedTrend, trendLoading, refresh: loadData }
}