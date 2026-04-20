<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  pageTitle: string
  metricName: string
  yesterday: string
}>()

const router = useRouter()
</script>

<template>
  <header class="top-bar">
    <div class="top-inner">
      <div class="top-left">
        <button class="back-btn" @click="router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="title-block">
          <div class="breadcrumb">经营驾驶舱 / {{ metricName }}下钻</div>
          <h1 class="page-title">{{ pageTitle }}<span class="accent"> 分析工作台</span></h1>
        </div>
      </div>
      <div class="top-right">
        <div class="date-pill"><span class="dp-label">业务日期</span><span class="dp-val">{{ yesterday }}</span></div>
        <div class="live-dot"><span class="pulse-ring"></span><span class="live-label">实时联调中</span></div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-bar { height: 72px; flex-shrink: 0; background: #fff; border-bottom: 1px solid #eef2f6; padding: 0 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); z-index: 100; }
.top-inner { height: 100%; display: flex; align-items: center; justify-content: space-between; }
.top-left  { display: flex; align-items: center; gap: 22px; min-width: 0; }
.top-right { display: flex; align-items: center; gap: 18px; flex-shrink: 0; }
.back-btn  { width: 42px; height: 42px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; flex-shrink: 0; }
.back-btn svg { width: 20px; height: 20px; }
.back-btn:hover { border-color: #3182ce; color: #3182ce; transform: translateX(-2px); }
.title-block { min-width: 0; }
.breadcrumb  { font-size: 13px; color: #94a3b8; margin-bottom: 4px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.page-title  { font-size: 22px; font-weight: 800; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.page-title .accent { color: #3182ce; font-weight: 500; }
.date-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 99px; padding: 7px 18px; }
.dp-label { font-size: 13px; font-weight: 600; color: #64748b; border-right: 1px solid #cbd5e1; padding-right: 12px; }
.dp-val   { font-size: 14px; font-weight: 700; color: #1e293b; }
.live-dot { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #64748b; font-weight: 500; }
.pulse-ring { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(.95); box-shadow: 0 0 0 0 rgba(16,185,129,.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { transform: scale(.95); } }

@media (max-width: 1023px) {
  .top-bar { padding: 0 20px; height: 64px; }
  .page-title { font-size: 18px; }
}
@media (max-width: 767px) {
  .top-bar { padding: 0 12px; height: 52px; }
  .page-title { font-size: 15px; }
  .breadcrumb { display: none; }
  .date-pill { padding: 5px 10px; }
  .dp-label { display: none; }
  .dp-val { font-size: 13px; }
  .live-label { display: none; }
}
</style>