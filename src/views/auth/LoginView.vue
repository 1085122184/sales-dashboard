<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="brand-panel">
        <div class="brand-mark">SCM</div>
        <div>
          <h1 class="brand-title">销售系统登录</h1>
          <p class="brand-copy">访问仪表盘、费用监控、订单明细和系统角色管理。</p>
        </div>
        <div class="brand-metrics">
          <div class="metric-chip">
            <span class="metric-label">认证方式</span>
            <strong>钉钉免登 / 账号密码</strong>
          </div>
          <div class="metric-chip">
            <span class="metric-label">权限模型</span>
            <strong>JWT + RBAC</strong>
          </div>
        </div>
      </section>

      <section class="form-panel">
        <div class="form-header">
          <h2>登录系统</h2>
          <p>{{ dingTalkAvailable ? '正在尝试钉钉免密登录，也可以使用账号密码登录。' : '请输入账号和密码完成登录。' }}</p>
        </div>

        <el-button
          v-if="dingTalkAvailable"
          type="success"
          size="large"
          class="ding-submit-btn"
          :loading="dingTalkSubmitting"
          @click="submitDingTalkLogin"
        >
          钉钉免密登录
        </el-button>

        <el-button
          v-if="dingTalkDesktopAvailable"
          size="large"
          class="external-submit-btn"
          :loading="externalOpening"
          @click="openExternalBrowserAfterDingTalkLogin"
        >
          在本地浏览器打开
        </el-button>

        <el-divider v-if="dingTalkAvailable">或</el-divider>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="login-form">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model.trim="form.username"
              placeholder="请输入用户名"
              size="large"
              clearable
              @keyup.enter="submitLogin"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              @keyup.enter="submitLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="submitting" @click="submitLogin">
              登录系统
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="loginMessage" class="hint-box">
          {{ loginMessage }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { consumeLoginTicket, createLoginTicket, login, loginByDingTalk } from '@/api/auth-api'
import { useGlobalStore } from '@/store/useGlobalStore'
import type { LoginRequest, LoginResponse } from '@/types'

const DINGTALK_JSAPI_URL = import.meta.env.VITE_DINGTALK_JSAPI_URL
  || 'https://g.alicdn.com/dingding/dingtalk-jsapi/3.0.36/dingtalk.open.js'

const router = useRouter()
const route = useRoute()
const store = useGlobalStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const dingTalkSubmitting = ref(false)
const externalOpening = ref(false)
const loginMessage = ref('')
const dingTalkAvailable = ref(isDingTalkContainer())
const dingTalkDesktopAvailable = ref(isDingTalkDesktopContainer())

const form = reactive<LoginRequest>({
  username: '',
  password: ''
})

const rules: FormRules<LoginRequest> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度为 2-50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度为 6-50 个字符', trigger: 'blur' }
  ]
}

onMounted(() => {
  const loginTicket = typeof route.query.loginTicket === 'string' ? route.query.loginTicket : ''
  if (loginTicket) {
    consumeExternalLoginTicket(loginTicket)
    return
  }

  if (dingTalkAvailable.value) {
    submitDingTalkLogin()
  }
})

async function submitLogin() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const res = await login({ ...form })
    handleLoginSuccess(res.data)
  } catch (error: any) {
    ElMessage.error(error?.message || '登录失败')
  } finally {
    submitting.value = false
  }
}

async function submitDingTalkLogin() {
  if (dingTalkSubmitting.value) return
  dingTalkSubmitting.value = true
  loginMessage.value = ''
  try {
    const authCode = await requestDingTalkAuthCode()
    const res = await loginByDingTalk({ authCode })
    if (dingTalkDesktopAvailable.value) {
      await openExternalBrowserWithPayload(res.data)
      return
    }
    handleLoginSuccess(res.data)
  } catch (error: any) {
    loginMessage.value = error?.message || '钉钉免密登录失败，请使用账号密码登录。'
  } finally {
    dingTalkSubmitting.value = false
  }
}

async function openExternalBrowserAfterDingTalkLogin() {
  if (externalOpening.value) return
  externalOpening.value = true
  loginMessage.value = ''
  try {
    if (store.isAuthenticated) {
      await openExternalBrowserByTicket()
      return
    }
    const authCode = await requestDingTalkAuthCode()
    const res = await loginByDingTalk({ authCode })
    await openExternalBrowserWithPayload(res.data)
  } catch (error: any) {
    loginMessage.value = error?.message || '打开本地浏览器失败，请使用账号密码登录。'
  } finally {
    externalOpening.value = false
  }
}

async function openExternalBrowserWithPayload(payload: LoginResponse) {
  store.setAuth(payload)
  await openExternalBrowserByTicket()
}

async function openExternalBrowserByTicket() {
  const res = await createLoginTicket()
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  const externalUrl = new URL('/login', window.location.origin)
  externalUrl.searchParams.set('loginTicket', res.data.ticket)
  externalUrl.searchParams.set('redirect', redirect)
  await openUrlInExternalBrowser(externalUrl.toString())
  loginMessage.value = '已打开本地浏览器。如未弹出，请检查钉钉是否拦截外部打开。'
}

async function consumeExternalLoginTicket(ticket: string) {
  submitting.value = true
  loginMessage.value = '正在使用钉钉登录票据进入系统...'
  try {
    const res = await consumeLoginTicket({ ticket })
    handleLoginSuccess(res.data)
  } catch (error: any) {
    loginMessage.value = error?.message || '登录票据已过期，请回到钉钉重新打开。'
  } finally {
    submitting.value = false
  }
}

function handleLoginSuccess(payload: LoginResponse) {
  store.setAuth(payload)
  ElMessage.success('登录成功')
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.replace(redirect)
}

function isDingTalkContainer() {
  if (typeof navigator === 'undefined') return false
  return /DingTalk/i.test(navigator.userAgent)
}

function isDingTalkDesktopContainer() {
  if (!isDingTalkContainer()) return false
  return !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

async function requestDingTalkAuthCode() {
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
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.24), transparent 28%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.18), transparent 26%),
    linear-gradient(135deg, #eaf2ff 0%, #f8fbff 45%, #f3f7fb 100%);
}

.login-shell {
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(12px);
}

.brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  padding: 56px 52px;
  color: #fff;
  background: linear-gradient(160deg, #0f172a 0%, #1d4ed8 56%, #38bdf8 100%);
}

.brand-mark {
  width: 64px;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-title {
  margin: 0;
  font-size: 40px;
  line-height: 1.08;
  letter-spacing: 0;
}

.brand-copy {
  max-width: 460px;
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 16px;
  line-height: 1.75;
}

.brand-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-chip {
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
}

.metric-chip strong {
  display: block;
  margin-top: 4px;
  font-size: 16px;
}

.metric-label {
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.form-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 52px 44px;
  background: rgba(255, 255, 255, 0.92);
}

.form-header h2 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 30px;
}

.form-header p {
  margin: 0 0 28px;
  color: #64748b;
  font-size: 14px;
}

.login-form {
  width: 100%;
}

.submit-btn,
.ding-submit-btn,
.external-submit-btn {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.external-submit-btn {
  margin-top: 12px;
}

.submit-btn {
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.18);
}

.hint-box {
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel,
  .form-panel {
    padding: 30px 24px;
  }

  .brand-title {
    font-size: 30px;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 12px;
  }

  .login-shell {
    border-radius: 20px;
  }

  .brand-panel,
  .form-panel {
    padding: 24px 18px;
  }
}
</style>
