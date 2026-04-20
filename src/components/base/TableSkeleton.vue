<script setup lang="ts">
/**
 * ============================================================
 * 高级骨架屏组件 - 表格区域
 * ============================================================
 * 模拟表格加载状态（带表头、多行数据）
 */
interface Props {
  height?: string
  rows?: number
  columns?: number
}

withDefaults(defineProps<Props>(), {
  height: '420px',
  rows: 6,
  columns: 5,
})
</script>

<template>
  <div class="table-skeleton" :style="{ height }">
    <!-- 工具栏骨架 -->
    <div class="skel-toolbar">
      <div class="skel-line skel-tab" v-for="i in 3" :key="i" />
      <div class="skel-line skel-search" />
    </div>
    
    <!-- 表头骨架 -->
    <div class="skel-thead">
      <div class="skel-line skel-th" v-for="i in columns" :key="i" />
    </div>
    
    <!-- 表格体骨架 -->
    <div class="skel-tbody">
      <div class="skel-tr" v-for="row in rows" :key="row">
        <div class="skel-line skel-td" v-for="col in columns" :key="col" 
             :class="{ 'td-short': col % 2 === 0 }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-skeleton {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.skel-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.skel-tab {
  width: 50px;
  height: 24px;
  border-radius: 12px;
}

.skel-search {
  width: 120px;
  height: 28px;
  margin-left: auto;
  border-radius: 14px;
}

.skel-thead {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 12px;
}

.skel-th {
  flex: 1;
  height: 14px;
  background: linear-gradient(
    90deg,
    #e2e8f0 25%,
    #cbd5e1 37%,
    #e2e8f0 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

.skel-tbody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skel-tr {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.skel-td {
  flex: 1;
  height: 12px;
}

.skel-td.td-short {
  flex: 0.6;
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
  .table-skeleton {
    padding: 12px 10px;
  }
  .skel-toolbar { gap: 6px; margin-bottom: 12px; }
  .skel-tab { width: 40px; height: 20px; }
  .skel-search { width: 90px; height: 24px; }
  .skel-thead { gap: 8px; padding-bottom: 8px; margin-bottom: 8px; }
  .skel-th { height: 12px; }
  .skel-tbody { gap: 8px; }
  .skel-tr { gap: 8px; padding: 6px 0; }
  .skel-td { height: 10px; }
}
</style>
