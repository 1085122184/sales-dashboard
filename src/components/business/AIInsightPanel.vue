<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  title?: string
  dataToAnalyze: any[] // 传入需要分析的图表数据
  apiEndpoint: string  // 对应的后端 AI 接口路径
}>()

const insightText = ref('')
const isGenerating = ref(false)
const hasError = ref(false)

// 🌟 添加 AbortController 用于请求取消，防止并发请求
let currentController: AbortController | null = null
let timeoutId: ReturnType<typeof setTimeout> | null = null

// 🌟 核心魔法：使用原生 fetch 读取流式数据 (SSE)
// 🌟 核心魔法：解析 SSE 并动态剔除思考过程
async function generateInsight(signal: AbortSignal) {
  if (!props.dataToAnalyze || props.dataToAnalyze.length === 0) return

  isGenerating.value = true
  insightText.value = ''
  hasError.value = false

  let fullRawText = '' // 用于在内存中累加包含 <think> 的完整原始文本

  // 🌟 添加 AbortController 用于超时控制和请求取消
  const controller = new AbortController()
  timeoutId = setTimeout(() => controller.abort(), 60000) // 60 秒超时

  try {
    // 🌟 从 localStorage 获取 Token，手动添加到 fetch 请求头
    const token = localStorage.getItem('access_token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(props.apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(props.dataToAnalyze.slice(0, 5)),
      signal: controller.signal // 🌟 绑定 abort 信号
    })

    if (!response.body) throw new Error('ReadableStream not yet supported.')

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      // 🌟 检查信号是否被中止
      if (signal.aborted) break
      
      const { done, value } = await reader.read()
      if (done) break

      // 1. 解码当前的字节流块
      const chunk = decoder.decode(value, { stream: true })
      const cleanText = chunk.split('\n').map(line => line.replace(/^data:/, '').trim()).filter(line => line).join('');
      fullRawText += cleanText

      // 2. 清洗 SSE 协议的 "data:" 前缀
      const lines = chunk.split('\n')

      // 3. 🛡️ 核心：动态剔除 <think> 标签及其内容
      // 先去掉已经闭合的 <think>...</think>
      let displayText = fullRawText.replace(/<think>[\s\S]*?<\/think>/g, '')
      // 再去掉还没闭合的 <think>... （即模型正在思考时的输出）
      displayText = displayText.replace(/<think>[\s\S]*/g, '')

      // 4. 将干干净净的最终文本交给 Vue 渲染
      insightText.value = displayText
    }
  } catch (error: any) {
    console.error('AI 生成失败:', error)
    hasError.value = true
    if (error.name === 'AbortError') {
      insightText.value = 'AI 诊断超时，请稍后重试。'
    } else {
      insightText.value = 'AI 诊断服务暂时不可用，请稍后再试。'
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    isGenerating.value = false
  }
}

// 🌟 当传入的数据发生变化时，自动触发 AI 分析，并取消上一个未完成的请求
watch(() => props.dataToAnalyze, async (newVal) => {
  // 取消上一个未完成的请求
  if (currentController) {
    currentController.abort()
  }

  if (!newVal || newVal.length === 0) return
  
  currentController = new AbortController()
  await generateInsight(currentController.signal)
}, { immediate: true })

// 🌟 组件卸载时清理未完成的请求
onUnmounted(() => {
  if (currentController) {
    currentController.abort()
  }
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

<template>
  <div class="ai-insight-panel">
    <div class="ai-header">
      <div class="ai-icon-wrap" :class="{ 'is-spinning': isGenerating }">
        <svg viewBox="0 0 24 24" fill="none" class="ai-sparkle">
          <path d="M10 1L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 1Z" fill="url(#ai-gradient)"/>
          <path d="M19 16L20 19L23 20L20 21L19 24L18 21L15 20L18 19L19 16Z" fill="url(#ai-gradient)"/>
          <defs>
            <linearGradient id="ai-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stop-color="#8b5cf6" />
              <stop offset="1" stop-color="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span class="ai-title">{{ title || 'AI 智能诊断' }}</span>
      <span v-if="isGenerating" class="ai-status">正在生成洞察...</span>
    </div>

    <div class="ai-content" :class="{ 'is-error': hasError }">
      <span class="typewriter-text">{{ insightText }}</span>
      <span v-if="isGenerating" class="cursor">|</span>
    </div>
  </div>
</template>

<style scoped>
.ai-insight-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-left: 4px solid #8b5cf6;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.05);
}

.ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ai-icon-wrap { width: 22px; height: 22px; }
.ai-sparkle { width: 100%; height: 100%; }
.is-spinning { animation: pulse 2s infinite ease-in-out; }

.ai-title { font-size: 15px; font-weight: 700; background: linear-gradient(90deg, #8b5cf6, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.ai-status { font-size: 12px; color: #94a3b8; margin-left: auto; }

.ai-content { font-size: 14px; line-height: 1.6; color: #334155; }
.typewriter-text { white-space: pre-wrap; }
.is-error { color: #ef4444; }

.cursor { font-weight: bold; color: #8b5cf6; animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
</style>