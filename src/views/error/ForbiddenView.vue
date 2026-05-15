<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <div class="status-code">403</div>
      <h1 class="status-title">没有权限访问当前页面</h1>
      <p class="status-copy">当前账号缺少访问该资源所需的权限。</p>

      <div class="diagnosis-panel">
        <div class="diagnosis-row">
          <span>当前账号</span>
          <strong>{{ store.displayName || store.userInfo?.username || '-' }}</strong>
        </div>
        <div class="diagnosis-row">
          <span>当前角色</span>
          <strong>{{ roleText }}</strong>
        </div>
        <div v-if="fromPath" class="diagnosis-row">
          <span>来源页面</span>
          <strong>{{ fromPath }}</strong>
        </div>
        <div v-if="requiredPermissions.length" class="permission-block">
          <span>缺失权限</span>
          <div class="permission-list">
            <code v-for="permission in requiredPermissions" :key="permission">
              {{ permissionLabel(permission) }}
            </code>
          </div>
        </div>
      </div>

      <div class="action-row">
        <button type="button" class="action-btn primary" @click="goHome">返回首页</button>
        <button type="button" class="action-btn" @click="goBack">返回上一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PERMISSION_LABELS } from '@/config/permissions'
import { useGlobalStore } from '@/store/useGlobalStore'

const route = useRoute()
const router = useRouter()
const store = useGlobalStore()

const fromPath = computed(() => {
  const from = route.query.from
  return typeof from === 'string' ? from : ''
})

const requiredPermissions = computed(() => {
  const required = route.query.required
  if (typeof required !== 'string') return []
  return required.split(',').map(item => item.trim()).filter(Boolean)
})

const roleText = computed(() => {
  return store.roles.length > 0 ? store.roles.join('、') : '-'
})

function permissionLabel(permission: string) {
  const label = PERMISSION_LABELS[permission]
  return label ? `${label} (${permission})` : permission
}

function goHome() {
  router.replace('/')
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.replace('/')
}
</script>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(239, 68, 68, 0.16), transparent 30%),
    radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.12), transparent 26%),
    linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
}

.forbidden-card {
  width: min(620px, 100%);
  padding: 40px 36px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  text-align: center;
}

.status-code {
  font-size: 72px;
  line-height: 1;
  font-weight: 800;
  color: #ef4444;
  margin-bottom: 10px;
}

.status-title {
  margin: 0 0 12px;
  font-size: 28px;
  color: #0f172a;
}

.status-copy {
  margin: 0 auto;
  max-width: 420px;
  color: #64748b;
  font-size: 15px;
  line-height: 1.8;
}

.diagnosis-panel {
  margin-top: 24px;
  padding: 16px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  text-align: left;
}

.diagnosis-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  color: #64748b;
  font-size: 14px;
}

.diagnosis-row strong {
  color: #0f172a;
  font-weight: 700;
  word-break: break-all;
}

.permission-block {
  padding-top: 10px;
  color: #64748b;
  font-size: 14px;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.permission-list code {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff;
  color: #b91c1c;
  border: 1px solid #fecaca;
  word-break: break-all;
}

.action-row {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  min-width: 132px;
  height: 42px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.18);
}

.action-btn.primary {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

.action-btn.primary:hover {
  box-shadow: 0 10px 22px rgba(239, 68, 68, 0.24);
}

@media (max-width: 560px) {
  .forbidden-page {
    padding: 12px;
  }

  .forbidden-card {
    padding: 30px 20px;
    border-radius: 18px;
  }

  .status-code {
    font-size: 58px;
  }

  .status-title {
    font-size: 24px;
  }

  .diagnosis-row {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
