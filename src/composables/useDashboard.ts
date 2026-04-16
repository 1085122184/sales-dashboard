import { ref, computed, watch, type Ref } from 'vue'
import dayjs from 'dayjs'
import { getDashboardMetrics, getDashboardOrders, getPriceDeviations as fetchPriceDeviations } from '@/api/dashboard-api'
import type { SalesMetric, CollectionMetric, OrderMetric, PriceDeviationItem ,DashboardData} from '@/types'

// 🌟 接收外部传入的响应式日期
function formatThousands(val: string | number | undefined): string {
  if (val === null || val === undefined) return '0'
  const str = String(val)
  return str.replace(/\d+/, (numString) => {
    return numString.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  })
}
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
    const backendDateStr = dayjs(queryDate.value).add(1, 'day').format('YYYY-MM-DD')
    metricsLoading.value = true
    getDashboardMetrics(backendDateStr)
  .then((data: DashboardData) => {
    // 修复：处理 salesVolume 类型
    if (data.salesVolume) {
      const salesVolumeData = {
        ...data.salesVolume,
        label: (data.salesVolume.label || '销量') + '（日）',
        value: formatThousands(data.salesVolume.value) as string,
        gapColor: data.salesVolume.gapColor === 'red' || data.salesVolume.gapColor === 'green'
          ? data.salesVolume.gapColor
          : undefined
      };
      salesVolume.value = salesVolumeData;
    }

    // 修复：处理 salesAmount 类型
    if (data.salesAmount) {
      const salesAmountData = {
        ...data.salesAmount,
        label: (data.salesAmount.label || '销售额') + '（日）',
        value: formatThousands(data.salesAmount.value) as string,
        gapColor: data.salesAmount.gapColor === 'red' || data.salesAmount.gapColor === 'green'
          ? data.salesAmount.gapColor
          : undefined
      };
      salesAmount.value = salesAmountData;
    }

    // collection 处理（无需 gapColor 转换，因为不是 SalesMetric 类型）
    if (data.collection) {
      if (data.collection.label) {
        data.collection.label = data.collection.label + '（日）'
      }
      data.collection.amount = formatThousands(data.collection.amount) as string
      collection.value = data.collection
    }
  })
  .catch(e => { error.value = e.message })
  .finally(() => { metricsLoading.value = false })

    ordersLoading.value = true
    getDashboardOrders(backendDateStr).then(data => {
      monthOrders.value = data.monthOrders; yearOrders.value = data.yearOrders
    }).catch(e => error.value = e.message).finally(() => ordersLoading.value = false)

    deviationsLoading.value = true
    fetchPriceDeviations({ date: backendDateStr }).then(data => {
      priceDeviations.value = data
    }).catch(e => error.value = e.message).finally(() => deviationsLoading.value = false)
  }

  // 🌟 核心魔法：监听日期变化，自动重新加载，并立即执行一次(代替 onMounted)
  watch(queryDate, loadData, { immediate: true })

  return { metricsLoading, ordersLoading, deviationsLoading, isAnyLoading, error, salesVolume, salesAmount, collection, monthOrders, yearOrders, priceDeviations, refresh: loadData }
}