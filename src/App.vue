<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { logout } from '@/api/auth-api'
import { useGlobalStore } from '@/store/useGlobalStore'

const route = useRoute()
const router = useRouter()
const store = useGlobalStore()

// 判断当前是否在不需要展示 Header 的页面（登录页不需要 Header 也不需要水印）
const hideHeader = computed(() => route.name === 'Login' || route.name === 'Forbidden')

// 动态计算水印内容
const watermarkContent = computed(() => {
  // 1. 如果是登录页，或者 store 中没有用户信息，不渲染水印
  if (hideHeader.value || !store.displayName) {
    return ''
  }
  // 2. 渲染多行水印：真实姓名 + 警示语 (如果有工号/手机号也可以拼接在此处)
  return [`${store.displayName}`, '内部机密 严禁外传']
})

async function handleLogout() {
  try {
    if (store.isAuthenticated) {
      await logout()
    }
  } catch {
    // 忽略错误，强制本地退出
  } finally {
    store.clearAuth()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<template>
  <el-watermark
    :content="watermarkContent"
    :font="{ color: 'rgba(15, 23, 42, 0.08)', fontSize: 14 }"
    :z-index="9999"
    class="global-watermark-wrapper"
  >
    <div class="app-layout">
      <header v-if="!hideHeader" class="global-header">
        <div class="header-left">
          <span class="system-name">销售监控系统</span>
        </div>
        <div class="header-right">
          <span v-if="store.displayName" class="user-info">
            <i class="user-icon">👤</i>
            {{ store.displayName }}
          </span>
          <div class="divider"></div>
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </header>

      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </el-watermark>
</template>

<style scoped>
/* 水印包裹层：需撑满全屏 */
.global-watermark-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 整体布局结构 */
.app-layout {
  display: flex;
  flex-direction: column;
  flex: 1; /* 继承水印容器的高度 */
  background-color: #f8fafc;
}

/* 标准头部样式 */
.global-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 1000;
}

.system-name {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.user-icon {
  margin-right: 6px;
  font-style: normal;
}

.divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
}

/* 退出按钮样式 */
.logout-btn {
  background: transparent;
  border: 1px solid #e2e8f0;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fda4af;
}

/* 主内容区 */
.app-main {
  flex: 1;
  position: relative;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .system-name {
    font-size: 16px;
  }
  .user-info {
    display: none;
  }
}
</style>
