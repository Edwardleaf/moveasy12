<script setup>
import { h, onMounted } from 'vue'
import { 
  NConfigProvider, 
  NMessageProvider, 
  NGlobalStyle,
  useOsTheme,
  darkTheme,
  lightTheme
} from 'naive-ui'
import { computed } from 'vue'
import placeholderColors from './assets/images/placeholders/placeholder.js'
import { initUserState } from './services/userStore'

// 初始化用户状态
onMounted(async () => {
  await initUserState()
})

// 自定义主题
const themeOverrides = {
  common: {
    primaryColor: placeholderColors.primary,
    primaryColorHover: placeholderColors.secondary,
    primaryColorPressed: '#0f5132', // Green-700
    primaryColorSuppl: placeholderColors.light,
    borderRadius: '8px',
  },
  Button: {
    textColorPrimary: '#fff',
    colorPrimary: placeholderColors.primary,
    colorHoverPrimary: placeholderColors.secondary,
    colorPressedPrimary: '#0f5132', // Green-700
    colorFocusPrimary: placeholderColors.primary,
    borderRadiusSmall: '6px',
    borderRadiusMedium: '8px',
    borderRadiusLarge: '10px',
  },
  Input: {
    borderRadius: '8px',
    boxShadowFocus: '0 0 0 2px rgba(25, 135, 84, 0.2)',
  },
  Card: {
    borderRadius: '12px',
  },
  Tabs: {
    tabBorderRadius: '8px',
  },
  Avatar: {
    borderRadius: '8px',
  },
  Checkbox: {
    borderRadius: '4px',
  },
  Radio: {
    buttonBorderRadius: '8px',
  },
  Tag: {
    borderRadius: '8px',
  },
  Dropdown: {
    optionBorderRadius: '8px',
  },
  Modal: {
    borderRadius: '12px',
  },
  Tooltip: {
    borderRadius: '8px',
  },
  Popover: {
    borderRadius: '8px',
  },
  Upload: {
    borderRadius: '8px',
  }
}
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <div class="app-container">
        <router-view />
      </div>
      <n-global-style />
    </n-message-provider>
  </n-config-provider>
</template>

<style>
/* 全局样式在global.css中 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
