import type { Directive, DirectiveBinding } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'

export const hasPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const all_permission = '*:*:*'
    const globalStore = useGlobalStore() 
    
    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value
      
      // 判断当前用户是否拥有该按钮权限
      const hasPermissions = globalStore.permissions.some((permission) => {
        return all_permission === permission || permissionFlag.includes(permission)
      })

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请设置操作权限`)
    }
  }
}