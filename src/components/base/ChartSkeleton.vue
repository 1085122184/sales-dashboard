<script setup lang="ts">
/**
 * ============================================================
 * 高级骨架屏组件 - 图表区域
 * ============================================================
 * 模拟 ECharts 图表加载状态（带标题、图例、绘图区）
 */
interface Props {
  height?: string
  showTitle?: boolean
  showLegend?: boolean
}

withDefaults(defineProps<Props>(), {
  height: '420px',
  showTitle: true,
  showLegend: true,
})
</script>

<template>
  <div class="chart-skeleton" :style="{ height }">
    <!-- 标题骨架 -->
    <div v-if="showTitle" class="skel-header">
      <div class="skel-line skel-title" />
      <div class="skel-line skel-subtitle" />
    </div>
    
    <!-- 图例骨架 -->
    <div v-if="showLegend" class="skel-legend">
      <div class="skel-legend-item" v-for="i in 3" :key="i">
        <div class="skel-legend-dot" />
        <div class="skel-line skel-legend-text" />
      </div>
    </div>
    
    <!-- 图表绘图区骨架 -->
    <div class="skel-chart-area">
      <!-- 模拟网格线 -->
      <div class="skel-grid-line" v-for="i in 5" :key="i" :style="{ top: `${i * 20}%` }" />
      <!-- 模拟柱状图/折线图 -->
      <div class="skel-bars">
        <div class="skel-bar" v-for="i in 8" :key="i" :style="{ height: `${30 + Math.random() * 50}%` }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-skeleton {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.skel-header {
  margin-bottom: 12px;
}

.skel-line {
  background: linear-gradient(
    90deg,
    #f1f5f9 25%,
    #e2e8f0 37%,
    #f1f5f9 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 4px;
}

.skel-title {
  width: 45%;
  height: 16px;
  margin-bottom: 6px;
}

.skel-subtitle {
  width: 60%;
  height: 12px;
}

.skel-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.skel-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skel-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
}

.skel-legend-text {
  width: 50px;
  height: 10px;
}

.skel-chart-area {
  flex: 1;
  position: relative;
  background: #f8fafc;
  border-radius: 6px;
}

.skel-grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.skel-bars {
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 80%;
  gap: 8px;
}

.skel-bar {
  flex: 1;
  background: linear-gradient(
    90deg,
    #cbd5e1 25%,
    #94a3b8 37%,
    #cbd5e1 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 4px 4px 0 0;
  min-height: 20px;
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
  .chart-skeleton {
    padding: 14px 10px;
  }
  .skel-title { height: 14px; width: 55%; }
  .skel-subtitle { height: 10px; width: 70%; }
  .skel-legend { gap: 10px; }
  .skel-legend-text { width: 40px; height: 9px; }
  .skel-bar { min-height: 15px; }
}
</style>
