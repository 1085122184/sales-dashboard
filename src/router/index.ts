import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useGlobalStore } from '@/store/useGlobalStore'
import { appRoutes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: appRoutes,
  scrollBehavior() {
    return { top: 0 }
  }
})

function collectMissingPermissions(to: RouteRecordRaw['meta'], store: ReturnType<typeof useGlobalStore>) {
  const missingPermissions: string[] = []
  const requiredPermission = to?.requiresPermission
  const requiredAnyPermissions = to?.requiresAnyPermissions || []
  const requiredAllPermissions = to?.requiresAllPermissions || []

  if (typeof requiredPermission === 'string' && !store.hasPermission(requiredPermission)) {
    missingPermissions.push(requiredPermission)
  }

  if (Array.isArray(requiredPermission) && !store.hasAllPermissions(requiredPermission)) {
    missingPermissions.push(...requiredPermission.filter(permission => !store.hasPermission(permission)))
  }

  if (requiredAnyPermissions.length > 0 && !store.hasAnyPermission(requiredAnyPermissions)) {
    missingPermissions.push(...requiredAnyPermissions)
  }

  if (requiredAllPermissions.length > 0 && !store.hasAllPermissions(requiredAllPermissions)) {
    missingPermissions.push(...requiredAllPermissions.filter(permission => !store.hasPermission(permission)))
  }

  return Array.from(new Set(missingPermissions))
}

router.beforeEach((to) => {
  const store = useGlobalStore()
  const isLoginRoute = to.name === 'Login'
  const isForbiddenRoute = to.name === 'Forbidden'
  const requiresAuth = to.meta.requiresAuth === true

  if (to.meta.title) {
    document.title = `${to.meta.title} - 经营分析系统`
  }

  const hasLoginTicket = isLoginRoute && typeof to.query.loginTicket === 'string' && to.query.loginTicket.length > 0

  if (isLoginRoute && store.isAuthenticated && !hasLoginTicket) {
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

  const missingPermissions = collectMissingPermissions(to.meta, store)
  if (missingPermissions.length > 0) {
    return {
      name: 'Forbidden',
      query: {
        from: to.fullPath,
        required: missingPermissions.join(',')
      }
    }
  }

  return true
})

export default router
