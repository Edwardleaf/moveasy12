<template>
  <div class="auth-callback">
    <div class="loading-container">
      <n-spin size="large" />
      <p>正在处理登录...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { supabase } from '../services/supabaseConfig'

const router = useRouter()
const message = useMessage()

onMounted(async () => {
  const supabaseClient = await supabase();
  try {
    // 处理OAuth回调
    const { data, error } = await supabaseClient.auth.getSession()
    
    if (error) {
      console.error('获取会话失败:', error)
      message.error('登录失败: ' + error.message)
      router.push('/sign-in')
      return
    }
    
    if (data.session) {
      // 登录成功，用户有会话
      console.log('OAuth登录成功:', data.session.user)
      
      // 如果是Google登录且没有userType，设置默认值
      if (data.session.user.app_metadata?.provider === 'google' && !data.session.user.user_metadata?.userType) {
        try {
          // 为Google用户设置默认角色
          await supabaseClient.auth.updateUser({
            data: {
              userType: 'tenant',
              display_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || data.session.user.email.split('@')[0]
            }
          })
          console.log('已为Google用户设置默认角色')
        } catch (updateError) {
          console.error('更新用户角色失败:', updateError)
        }
      }
      
      message.success('Welcome back!')
      router.push('/')
    } else {
      // 没有会话，可能登录失败
      message.error('登录失败，请重试')
      router.push('/sign-in')
    }
  } catch (error) {
    console.error('处理OAuth回调失败:', error)
    message.error('登录处理失败')
    router.push('/sign-in')
  }
})
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.loading-container {
  text-align: center;
}

.loading-container p {
  margin-top: 16px;
  color: #666;
  font-size: 16px;
}
</style>