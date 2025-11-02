import { createClient } from '@supabase/supabase-js'

// 配置缓存
let cachedConfig = null
let supabaseClient = null

// 从后端获取配置
async function getConfig() {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBaseUrl}/api/config`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to load configuration')
    }

    cachedConfig = data.config
    console.log('🔐 Configuration loaded securely from backend')
    return cachedConfig
  } catch (error) {
    console.error('Failed to load configuration:', error)
    throw new Error('Unable to load application configuration')
  }
}

// 获取 Supabase 客户端
export async function getSupabase() {
  if (supabaseClient) {
    return supabaseClient
  }

  const config = await getConfig()
  
  supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  })

  return supabaseClient
}

export async function getAppConfig() {
  const config = await getConfig();
  return {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    googleClientId: config.googleClientId,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
    callbackUrl: window.location.origin + '/auth/callback'
  };
}

// 便于导入的简化版本
export const supabase = getSupabase

export default getAppConfig;