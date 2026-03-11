import { ref, computed, watch, type Ref } from 'vue'
import { getDashboardMetrics, getDashboardOrders, getPriceDeviations as fetchPriceDeviations } from '@/api/dashboard-api'
import type { SalesMetric, CollectionMetric, OrderMetric, PriceDeviationItem } from '@/types'

// 🌟 接收外部传入的响应式日期
export function useDashboard(queryDate: Ref<string>) {
  const metricsLoading = ref(true)
  const ordersLoading = ref(true)
  const deviationsLoading = ref(true)
  const error = ref<string | null>(null)

  const isAnyLoading = computed(() => metricsLoading.value || ordersLoading.value || deviationsLoading.value)

  const salesVolume = ref<SalesMetric | null>(null)
  const salesAmount = ref<SalesMetric | null>(null)
  const collection = ref<CollectionMetric | null>(null)
  const monthOrders = ref<OrderMetric | null>(null)
  const yearOrders = ref<OrderMetric | null>(null)
  const priceDeviations = ref<PriceDeviationItem[]>([])

  function loadData() {
    error.value = null
    const dateStr = queryDate.value // 🌟 获取当前选中日期
    
    metricsLoading.value = true
    getDashboardMetrics(dateStr).then(data => {
      salesVolume.value = data.salesVolume; salesAmount.value = data.salesAmount; collection.value = data.collection
    }).catch(e => error.value = e.message).finally(() => metricsLoading.value = false)

    ordersLoading.value = true
    getDashboardOrders(dateStr).then(data => {
      monthOrders.value = data.monthOrders; yearOrders.value = data.yearOrders
    }).catch(e => error.value = e.message).finally(() => ordersLoading.value = false)

    deviationsLoading.value = true
    fetchPriceDeviations({ date: dateStr }).then(data => {
      priceDeviations.value = data
    }).catch(e => error.value = e.message).finally(() => deviationsLoading.value = false)
  }

  // 🌟 核心魔法：监听日期变化，自动重新加载，并立即执行一次(代替 onMounted)
  watch(queryDate, loadData, { immediate: true })

  return { metricsLoading, ordersLoading, deviationsLoading, isAnyLoading, error, salesVolume, salesAmount, collection, monthOrders, yearOrders, priceDeviations, refresh: loadData }
}