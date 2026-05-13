<script setup lang="ts">
/**
 * ============================================================
 * 延迟骨架屏包装器
 * ============================================================
 * 如果加载时间 < delay，则不显示骨架屏，避免闪烁
 * 
 * @example
 * ```vue
 * <DelayedSkeleton :loading="dataLoading" :delay="300">
 *   <template #skeleton>
 *     <ChartSkeleton height="420px" />
 *   </template>
 *   <template #content>
 *     <MyChart :data="data" />
 *   </template>
 * </DelayedSkeleton>
 * ```
 */
import { ref, watch, onUnmounted } from 'vue'

interface Props {
  loading: boolean
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  delay: 300, // 默认 300ms 延迟
})

const showSkeleton = ref(false)
const hasLoadedOnce = ref(false) // 🌟 标记是否至少加载过一次
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.loading,
  (isLoading) => {
    if (isLoading) {
      // 开始加载：延迟显示骨架屏
      hasLoadedOnce.value = true
      timer = setTimeout(() => {
        showSkeleton.value = true
      }, props.delay)
    } else {
      // 加载完成：立即隐藏骨架屏并清理定时器
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      showSkeleton.value = false
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<template>
  <!-- 🌟 如果从未加载过，也显示骨架屏（避免空白） -->
  <slot v-if="showSkeleton || !hasLoadedOnce" name="skeleton" />
  <slot v-else name="content" />
</template>
