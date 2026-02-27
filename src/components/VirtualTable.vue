<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * VirtualTable — 通用虚拟滚动表格
 * 只渲染可视区域内的行，200+ 条数据无压力
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  rows: T[]
  rowHeight?: number   // 每行高度 px，默认 44
  visibleCount?: number // 可视区域行数，默认 9
}>()

const ROW_H    = props.rowHeight    ?? 44
const VISIBLE  = props.visibleCount ?? 9
const BUFFER   = 3  // 上下各多渲染 3 行，防止滚动白屏

const containerH = ROW_H * VISIBLE
const scrollTop  = ref(0)
const containerRef = ref<HTMLDivElement | null>(null)

const startIdx = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / ROW_H) - BUFFER)
)
const endIdx = computed(() =>
  Math.min(props.rows.length, startIdx.value + VISIBLE + BUFFER * 2)
)
const visibleRows = computed(() =>
  props.rows.slice(startIdx.value, endIdx.value).map((row, i) => ({
    row,
    index: startIdx.value + i,
  }))
)
const totalH   = computed(() => props.rows.length * ROW_H)
const offsetY  = computed(() => startIdx.value * ROW_H)

function onScroll(e: Event) {
  scrollTop.value = (e.target as HTMLDivElement).scrollTop
}

// 暴露滚动到指定行的方法（供父组件调用）
function scrollToRow(idx: number) {
  if (!containerRef.value) return
  containerRef.value.scrollTop = idx * ROW_H
}

defineExpose({ scrollToRow })
</script>

<template>
  <div
    ref="containerRef"
    class="vt-scroll"
    :style="{ height: containerH + 'px' }"
    @scroll="onScroll"
  >
    <!-- 撑开总高度的占位层 -->
    <div :style="{ height: totalH + 'px', position: 'relative' }">
      <!-- 只渲染可视行，absolute 定位到正确位置 -->
      <div :style="{ position: 'absolute', top: offsetY + 'px', left: 0, right: 0 }">
        <slot :visible-rows="visibleRows" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vt-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
  will-change: transform; /* GPU 加速 */
}
.vt-scroll::-webkit-scrollbar { width: 5px; }
.vt-scroll::-webkit-scrollbar-track { background: transparent; }
.vt-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
.vt-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>
