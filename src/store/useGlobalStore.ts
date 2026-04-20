// src/store/useGlobalStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export const useGlobalStore = defineStore('global', () => {
  // 默认昨天
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  const thisMonth =  dayjs().format('YYYY-MM')

  // 全局业务日期 (双向绑定用)
  const queryDate = ref(yesterday)

  const queryMonth = ref(thisMonth)
  // 🌟 传给后端的日期格式 (加一天，符合原逻辑)
  const backendDateStr = computed(() => {
    return dayjs(queryDate.value).add(1, 'day').format('YYYY-MM-DD')
  })

  // 🌟 统一提供昨天日期字符串（避免各组件重复计算）
  const yesterdayStr = computed(() => {
    return dayjs(queryDate.value).format('YYYY-MM-DD')
  })

  // 🌟 提供显示用的日期字符串（不加不减）
  const displayDateStr = computed(() => {
    return queryDate.value
  })

  return {
    yesterday,
    queryDate,
    backendDateStr,
    queryMonth,
    yesterdayStr,    // 🌟 新增：昨天日期
    displayDateStr   // 🌟 新增：显示日期
  }
})