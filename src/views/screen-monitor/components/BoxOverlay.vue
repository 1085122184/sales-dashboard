<template>
  <canvas 
    ref="overlayCanvasRef" 
    class="overlay-canvas"
    :width="width"
    :height="height"
    @click="handleCanvasClick"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useScreenMonitorStore, type BoxData } from '@/store/useScreenMonitorStore'

const props = defineProps<{ width: number; height: number }>()
const emit = defineEmits<{ (e: 'box-clicked', box: BoxData): void }>()

const overlayCanvasRef = ref<HTMLCanvasElement | null>(null)
const store = useScreenMonitorStore()

// 用 ResizeObserver 监听兄弟 video 元素的实际渲染尺寸，同步给 canvas CSS 尺寸
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const videoEl = overlayCanvasRef.value?.parentElement?.querySelector('video')
  if (!videoEl || !overlayCanvasRef.value) return

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      if (overlayCanvasRef.value) {
        overlayCanvasRef.value.style.width = `${width}px`
        overlayCanvasRef.value.style.height = `${height}px`
      }
    }
  })
  resizeObserver.observe(videoEl)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(() => store.currentBoxes, (boxes) => {
  if (!overlayCanvasRef.value || props.width === 0) return
  const ctx = overlayCanvasRef.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, props.width, props.height)

  boxes.forEach((box) => {
    // 边框
    ctx.strokeStyle = '#00FF00'
    ctx.lineWidth = 2
    ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w, box.h)
    
    // 半透明填充
    ctx.fillStyle = 'rgba(0, 255, 0, 0.15)'
    ctx.fillRect(box.x, box.y, box.w, box.h)
    
    // 绘制文字标签，方便确认坐标是否对齐
    ctx.fillStyle = '#00FF00'
    ctx.font = '12px monospace'
    ctx.fillText(box.text, box.x + 2, box.y - 4 > 0 ? box.y - 4 : box.y + 14)
  })
}, { deep: true })

const handleCanvasClick = (event: MouseEvent) => {
  if (!overlayCanvasRef.value) return
  const rect = overlayCanvasRef.value.getBoundingClientRect()
  
  // 计算点击坐标相对于 Canvas 内部渲染分辨率的映射
  const scaleX = props.width / rect.width
  const scaleY = props.height / rect.height
  const clickX = Math.round((event.clientX - rect.left) * scaleX)
  const clickY = Math.round((event.clientY - rect.top) * scaleY)
  
  const clickedBox = store.currentBoxes.find((box) =>
    clickX >= box.x && clickX <= box.x + box.w &&
    clickY >= box.y && clickY <= box.y + box.h
  )
  
  if (clickedBox) emit('box-clicked', clickedBox)
}
</script>

<style scoped>
.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
  pointer-events: auto;
}
</style>