// src/composables/useProductDetail.ts
import { ref, shallowRef } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { getProductDeepDetail } from '@/api/dashboard-api'
import type { ProductDeepDetail } from '@/types'

export function useProductDetail() {
  const store = useGlobalStore()
  
  // 首次进场的全局 Loading
  const loading = ref(true)
  // 切换时间 Tab 时的局部 Loading
  const chartLoading = ref(false)
  
  // 使用 shallowRef 避免 ECharts 数据渲染卡顿
  const detailData = shallowRef<ProductDeepDetail | null>(null)

  async function fetchDetail(companyName: string, productName: string, tab: 'month' | 'year') {
    // 如果是第一次加载，显示全屏骨架；如果是切 Tab，只显示图表遮罩
    if (!detailData.value) {
      loading.value = true
    } else {
      chartLoading.value = true
    }

    try {
      const dateStr = store.backendDateStr
      // 调用 API 请求数据
      detailData.value = await getProductDeepDetail(companyName, productName, tab, dateStr)
    } catch (error) {
      console.error('获取产品深度解析数据失败:', error)
    } finally {
      loading.value = false
      chartLoading.value = false
    }
  }

  // 暴露给 Vue 组件清理缓存用
  function clearData() {
    detailData.value = null
  }

  return {
    loading,
    chartLoading,
    detailData,
    fetchDetail,
    clearData
  }
}