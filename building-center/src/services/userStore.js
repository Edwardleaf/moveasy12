import { ref, reactive } from 'vue';
import { getCurrentUser, refreshSession } from './supabaseAuthService';

// 创建用户状态
const userState = reactive({
  isAuthenticated: false,
  user: null,
  attributes: {},
  loading: false,
  error: null
});

// 初始化用户状态
export const initUserState = async () => {
  userState.loading = true;
  userState.error = null;
  
  try {
    const userData = await getCurrentUser();
    
    if (userData) {
      userState.isAuthenticated = true;
      userState.user = userData.user;
      userState.attributes = userData.attributes;
    } else {
      userState.isAuthenticated = false;
      userState.user = null;
      userState.attributes = {};
    }
  } catch (error) {
    console.error('初始化用户状态失败:', error);
    userState.error = error.message || '初始化用户状态失败';
    userState.isAuthenticated = false;
    userState.user = null;
    userState.attributes = {};
  } finally {
    userState.loading = false;
  }
  
  return userState;
};

// 更新用户状态
export const updateUserState = (userData) => {
  if (userData) {
    userState.isAuthenticated = true;
    userState.user = userData.user;
    userState.attributes = userData.attributes || {};
  } else {
    userState.isAuthenticated = false;
    userState.user = null;
    userState.attributes = {};
  }
  
  return userState;
};

// 清除用户状态
export const clearUserState = () => {
  userState.isAuthenticated = false;
  userState.user = null;
  userState.attributes = {};
  userState.error = null;
  
  return userState;
};

// 刷新用户会话
export const refreshUserSession = async () => {
  try {
    await refreshSession();
    await initUserState();
    return true;
  } catch (error) {
    console.error('刷新用户会话失败:', error);
    return false;
  }
};

// 导出用户状态
export default userState; 