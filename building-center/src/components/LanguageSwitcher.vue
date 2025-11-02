<template>
  <div class="language-switcher">
    <!-- 当前语言显示 -->
    <n-dropdown
      trigger="click"
      :options="languageOptions"
      @select="handleLanguageChange"
      placement="bottom-start"
    >
      <div class="language-display">
        <span class="language-icon">
          <img src="../assets/images/earth.svg" class="earth-icon" alt="Language" />
        </span>
        <span class="language-name">{{ languageDisplay }}</span>
      </div>
    </n-dropdown>
    
    <!-- 加载状态 -->
    <n-spin size="small" v-if="isLoading" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import useTranslation from '../composables/useTranslation';
import { NDropdown, NSpin } from 'naive-ui';

// 使用翻译组合API
const { 
  currentLanguage,
  availableLanguages,
  isLoading,
  setLanguage,
  loadLanguages
} = useTranslation();

// 初始化语言列表
onMounted(() => {
  loadLanguages();
});

// 语言显示标识
const languageDisplay = computed(() => {
  switch (currentLanguage.value) {
    case 'zh': return '简';
    default: return 'EN';
  }
});

// 计算语言选项 - 不禁用当前语言，让用户可以看到所有选项
const languageOptions = computed(() => {
  const options = availableLanguages.value.map(lang => ({
    label: lang.name,
    key: lang.code,
    disabled: false // 移除禁用逻辑，让用户可以看到当前选择
  }));
  console.log('🗂️ Language Options:', options);
  console.log('🗂️ Current Language:', currentLanguage.value);
  console.log('🗂️ Available Languages:', availableLanguages.value);
  return options;
});

/**
 * 处理语言切换
 * @param {string} langCode 语言代码
 */
function handleLanguageChange(langCode) {
  console.log('🌐 Language Switcher: 切换语言到', langCode);
  console.log('🌐 Language Switcher: 当前语言:', currentLanguage.value);
  setLanguage(langCode);
  console.log('🌐 Language Switcher: 切换后语言:', currentLanguage.value);
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
  position: relative;
}

.language-display {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.language-display:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.language-icon {
  margin-right: 6px;
  display: flex;
  align-items: center;
}

.earth-icon {
  width: 18px;
  height: 18px;
  opacity: 0.65;
}

.language-name {
  font-size: 14px;
  font-weight: 500;
}
</style> 