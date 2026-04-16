<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="app-wrapper">
    <div class="view-switcher">
      <router-link to="/" class="switch-btn" :class="{ active: route.path === '/' }">
        📊 业务明细视角
      </router-link>
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
  position: fixed; top: 20px; right: 50%; transform: translateX(50%);
  z-index: 9999; display: none; align-items: center;
  background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
  padding: 6px 8px; border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;
}
.switch-btn {
  text-decoration: none; padding: 6px 16px; border-radius: 20px;
  font-size: 14px; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.2s; display: inline-block;
}
.switch-btn:hover  { color: #0f172a; background: #f1f5f9; }
.switch-btn.active { background: #3b82f6; color: #fff; box-shadow: 0 2px 6px rgba(59,130,246,0.3); }

@media (max-width: 767px) {
  .switch-btn { padding: 5px 12px; font-size: 12px; }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to   { opacity: 0; transform: translateY(-10px); }
</style>