// src/composables/useDashboard.ts
import { ref, computed, watch } from 'vue' 
import { useGlobalStore } from '@/store/useGlobalStore' 
import { getDashboardMetrics, getDashboardOrders, getPriceDeviations as fetchPriceDeviations } from '@/api/dashboard-api'
import type { SalesMetric, CollectionMetric, OrderMetric, PriceDeviationItem, DashboardData } from '@/types'


function formatThousands(val: string | number | undefined): string {
  if (val === null || val === undefined || val === '') return '0.00'
  
  // 1. 转为字符串，并去掉可能残留的千分位逗号和空格
  const str = String(val).replace(/,/g, '').replace(/\s/g, '')
  
  // 2. 用正则把 "数字部分" 和 "单位文字部分" 拆开
  // 例如："12345.6万" 会被拆成 match[1]="12345.6", match[2]="万"
  const match = str.match(/^(-?\d+(?:\.\d+)?)(.*)$/)
  
  if (match) {
    const num = Number(match[1])
    if (!isNaN(num)) {
      // 3. 仅对数字部分强制保留两位小数并添加千分位
      const formattedNum = num.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
      // 4. 把格式化好的数字和原来的单位拼起来返回 (如 "12,345.60万")
      return formattedNum + match[2]
    }
  }
  
  return '0.00'
}
export function useDashboard() {
  const store = useGlobalStore()

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
    // 🌟 直接从 Store 中获取处理好的后端所需日期格式
    const backendDateStr = store.backendDateStr 
    
    metricsLoading.value = true
    getDashboardMetrics(backendDateStr)
      .then((data) => {
        if (data.salesVolume) {
          salesVolume.value = {
            ...data.salesVolume,
            label: (data.salesVolume.label || '销量') + '（日）',
            value: formatThousands(data.salesVolume.value) as string,
            gapColor: data.salesVolume.gapColor === 'red' || data.salesVolume.gapColor === 'green'
              ? data.salesVolume.gapColor
              : undefined
          }
        }

        if (data.salesAmount) {
          salesAmount.value = {
            ...data.salesAmount,
            label: (data.salesAmount.label || '销售额') + '（日）',
            value: formatThousands(data.salesAmount.value) as string,
            gapColor: data.salesAmount.gapColor === 'red' || data.salesAmount.gapColor === 'green'
              ? data.salesAmount.gapColor
              : undefined
          }
        }

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
    getDashboardOrders(backendDateStr)
      .then(data => {
        monthOrders.value = data.monthOrders
        yearOrders.value = data.yearOrders
      })
      .catch(e => { error.value = e.message })
      .finally(() => { ordersLoading.value = false })

    deviationsLoading.value = true
    fetchPriceDeviations({ date: backendDateStr })
      .then(data => {
        priceDeviations.value = data
      })
      .catch(e => { error.value = e.message })
      .finally(() => { deviationsLoading.value = false })
  }

  // 🌟 监听 Store 中 backendDateStr 的变化自动拉取数据
  watch(() => store.backendDateStr, loadData, { immediate: true })

  return { 
    metricsLoading, ordersLoading, deviationsLoading, isAnyLoading, 
    error, salesVolume, salesAmount, collection, monthOrders, yearOrders, 
    priceDeviations, refresh: loadData 
  }
}