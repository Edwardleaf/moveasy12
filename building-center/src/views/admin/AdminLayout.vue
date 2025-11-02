<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <header class="admin-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="admin-title">
            <TranslatedText text="Admin Dashboard" :use-static="true" />
          </h1>
        </div>
        
        <div class="header-right">
          <n-space align="center">
            <!-- 语言切换 -->
            <n-select
              v-model:value="currentLanguage"
              :options="languageOptions"
              :loading="isLoading"
              size="small"
              style="width: 120px"
              @update:value="setLanguage"
            />
            
            <!-- 用户信息 -->
            <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
              <n-button text>
                <n-space align="center">
                  <n-avatar size="small" :src="userAvatar" />
                  <span>{{ userName }}</span>
                  <n-icon><ChevronDownOutline /></n-icon>
                </n-space>
              </n-button>
            </n-dropdown>
          </n-space>
        </div>
      </div>
    </header>

    <div class="admin-body">
      <!-- 侧边栏 -->
      <aside class="admin-sidebar">
        <n-menu
          v-model:value="activeKey"
          :options="menuOptions"
          :root-indent="36"
          :indent="12"
          @update:value="handleMenuSelect"
        />
      </aside>

      <!-- 主内容区 -->
      <main class="admin-main">
        <div class="main-content">
          <n-dialog-provider>
            <router-view />
          </n-dialog-provider>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  ChevronDownOutline,
  HomeOutline,
  BusinessOutline,
  LocationOutline,
  PeopleOutline,
  LogOutOutline,
  ListOutline, // For Amenities
  TrainOutline, // For Transportation
  SettingsOutline,
  ArrowBackOutline
} from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'
import useTranslation from '@/composables/useTranslation'
import useAdmin from '@/composables/useAdmin'
import { getSupabase } from '@/services/supabaseConfig'

export default {
  name: 'AdminLayout',
  components: {
    TranslatedText,
    ChevronDownOutline
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const message = useMessage()
    const { currentLanguage, setLanguage, availableLanguages, isLoading, getStaticText } = useTranslation()
    const { currentUser, userProfile, isAdmin } = useAdmin()
    
    const activeKey = ref('')

    // 语言选项
    const languageOptions = computed(() => 
      availableLanguages.value.map(lang => ({
        label: lang.name,
        value: lang.code
      }))
    )

    // 用户信息
    const userName = computed(() => {
      if (userProfile.value?.display_name) {
        return userProfile.value.display_name
      }
      if (currentUser.value?.email) {
        return currentUser.value.email.split('@')[0]
      }
      return 'Admin'
    })

    const userAvatar = computed(() => {
      return userProfile.value?.avatar_url || 
             currentUser.value?.user_metadata?.avatar_url ||
             `https://api.dicebear.com/7.x/initials/svg?seed=${userName.value}`
    })

    // 菜单选项 - 使用computed以支持动态翻译
    const menuOptions = computed(() => [
      {
        label: getStaticText('Dashboard'),
        key: 'dashboard',
        icon: () => h(HomeOutline)
      },
      {
        label: getStaticText('Buildings'),
        key: 'buildings-list',
        icon: () => h(BusinessOutline)
      },
      {
        label: getStaticText('Areas'),
        key: 'areas-list',
        icon: () => h(LocationOutline)
      },
      {
        label: getStaticText('Users'),
        key: 'users',
        icon: () => h(PeopleOutline),
        disabled: true
      },
      {
        label: getStaticText('Amenities'),
        key: 'amenities-list',
        icon: () => h(ListOutline)
      },
      {
        label: getStaticText('Transportation'),
        key: 'transportation-list',
        icon: () => h(TrainOutline)
      }
    ])

    // 用户菜单选项 - 使用computed以支持动态翻译
    const userMenuOptions = computed(() => [
      {
        label: getStaticText('Back to site'),
        key: 'back-to-site',
        icon: () => h(ArrowBackOutline)
      },
      {
        type: 'divider'
      },
      {
        label: getStaticText('Logout'),
        key: 'logout',
        icon: () => h(LogOutOutline)
      }
    ])

    // 菜单选择处理
    // 处理菜单选择 - 使用防抖优化性能
    let menuSelectTimeout = null
    const handleMenuSelect = (key) => {
      activeKey.value = key

      // 清除之前的定时器
      if (menuSelectTimeout) {
        clearTimeout(menuSelectTimeout)
      }

      // 减少防抖时间，提高响应速度
      menuSelectTimeout = setTimeout(() => {
        const routes = {
          'dashboard': '/admin',
          'buildings-list': '/admin/buildings',
          'areas-list': '/admin/areas',
          'amenities-list': '/admin/amenities',
          'transportation-list': '/admin/transportation'
        }

        const targetRoute = routes[key]
        if (targetRoute && router.currentRoute.value.path !== targetRoute) {
          router.push(targetRoute)
        }
      }, 50) // 减少到50ms提高响应速度
    }

    // 用户菜单选择处理
    const handleUserMenuSelect = async (key) => {
      switch (key) {
        case 'back-to-site':
          router.push('/')
          break
        case 'logout':
          try {
            const supabaseClient = await getSupabase();
            const { error } = await supabaseClient.auth.signOut()
            if (error) throw error

            message.success('Logged out successfully')
            router.push('/sign-in')
          } catch (error) {
            console.error('Error logging out:', error)
            message.error('Failed to log out')
          }
          break
      }
    }

    // 根据当前路由设置活跃菜单
    const setActiveMenuFromRoute = () => {
      const path = route.path
      
      if (path === '/admin' || path === '/admin/') {
        activeKey.value = 'dashboard'
      } else if (path.startsWith('/admin/buildings')) {
        activeKey.value = 'buildings-list'
      } else if (path.startsWith('/admin/areas')) {
        activeKey.value = 'areas-list'
      } else if (path.startsWith('/admin/users')) {
        activeKey.value = 'users'
      } else if (path.startsWith('/admin/amenities')) {
        activeKey.value = 'amenities-list'
      } else if (path.startsWith('/admin/transportation')) {
        activeKey.value = 'transportation-list'
      }
    }

    onMounted(() => {
      setActiveMenuFromRoute()
    })

    return {
      activeKey,
      currentLanguage,
      languageOptions,
      userName,
      userAvatar,
      menuOptions,
      userMenuOptions,
      setLanguage,
      handleMenuSelect,
      handleUserMenuSelect,
      isLoading
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.admin-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: none;
}

.header-left {
  display: flex;
  align-items: center;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.admin-body {
  display: flex;
  flex: 1;
}

.admin-sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 1rem 0;
  overflow-y: auto;
}

.admin-main {
  flex: 1;
  overflow-y: auto;
}

.main-content {
  padding: 2rem;
  max-width: none;
}

:deep(.n-menu-item-content) {
  padding-left: 2rem !important;
}

:deep(.n-menu-item-content-header) {
  font-weight: 500;
}

:deep(.n-submenu-children .n-menu-item-content) {
  padding-left: 3rem !important;
}

:deep(.n-dropdown-menu) {
  border-radius: 8px;
}

/* 禁用状态的菜单项样式 */
:deep(.n-menu-item.n-menu-item--disabled .n-menu-item-content) {
  color: #9ca3af !important;
  cursor: not-allowed !important;
}

:deep(.n-menu-item.n-menu-item--disabled .n-menu-item-content:hover) {
  background-color: transparent !important;
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 200px;
  }
  
  .header-content {
    padding: 1rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .admin-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .admin-body {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    order: 2;
  }
  
  .admin-main {
    order: 1;
  }
}
</style>