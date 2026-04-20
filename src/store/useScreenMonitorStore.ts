import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BoxData {
  text: string
  x: number
  y: number
  w: number
  h: number
}

export const useScreenMonitorStore = defineStore('screenMonitor', () => {
  const ws = ref<WebSocket | null>(null)
  const currentBoxes = ref<BoxData[]>([])
  const isProcessing = ref(false)

  const initWebSocket = () => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) return

    // 从环境变量读取 WebSocket 地址，支持不同环境配置
    const wsUrl = import.meta.env.VITE_WS_OCR_URL || `ws://${window.location.hostname}:18000/ws/ocr`
    ws.value = new WebSocket(wsUrl)
    ws.value.binaryType = 'arraybuffer' // 必须设置，用于接收二进制/极速响应
    
    ws.value.onopen = () => {
      console.log('✅ WebSocket 连接成功！数据通道已建立！')
      isProcessing.value = false
    }

    ws.value.onmessage = (event: MessageEvent) => {
      try {
        const result = JSON.parse(event.data)
        const PADDING = 4;
        currentBoxes.value = result.matches.map((box: any): BoxData => ({
          text: box.text,
          x: Math.max(0, Math.round(box.x) - PADDING), 
          y: Math.max(0, Math.round(box.y) - PADDING),
          w: Math.round(box.w) + PADDING * 2,
          h: Math.round(box.h) + PADDING * 2
        }))
      } catch (error) {
        console.error('❌ 解析坐标数据失败:', error)
      } finally {
        isProcessing.value = false // 收到后端回复，解锁，允许发送下一帧
      }
    }

    ws.value.onerror = (error) => {
      isProcessing.value = false // 发生错误时解锁，防止死锁
      console.error('❌ WebSocket 连接发生错误！请检查后端是否在 18000 端口启动:', error)
    }

    ws.value.onclose = (event) => {
      isProcessing.value = false
      console.warn(`⚠️ WebSocket 连接已关闭，代码: ${event.code}, 原因: ${event.reason}`)
    }
  }

  const sendFrame = (blob: Blob) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(blob)
    } else {
      isProcessing.value = false
      console.warn('⚠️ 试图发送图像，但 WebSocket 尚未连接！')
    }
  }

  const closeWebSocket = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  // 暴露给播放器的方法：清空所有框
  const clearBoxes = () => {
    currentBoxes.value = []
  }

  return { 
    ws, 
    currentBoxes, 
    isProcessing,
    initWebSocket, 
    sendFrame, 
    closeWebSocket,
    clearBoxes
  }
})