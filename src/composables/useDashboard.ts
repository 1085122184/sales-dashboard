/**
 * ============================================================
 * useDashboard.ts — 仪表盘数据 Composable
 * ============================================================
 *
 * ✅ 当前模式：MOCK（使用本地模拟数据，无需后台）
 *
 * 🔄 切换到真实 API 只需两步：
 *
 *   第一步：把下面 import 这一行
 *     import { fetchDashboardData } from '@/mock/dashboard'
 *   替换为：
 *     import { getDashboardAll as fetchDashboardData } from '@/api'
 *
 *   第二步：确认 src/api/http.ts 里的 BASE_URL 指向正确后台地址
 *           或在 .env.production 中配置 VITE_API_BASE_URL
 *
 * ⚠️  注意：如果后台字段与前端 DTO 不同，
 *           需先在 src/api/dashboard.ts 的适配函数中做字段映射。
 * ============================================================
 */

// ── 数据源切换：改这一行即可 ──────────────────────────────────
import { fetchDashboardData } from '@/mock/dashboard'
// import { getDashboardAll as fetchDashboardData } from '@/api'  ← 切换为真实 API
// ─────────────────────────────────────────────────────────────

import { ref, onMounted } from 'vue'
import type { SalesMetric, CollectionMetric, OrderMetric, PriceDeviationItem } from '@/types'

export function useDashboard() {
  const loading = ref(true)
  const error   = ref<string | null>(null)

  const salesVolume     = ref<SalesMetric | null>(null)
  const salesAmount     = ref<SalesMetric | null>(null)
  const collection      = ref<CollectionMetric | null>(null)
  const monthOrders     = ref<OrderMetric | null>(null)
  const yearOrders      = ref<OrderMetric | null>(null)
  const priceDeviations = ref<PriceDeviationItem[]>([])

  async function loadData() {
    loading.value = true
    error.value   = null
    try {
      const data = await fetchDashboardData()
      salesVolume.value     = data.salesVolume
      salesAmount.value     = data.salesAmount
      collection.value      = data.collection
      monthOrders.value     = data.monthOrders
      yearOrders.value      = data.yearOrders
      priceDeviations.value = data.priceDeviations
    } catch (e) {
      error.value = e instanceof Error ? e.message : '数据加载失败'
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  return {
    loading,
    error,
    salesVolume,
    salesAmount,
    collection,
    monthOrders,
    yearOrders,
    priceDeviations,
    refresh: loadData,
  }
}
