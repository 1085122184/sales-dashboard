<template>
  <div class="screen-monitor-page">
    <div class="actions">
      <button @click="initiateCapture">开启屏幕监控</button>
    </div>
    
    <div class="player-wrapper" style="position: relative; width: 100%; max-width: 1280px; margin: 0 auto; margin-top: 20px;">
      <ScreenPlayer ref="playerRef" @video-ready="handleVideoReady" />
      
      <BoxOverlay 
        v-if="videoSize.width > 0"
        :width="videoSize.width" 
        :height="videoSize.height"
        @box-clicked="handleBusinessAction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScreenPlayer from './components/ScreenPlayer.vue'
import BoxOverlay from './components/BoxOverlay.vue'
import type { BoxData } from '@/store/useScreenMonitorStore'

const playerRef = ref<InstanceType<typeof ScreenPlayer> | null>(null)
const videoSize = ref({ width: 0, height: 0 })

const initiateCapture = () => {
  if (playerRef.value) {
    playerRef.value.startCapture()
  }
}

const handleVideoReady = (size: { width: number; height: number }) => {
  videoSize.value = size
}

const handleBusinessAction = (boxData: BoxData) => {
  console.log('🎯 拦截到目标数据被点击:', boxData.text, boxData)
  // 在这里处理你的业务逻辑，比如填写表单、打开弹窗等
}
</script>

<style scoped>
.screen-monitor-page {
  padding: 20px;
}
.actions button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>