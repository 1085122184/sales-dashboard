<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="brand-panel">
        <div class="brand-mark">SCM</div>
        <h1 class="brand-title">销售系统登录</h1>
        <p class="brand-copy">登录后可访问仪表盘、费用监控、订单明细和系统角色管理。</p>
        <div class="brand-metrics">
          <div class="metric-chip">
            <span class="metric-label">系统模块</span>
            <strong>业务分析 / 权限管理</strong>
          </div>
          <div class="metric-chip">
            <span class="metric-label">鉴权方式</span>
            <strong>Token + RBAC</strong>
          </div>
        </div>
      </section>

      <section class="form-panel">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p>请输入账号和密码完成登录。</p>
        </div>

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

        <div class="hint-box">
          登录成功后会缓存 `access_token`、角色和权限数据，刷新页面不会丢失登录态。
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { login } from '@/api/auth-api'
import { useGlobalStore } from '@/store/useGlobalStore'
import type { LoginRequest } from '@/types'

const router = useRouter()
const route = useRoute()
const store = useGlobalStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

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

async function submitLogin() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const res = await login({ ...form })
    store.setAuth(res.data)
    ElMessage.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (error: any) {
    ElMessage.error(error?.message || '登录失败')
  } finally {
    submitting.value = false
  }
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
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255,255,255,0.78);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(226,232,240,0.9);
  backdrop-filter: blur(12px);
}

.brand-panel {
  padding: 56px 52px;
  background:
    linear-gradient(160deg, #0f172a 0%, #1d4ed8 56%, #38bdf8 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}

.brand-mark {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-title {
  margin: 0;
  font-size: 40px;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.brand-copy {
  margin: 0;
  max-width: 460px;
  font-size: 16px;
  line-height: 1.75;
  color: rgba(255,255,255,0.82);
}

.brand-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-chip {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
}

.metric-chip strong {
  display: block;
  margin-top: 4px;
  font-size: 16px;
}

.metric-label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.64);
}

.form-panel {
  padding: 52px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255,255,255,0.92);
}

.form-header h2 {
  margin: 0 0 8px;
  font-size: 30px;
  color: #0f172a;
}

.form-header p {
  margin: 0 0 28px;
  color: #64748b;
  font-size: 14px;
}

.login-form {
  width: 100%;
}

.submit-btn {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 12px 24px rgba(59,130,246,0.18);
}

.hint-box {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
