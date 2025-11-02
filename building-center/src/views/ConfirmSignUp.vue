<template>
  <div class="confirm-page">
    <div class="confirm-left">
      <LoginSidebar />
    </div>
    <div class="confirm-right">
      <div class="back-link">
        <AppButton quaternary circle @click="goBack" :icon="ArrowBackOutline">
        </AppButton>
        <span>返回</span>
      </div>
      
      <div class="confirm-content">
        <div class="profile-logo">
          <AppLogo :size="64" />
        </div>
        
        <h1 class="confirm-title">验证您的邮箱</h1>
        <p class="confirm-subtitle">我们已向您的邮箱发送了验证码，请查收并输入验证码完成注册</p>
        
        <n-form
          ref="formRef"
          :model="formModel"
          :rules="rules"
          label-placement="top"
          class="confirm-form"
        >
          <AppInput
            v-model="formModel.email"
            label="邮箱"
            type="text"
            placeholder="请输入您的邮箱"
            :prefix-icon="MailOutline"
            required
            :disabled="!!email"
          />
          
          <AppInput
            v-model="formModel.code"
            label="验证码"
            type="text"
            placeholder="请输入验证码"
            :prefix-icon="KeyOutline"
            required
            @enter="handleConfirm"
          />
          
          <AppButton 
            type="primary" 
            block 
            class="confirm-btn" 
            :loading="loading"
            @click="handleConfirm"
          >
            确认验证
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
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { 
  ArrowBackOutline, 
  MailOutline,
  KeyOutline
} from '@vicons/ionicons5'
import AppLogo from '../components/AppLogo.vue'
import AppInput from '../components/AppInput.vue'
import AppButton from '../components/AppButton.vue'
import LoginSidebar from '../components/LoginSidebar.vue'
import { confirmSignUp, signUp } from '../services/authService'

export default {
  name: 'ConfirmSignUp',
  components: {
    AppLogo,
    AppInput,
    AppButton,
    LoginSidebar
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const message = useMessage()
    const formRef = ref(null)
    const loading = ref(false)
    const countdown = ref(0)
    let timer = null

    // 从路由参数中获取邮箱
    const email = route.query.email || ''

    const formModel = reactive({
      email: email,
      code: ''
    })

    const rules = {
      email: [
        { required: true, message: '邮箱是必填项', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'input'] }
      ],
      code: [
        { required: true, message: '验证码是必填项', trigger: 'blur' },
        { pattern: /^\d{6}$/, message: '验证码应为6位数字', trigger: ['blur', 'input'] }
      ]
    }

    // 确认验证
    const handleConfirm = (e) => {
      if (e) e.preventDefault()
      formRef.value?.validate(async (errors) => {
        if (!errors) {
          loading.value = true
          try {
            await confirmSignUp(formModel.email, formModel.code)
            message.success('邮箱验证成功！')
            router.push('/sign-in')
          } catch (error) {
            message.error('验证失败: ' + (error.message || '未知错误'))
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
      if (!formModel.email) {
        message.error('请输入邮箱地址')
        return
      }

      try {
        // 这里需要调用重新发送验证码的API
        // 假设用户已经注册，我们只需要重新发送验证码
        // 实际实现可能需要根据您的API调整
        await signUp(formModel.email, '', {})
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
      if (window.history.length > 1) {
        router.go(-1)
      } else {
        router.push('/sign-in')
      }
    }

    // 组件卸载时清除定时器
    onUnmounted(() => {
      clearInterval(timer)
    })

    return {
      formRef,
      formModel,
      rules,
      loading,
      countdown,
      email,
      handleConfirm,
      handleResendCode,
      goBack,
      ArrowBackOutline,
      MailOutline,
      KeyOutline
    }
  }
}
</script>

<style scoped>
.confirm-page {
  display: flex;
  min-height: 100vh;
}

.confirm-left {
  flex: 0 0 40%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-right {
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

.confirm-content {
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

.confirm-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.confirm-subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  text-align: center;
}

.confirm-form {
  width: 100%;
}

.confirm-btn {
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

@media (max-width: 768px) {
  .confirm-page {
    flex-direction: column;
  }
  
  .confirm-left {
    display: none;
  }
  
  .confirm-right {
    flex: 1;
    padding: 1.5rem;
  }
  
  .confirm-content {
    padding: 1.5rem 0;
  }
}
</style> 