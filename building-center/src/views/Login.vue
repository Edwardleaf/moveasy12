<template>
  <div class="login-page">
    <div class="login-content-wrapper">
      <div class="login-left">
        <LoginSidebar />
      </div>
      <div class="login-right">
      <div class="back-link">
        <AppButton quaternary circle @click="goBack" :icon="ArrowBackOutline">
        </AppButton>
        <TranslatedText :use-static="true">back</TranslatedText>
      </div>
      
      <div class="login-content">        
        <h1 class="login-title"><TranslatedText :use-static="true">login</TranslatedText></h1>
        <p class="login-subtitle"><TranslatedText :use-static="true">Welcome back! Please enter your details.</TranslatedText></p>
        
        <!-- 显示从注册页面传递的消息 -->
        <n-alert v-if="routeMessage" type="success" class="message-alert" closable>
          {{ routeMessage }}
        </n-alert>
        
        <div class="social-login">
          <n-button class="btn-google" secondary block @click="handleGoogleLogin">
            <template #icon>
              <img src="../assets/images/google.svg" alt="Google" class="google-icon" />
            </template>
<TranslatedText :use-static="true">Sign in with Google</TranslatedText>
          </n-button>
        </div>
        
        <div class="separator">
          <span><TranslatedText :use-static="true">or Sign in with Email</TranslatedText></span>
        </div>
        
        <n-form
          ref="formRef"
          :model="formModel"
          :rules="rules"
          label-placement="top"
          class="login-form"
        >
          <AppInput
            v-model="formModel.email"
            :label="getStaticText('email')"
            type="text"
            :placeholder="getStaticText('email')"
            :prefix-icon="MailOutline"
            required
          />
          
          <AppInput
            v-model="formModel.password"
            :label="getStaticText('password')"
            type="password"
            placeholder="••••••••"
            :prefix-icon="LockClosedOutline"
            required
            @enter="handleLogin"
          />
          
          <div class="form-options">
            <n-checkbox v-model:checked="formModel.rememberMe">
<TranslatedText :use-static="true">Remember me</TranslatedText>
            </n-checkbox>
            <AppButton text class="forgot-password" @click="handleForgotPassword">
<TranslatedText :use-static="true">Forgot Password</TranslatedText>
            </AppButton>
          </div>
          
          <AppButton 
            type="primary" 
            block 
            class="login-btn" 
            :loading="loading"
            @click="handleLogin"
          >
<TranslatedText :use-static="true">login</TranslatedText>
          </AppButton>
        </n-form>
        
        <div class="register-link">
          <p><TranslatedText :use-static="true">Not registered yet?</TranslatedText> <AppButton text class="register-btn" @click="goToRegister"><TranslatedText :use-static="true">register</TranslatedText></AppButton></p>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import useTranslation from '../composables/useTranslation'
import { 
  ArrowBackOutline, 
  MailOutline, 
  LockClosedOutline, 
  EyeOutline, 
  EyeOffOutline, 
  LogoGoogle 
} from '@vicons/ionicons5'
import AppLogo from '../components/AppLogo.vue'
import AppInput from '../components/AppInput.vue'
import AppButton from '../components/AppButton.vue'
import LoginSidebar from '../components/LoginSidebar.vue'
import Navbar from '../components/Navbar.vue'
import TranslatedText from '../components/TranslatedText.vue'
import { signIn, signInWithGoogle, signInWithAPI } from '../services/supabaseAuthService'
import { updateUserState } from '../services/supabaseUserStore'
import supabaseConfig from '../services/supabaseConfig'
import { supabase } from '../services/supabaseConfig'

export default {
  name: 'Login',
  components: {
    AppLogo,
    AppInput,
    AppButton,
    LoginSidebar,
    Navbar,
    TranslatedText
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const message = useMessage()
    const { getStaticText } = useTranslation()
    const formRef = ref(null)
    const loading = ref(false)
    
    // 获取URL查询参数中的消息
    const routeMessage = ref(route.query.message || '')

    const formModel = reactive({
      email: '',
      password: '',
      rememberMe: false
    })


    // 处理验证链接回调
    onMounted(async () => {
      const supabaseClient = await supabase();
      // 语言系统已通过统一翻译系统初始化
      // 检查URL参数以确定是否为邮箱确认
      const urlParams = new URLSearchParams(window.location.search);
      const token_hash = urlParams.get('token_hash');
      const type = urlParams.get('type');
      
      // 处理Supabase邮箱确认
      if (token_hash && type === 'email') {
        try {
          loading.value = true;
          console.log('处理邮箱确认，token_hash:', token_hash);
          
          // 调用Supabase验证邮箱
          const { data, error } = await supabaseClient.auth.verifyOtp({
            token_hash: token_hash,
            type: 'email'
          });
          
          if (error) {
            console.error('邮箱验证失败:', error);
            message.error('邮箱验证失败: ' + error.message);
          } else {
            console.log('邮箱验证成功:', data);
            // 移除顶部flash，只保留页面内alert
            routeMessage.value = getStaticText('email_verified_success');
            
            // 清理URL参数
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        } catch (error) {
          console.error('邮箱验证错误:', error);
          message.error('邮箱验证失败');
        } finally {
          loading.value = false;
        }
      }
      
      // 检查旧的确认回调格式（兼容性）
      if (route.name === 'AuthConfirm') {
        const token = route.query.token;
        const confirmationType = route.query.type;
        
        if (token && confirmationType === 'signup') {
          try {
            loading.value = true;
            const { data, error } = await supabaseClient.auth.verifyOtp({
              token_hash: token,
              type: 'email'
            });
            
            if (error) {
              console.error('邮箱验证失败:', error);
              routeMessage.value = getStaticText('email_verification_failed');
            } else {
              routeMessage.value = getStaticText('email_verified_success');
            }
          } catch (error) {
            console.error('邮箱验证错误:', error);
            routeMessage.value = getStaticText('email_verification_failed');
          } finally {
            loading.value = false;
          }
        }
      }
      
      
    })
    
    onBeforeUnmount(() => {
      // 清理操作
    })

    const rules = {
      email: [
        { required: true, message: '邮箱是必填项', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'input'] }
      ],
      password: [
        { required: true, message: '密码是必填项', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: ['blur', 'input'] }
      ]
    }
    

    const handleLogin = (e) => {
      if (e) e.preventDefault()
      formRef.value?.validate(async (errors) => {
        if (!errors) {
          loading.value = true
          try {
            const supabaseClient = await supabase();
            console.log('开始登录...');
            
            // 尝试使用API登录
            try {
              // 调用API登录
              const result = await signInWithAPI(formModel.email, formModel.password);
              
              console.log('API登录成功:', result);
              
              // 更新用户状态
              updateUserState(result);
              
              // 处理登录成功
              message.success('登录成功');
              
              // 存储令牌
              localStorage.setItem('idToken', result.idToken);
              localStorage.setItem('accessToken', result.accessToken);
              
              // 如果需要记住登录状态
              if (formModel.rememberMe) {
                localStorage.setItem('refreshToken', result.refreshToken);
              }
              
              // 检查是否有重定向URL
              const redirectPath = route.query.redirect || '/';
              
              // 跳转到主页或重定向页面
              router.push(redirectPath);
              return;
            } catch (apiError) {
              console.error('API登录失败:', apiError);
              
              // 不再尝试备用方法，而是直接抛出错误
              throw apiError;
            }
          } catch (error) {
            console.error('登录详细错误:', error);
            
            if (error.code === 'UserNotConfirmedException') {
              // 用户未确认邮箱
              message.warning('请先验证您的邮箱');
              router.push({
                path: '/confirm-signup',
                query: { email: formModel.email }
              });
            } else {
              message.error('登录失败: ' + (error.message || '未知错误'));
            }
          } finally {
            loading.value = false;
          }
        } else {
          message.error('请检查表单中的错误');
        }
      });
    }

    // 处理Google登录按钮点击
    const handleGoogleLogin = async () => {
      try {
        const supabaseClient = await supabase();
        console.log('开始Google登录流程');
        
        // 使用Supabase的Google OAuth
        const result = await signInWithGoogle();
        
        // Supabase会自动处理重定向到Google授权页面
        console.log('正在重定向到Google登录...');
        
      } catch (error) {
        console.error('Google登录失败:', error);
        message.error('Google登录失败: ' + (error.message || '未知错误'));
      }
    };

    const handleForgotPassword = () => {
      router.push('/forgot-password')
    }

    const goToRegister = () => {
      router.push('/signup')
    }

    const goBack = () => {
      router.push('/')
    }

    return {
      formRef,
      formModel,
      rules,
      loading,
      routeMessage,
      handleLogin,
      handleGoogleLogin,
      handleForgotPassword,
      goToRegister,
      goBack,
      getStaticText,
      ArrowBackOutline,
      MailOutline,
      LockClosedOutline,
      EyeOutline,
      EyeOffOutline,
      LogoGoogle
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.login-content-wrapper {
  display: flex;
  flex: 1;
  min-height: 100vh;
}

.login-left {
  flex: 0 0 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-right {
  flex: 0 0 50%;
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

.login-content {
  margin: 0 auto;
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.profile-logo {
  margin-bottom: 1.5rem;
}

.logo-image {
  height: 80px;
  width: auto;
}

.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #1f2937;
  text-align: center;
}

.login-subtitle {
  color: #4b5563;
  font-size: 1.1rem;
  font-weight: 400;
  margin-bottom: 2.5rem;
  text-align: center;
  line-height: 1.5;
}

.social-login {
  width: 100%;
  margin: 0 auto 1.5rem auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  color: #333;
  font-weight: 500;
  gap: 8px;
  transition: all 0.2s ease;
  width: 100%;
}

.btn-google:hover {
  background-color: #e9ecef;
  border-color: #d0d0d0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.google-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.google-signin-button {
  width: 100%;
  height: 48px;
  display: flex;
  justify-content: center;
}

.separator {
  width: 100%;
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.separator::before,
.separator::after {
  content: "";
  position: absolute;
  top: 50%;
  width: calc(50% - 120px);
  height: 1px;
  background-color: var(--border-color);
}

.separator::before {
  left: 0;
}

.separator::after {
  right: 0;
}

.separator span {
  background-color: white;
  padding: 0 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.login-form {
  width: 100%;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.forgot-password {
  font-size: 0.875rem;
  color: #4f46e5; /* 蓝紫色，更接近设计图 */
}

.login-btn {
  margin-bottom: 1.5rem;
  background-color: var(--primary-color);
  height: 48px;
  font-size: 1rem;
  font-weight: 500;
  width: 100%;
}

.register-link {
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-btn {
  font-weight: 500;
  color: #2563eb !important; /* 更明显的蓝色 */
}

.register-btn:hover {
  color: #1d4ed8 !important;
  text-decoration: underline;
}

.message-alert {
  width: 100%;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  
  .login-left {
    display: none;
  }
  
  .login-right {
    flex: 1;
    padding: 1.5rem;
  }
  
  .login-content {
    padding: 1.5rem 0;
  }
}
</style> 
 