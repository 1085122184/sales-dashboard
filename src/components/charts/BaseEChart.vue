<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { debounce } from '@/utils'

// 🌟 1. 使用与默认值绑定的 Props：默认撑满父容器的 100%
const props = withDefaults(defineProps<{
  option: echarts.EChartsCoreOption | Record<string, any>
  height?: string
  width?: string
}>(), {
  height: '100%',
  width: '100%'
})

const emit = defineEmits<{
  (e: 'click', params: any): void
}>()

const chartRef = ref<HTMLDivElement | null>(null)
const chartInstance = shallowRef<echarts.ECharts | null>(null)

// 🌟 2. 引入 ResizeObserver 对象
let resizeObserver: ResizeObserver | null = null

const initChart = () => {
  if (!chartRef.value) return
  chartInstance.value = echarts.init(chartRef.value)

  if (props.option && Object.keys(props.option).length > 0) {
    chartInstance.value.setOption(props.option)
  }

  chartInstance.value.on('click', (params) => {
    emit('click', params)
  })
}

// 防抖重绘
const handleResize = debounce(() => {
  chartInstance.value?.resize()
}, 150)

// 监听 Option 变化
watch(() => props.option, (newVal) => {
  if (!chartInstance.value) return
  if (newVal && Object.keys(newVal).length > 0) {
    chartInstance.value.setOption(newVal, { notMerge: false })
  } else {
    chartInstance.value.clear()
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
    // 🌟 3. 核心大招：弃用传统的 window resize，改用 ResizeObserver 精确监听当前 DOM 盒子的大小变化
    if (chartRef.value) {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(chartRef.value)
    }
  })
})

onUnmounted(() => {
  // 🌟 4. 销毁时清理 Observer，防止内存泄漏
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chartInstance.value) {
    chartInstance.value.off('click')
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>

<template>
  <div 
    ref="chartRef" 
    :style="{ width: props.width, height: props.height }" 
  ></div>
</template>

<style scoped>
/* 既然使用了 100% 默认值，这里的兜底 CSS 可以安全移除了，保持代码干净 */
</style>