
<script setup lang="ts">
import { computed } from 'vue'
interface Props {
  /** 进度值 0~1 */
  value: number
  /** 进度条颜色 */
  color?: string
  /** 高度 px */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'var(--color-primary)',
  height: 6,
})
const percent = computed(() => Math.min(Math.max(props.value * 100, 0), 100))

</script>

<template>
  <div
    class="progress-track"
    :style="{ height: `${height}px` }"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="progress-fill"
      :style="{
        width: `${percent}%`,
        background: color,
      }"
    />
  </div>
</template>

<style scoped>
.progress-track {
  width: 100%;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
