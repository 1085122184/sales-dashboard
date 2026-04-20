<template>
  <div class="video-container" ref="containerRef">
    <video ref="videoRef" autoplay playsinline muted class="screen-video"></video>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useScreenMonitorStore } from '@/store/useScreenMonitorStore'

const emit = defineEmits<{
  (e: 'video-ready', size: { width: number; height: number }): void
}>()

const store = useScreenMonitorStore()
const videoRef = ref<HTMLVideoElement | null>(null)

let captureInterval: number | null = null

// 主 OCR 截帧画布
let hiddenCanvasRef: HTMLCanvasElement | null = null
let hiddenCtxRef: CanvasRenderingContext2D | null = null

// 变动检测微型画布 (4x4 极低开销)
let motionCanvasRef: HTMLCanvasElement | null = null
let motionCtxRef: CanvasRenderingContext2D | null = null
let prevMotionData: Uint8ClampedArray | null = null

// --- 核心状态机控制 ---
let stableFrameCount = 0       // 连续静止帧数
let isCurrentFrameSent = false // 当前静止的画面是否已发送

// --- 性能配置 ---
const MAX_CAPTURE_WIDTH = 1920
const SEND_INTERVAL_MS = 100
const ENCODING_FORMAT = 'image/jpeg'
const ENCODING_QUALITY = 0.6
const MOTION_CANVAS_DIM = 32
const PIXEL_DIFF_THRESHOLD = 20
const MOTION_MAD_THRESHOLD = 20 // 变动阈值，大于5认定为画面变动

// 计算平均绝对差异 (Fast Mean Absolute Difference)
const detectMotion = (data1: Uint8ClampedArray, data2: Uint8ClampedArray): boolean => {
  if (data1.length !== data2.length) return true;
  let changedPixelCount = 0;
  
  // 每次步进 4 (跳过 Alpha 透明度通道，只比对 R, G, B)
  for (let i = 0; i < data1.length; i += 4) {
    if (Math.abs(data1[i] - data2[i]) > PIXEL_DIFF_THRESHOLD ||     // R
        Math.abs(data1[i+1] - data2[i+1]) > PIXEL_DIFF_THRESHOLD || // G
        Math.abs(data1[i+2] - data2[i+2]) > PIXEL_DIFF_THRESHOLD) { // B
      changedPixelCount++;
    }
  }
  
  // 👉 关键排错：打印出变化的像素数量
  // console.log(`当前变化像素数量: ${changedPixelCount}`); 
  
  return changedPixelCount > MOTION_MAD_THRESHOLD;
}

const startCapture = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 15, cursor: 'never' } as any,
      audio: false
    })

    stream.getVideoTracks()[0].onended = () => {
      console.warn('⚠️ 监听到用户点击了浏览器的停止共享！')
      stopCapture()
    }

    store.initWebSocket()

    if (!videoRef.value) return
    videoRef.value.srcObject = stream

    videoRef.value.onloadedmetadata = () => {
      if (!videoRef.value) return
      
      const originalW = videoRef.value.videoWidth
      const originalH = videoRef.value.videoHeight

      // 限制最大宽度，减轻后端压力
      let captureW = originalW
      let captureH = originalH
      if (originalW > MAX_CAPTURE_WIDTH) {
        captureH = Math.round(originalH * (MAX_CAPTURE_WIDTH / originalW))
        captureW = MAX_CAPTURE_WIDTH
      }

      emit('video-ready', { width: captureW, height: captureH })

      // 初始化主画布
      const hiddenCanvas = document.createElement('canvas')
      hiddenCanvas.width = captureW
      hiddenCanvas.height = captureH
      const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true }) 
      if (!ctx) return
      hiddenCanvasRef = hiddenCanvas
      hiddenCtxRef = ctx

      // 初始化微型变动检测画布
      const motionCanvas = document.createElement('canvas')
      motionCanvas.width = MOTION_CANVAS_DIM
      motionCanvas.height = MOTION_CANVAS_DIM
      const mCtx = motionCanvas.getContext('2d', { willReadFrequently: true })
      if (!mCtx) return
      motionCanvasRef = motionCanvas
      motionCtxRef = mCtx
      
      prevMotionData = null 
      stableFrameCount = 0
      isCurrentFrameSent = false

      if (captureInterval) window.clearInterval(captureInterval)
      captureInterval = window.setInterval(captureLoopCallback, SEND_INTERVAL_MS)
    }

  } catch (err) {
    console.error('❌ 屏幕捕获失败或被取消:', err)
  }
}

const captureLoopCallback = () => {

  
  const vid = videoRef.value
  const motionCtx = motionCtxRef
  const ocrCtx = hiddenCtxRef
  const ocrCanvas = hiddenCanvasRef
  
  if (!vid || vid.paused || vid.ended || !ocrCtx || !ocrCanvas || !motionCtx) return

  // 1. 变动检测 (Heuristic)
  motionCtx.drawImage(vid, 0, 0, MOTION_CANVAS_DIM, MOTION_CANVAS_DIM)
  const currentMotionData = motionCtx.getImageData(0, 0, MOTION_CANVAS_DIM, MOTION_CANVAS_DIM).data

  let hasMotion = false
  if (prevMotionData) {
    hasMotion = detectMotion(currentMotionData, prevMotionData)
  }
  prevMotionData = currentMotionData

  // 2. 状态机逻辑分发
  if (hasMotion) {
    // 【状态A：画面变动中】清空框、重置计数器，绝对不发送请求
    console.log('🌪️ 画面变动中，清空框，不发送！') 
    store.clearBoxes() 
    stableFrameCount = 0
    isCurrentFrameSent = false
    return
  }

  // 【状态B/C：画面静止】
  stableFrameCount++

  // 连续静止 2 帧（约 200ms），确认画面停稳
  if (stableFrameCount >= 2) {
    // 且当前静止画面还没有被发送过
    if (!isCurrentFrameSent) {
      // 检查并发锁
      if (store.isProcessing) return 
      
      store.isProcessing = true 
      const mainW = ocrCanvas.width
      const mainH = ocrCanvas.height
      ocrCtx.drawImage(vid, 0, 0, mainW, mainH)
      
      ocrCanvas.toBlob((blob) => {
        if (blob) {
          console.log('🚀 画面静止，成功发送了一帧数据到后端！')
          store.sendFrame(blob)
        } else {
          store.isProcessing = false
        }
      }, ENCODING_FORMAT, ENCODING_QUALITY)
      
      isCurrentFrameSent = true // 标记当前静止帧已发送，后续循环将彻底挂起
    } 
  }
}

const stopCapture = () => {
  if (captureInterval) {
    window.clearInterval(captureInterval)
    captureInterval = null
  }
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
    videoRef.value.srcObject = null
  }
  
  store.closeWebSocket()
  store.clearBoxes()
  
  prevMotionData = null
  motionCanvasRef = null
  motionCtxRef = null
  hiddenCanvasRef = null
  hiddenCtxRef = null
  
  emit('video-ready', { width: 0, height: 0 })
}

defineExpose({ startCapture, stopCapture })

onUnmounted(() => {
  stopCapture()
})
</script>

<style scoped>
.video-container {
  width: 100%;
}
.screen-video {
  width: 100%;
  height: auto;
  display: block;
}
</style>