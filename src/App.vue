<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { logout } from '@/api/auth-api'
import { useGlobalStore } from '@/store/useGlobalStore'

const route = useRoute()
const router = useRouter()
const store = useGlobalStore()

const hideChrome = computed(() => route.name === 'Login' || route.name === 'Forbidden')

async function handleLogout() {
  try {
    if (store.isAuthenticated) {
      await logout()
    }
  } catch {
    // Ignore remote logout failure and clear local auth anyway.
  } finally {
    store.clearAuth()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<template>
  <div class="app-wrapper">
    <div v-if="!hideChrome" class="view-switcher">
      <router-link to="/" class="switch-btn" :class="{ active: route.path === '/' }">
        业务视角
      </router-link>
      <span v-if="store.displayName" class="user-badge">{{ store.displayName }}</span>
      <button class="logout-btn" type="button" @click="handleLogout">退出</button>
    </div>

    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
.view-switcher {
  position: fixed;
  top: 20px;
  right: 50%;
  transform: translateX(50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(8px);
  padding: 6px 8px;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
}

.switch-btn,
.logout-btn {
  text-decoration: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-block;
  border: none;
  background: transparent;
  font-family: inherit;
}

.switch-btn:hover,
.logout-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.switch-btn.active {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 2px 6px rgba(59,130,246,0.3);
}

.user-badge {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 767px) {
  .view-switcher {
    top: 12px;
    gap: 6px;
    padding: 5px 6px;
  }

  .switch-btn,
  .logout-btn {
    padding: 5px 12px;
    font-size: 12px;
  }

  .user-badge {
    display: none;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
