/**
 * useSalesTrend.ts — 销售趋势数据 Composable
 *
 * 切换真实 API 同样只改一行 import：
 *   import { getSalesTrends as fetchSalesTrends } from '@/api'
 */
import { ref, onMounted } from 'vue'
import { fetchSalesTrends } from '@/mock/dashboard'   // ← 切换为真实 API 时替换这行
import type { SalesTrendProduct } from '@/types'

export function useSalesTrend() {
  const trendLoading = ref(true)
  const trends       = ref<SalesTrendProduct[]>([])
  const selectedTrend = ref<SalesTrendProduct | null>(null)

  onMounted(async () => {
    try {
      trends.value = await fetchSalesTrends()
      // 默认选中第一个产品
      if (trends.value.length) selectedTrend.value = trends.value[0]
    } finally {
      trendLoading.value = false
    }
  })

  return { trendLoading, trends, selectedTrend }
}
