<template>
  <div class="supabase-test">
    <h3>Supabase 连接测试</h3>
    <div class="test-section">
      <n-space vertical>
        <n-alert v-if="connectionStatus === 'success'" type="success">
          ✅ Supabase 连接成功！
        </n-alert>
        <n-alert v-else-if="connectionStatus === 'error'" type="error">
          ❌ Supabase 连接失败: {{ errorMessage }}
        </n-alert>
        <n-alert v-else type="info">
          🔄 正在测试 Supabase 连接...
        </n-alert>
        
        <n-button @click="testConnection" :loading="testing">
          重新测试连接
        </n-button>
        
        <div v-if="userState.isAuthenticated" class="user-info">
          <h4>当前用户信息：</h4>
          <pre>{{ JSON.stringify(userState, null, 2) }}</pre>
        </div>
        
        <div v-else class="auth-test">
          <h4>认证测试：</h4>
          <n-space>
            <n-input v-model:value="testEmail" placeholder="测试邮箱" />
            <n-input v-model:value="testPassword" type="password" placeholder="测试密码" />
            <n-button @click="testSignUp" :loading="authTesting">测试注册</n-button>
            <n-button @click="testSignIn" :loading="authTesting">测试登录</n-button>
          </n-space>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { supabase } from '../services/supabaseConfig'
import { signUp, signIn, getCurrentUser } from '../services/supabaseAuthService'
import userState, { initUserState } from '../services/supabaseUserStore'

export default {
  name: 'SupabaseTest',
  setup() {
    const message = useMessage()
    const connectionStatus = ref('testing')
    const errorMessage = ref('')
    const testing = ref(false)
    const authTesting = ref(false)
    const testEmail = ref('test@example.com')
    const testPassword = ref('123456')

    const testConnection = async () => {
      testing.value = true
      connectionStatus.value = 'testing'
      
      try {
        // 测试基本连接
        const { data, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          throw error
        }
        
        connectionStatus.value = 'success'
        message.success('Supabase 连接测试成功！')
        
        // 初始化用户状态
        await initUserState()
        
      } catch (error) {
        connectionStatus.value = 'error'
        errorMessage.value = error.message
        message.error('Supabase 连接测试失败: ' + error.message)
      } finally {
        testing.value = false
      }
    }

    const testSignUp = async () => {
      authTesting.value = true
      try {
        const result = await signUp(testEmail.value, testPassword.value, {
          userType: 'tenant'
        })
        message.success('注册测试成功！请检查邮箱确认邮件。')
        console.log('注册结果:', result)
      } catch (error) {
        message.error('注册测试失败: ' + error.message)
        console.error('注册错误:', error)
      } finally {
        authTesting.value = false
      }
    }

    const testSignIn = async () => {
      authTesting.value = true
      try {
        const result = await signIn(testEmail.value, testPassword.value)
        message.success('登录测试成功！')
        console.log('登录结果:', result)
        await initUserState() // 刷新用户状态
      } catch (error) {
        message.error('登录测试失败: ' + error.message)
        console.error('登录错误:', error)
      } finally {
        authTesting.value = false
      }
    }

    onMounted(() => {
      testConnection()
    })

    return {
      connectionStatus,
      errorMessage,
      testing,
      authTesting,
      testEmail,
      testPassword,
      userState,
      testConnection,
      testSignUp,
      testSignIn
    }
  }
}
</script>

<style scoped>
.supabase-test {
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin: 1rem;
}

.test-section {
  margin-top: 1rem;
}

.user-info, .auth-test {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.user-info pre {
  font-size: 12px;
  background-color: white;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style>