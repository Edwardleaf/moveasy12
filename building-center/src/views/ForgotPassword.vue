<template>
  <div class="forgot-page">
    <div class="forgot-left">
      <LoginSidebar />
    </div>
    <div class="forgot-right">
      <div class="back-link">
        <AppButton quaternary circle @click="goBack" :icon="ArrowBackOutline">
        </AppButton>
        <span>返回登录</span>
      </div>
      
      <div class="forgot-content">
        <div class="profile-logo">
          <AppLogo :size="64" />
        </div>
        
        <template v-if="step === 'request'">
          <h1 class="forgot-title">找回密码</h1>
          <p class="forgot-subtitle">请输入您的邮箱，我们将向您发送重置密码的验证码</p>
          
          <n-form
            ref="requestFormRef"
            :model="requestForm"
            :rules="requestRules"
            label-placement="top"
            class="forgot-form"
          >
            <AppInput
              v-model="requestForm.email"
              label="邮箱"
              type="text"
              placeholder="请输入您的邮箱"
              :prefix-icon="MailOutline"
              required
              @enter="handleRequestCode"
            />
            
            <AppButton 
              type="primary" 
              block 
              class="forgot-btn" 
              :loading="loading"
              @click="handleRequestCode"
            >
              发送验证码
            </AppButton>
          </n-form>
        </template>
        
        <template v-else-if="step === 'reset'">
          <h1 class="forgot-title">重置密码</h1>
          <p class="forgot-subtitle">请输入您收到的验证码和新密码</p>
          
          <n-form
            ref="resetFormRef"
            :model="resetForm"
            :rules="resetRules"
            label-placement="top"
            class="forgot-form"
          >
            <AppInput
              v-model="resetForm.code"
              label="验证码"
              type="text"
              placeholder="请输入验证码"
              :prefix-icon="KeyOutline"
              required
            />
            
            <AppInput
              v-model="resetForm.password"
              label="新密码"
              type="password"
              placeholder="请输入新密码"
              :prefix-icon="LockClosedOutline"
              required
            />
            
            <AppInput
              v-model="resetForm.confirmPassword"
              label="确认密码"
              type="password"
              placeholder="请再次输入新密码"
              :prefix-icon="LockClosedOutline"
              required
              @enter="handleResetPassword"
            />
            
            <AppButton 
              type="primary" 
              block 
              class="forgot-btn" 
              :loading="loading"
              @click="handleResetPassword"
            >
              重置密码
            </AppButton>
            
            <div class="resend-code">
              <p>
                没有收到验证码？
                <AppButton text class="resend-btn" @click="handleResendCode" :disabled="countdown > 0">
                  {{ countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送' }}
                </AppButton>
              </p>
            </div>
          </n-form>
        </template>
        
        <template v-else-if="step === 'success'">
          <div class="success-message">
            <n-icon size="64" color="#4caf50">
              <CheckmarkCircleOutline />
            </n-icon>
            <h1 class="forgot-title">密码重置成功</h1>
            <p class="forgot-subtitle">您的密码已成功重置，现在可以使用新密码登录</p>
            <AppButton 
              type="primary" 
              block 
              class="forgot-btn" 
              @click="goToLogin"
            >
              返回登录
            </AppButton>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { 
  ArrowBackOutline, 
  MailOutline,
  KeyOutline,
  LockClosedOutline,
  CheckmarkCircleOutline
} from '@vicons/ionicons5'
import AppLogo from '../components/AppLogo.vue'
import AppInput from '../components/AppInput.vue'
import AppButton from '../components/AppButton.vue'
import LoginSidebar from '../components/LoginSidebar.vue'
import { forgotPassword, confirmForgotPassword } from '../services/authService'

export default {
  name: 'ForgotPassword',
  components: {
    AppLogo,
    AppInput,
    AppButton,
    LoginSidebar,
    CheckmarkCircleOutline
  },
  setup() {
    const router = useRouter()
    const message = useMessage()
    const requestFormRef = ref(null)
    const resetFormRef = ref(null)
    const loading = ref(false)
    const step = ref('request') // 'request', 'reset', 'success'
    const countdown = ref(0)
    let timer = null

    const requestForm = reactive({
      email: ''
    })

    const resetForm = reactive({
      email: '',
      code: '',
      password: '',
      confirmPassword: ''
    })

    const requestRules = {
      email: [
        { required: true, message: '邮箱是必填项', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'input'] }
      ]
    }

    const resetRules = {
      code: [
        { required: true, message: '验证码是必填项', trigger: 'blur' },
        { pattern: /^\d{6}$/, message: '验证码应为6位数字', trigger: ['blur', 'input'] }
      ],
      password: [
        { required: true, message: '密码是必填项', trigger: 'blur' },
        { min: 8, message: '密码长度至少为8个字符', trigger: ['blur', 'input'] }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
          validator: (rule, value) => value === resetForm.password,
          message: '两次输入的密码不一致',
          trigger: ['blur', 'input']
        }
      ]
    }

    // 请求重置密码验证码
    const handleRequestCode = (e) => {
      if (e) e.preventDefault()
      requestFormRef.value?.validate(async (errors) => {
        if (!errors) {
          loading.value = true
          try {
            await forgotPassword(requestForm.email)
            message.success('验证码已发送到您的邮箱')
            
            // 保存邮箱到重置表单
            resetForm.email = requestForm.email
            
            // 切换到重置密码步骤
            step.value = 'reset'
            
            // 开始倒计时
            countdown.value = 60
            startCountdown()
          } catch (error) {
            message.error('发送验证码失败: ' + (error.message || '未知错误'))
          } finally {
            loading.value = false
          }
        } else {
          message.error('请检查表单中的错误')
        }
      })
    }

    // 重置密码
    const handleResetPassword = (e) => {
      if (e) e.preventDefault()
      resetFormRef.value?.validate(async (errors) => {
        if (!errors) {
          loading.value = true
          try {
            await confirmForgotPassword(resetForm.email, resetForm.code, resetForm.password)
            message.success('密码重置成功')
            
            // 切换到成功步骤
            step.value = 'success'
          } catch (error) {
            message.error('重置密码失败: ' + (error.message || '未知错误'))
          } finally {
            loading.value = false
          }
        } else {
          message.error('请检查表单中的错误')
        }
      })
    }

    // 重新发送验证码
    const handleResendCode = async () => {
      if (!resetForm.email) {
        message.error('邮箱地址无效')
        return
      }

      try {
        await forgotPassword(resetForm.email)
        message.success('验证码已重新发送到您的邮箱')
        
        // 开始倒计时
        countdown.value = 60
        startCountdown()
      } catch (error) {
        message.error('发送验证码失败: ' + (error.message || '未知错误'))
      }
    }

    // 倒计时
    const startCountdown = () => {
      clearInterval(timer)
      timer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value--
        } else {
          clearInterval(timer)
        }
      }, 1000)
    }

    const goBack = () => {
      router.push('/sign-in')
    }

    const goToLogin = () => {
      router.push('/sign-in')
    }

    return {
      requestFormRef,
      resetFormRef,
      requestForm,
      resetForm,
      requestRules,
      resetRules,
      loading,
      step,
      countdown,
      handleRequestCode,
      handleResetPassword,
      handleResendCode,
      goBack,
      goToLogin,
      ArrowBackOutline,
      MailOutline,
      KeyOutline,
      LockClosedOutline,
      CheckmarkCircleOutline
    }
  }
}
</script>

<style scoped>
.forgot-page {
  display: flex;
  min-height: 100vh;
}

.forgot-left {
  flex: 0 0 40%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.forgot-right {
  flex: 0 0 60%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.back-link {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.forgot-content {
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.profile-logo {
  margin-bottom: 1.5rem;
}

.forgot-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.forgot-subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  text-align: center;
}

.forgot-form {
  width: 100%;
}

.forgot-btn {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: var(--primary-color);
  height: 48px;
  font-size: 1rem;
  font-weight: 500;
}

.resend-code {
  text-align: center;
  color: var(--text-secondary);
}

.resend-btn {
  font-weight: 500;
  color: #4f46e5;
}

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

@media (max-width: 768px) {
  .forgot-page {
    flex-direction: column;
  }
  
  .forgot-left {
    display: none;
  }
  
  .forgot-right {
    flex: 1;
    padding: 1.5rem;
  }
  
  .forgot-content {
    padding: 1.5rem 0;
  }
}
</style> 