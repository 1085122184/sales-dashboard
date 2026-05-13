<template>
  <div class="bridge-page">
    <div class="bridge-card">
      <div class="bridge-spinner" />
      <h1>正在跳转中</h1>
      <p>{{ message }}</p>
      <div class="bridge-progress">
        <div class="bridge-progress-bar" />
      </div>
      <el-button v-if="externalUrl" type="primary" @click="retryOpenBrowser">重新打开浏览器</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createPcDingTalkBridgeLogin } from '@/api/auth-api'

const DINGTALK_JSAPI_URL = import.meta.env.VITE_DINGTALK_JSAPI_URL
  || 'https://g.alicdn.com/dingding/dingtalk-jsapi/3.0.36/dingtalk.open.js'

const route = useRoute()
const message = ref('正在获取钉钉身份并打开系统浏览器，请稍候。')
const externalUrl = ref('')

onMounted(() => {
  startBridge()
})

async function startBridge() {
  try {
    const authCode = await requestDingTalkAuthCode()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    const res = await createPcDingTalkBridgeLogin({ authCode }, redirect)
    externalUrl.value = buildAbsoluteUrl(res.data.externalUrl)
    await openUrlInExternalBrowser(externalUrl.value)
    message.value = '浏览器已打开。如果当前页面未自动关闭，请手动关闭钉钉中的这个中转页。'
    await closeCurrentDingTalkPage()
  } catch (error: any) {
    message.value = error?.message || '跳转失败，请关闭当前页后重试。'
  }
}

async function retryOpenBrowser() {
  if (!externalUrl.value) return
  await openUrlInExternalBrowser(externalUrl.value)
  await closeCurrentDingTalkPage()
}

function buildAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }
  return new URL(pathOrUrl, window.location.origin).toString()
}

function isDingTalkContainer() {
  if (typeof navigator === 'undefined') return false
  return /DingTalk/i.test(navigator.userAgent)
}

async function requestDingTalkAuthCode() {
  if (!isDingTalkContainer()) {
    throw new Error('当前环境不是钉钉容器')
  }
  const corpId = import.meta.env.VITE_DINGTALK_CORP_ID
  if (!corpId) {
    throw new Error('缺少 VITE_DINGTALK_CORP_ID 配置')
  }

  const dd = await ensureDingTalkSdk()
  return new Promise<string>((resolve, reject) => {
    dd.ready(() => {
      const requestByRuntime = dd.runtime?.permission?.requestAuthCode
      if (requestByRuntime) {
        requestByRuntime({
          corpId,
          onSuccess: result => resolve(result.code),
          onFail: reject
        })
        return
      }

      if (dd.requestAuthCode) {
        dd.requestAuthCode({
          corpId,
          success: result => resolve(result.code),
          fail: reject
        })
        return
      }

      reject(new Error('当前钉钉 JSAPI 不支持免登授权'))
    })
    dd.error(reject)
  })
}

function ensureDingTalkSdk() {
  if (window.dd) {
    return Promise.resolve(window.dd)
  }

  return new Promise<DingTalkApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = DINGTALK_JSAPI_URL
    script.async = true
    script.onload = () => {
      if (window.dd) {
        resolve(window.dd)
      } else {
        reject(new Error('钉钉 JSAPI 加载失败'))
      }
    }
    script.onerror = () => reject(new Error('钉钉 JSAPI 加载失败'))
    document.head.appendChild(script)
  })
}

async function openUrlInExternalBrowser(url: string) {
  const dd = await ensureDingTalkSdk()
  await new Promise<void>((resolve, reject) => {
    dd.ready(() => {
      const openLink = dd.biz?.util?.openLink
      if (openLink) {
        openLink({
          url,
          onSuccess: resolve,
          onFail: reject
        })
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
      resolve()
    })
    dd.error(reject)
  })
}

async function closeCurrentDingTalkPage() {
  const dd = await ensureDingTalkSdk()
  await new Promise<void>((resolve) => {
    dd.ready(() => {
      const close = dd.biz?.navigation?.close
      const quit = dd.biz?.navigation?.quit
      if (close) {
        close()
      } else if (quit) {
        quit()
      }
      resolve()
    })
    dd.error(() => resolve())
  })
}
</script>

<style scoped>
.bridge-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
}

.bridge-card {
  width: min(420px, 100%);
  padding: 40px 32px;
  border: 1px solid #dbe7ff;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 50px rgba(30, 64, 175, 0.12);
  text-align: center;
}

.bridge-card h1 {
  margin: 20px 0 10px;
  color: #0f172a;
  font-size: 28px;
}

.bridge-card p {
  margin: 0 0 24px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.bridge-spinner {
  width: 54px;
  height: 54px;
  margin: 0 auto;
  border: 4px solid rgba(59, 130, 246, 0.16);
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.bridge-progress {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5edff;
  margin-bottom: 24px;
}

.bridge-progress-bar {
  width: 45%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb 0%, #38bdf8 100%);
  animation: progress 1.2s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(320%);
  }
}
</style>
