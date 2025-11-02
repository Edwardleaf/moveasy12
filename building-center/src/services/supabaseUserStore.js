import { ref, reactive } from 'vue'
import { getCurrentUser, refreshSession, onAuthStateChange } from './supabaseAuthService'

// 创建用户状态
const userState = reactive({
  isAuthenticated: false,
  user: null,
  attributes: {},
  loading: false,
  error: null
})

// 认证状态变化监听器
let authStateUnsubscribe = null

// 初始化用户状态
export const initUserState = async () => {
  userState.loading = true
  userState.error = null
  
  try {
    const userData = await getCurrentUser()
    updateUserState(userData)
    
    // 设置认证状态监听器
    if (authStateUnsubscribe) {
      authStateUnsubscribe()
    }
    
    authStateUnsubscribe = await onAuthStateChange((userData, event) => {
      // 只在开发环境或有意义的状态变化时记录日志
      if (process.env.NODE_ENV === 'development' && event !== 'INITIAL_SESSION') {
        console.log('用户状态变化:', event, userData ? '已登录' : '未登录')
      }
      updateUserState(userData)
    })
    
  } catch (error) {
    console.error('初始化用户状态失败:', error)
    userState.error = error.message || '初始化用户状态失败'
    updateUserState(null)
  } finally {
    userState.loading = false
  }
  
  return userState
}

// 更新用户状态
export const updateUserState = (userData) => {
  if (userData) {
    userState.isAuthenticated = true
    userState.user = userData.user
    userState.attributes = userData.attributes || {}
  } else {
    userState.isAuthenticated = false
    userState.user = null
    userState.attributes = {}
  }
  
  return userState
}

// 清除用户状态
export const clearUserState = () => {
  userState.isAuthenticated = false
  userState.user = null
  userState.attributes = {}
  userState.error = null
  
  // 取消认证状态监听
  if (authStateUnsubscribe) {
    authStateUnsubscribe()
    authStateUnsubscribe = null
  }
  
  return userState
}

// 刷新用户会话
export const refreshUserSession = async () => {
  try {
    await refreshSession()
    await initUserState()
    return true
  } catch (error) {
    console.error('刷新用户会话失败:', error)
    return false
  }
}

// 获取用户角色
export const getUserRole = () => {
  return userState.attributes?.userType || userState.attributes?.user_role || 'tenant'
}

// 检查是否为管理员
export const isAdmin = () => {
  const role = getUserRole()
  return role === 'admin'
}

// 检查是否为房东
export const isLandlord = () => {
  const role = getUserRole()
  return role === 'landlord'
}

// 检查是否为租客
export const isTenant = () => {
  const role = getUserRole()
  return role === 'tenant'
}

// 销毁监听器 (组件卸载时调用)
export const destroyUserStore = () => {
  if (authStateUnsubscribe) {
    authStateUnsubscribe()
    authStateUnsubscribe = null
  }
}

// 导出用户状态
export default userState