/**
 * Admin权限管理组合式API
 */

import { ref, computed } from 'vue'
import { getSupabase } from '@/services/supabaseConfig'

const currentUser = ref(null)
const userProfile = ref(null)
const isLoading = ref(false)
const lastCheckTime = ref(0)
const CHECK_INTERVAL = 30 * 60 * 1000 // 30分钟缓存

export default function useAdmin() {
  
  // 检查当前用户是否为admin
  const isAdmin = computed(() => {
    if (!currentUser.value) return false
    
    // 首先检查用户profile中的user_type
    if (userProfile.value?.user_type === 'admin') {
      return true
    }
    
    // 备用检查：用户元数据中的userType
    const userType = currentUser.value.user_metadata?.userType
    return userType === 'admin'
  })

  // 检查用户是否已登录
  const isAuthenticated = computed(() => {
    return !!currentUser.value
  })

  // 获取当前用户信息 - 添加缓存优化
  const getCurrentUser = async (forceRefresh = false) => {
    try {
      const supabase = await getSupabase();
      
      // 检查缓存，避免频繁请求
      const now = Date.now()
      if (!forceRefresh && currentUser.value && userProfile.value && 
          (now - lastCheckTime.value) < CHECK_INTERVAL) {
        return currentUser.value
      }
      
      isLoading.value = true
      
      // 获取当前登录用户
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError
      
      currentUser.value = user
      
      if (user && (!userProfile.value || forceRefresh || (now - lastCheckTime.value) >= CHECK_INTERVAL)) {
        // 使用后端API检查admin权限
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
            const response = await fetch(`${apiBaseUrl}/api/admin/check`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                userProfile.value = data.user.profile
                lastCheckTime.value = now
                console.log('Admin权限检查成功 (缓存更新)')
              }
            }
          }
        } catch (error) {
          console.error('Admin权限检查失败:', error)
          // 降级到直接数据库查询
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            
          if (!profileError && profile) {
            userProfile.value = profile
            lastCheckTime.value = now
            console.log('用户档案加载成功(降级缓存)')
          } else {
            console.error('获取用户档案失败:', profileError)
          }
        }
      }
      
      return user
    } catch (error) {
      // 只有在非预期错误时才记录日志
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Error getting current user:', error)
      }
      currentUser.value = null
      userProfile.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 初始化用户状态
  const initializeAuth = async () => {
    const supabase = await getSupabase();
    await getCurrentUser()
    
    // 监听认证状态变化
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        currentUser.value = session.user
        await getCurrentUser() // 重新获取用户档案
      } else if (event === 'SIGNED_OUT') {
        currentUser.value = null
        userProfile.value = null
      }
    })
  }

  // 检查admin权限并重定向
  const requireAdmin = async (router) => {
    await getCurrentUser()
    
    if (!isAuthenticated.value) {
      router.push('/sign-in?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
      return false
    }
    
    if (!isAdmin.value) {
      router.push('/')
      return false
    }
    
    return true
  }

  // 创建admin导航守卫
  const createAdminGuard = () => {
    return async (to, from, next) => {
      await getCurrentUser()
      
      if (!isAuthenticated.value) {
        next('/sign-in?redirect=' + encodeURIComponent(to.fullPath))
        return
      }
      
      if (!isAdmin.value) {
        next('/')
        return
      }
      
      next()
    }
  }

  return {
    currentUser,
    userProfile,
    isLoading,
    isAdmin,
    isAuthenticated,
    getCurrentUser,
    initializeAuth,
    requireAdmin,
    createAdminGuard
  }
}