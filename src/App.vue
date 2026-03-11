<script setup lang="ts">
import { useRoute } from 'vue-router'

// 获取当前路由对象，用于判断哪个按钮应该高亮
const route = useRoute()
</script>

<template>
  <div class="app-wrapper">
    
    <div class="view-switcher">
      <!-- <span class="switcher-label">视角切换：</span> -->
      
      <router-link 
        to="/" 
        class="switch-btn" 
        :class="{ active: route.path === '/' }"
      >
        📊 业务明细视角
      </router-link>
      <!-- <router-link 
        to="/v1" 
        class="switch-btn" 
        :class="{ active: route.path === '/v1' }"
      >
        👑 集团高管视角
      </router-link> -->
      <!-- <router-link 
        to="/v2" 
        class="switch-btn" 
        :class="{ active: route.path === '/v2' }"
      >
        📊 异常监控视角
      </router-link> -->
    </div>

    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

  </div>
</template>

<style>
/* 悬浮切换器的样式 */
.view-switcher {
  position: fixed;
  top: 20px;
  right: 50%;
  transform: translateX(50%);
  z-index: 9999;
  display: none;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 6px 8px;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.switcher-label {
  font-size: 14px;
  color: #64748b;
  margin-left: 8px;
  margin-right: 4px;
  font-weight: 600;
}

.switch-btn {
  text-decoration: none; /* 去除 a 标签默认下划线 */
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-block;
}

.switch-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.switch-btn.active {
  background: #3b82f6;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

/* 页面切换的过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>