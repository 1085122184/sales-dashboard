/**
 * ============================================================
 * 响应式断点 Composable
 * ============================================================
 * 基于 @vueuse/core 的 useMediaQuery，提供响应式断点检测
 * 
 * 断点系统（移动优先）：
 * - sm: 640px   (小屏手机)
 * - md: 768px   (大屏手机/小平板)
 * - lg: 1024px  (平板)
 * - xl: 1280px  (桌面)
 * - 2xl: 1536px (大屏桌面)
 * 
 * @example
 * ```ts
 * import { useBreakpoint } from '@/composables/useBreakpoint'
 * 
 * const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint()
 * 
 * // 在模板中使用
 * if (isMobile.value) { ... }
 * ```
 */

import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'

// 断点定义（与 Tailwind CSS 保持一致）
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * 响应式断点 Composable
 */
export function useBreakpoint() {
  // 使用 useMediaQuery 创建响应式媒体查询
  const sm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`)
  const md = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`)
  const lg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
  const xl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`)
  const xl2 = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`)

  // 当前断点名称
  const breakpoint = computed<Breakpoint>(() => {
    if (xl2.value) return '2xl'
    if (xl.value) return 'xl'
    if (lg.value) return 'lg'
    if (md.value) return 'md'
    if (sm.value) return 'sm'
    return 'sm'
  })

  // 便捷的布尔值判断
  const isMobile = computed(() => !md.value)           // < 768px
  const isTablet = computed(() => md.value && !lg.value) // 768px - 1023px
  const isDesktop = computed(() => lg.value)            // >= 1024px
  const isLargeDesktop = computed(() => xl.value)       // >= 1280px

  // 最大宽度判断（max-width 版本，兼容旧代码）
  const isMaxSm = computed(() => !sm.value)             // <= 639px
  const isMaxMd = computed(() => !md.value)             // <= 767px
  const isMaxLg = computed(() => !lg.value)             // <= 1023px
  const isMaxXl = computed(() => !xl.value)             // <= 1279px

  return {
    // 原始媒体查询
    sm,
    md,
    lg,
    xl,
    xl2,
    // 当前断点
    breakpoint,
    // 便捷判断
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // 最大宽度判断（兼容旧代码）
    isMaxSm,
    isMaxMd,
    isMaxLg,
    isMaxXl,
  }
}
