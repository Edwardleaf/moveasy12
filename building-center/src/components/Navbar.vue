<template>
  <n-layout-header class="navbar-container">
    <div class="navbar-content">
      <div class="logo-container">
        <img src="../assets/images/sh_logo.png" alt="Moveasy Logo" class="logo-image" />
      </div>
      
      <div class="right-section">
        <div class="menu-desktop">
          <n-menu 
            mode="horizontal" 
            :options="menuOptions" 
            :value="activeKey"
            @update:value="handleMenuSelect" 
          />
        </div>
        
        <div class="actions-container">
          <language-switcher />
        
          <n-tooltip v-if="!isMobile" trigger="hover" placement="bottom">
            <template #trigger>
              <n-button type="primary" class="list-place-btn disabled" disabled>
                <translated-text text="List A Place" :use-static="true" />
              </n-button>
            </template>
            <div class="list-place-tooltip">
              <div class="tooltip-title">
                <translated-text text="Coming Soon" :use-static="true" />
              </div>
              <div class="tooltip-message">
                <translated-text text="Landlord registration is temporarily unavailable while we enhance our verification process." :use-static="true" />
              </div>
            </div>
          </n-tooltip>

          <!-- 未登录时显示登录按钮 -->
          <n-button v-if="!userState.isAuthenticated && !isMobile" quaternary class="login-btn" @click="goToLogin">
            <translated-text text="Sign In" :use-static="true" />
          </n-button>

          <!-- 已登录时显示账号下拉菜单 -->
          <n-dropdown 
            v-if="userState.isAuthenticated && !isMobile" 
            trigger="hover" 
            :options="accountOptions" 
            @select="handleAccountAction"
            placement="bottom-end"
            class="account-dropdown"
          >
            <n-button quaternary circle class="account-btn">
              <template #icon>
                <n-icon size="20">
                  <img src="../assets/images/account.svg" alt="Account" class="account-icon" />
                </n-icon>
              </template>
            </n-button>
          </n-dropdown>

          <n-button v-if="isMobile" quaternary circle class="mobile-menu-btn" @click="showMobileMenu = true">
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
                  <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12h18"></path>
                    <path d="M3 6h18"></path>
                    <path d="M3 18h18"></path>
                  </g>
                </svg>
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>
    
    <n-drawer v-model:show="showMobileMenu" :width="280" placement="right">
      <n-drawer-content>
        <template #header>
          <translated-text text="Menu" :use-static="true" />
        </template>
        <n-menu
          :options="menuOptions"
          :value="activeKey"
          @update:value="handleMenuSelect"
        />
        <div class="mobile-actions">
          <language-switcher />

          <!-- Mobile Account Actions for authenticated users -->
          <div v-if="userState.isAuthenticated" class="mobile-account-section">
            <!-- Admin Dashboard Button for mobile -->
            <n-button v-if="isAdmin" block class="dashboard-btn" @click="goToDashboard">
              <translated-text text="Dashboard" :use-static="true" />
            </n-button>
            <n-button block class="profile-btn" @click="handleProfileClick">
              <translated-text text="Profile" :use-static="true" />
            </n-button>
            <n-button block class="logout-btn" @click="handleLogout">
              <translated-text text="Logout" :use-static="true" />
            </n-button>
          </div>

          <!-- Mobile Login Button for unauthenticated users -->
          <n-button v-if="!userState.isAuthenticated" block class="login-btn" @click="goToLogin">
            <translated-text text="Sign In" :use-static="true" />
          </n-button>

          <n-button type="primary" block class="list-place-btn disabled" disabled @click="showListPlaceMessage">
            <translated-text text="List A Place" :use-static="true" />
          </n-button>
        </div>
      </n-drawer-content>
    </n-drawer>
  </n-layout-header>
</template>

<script setup>
import { ref, h, computed, onMounted, watch } from 'vue';
import { NIcon } from 'naive-ui';
import { useRouter, useRoute } from 'vue-router';
import { useWindowSize } from '../composables/useWindowSize';
import LanguageSwitcher from './LanguageSwitcher.vue';
import TranslatedText from './TranslatedText.vue';
import userState, { initUserState } from '../services/supabaseUserStore';
import { signOut } from '../services/supabaseAuthService';
import useAdmin from '../composables/useAdmin';

// 路由管理
const router = useRouter();
const route = useRoute();

// 窗口大小管理
const { width } = useWindowSize();
const showMobileMenu = ref(false);

// Admin权限管理
const { getCurrentUser, isAdmin } = useAdmin();

// 计算是否为移动设备
const isMobile = computed(() => {
  return width.value < 768;
});

// 计算当前活跃的菜单项
const activeKey = computed(() => {
  const currentPath = route.path;
  
  // 根据路径匹配对应的菜单键
  if (currentPath === '/' || currentPath === '/home') {
    return 'home';
  } else if (currentPath.startsWith('/browse')) {
    return 'browse';
  } else if (currentPath.startsWith('/about')) {
    return 'about';
  } else if (currentPath.startsWith('/whatsapp')) {
    return 'whatsapp';
  }
  
  // 默认返回null，表示没有活跃项
  return null;
});

// 账户下拉菜单选项
const accountOptions = computed(() => {
  const options = [];

  // 如果是admin用户，显示Dashboard选项
  if (isAdmin.value) {
    options.push({
      label: () => h(TranslatedText, { text: 'Dashboard', 'use-static': true }),
      key: 'dashboard'
    });
  }

  options.push(
    {
      label: () => h(TranslatedText, { text: 'Profile', 'use-static': true }),
      key: 'profile',
      disabled: true
    },
    {
      label: () => h(TranslatedText, { text: 'Logout', 'use-static': true }),
      key: 'logout'
    }
  );

  return options;
});

// 处理账户下拉菜单操作
const handleAccountAction = (key) => {
  if (key === 'logout') {
    handleLogout();
  } else if (key === 'dashboard') {
    router.push('/admin');
  } else if (key === 'debug') {
    console.log('=== 当前用户信息 ===');
    console.log('用户状态:', userState);
    console.log('是否认证:', userState.isAuthenticated);
    console.log('用户数据:', userState.user);
    console.log('用户Role:', userState.user?.user_metadata?.userType);
    console.log('显示名称:', userState.user?.user_metadata?.display_name);
    console.log('邮箱:', userState.user?.email);
    console.log('Admin权限:', isAdmin.value);
    console.log('==================');
  }
};

// 处理用户档案点击（移动端）
const handleProfileClick = () => {
  // 预留功能 - 待开发
  console.log('Profile feature - to be developed');
};

// 处理退出登录
const handleLogout = async () => {
  try {
    await signOut();
    // 退出后跳转到登录页面
    router.push('/sign-in');
  } catch (error) {
    console.error('退出登录失败:', error);
  }
};

// 跳转到登录页面
const goToLogin = () => {
  router.push('/sign-in');
};

// 跳转到Dashboard
const goToDashboard = () => {
  showMobileMenu.value = false;
  router.push('/admin');
};

// 显示List Place暂不可用消息
const showListPlaceMessage = () => {
  console.log('List A Place feature is temporarily unavailable');
  // 可以在这里添加消息提示
};

// 处理菜单选择
const handleMenuSelect = (key) => {
  // 关闭移动端菜单
  showMobileMenu.value = false;
  
  if (key === 'home') {
    router.push('/').then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  } else if (key === 'browse') {
    // 如果用户未登录，重定向到登录页面
    if (!userState.isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    // 如果已登录，跳转到browse页面
    router.push('/browse');
  } else if (key === 'about') {
    // About页面路由（如果存在）
    console.log('About page - to be implemented');
  } else if (key === 'whatsapp') {
    // WhatsApp功能（如果存在）
    console.log('WhatsApp feature - to be implemented');
  }
  // 其他菜单项的处理可以在这里添加
};

// 菜单项配置
const menuOptions = computed(() => [
  {
    label: () => h(TranslatedText, { text: 'HOME', 'use-static': true }),
    key: 'home',
  },
  {
    label: () => h(TranslatedText, { text: 'ABOUT US', 'use-static': true }),
    key: 'about',
  },
  {
    label: () => h(TranslatedText, { text: 'Browse', 'use-static': true }),
    key: 'browse',
  },
  {
    label: () => h(TranslatedText, { text: 'Whats App', 'use-static': true }),
    key: 'whatsapp',
  }
]);

// 初始化用户状态
onMounted(async () => {
  await initUserState();
  // 初始化admin权限检查
  await getCurrentUser();
});
</script>

<style scoped>
/* 导入 Inter 字体 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.navbar-container {
  background-color: #ffffff;
  color: #198754; /* Green-500 for text */
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #d1e7dd;
  font-family: 'Inter', sans-serif;
  position: sticky;
  top: 0;
  z-index: 99999; /* 大幅提高z-index确保始终在最上层 */
  width: 100%;
  backdrop-filter: blur(10px); /* 添加模糊背景效果 */
}

.navbar-content {
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  height: 4rem;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 35px;
  width: auto;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.menu-desktop {
  display: flex;
  justify-content: center;
}

/* 覆盖naive-ui菜单项样式 */
:deep(.n-menu-item-content-wrapper) {
  color: #198754 !important; /* Green-500 */
  font-weight: 700 !important;
  font-family: 'Inter', sans-serif !important;
  text-transform: uppercase;
  transition: all 0.3s ease;
  position: relative;
}

:deep(.n-menu-item:hover .n-menu-item-content-wrapper) {
  color: #146c43 !important; /* Green-600 */
  transform: translateY(-1px);
}

/* 选中状态样式 */
:deep(.n-menu-item-content--selected) {
  color: #0f5132 !important; /* Green-700 */
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.1) 0%, rgba(15, 81, 50, 0.05) 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(25, 135, 84, 0.15);
  transform: translateY(-1px);
}

/* 为选中项添加底部边框指示器 - 仅桌面端 */
.menu-desktop :deep(.n-menu-item-content--selected::after) {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3px;
  background: linear-gradient(90deg, #198754, #0f5132);
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(25, 135, 84, 0.3);
}

/* 选中项hover效果 */
:deep(.n-menu-item:hover .n-menu-item-content--selected) {
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.15) 0%, rgba(15, 81, 50, 0.08) 100%);
  box-shadow: 0 4px 12px rgba(25, 135, 84, 0.2);
}

/* 菜单项基础样式 */
:deep(.n-menu-item) {
  border-radius: 8px;
  margin: 0 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 菜单项内容包装器增强 */
:deep(.n-menu-item .n-menu-item-content) {
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 活跃指示器动画 - 仅桌面端 */
.menu-desktop :deep(.n-menu-item-content--selected::after) {
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  0% {
    width: 0%;
    opacity: 0;
  }
  100% {
    width: 60%;
    opacity: 1;
  }
}

.actions-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.list-place-btn {
  background-color: #198754 !important; /* Green-500 as primary color */
  color: white !important;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}

.list-place-btn:hover {
  background-color: #146c43 !important; /* Green-600 as hover */
}

.mobile-menu-btn {
  color: #198754; /* Green-500 */
}

.account-btn {
  color: #198754;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-btn:hover {
  background-color: rgba(25, 135, 84, 0.1);
}

.account-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.account-dropdown {
  z-index: 10000;
}

.login-btn {
  color: #198754;
  font-weight: 600;
  padding: 0 16px;
}

.dashboard-btn {
  background-color: #198754 !important;
  color: white !important;
  font-weight: 600;
  margin-bottom: 8px;
}

.dashboard-btn:hover {
  background-color: #146c43 !important;
}

.login-btn:hover {
  background-color: rgba(25, 135, 84, 0.1);
}

.mobile-actions {
  margin-top: 24px;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-account-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.profile-btn {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
}

.logout-btn:hover {
  background-color: #c82333;
}

@media (max-width: 768px) {
  .menu-desktop {
    display: none;
  }
  
  .logo-image {
    height: 36px;
  }
  
  /* 移动端菜单项样式 */
  :deep(.n-drawer .n-menu-item-content--selected) {
    background: linear-gradient(135deg, rgba(25, 135, 84, 0.12) 0%, rgba(15, 81, 50, 0.06) 100%);
    border-radius: 8px;
    margin: 4px 0;
    border-left: 4px solid #198754;
    padding: 12px 16px;
  }
  
  /* 移动端菜单项增强悬停效果 */
  :deep(.n-drawer .n-menu-item:hover .n-menu-item-content--selected) {
    background: linear-gradient(135deg, rgba(25, 135, 84, 0.18) 0%, rgba(15, 81, 50, 0.08) 100%);
    border-left: 5px solid #0f5132;
  }
}

/* List Place Button Disabled Styles */
.list-place-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.list-place-btn.disabled:hover {
  background-color: #6c757d !important;
  border-color: #6c757d !important;
}

/* Tooltip Styles */
.list-place-tooltip {
  max-width: 280px;
  padding: 12px;
}

.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  color: #ffc107;
  margin-bottom: 6px;
}

.tooltip-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}
</style> 