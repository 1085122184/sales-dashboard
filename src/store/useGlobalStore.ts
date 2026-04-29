import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import type { LoginResponse } from '@/types'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'
const PERMISSIONS_KEY = 'permissions'
const ROLES_KEY = 'roles'

function safeParseArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const useGlobalStore = defineStore('global', () => {
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const thisMonth = dayjs().format('YYYY-MM')

  const queryDate = ref(yesterday)
  const queryMonth = ref(thisMonth)

  const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY) || '')
  const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || '')
  const userInfo = ref(safeParseObject<LoginResponse['userInfo']>(localStorage.getItem(USER_INFO_KEY)))
  const permissions = ref<string[]>(safeParseArray(localStorage.getItem(PERMISSIONS_KEY)))
  const roles = ref<string[]>(safeParseArray(localStorage.getItem(ROLES_KEY)))

  const backendDateStr = computed(() => dayjs(queryDate.value).add(1, 'day').format('YYYY-MM-DD'))
  const yesterdayStr = computed(() => dayjs(queryDate.value).format('YYYY-MM-DD'))
  const displayDateStr = computed(() => queryDate.value)
  const isAuthenticated = computed(() => Boolean(accessToken.value))
  const displayName = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')

  function setPermissions(perms: string[]) {
    permissions.value = perms
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms))
  }

  function setRoles(roleList: string[]) {
    roles.value = roleList
    localStorage.setItem(ROLES_KEY, JSON.stringify(roleList))
  }

  function setAuth(payload: LoginResponse) {
    accessToken.value = payload.accessToken
    refreshToken.value = payload.refreshToken || ''
    userInfo.value = payload.userInfo

    localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken)
    if (payload.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(payload.userInfo))

    setPermissions(payload.permissions || [])
    setRoles(payload.roles || [])
  }

  function clearAuth() {
    accessToken.value = ''
    refreshToken.value = ''
    userInfo.value = null
    permissions.value = []
    roles.value = []

    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
    localStorage.removeItem(PERMISSIONS_KEY)
    localStorage.removeItem(ROLES_KEY)
  }

  return {
    yesterday,
    queryDate,
    backendDateStr,
    queryMonth,
    yesterdayStr,
    displayDateStr,
    accessToken,
    refreshToken,
    userInfo,
    displayName,
    permissions,
    roles,
    isAuthenticated,
    setPermissions,
    setRoles,
    setAuth,
    clearAuth
  }
})
