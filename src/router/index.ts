/**
 * src/router/index.ts
 * 路由配置文件
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 1. 定义路由表
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'BusinessDashboard',
    // 采用路由懒加载（按需加载），提升首页首屏渲染速度
    component: () => import('@/views/DashboardView.vue'),
    meta: { 
      title: '业务明细大屏' 
    }
  },
  {
    path: '/v1',
    name: 'ExecutiveDashboard',
    component: () => import('@/views/ExecutiveDashboardView.vue'),
    meta: { 
      title: '集团高管指挥舱' 
    }
  },
  {
    path: '/v2',
    name: 'AnomalyMonitorView',
    component: () => import('@/views/AnomalyMonitorView.vue'),
    meta: { 
      title: '异常监控指挥舱' 
    }
  },
  {
    path: '/details/sales',
    name: 'SalesDetail',
    component: () => import('@/views/SalesDetailView.vue'),
    meta: { title: '各公司销售明细' }
  }
  // 未来您可以在这里继续添加二级页面，例如：
  // {
  //   path: '/details/price',
  //   name: 'PriceDetails',
  //   component: () => import('@/views/PriceDeviationView.vue'),
  //   meta: { title: '价格偏差明细台账' }
  // }
]

// 2. 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式（去掉 URL 中的 # 号）
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 切换路由时自动滚动到顶部
  scrollBehavior() {
    return { top: 0 }
  }
})

// 3. 全局前置路由守卫：用于动态修改网页标题
router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 销售系统`
  }
  next()
})

export default router