<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <div class="status-code">403</div>
      <h1 class="status-title">没有权限访问当前页面</h1>
      <p class="status-copy">
        当前账号没有访问这个资源的权限。
        <span v-if="fromPath">来源页面：{{ fromPath }}</span>
      </p>

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

const route = useRoute()
const router = useRouter()

const fromPath = computed(() => {
  const from = route.query.from
  return typeof from === 'string' ? from : ''
})

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
  width: min(560px, 100%);
  padding: 40px 36px;
  border-radius: 24px;
  background: rgba(255,255,255,0.94);
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  text-align: center;
}

.status-code {
  font-size: 72px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.04em;
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
  border-radius: 999px;
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

  .status-copy {
    font-size: 14px;
  }
}
</style>
