<script setup lang="ts">
/**
 * ============================================================
 * 高级骨架屏组件 - 指标卡片
 * ============================================================
 * 模拟 MetricCard / CollectionCard / OrderCard 的真实加载状态
 */
interface Props {
  variant?: 'blue' | 'purple' | 'green' | 'amber'
}

withDefaults(defineProps<Props>(), {
  variant: 'blue'
})

const bgMap = {
  blue: '#dbeafe',
  purple: '#ede9fe',
  green: '#dcfce7',
  amber: '#fef3c7',
}
</script>

<template>
  <div class="metric-card-skeleton" :style="{ background: bgMap[variant] }">
    <!-- 标题骨架 -->
    <div class="skel-line skel-title" />
    <!-- 数值骨架 -->
    <div class="skel-line skel-value" />
    <!-- 进度条骨架 -->
    <div class="skel-progress">
      <div class="skel-progress-bar" />
    </div>
    <!-- 底部描述骨架 -->
    <div class="skel-desc">
      <div class="skel-line skel-desc-line" />
      <div class="skel-line skel-desc-line short" />
    </div>
  </div>
</template>

<style scoped>
.metric-card-skeleton {
  border-radius: 14px;
  padding: 20px;
  height: 100%;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.skel-line {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.3) 25%,
    rgba(255,255,255,0.6) 37%,
    rgba(255,255,255,0.3) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}

.skel-title {
  width: 40%;
  height: 14px;
}

.skel-value {
  width: 60%;
  height: 28px;
  margin-top: 4px;
}

.skel-progress {
  height: 8px;
  background: rgba(255,255,255,0.4);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
}

.skel-progress-bar {
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.4) 25%,
    rgba(255,255,255,0.7) 37%,
    rgba(255,255,255,0.4) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 4px;
}

.skel-desc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
}

.skel-desc-line {
  width: 80%;
  height: 12px;
}

.skel-desc-line.short {
  width: 50%;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 移动端适配 */
@media (max-width: 767px) {
  .metric-card-skeleton {
    padding: 14px;
    min-height: 120px;
    gap: 10px;
  }
  .skel-title { height: 12px; }
  .skel-value { height: 22px; }
  .skel-desc-line { height: 10px; }
}
</style>
