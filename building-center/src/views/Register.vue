<template>
  <div class="register-page">
    <div class="register-content-wrapper">
      <div class="register-left">
      <div class="register-sidebar">
        <div class="decoration-circles">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
        </div>
        
        <div class="image-stack">
          <div class="image image-1">
            <img src="../assets/images/harry-shelton-pPxhM0CRzl4-unsplash.jpg" alt="Building facade" class="sidebar-image" />
          </div>
          <div class="image image-2">
            <img src="../assets/images/hohyeong-lee-e0uCDHd19U4-unsplash.jpg" alt="Skyscrapers" class="sidebar-image" />
          </div>
          <div class="image image-3">
            <img src="../assets/images/kimon-maritz-mQiZnKwGXW0-unsplash.jpg" alt="Apartment exterior" class="sidebar-image" />
          </div>
        </div>
        
        <div class="floating-elements">
          <div class="floating-element element-1">
            <n-icon size="24" color="#198754">
              <HomeOutline />
            </n-icon>
          </div>
          <div class="floating-element element-2">
            <n-icon size="24" color="#198754">
              <BusinessOutline />
            </n-icon>
          </div>
          <div class="floating-element element-3">
            <n-icon size="24" color="#198754">
              <LinkOutline />
            </n-icon>
          </div>
        </div>
      </div>
    </div>
    <div class="register-right">
      <div class="back-link">
        <n-button quaternary circle @click="goBack">
          <template #icon>
            <n-icon><ArrowBackOutline /></n-icon>
          </template>
        </n-button>
        <TranslatedText text="back" :use-static="true" />
      </div>
      
      <div class="register-content">
        <n-tabs
          v-model:value="activeTab"
          type="line"
          size="large"
          :tab-style="{ width: '160px' }"
          justify-content="space-evenly"
          class="register-tabs"
        >
          <n-tab-pane name="tenant" :tab="getStaticText('tenant', currentLanguage)" />
          <n-tab-pane name="landlord" :tab="getStaticText('landlord', currentLanguage)" />
        </n-tabs>
        
        <h1 class="register-title"><TranslatedText text="Getting Started" :use-static="true" /></h1>
        <p class="register-subtitle"><TranslatedText text="Create an account to continue!" :use-static="true" /></p>
        
        <!-- Tenant Registration Form -->
        <div v-if="activeTab === 'tenant'" class="register-form">
          <div class="social-login">
            <n-button class="btn-google" secondary block @click="handleGoogleLogin">
              <template #icon>
                <img src="../assets/images/google.svg" alt="Google" class="google-icon" />
              </template>
<TranslatedText text="Sign in with Google" :use-static="true" />
            </n-button>
          </div>
          
          <div class="separator">
            <span><TranslatedText text="or Sign Up with Email" :use-static="true" /></span>
          </div>
          
          <n-form
            ref="tenantFormRef"
            :model="tenant"
            :rules="tenantRules"
            label-placement="top"
          >
            <n-form-item path="email" :label="getStaticText('email')">
              <n-input 
                v-model:value="tenant.email" 
:placeholder="getStaticText('email')"
                clearable
              >
                <template #prefix>
                  <n-icon><MailOutline /></n-icon>
                </template>
              </n-input>
            </n-form-item>
            
            <n-form-item path="name" :label="getStaticText('name')">
              <n-input 
                v-model:value="tenant.name" 
:placeholder="getStaticText('name')"
                clearable
              >
                <template #prefix>
                  <n-icon><PersonOutline /></n-icon>
                </template>
              </n-input>
            </n-form-item>
            
            <n-form-item path="password" :label="getStaticText('password')">
              <n-input 
                v-model:value="tenant.password" 
                type="password" 
                show-password
                placeholder="••••••••"
                :maxlength="30"
                clearable
              >
                <template #prefix>
                  <n-icon><LockClosedOutline /></n-icon>
                </template>
              </n-input>
              <div v-if="tenant.password" class="password-strength">
                <n-text type="success"><TranslatedText text="Strong" :use-static="true" /></n-text>
              </div>
            </n-form-item>
            
          </n-form>
          
          <!-- Terms checkbox -->
          <div class="terms-section">
            <n-checkbox v-model:checked="tenant.agreeTerms">
              <TranslatedText text="I agree to the" :use-static="true" /> 
              <n-button text class="terms-link" @click="openTerms"><TranslatedText text="Terms & Conditions" :use-static="true" /></n-button>
            </n-checkbox>
          </div>
          
          <!-- Sign In link -->
          <div class="signin-section">
            <p><TranslatedText text="Already have an account?" :use-static="true" /> <n-button text @click="goToLogin"><TranslatedText text="login" :use-static="true" /></n-button></p>
          </div>
          
          <!-- Centered Sign Up Button -->
          <div class="signup-button-container">
            <n-button 
              type="primary" 
              class="register-btn" 
              :loading="tenantLoading"
              @click="registerTenant"
            >
<TranslatedText text="register" :use-static="true" />
            </n-button>
          </div>
        </div>
        
        <!-- Landlord Registration Form -->
        <div v-if="activeTab === 'landlord'" class="register-form">
          <n-form
            ref="landlordFormRef"
            :model="landlord"
            :rules="landlordRules"
            label-placement="top"
          >
            <n-grid :cols="2" :x-gap="24">
              <n-grid-item>
                <n-form-item path="companyName" :label="getStaticText('Company/Landlord Name')">
                  <n-input 
                    v-model:value="landlord.companyName" 
                    :placeholder="getStaticText('Enter your company or agency name')"
                    clearable
                  >
                    <template #prefix>
                      <n-icon><BusinessOutline /></n-icon>
                    </template>
                  </n-input>
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item path="buildingName" :label="getStaticText('Building Name')">
                  <n-input 
                    v-model:value="landlord.buildingName" 
                    :placeholder="getStaticText('Enter the name of the building')"
                    clearable
                  >
                    <template #prefix>
                      <n-icon><HomeOutline /></n-icon>
                    </template>
                  </n-input>
                </n-form-item>
              </n-grid-item>
            </n-grid>
            
            <n-grid :cols="2" :x-gap="24">
              <n-grid-item>
                <n-form-item path="email" :label="getStaticText('Contact Email')">
                  <n-input 
                    v-model:value="landlord.email" 
                    :placeholder="getStaticText('Enter your email address')"
                    clearable
                  >
                    <template #prefix>
                      <n-icon><MailOutline /></n-icon>
                    </template>
                  </n-input>
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item path="password" :label="getStaticText('Set Password')">
                  <n-input 
                    v-model:value="landlord.password" 
                    type="password" 
                    show-password
                    :placeholder="getStaticText('Enter a password')"
                    :maxlength="30"
                    clearable
                  >
                    <template #prefix>
                      <n-icon><LockClosedOutline /></n-icon>
                    </template>
                  </n-input>
                </n-form-item>
              </n-grid-item>
            </n-grid>
          
                        
            <!-- Plan Selection - Single Row -->
            <div class="compact-form-row">
              <label class="compact-label">{{ getStaticText('Choose Plan') }}</label>
              <div class="plan-options">
                <button 
                  type="button"
                  class="plan-option" 
                  :class="{ active: landlord.plan === 'listing' }"
                  @click="landlord.plan = 'listing'"
                >
                  {{ getStaticText('Listing Fee') }}
                </button>
                <button 
                  type="button"
                  class="plan-option"
                  :class="{ active: landlord.plan === 'success' }"
                  @click="landlord.plan = 'success'"
                >
                  {{ getStaticText('Success Fee') }}
                </button>
              </div>
            </div>
            
            <!-- Calendly Link - Single Row -->
            <div class="compact-form-row">
              <label class="compact-label">
                {{ getStaticText('Calendly Link') }}
                <n-tooltip trigger="hover" placement="top">
                  <template #trigger>
                    <n-icon size="14" class="info-icon-inline">
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5A1.5,1.5 0 0,1 10.5,9A1.5,1.5 0 0,1 12,7.5A1.5,1.5 0 0,1 13.5,9A1.5,1.5 0 0,1 12,10.5Z" />
                      </svg>
                    </n-icon>
                  </template>
                  <div class="tooltip-content">
                    <p>1. Go to <a href="https://calendly.com/event_types/user/me" target="_blank" class="tooltip-link">your Calendly events</a></p>
                    <p>2. Click "Copy Link" on your event card</p>
                    <p>3. Paste the link here</p>
                  </div>
                </n-tooltip>
              </label>
              <input 
                v-model="landlord.calendlyLink" 
                type="url"
                placeholder="https://calendly.com/your-event-link"
                class="compact-input"
              />
            </div>
            

            <div class="upload-form-item">
              <div class="upload-label-container">
                <label class="upload-label">{{ getStaticText('Building Qualification Document') }}</label>
                <span class="upload-support-text">{{ getStaticText('PDF, JPG, PNG (Max 5 files)') }}</span>
              </div>
              <div class="document-upload-container">
                <n-upload
                  accept=".pdf,.jpg,.jpeg,.png"
                  :default-upload="false"
                  @change="handleFileUpload"
                  :show-file-list="true"
                  :max="5"
                  multiple
                  list-type="image-card"
                  class="upload-component"
                >
                  <n-upload-dragger class="upload-dragger-custom">
                    <div class="upload-placeholder">
                      <div class="upload-icon">
                        <img src="../assets/images/upload.svg" alt="Upload" width="48" height="48" />
                      </div>
                    </div>
                  </n-upload-dragger>
                </n-upload>
              </div>
            </div>

            <n-form-item path="agreeTerms">
              <n-checkbox v-model:checked="landlord.agreeTerms" size="large" class="terms-checkbox">
                <span class="terms-text">{{ getStaticText('I have read and agree to the') }}
                <n-button text class="terms-link" @click="openPrivacyPolicy">{{ getStaticText('Privacy Policy') }}</n-button>
                {{ getStaticText('and') }}
                <n-button text class="terms-link" @click="openTermsOfService">{{ getStaticText('Terms of Service') }}</n-button>
                </span>
              </n-checkbox>
            </n-form-item>
            
            <!-- Landlord Sign In link -->
            <div class="landlord-signin-section">
              <p>{{ getStaticText('Already have an account?') }} <n-button text @click="goToLogin">{{ getStaticText('Sign In') }}</n-button></p>
            </div>

            <!-- Landlord Submit Button -->
            <div class="landlord-submit-container">
              <n-button 
                type="primary" 
                class="register-btn" 
                :loading="landlordLoading"
                @click="registerLandlord"
                size="large"
              >
                {{ getStaticText('Submit Registration') }}
              </n-button>
            </div>
          </n-form>
          

        </div>
      </div>
    </div>
    </div>
    
    <!-- Flash Notification -->
    <div v-if="showFlashNotification" class="flash-notification">
      <div class="flash-content">
        <div class="flash-icon">
          <img src="../assets/images/email (1).svg" alt="Email" width="32" height="32" />
        </div>
        <div class="flash-message">
          <div class="flash-title">{{ flashTitle }}</div>
          <div class="flash-subtitle">{{ flashSubtitle }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import useTranslation from '../composables/useTranslation'
import TranslatedText from '../components/TranslatedText.vue'
import { 
  ArrowBackOutline, 
  MailOutline, 
  PersonOutline,
  BusinessOutline,
  HomeOutline,
  LockClosedOutline, 
  EyeOutline, 
  EyeOffOutline, 
  LogoGoogle,
  CloudUploadOutline,
  LinkOutline
} from '@vicons/ionicons5'
import Navbar from '../components/Navbar.vue'
import { signUp, signInWithGoogle, signUpWithAPI } from '../services/supabaseAuthService'
import { updateUserState } from '../services/supabaseUserStore'

export default {
  name: 'Register',
  components: {
    Navbar,
    TranslatedText,
    ArrowBackOutline,
    MailOutline,
    PersonOutline,
    BusinessOutline,
    HomeOutline,
    LockClosedOutline,
    EyeOutline,
    EyeOffOutline,
    LogoGoogle,
    CloudUploadOutline,
    LinkOutline
  },
  props: {
    defaultTab: {
      type: String,
      default: 'tenant'
    }
  },
  setup(props) {
    const router = useRouter()
    const message = useMessage()
    const { getStaticText, currentLanguage } = useTranslation()
    const activeTab = ref(props.defaultTab)
    const showPassword = ref(false)
    const tenantFormRef = ref(null)
    const landlordFormRef = ref(null)
    const tenantLoading = ref(false)
    const landlordLoading = ref(false)
    const showFlashNotification = ref(false)

    // 响应式文本
    const flashTitle = computed(() => getStaticText('Application Submitted Successfully!'))
    const flashSubtitle = computed(() => getStaticText("We'll review your application within 1-2 business days and notify you via email."))

    const tenant = reactive({
      name: '',
      email: '',
      password: '',
      agreeTerms: false
    })

    const landlord = reactive({
      companyName: '',
      buildingName: '',
      email: '',
      password: '',
      documents: [],
      plan: 'listing',
      calendlyLink: '',
      agreeTerms: false
    })

    const tenantRules = {
      name: [
        { required: true, message: getStaticText('Name is required'), trigger: 'blur' },
        { min: 2, message: getStaticText('Name must be at least 2 characters'), trigger: ['blur', 'input'] }
      ],
      email: [
        { required: true, message: getStaticText('Email is required'), trigger: 'blur' },
        { type: 'email', message: getStaticText('Please enter a valid email address'), trigger: ['blur', 'input'] }
      ],
      password: [
        { required: true, message: getStaticText('Password is required'), trigger: 'blur' },
        { min: 6, message: getStaticText('Password must be at least 6 characters'), trigger: ['blur', 'input'] }
      ],
      agreeTerms: [
        { 
          validator: (rule, value) => value === true, 
          message: getStaticText('You must agree to the Terms & Conditions'), 
          trigger: 'change' 
        }
      ]
    }

    const landlordRules = {
      companyName: [
        { required: true, message: getStaticText('Company name is required'), trigger: 'blur' }
      ],
      buildingName: [
        { required: true, message: getStaticText('Building name is required'), trigger: 'blur' }
      ],
      email: [
        { required: true, message: getStaticText('Email is required'), trigger: 'blur' },
        { type: 'email', message: getStaticText('Please enter a valid email address'), trigger: ['blur', 'input'] }
      ],
      password: [
        { required: true, message: getStaticText('Password is required'), trigger: 'blur' },
        { min: 6, message: getStaticText('Password must be at least 6 characters'), trigger: ['blur', 'input'] }
      ],
      document: [
        { 
          required: true, 
          message: getStaticText('Building qualification document is required'), 
          trigger: ['blur', 'change'],
          validator: (rule, value) => {
            return landlord.document !== null
          }
        }
      ],
      calendlyLink: [
        { required: true, message: getStaticText('Calendly link is required'), trigger: 'blur' },
        { 
          pattern: /^https:\/\/calendly\.com\//, 
          message: getStaticText('Please enter a valid Calendly link'), 
          trigger: ['blur', 'input'] 
        }
      ],
      agreeTerms: [
        { 
          validator: (rule, value) => value === true, 
          message: getStaticText('You must agree to the Terms of Service and Privacy Policy'), 
          trigger: 'change' 
        }
      ]
    }

    // File upload handler
    const handleFileUpload = (options) => {
      const { fileList } = options
      landlord.documents = fileList
      console.log('文档上传:', fileList)
      // 不触发表单验证，让用户自由上传和预览
    }

    // Registration methods
    const registerTenant = (e) => {
      e.preventDefault()
      tenantFormRef.value?.validate(async (errors) => {
        if (!errors) {
          tenantLoading.value = true
          try {
            console.log('开始租户注册...', {
              email: tenant.email,
              name: tenant.name,
              userType: 'tenant'
            });
            
            // 使用API进行注册
            const result = await signUpWithAPI(tenant.email, tenant.password, {
              display_name: tenant.name,
              'custom:userType': 'tenant'
            });
            
            console.log('注册成功:', result);
            
            // 注册成功后跳转到登录页面，只使用页面内alert显示消息
            router.push({
              path: '/sign-in',
              query: { 
                message: getStaticText('check_email_message')
              }
            });
          } catch (error) {
            console.error('注册详细错误:', error);
            message.error('注册失败: ' + (error.message || error.toString()));
          } finally {
            tenantLoading.value = false;
          }
        } else {
          // 移除额外的flash，只依赖表单feedback显示错误
        }
      });
    };

    // 预留的CRUD函数，用于未来的管理界面
    const submitLandlordApplication = async (applicationData) => {
      // TODO: 提交到 landlord_applications 表
      // const { data, error } = await supabase
      //   .from('landlord_applications')
      //   .insert(applicationData);
      // return { data, error };
      
      // Demo模拟延迟
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: { id: 'demo-id' }, error: null });
        }, 1000);
      });
    };

    const registerLandlord = (e) => {
      e.preventDefault()
      landlordFormRef.value?.validate(async (errors) => {
        if (!errors) {
          landlordLoading.value = true
          try {
            // 提交申请而非直接注册
            const applicationData = {
              email: landlord.email,
              company_name: landlord.companyName,
              building_name: landlord.buildingName,
              contact_email: landlord.contactEmail,
              plan: landlord.plan,
              calendly_link: landlord.calendlyLink,
              // documents: uploadedFiles.value, // 暂时注释，因为还没有文件上传逻辑
              status: 'pending'
            };

            const { data, error } = await submitLandlordApplication(applicationData);
            
            if (error) {
              throw new Error(error.message);
            }

            // 显示flash通知
            showFlashNotification.value = true;
            
            // 3秒后自动隐藏通知
            setTimeout(() => {
              showFlashNotification.value = false;
            }, 3000);

          } catch (error) {
            console.error('申请提交错误:', error);
            // 移除额外的flash，只依赖表单feedback
          } finally {
            landlordLoading.value = false;
          }
        } else {
          // 移除额外的flash，只依赖表单feedback显示错误
        }
      });
    }

    const handleGoogleLogin = async () => {
      try {
        // 使用Supabase的Google OAuth
        const result = await signInWithGoogle()
        
        // Supabase会自动处理重定向，所以这里主要是处理错误
        if (result.error) {
          throw result.error
        }
        
        message.success('正在重定向到Google登录...')
      } catch (error) {
        console.error('Google登录失败:', error)
        message.error('Google登录失败: ' + (error.message || '未知错误'))
      }
    }


    const goToLogin = () => {
      router.push('/sign-in')
    }

    const goBack = () => {
      router.push('/')
    }

    // Terms and policy handlers
    const openTerms = () => {
      // Placeholder for terms and conditions page
      console.log('Open Terms & Conditions')
      message.info('Terms & Conditions page will be available soon')
    }

    const openPrivacyPolicy = () => {
      // Placeholder for privacy policy page
      console.log('Open Privacy Policy')
      message.info('Privacy Policy page will be available soon')
    }

    const openTermsOfService = () => {
      // Placeholder for terms of service page
      console.log('Open Terms of Service')
      message.info('Terms of Service page will be available soon')
    }

    // 初始化语言
    onMounted(() => {
      // 语言系统已通过统一翻译系统初始化
    })

    return {
      getStaticText,
      currentLanguage,
      flashTitle,
      flashSubtitle,
      activeTab,
      tenant,
      landlord,
      tenantFormRef,
      landlordFormRef,
      tenantRules,
      landlordRules,
      showPassword,
      tenantLoading,
      landlordLoading,
      showFlashNotification,
      handleFileUpload,
      registerTenant,
      registerLandlord,
      goToLogin,
      goBack,
      openTerms,
      openPrivacyPolicy,
      openTermsOfService,
      ArrowBackOutline,
      MailOutline,
      PersonOutline,
      BusinessOutline,
      HomeOutline,
      LockClosedOutline,
      EyeOutline,
      EyeOffOutline,
      LogoGoogle,
      CloudUploadOutline,
      LinkOutline,
      handleGoogleLogin
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.register-content-wrapper {
  display: flex;
  flex: 1;
  min-height: 100vh;
}

.register-left {
  flex: 0 0 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Register Sidebar Styles (copied from LoginSidebar) */
.register-sidebar {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
}

.decoration-circles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  background: linear-gradient(135deg, #198754, #20c997);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation: float 15s infinite ease-in-out;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
  animation: float 12s infinite ease-in-out reverse;
}

.image-stack {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 70%;
  z-index: 2;
}

.image {
  position: absolute;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: all 0.5s ease;
}

.image-1 {
  width: 70%;
  height: 60%;
  top: 0;
  left: 0;
  z-index: 4;
  animation: hover 6s infinite ease-in-out;
}

.image-2 {
  width: 60%;
  height: 50%;
  top: 20%;
  right: 0;
  z-index: 3;
  animation: hover 7s infinite ease-in-out 1s;
}

.image-3 {
  width: 65%;
  height: 55%;
  bottom: 0;
  left: 15%;
  z-index: 2;
  animation: hover 8s infinite ease-in-out 2s;
}

.floating-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  width: 48px;
  height: 48px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.element-1 {
  top: 15%;
  right: 20%;
  animation: float 10s infinite ease-in-out;
}

.element-2 {
  top: 60%;
  left: 15%;
  animation: float 12s infinite ease-in-out 2s;
}

.element-3 {
  bottom: 15%;
  right: 30%;
  animation: float 9s infinite ease-in-out 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes hover {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.02);
  }
}

.register-right {
  flex: 0 0 50%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  overflow-y: auto;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.register-content {
  margin: 0 auto;
  width: 100%;
  max-width: 520px;
  padding: 0 1rem;
}

.register-tabs {
  margin-bottom: 2rem;
}

.register-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.register-subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1rem;
}

.register-form {
  width: 100%;
}

.social-login {
  width: 100%;
  margin-bottom: 1.5rem;
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
  width: calc(50% - 80px);
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

.password-strength {
  text-align: right;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.upload-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.submit-button-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0 2rem 0;
}

.register-btn {
  width: 280px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.terms-checkbox {
  margin-bottom: 1rem;
}

.terms-text {
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
}

:deep(.n-checkbox) {
  font-size: 15px !important;
}

:deep(.n-checkbox .n-checkbox__label) {
  font-size: 15px !important;
}

/* Terms and Sign In sections for tenant */
.terms-section {
  margin-top: 1rem;
  margin-bottom: 0.75rem;
}

.signin-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.signin-section p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.signin-section .n-button {
  color: #2563eb !important;
  font-weight: 500 !important;
}

.signin-section .n-button:hover {
  color: #1d4ed8 !important;
  text-decoration: underline;
}

/* Centered signup button container */
.signup-button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

/* Landlord form specific styles */
.landlord-signin-section {
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.landlord-signin-section p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.landlord-signin-section .n-button {
  color: #2563eb !important;
  font-weight: 500 !important;
}

.landlord-signin-section .n-button:hover {
  color: #1d4ed8 !important;
  text-decoration: underline;
}

.landlord-submit-container {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.login-link p {
  margin: 0;
  font-size: 15px;
}

.login-link .n-button {
  color: #2563eb !important;
  font-weight: 500 !important;
  margin-left: 4px;
}

.login-link .n-button:hover {
  color: #1d4ed8 !important;
  text-decoration: underline;
}

.terms-link {
  color: #198754 !important;
  text-decoration: underline;
  font-weight: 500;
}

.terms-link:hover {
  color: #146c43 !important;
}

.upload-label-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.upload-label {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.upload-support-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
}

/* Document Upload Styles */
.document-upload-container {
  width: 100%;
  max-width: 400px;
}

.upload-component {
  width: 100%;
}

.upload-dragger-custom {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px;
  background-color: #f9fafb;
  transition: all 0.2s ease;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-dragger-custom:hover {
  border-color: #198754;
  background-color: #f0fdf4;
}

.upload-placeholder {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-sub-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* Form Typography Improvements */
:deep(.n-form-item-label) {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #1f2937 !important;
  margin-bottom: 8px !important;
}

:deep(.n-form-item) {
  margin-bottom: 1.25rem !important;
}

/* Reduce height of Naive UI feedback wrapper */
:deep(.n-form-item-feedback-wrapper) {
  min-height: 12px !important;
  height: 12px !important;
}

/* Reduce margin for last form item in landlord form (terms) */
:deep(.n-form-item:has(.terms-checkbox)) {
  margin-bottom: -2rem !important;
}

:deep(.n-input) {
  font-size: 15px !important;
}

:deep(.n-radio__label) {
  font-size: 15px !important;
}

/* Compact Form Row Styles */
.compact-form-row {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
  gap: 1rem;
}

.compact-label {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-icon-inline {
  color: #6b7280;
  cursor: help;
}

/* Plan Options */
.plan-options {
  display: flex;
  gap: 0.75rem;
}

.plan-option {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.plan-option:hover {
  border-color: #198754;
  background-color: #f0fdf4;
}

.plan-option.active {
  border-color: #198754;
  background-color: #198754;
  color: white;
}

/* Compact Input */
.compact-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease;
}

.compact-input:focus {
  border-color: #198754;
  box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.1);
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  background-color: #f9fafb;
  color: #6b7280;
  cursor: help;
  flex-shrink: 0;
}

.info-icon:hover {
  border-color: #9ca3af;
  background-color: #f3f4f6;
}

.tooltip-content {
  max-width: 200px;
  font-size: 12px;
  line-height: 1.4;
}

.tooltip-content p {
  margin: 4px 0;
}

.tooltip-link {
  color: #3b82f6;
  text-decoration: underline;
}

.tooltip-link:hover {
  color: #2563eb;
}

.input-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-row-horizontal {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.input-label-inline {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  min-width: 90px;
  flex-shrink: 0;
}

.flex-input {
  flex: 1;
}

.calendly-hint {
  font-size: 11px !important;
  color: #6b7280 !important;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .register-page {
    flex-direction: column;
  }
  
  .register-left {
    display: none;
  }
  
  .register-right {
    flex: 1;
    padding: 1rem 2rem;
  }
}

.sidebar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Flash Notification Styles */
.flash-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  animation: scaleIn 0.3s ease-out;
}

.flash-content {
  background: white;
  border-radius: 16px;
  padding: 32px 40px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 520px;
  max-width: 640px;
  min-height: 140px;
}

.flash-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #f0f9ff;
  border-radius: 12px;
  flex-shrink: 0;
}

.flash-message {
  flex: 1;
}

.flash-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
  line-height: 1.3;
}

.flash-subtitle {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.4;
}

@keyframes scaleIn {
  from {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .flash-notification {
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    width: calc(100vw - 40px);
  }
  
  .flash-content {
    min-width: auto;
    padding: 28px 32px;
    min-height: 120px;
  }
  
  .flash-icon {
    width: 48px;
    height: 48px;
  }
  
  .flash-title {
    font-size: 18px;
  }
  
  .flash-subtitle {
    font-size: 14px;
  }
}
</style> 