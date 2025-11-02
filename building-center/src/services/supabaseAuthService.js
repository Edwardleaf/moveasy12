import { getSupabase } from './supabaseConfig'
import { clearUserState } from './userStore'

/**
 * 注册新用户
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {object} attributes - 用户属性 (包含用户角色等)
 * @returns {Promise} - 返回注册结果
 */
export const signUp = async (email, password, attributes = {}) => {
  const supabase = await getSupabase();
  try {
    // 处理自定义属性，将 custom: 前缀的属性转换为用户元数据
    const userMetadata = {}
    Object.keys(attributes).forEach(key => {
      if (key.startsWith('custom:')) {
        userMetadata[key.replace('custom:', '')] = attributes[key]
      } else {
        userMetadata[key] = attributes[key]
      }
    })

    console.log('Supabase signUp userMetadata:', userMetadata);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata, // 包含 userType: 'tenant' 或 'landlord'
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    console.log('Supabase signUp result:', data, error);
    
    if (data.user) {
      console.log('User created with metadata:', data.user.user_metadata);
    }

    if (error) throw error

    return {
      user: data.user,
      userConfirmed: !!data.session, // Supabase中如果有session说明已确认
      userSub: data.user?.id
    }
  } catch (error) {
    console.error('注册失败:', error)
    throw error
  }
}

/**
 * 使用API进行注册 (兼容现有接口)
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {object} attributes - 用户属性
 * @returns {Promise} - 返回注册结果
 */
export const signUpWithAPI = async (email, password, attributes = {}) => {
  return signUp(email, password, attributes)
}

/**
 * 确认用户注册 (邮箱验证)
 * @param {string} email - 用户邮箱
 * @param {string} token - 验证令牌
 * @returns {Promise} - 返回确认结果
 */
export const confirmSignUp = async (email, token) => {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('确认注册失败:', error)
    throw error
  }
}

/**
 * 用户登录
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {Promise} - 返回登录结果
 */
export const signIn = async (email, password) => {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return {
      session: data.session,
      user: data.user,
      idToken: data.session?.access_token,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      isAuthenticated: !!data.session
    }
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

/**
 * 使用API登录 (兼容现有接口)
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {Promise} - 返回登录结果
 */
export const signInWithAPI = async (email, password) => {
  return signIn(email, password)
}

/**
 * 使用Google登录
 * @returns {Promise} - 返回登录结果
 */
export const signInWithGoogle = async () => {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Google登录失败:', error)
    throw error
  }
}

/**
 * 忘记密码 - 发送重置密码邮件
 * @param {string} email - 用户邮箱
 * @returns {Promise} - 返回发送结果
 */
export const forgotPassword = async (email) => {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('发送重置密码邮件失败:', error)
    throw error
  }
}

/**
 * 重置密码
 * @param {string} email - 用户邮箱 (在Supabase中不需要，但保持兼容性)
 * @param {string} code - 验证码 (在Supabase中不需要，但保持兼容性)
 * @param {string} newPassword - 新密码
 * @returns {Promise} - 返回重置结果
 */
export const confirmForgotPassword = async (email, code, newPassword) => {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('重置密码失败:', error)
    throw error
  }
}

/**
 * 更新密码 (新方法)
 * @param {string} newPassword - 新密码
 * @returns {Promise} - 返回重置结果
 */
export const updatePassword = async (newPassword) => {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('更新密码失败:', error)
    throw error
  }
}

/**
 * 获取当前用户
 * @returns {Promise<Object|null>} - 返回当前用户或null
 */
export const getCurrentUser = async () => {
  const supabase = await getSupabase();
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    if (!session) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        sub: session.user.id,
        email: session.user.email,
        email_verified: session.user.email_confirmed_at !== null,
        username: session.user.email, // 使用email作为username
        name: session.user.user_metadata?.display_name,
        user_metadata: session.user.user_metadata,
        app_metadata: session.user.app_metadata
      },
      session,
      attributes: {
        sub: session.user.id,
        email: session.user.email,
        email_verified: session.user.email_confirmed_at !== null,
        userType: session.user.user_metadata?.userType || 'tenant',
        user_role: session.user.user_metadata?.userType || 'tenant',
        name: session.user.user_metadata?.display_name,
        companyName: session.user.user_metadata?.companyName,
        buildingName: session.user.user_metadata?.buildingName,
        plan: session.user.user_metadata?.plan,
        ...session.user.user_metadata
      },
      isAuthenticated: true
    }
  } catch (error) {
    // 只有在非预期错误时才记录日志
    if (error.name !== 'AuthSessionMissingError') {
      console.error('获取当前用户失败:', error)
    }
    return null
  }
}

/**
 * 用户登出
 */
export const signOut = async () => {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // 清除用户状态
    clearUserState()
  } catch (error) {
    console.error('登出失败:', error)
    throw error
  }
}

/**
 * 检查用户是否已登录
 * @returns {Promise<boolean>} - 返回是否已登录
 */
export const isAuthenticated = async () => {
  const supabase = await getSupabase();
  try {
    const userData = await getCurrentUser()
    return !!userData
  } catch (error) {
    console.error('检查认证状态失败:', error)
    return false
  }
}

/**
 * 刷新会话 (兼容现有接口)
 * @returns {Promise} - 返回刷新结果
 */
export const refreshSession = async () => {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) throw error
    
    return {
      idToken: data.session?.access_token,
      accessToken: data.session?.access_token
    }
  } catch (error) {
    console.error('刷新会话失败:', error)
    throw error
  }
}

/**
 * 验证用户是否存在于用户池中 (兼容现有接口)
 * @param {string} token - 访问令牌
 * @returns {Promise<boolean>} - 返回用户是否存在
 */
export const verifyUserInCognitoPool = async (token) => {
  const supabase = await getSupabase();
  try {
    // 在Supabase中，我们可以通过获取用户信息来验证token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return !error && !!user
  } catch (error) {
    console.error('验证用户失败:', error)
    return false
  }
}

/**
 * 监听认证状态变化
 * @param {Function} callback - 状态变化回调函数
 * @returns {Function} - 取消监听的函数
 */
export const onAuthStateChange = async (callback) => {
  const supabase = await getSupabase();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth state changed:', event, session)
      
      let userData = null
      if (session) {
        userData = {
          user: {
            id: session.user.id,
            sub: session.user.id,
            email: session.user.email,
            email_verified: session.user.email_confirmed_at !== null,
            username: session.user.email,
            name: session.user.user_metadata?.display_name,
            user_metadata: session.user.user_metadata,
            app_metadata: session.user.app_metadata
          },
          session,
          attributes: {
            sub: session.user.id,
            email: session.user.email,
            email_verified: session.user.email_confirmed_at !== null,
            userType: session.user.user_metadata?.userType || session.user.app_metadata?.provider === 'google' ? 'tenant' : 'tenant',
            user_role: session.user.user_metadata?.userType || session.user.app_metadata?.provider === 'google' ? 'tenant' : 'tenant',
            name: session.user.user_metadata?.display_name,
            companyName: session.user.user_metadata?.companyName,
            buildingName: session.user.user_metadata?.buildingName,
            plan: session.user.user_metadata?.plan,
            ...session.user.user_metadata
          },
          isAuthenticated: true
        }
      }
      
      callback(userData, event)
    }
  )
  
  return () => subscription.unsubscribe()
}

