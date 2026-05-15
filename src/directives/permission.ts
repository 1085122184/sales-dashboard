import type { Directive, DirectiveBinding } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'

export const hasPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const globalStore = useGlobalStore()
    const permissionList = Array.isArray(value)
      ? value.filter(Boolean)
      : typeof value === 'string' && value
        ? [value]
        : []

    if (permissionList.length === 0) {
      throw new Error('Please provide at least one permission')
    }

    const hasPermissions = binding.modifiers.all
      ? globalStore.hasAllPermissions(permissionList)
      : globalStore.hasAnyPermission(permissionList)

    if (!hasPermissions && el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
}
