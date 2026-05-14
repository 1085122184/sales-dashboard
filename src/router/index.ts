import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useGlobalStore } from '@/store/useGlobalStore'
import { DECISION_PERMISSIONS } from '@/config/permissions'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/dingtalk-bridge',
    name: 'DingTalkBridge',
    component: () => import('@/views/auth/DingTalkBridgeView.vue'),
    meta: { title: '钉钉中转' }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/ForbiddenView.vue'),
    meta: { title: '无权限' }
  },
  {
    path: '/',
    name: 'BusinessDashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { title: '销售指标大盘', requiresAuth: true }
  },
  {
    path: '/v1',
    name: 'ExecutiveDashboard',
    component: () => import('@/views/dashboard/ExecutiveDashboardView.vue'),
    meta: { title: '集团高管指挥舱', requiresAuth: true }
  },
  {
    path: '/v2',
    name: 'AnomalyMonitorView',
    component: () => import('@/views/anomaly-monitor/AnomalyMonitorView.vue'),
    meta: { title: '异常监控指挥舱', requiresAuth: true }
  },
  {
    path: '/details/sales',
    name: 'SalesDetail',
    component: () => import('@/views/sales-detail/SalesDetailView.vue'),
    meta: { title: '销售明细', requiresAuth: true }
  },
  {
    path: '/details/order',
    name: 'OrderDetail',
    component: () => import('@/views/order-detail/OrderDetailView.vue'),
    meta: { title: '订单明细', requiresAuth: true }
  },
  {
    path: '/screen/monitor',
    name: 'ScreenMonitor',
    component: () => import('@/views/screen-monitor/index.vue'),
    meta: { title: '大屏监控', requiresAuth: true }
  },
  {
    path: '/details/collection',
    name: 'CollectionDetail',
    component: () => import('@/views/collection-detail/CollectionDetailView.vue'),
    meta: { title: '回款明细', requiresAuth: true }
  },
  {
    path: '/all-details',
    name: 'AllDetails',
    component: () => import('@/views/all-details/AllDetailsView.vue'),
    meta: { title: '明细数据查询', requiresAuth: true }
  },
  {
    path: '/expense-monitor',
    name: 'ExpenseMonitor',
    component: () => import('@/views/expense-monitor/ExpenseMonitorView.vue'),
    meta: { title: '三费监控', requiresAuth: true }
  },
  {
    path: '/expense-executive',
    name: 'ExpenseExecutive',
    meta: { title: '集团三费高管驾驶舱' },
    component: () => import('@/views/expense-monitor/ExpenseExecutiveView.vue')
  },
  {
    path: '/production-dashboard',
    name: 'ProductionDashboard',
    meta: {
      title: '生产运营指标大盘',
      requiresAuth: true,
      requiresPermission: DECISION_PERMISSIONS.PRODUCTION_VIEW
    },
    component: () => import('@/views/production/ProductionDashboardView.vue')
  },
  {
    path: '/production-detail',
    name: 'ProductionDetail',
    meta: {
      title: '生产明细数据',
      requiresAuth: true,
      requiresPermission: DECISION_PERMISSIONS.PRODUCTION_DETAIL_VIEW
    },
    component: () => import('@/views/production/ProductionDetailView.vue')
  },
  {
    path: '/system/role',
    name: 'RoleManage',
    component: () => import('@/views/system/role/RoleView.vue'),
    meta: { title: '角色管理', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
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
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const store = useGlobalStore()
  const isLoginRoute = to.name === 'Login'
  const isForbiddenRoute = to.name === 'Forbidden'
  const requiresAuth = to.meta.requiresAuth === true
  const requiredPermission = typeof to.meta.requiresPermission === 'string' ? to.meta.requiresPermission : ''

  if (to.meta.title) {
    document.title = `${to.meta.title} - 经营分析系统`
  }

  if (isLoginRoute && store.isAuthenticated) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
    return redirect
  }

  if (isForbiddenRoute && !store.isAuthenticated) {
    return {
      name: 'Login',
      query: { redirect: '/' }
    }
  }

  if (requiresAuth && !store.isAuthenticated) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath }
    }
  }

  if (requiredPermission && !store.hasPermission(requiredPermission)) {
    return {
      name: 'Forbidden'
    }
  }

  return true
})

export default router
