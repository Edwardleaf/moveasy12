<template>
  <div v-if="showDebugger" class="translation-debugger">
    <div class="debug-header">
      <h4>🔤 翻译调试器</h4>
      <button @click="toggleDebugger" class="close-btn">×</button>
    </div>
    <div class="debug-content">
      <div class="language-info">
        <strong>当前语言:</strong> {{ currentLanguage }}
        <button @click="switchLanguage" class="switch-btn">
          切换到 {{ currentLanguage === 'en' ? '中文' : 'English' }}
        </button>
      </div>
      <div class="translation-stats">
        <div class="stat-item">
          <span class="stat-label">静态翻译:</span>
          <span class="stat-value static">{{ stats.static }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">缓存翻译:</span>
          <span class="stat-value cached">{{ stats.cached }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">API翻译:</span>
          <span class="stat-value api">{{ stats.api }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">失败:</span>
          <span class="stat-value failed">{{ stats.failed }}</span>
        </div>
      </div>
      <div class="force-api-controls">
        <label>
          <input type="checkbox" v-model="forceAPIModeEnabled" @change="toggleForceAPIMode">
          强制API翻译模式
        </label>
        <button @click="clearCache" class="clear-btn">清除缓存</button>
      </div>
    </div>
  </div>
  <div v-else class="debug-toggle" @click="toggleDebugger">
    🔤
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import useTranslation from '@/composables/useTranslation';

export default {
  name: 'TranslationDebugger',
  setup() {
    const { currentLanguage, setLanguage } = useTranslation();
    const showDebugger = ref(false);
    const forceAPIModeEnabled = ref(false);
    
    const stats = reactive({
      static: 0,
      cached: 0,
      api: 0,
      failed: 0
    });

    // 监听控制台日志来统计翻译类型
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;

    const interceptConsole = () => {
      console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('🔤')) {
          if (message.includes('静态翻译:')) {
            stats.static++;
          } else if (message.includes('缓存翻译:')) {
            stats.cached++;
          } else if (message.includes('API翻译成功:')) {
            stats.api++;
          }
        }
        originalConsoleLog.apply(console, args);
      };

      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('🔤') && (message.includes('API翻译失败') || message.includes('API不可用'))) {
          stats.failed++;
        }
        originalConsoleWarn.apply(console, args);
      };
    };

    const restoreConsole = () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
    };

    const toggleDebugger = () => {
      showDebugger.value = !showDebugger.value;
    };

    const switchLanguage = () => {
      const newLang = currentLanguage.value === 'en' ? 'zh' : 'en';
      setLanguage(newLang);
      // 重置统计
      Object.keys(stats).forEach(key => stats[key] = 0);
    };

    const toggleForceAPIMode = () => {
      // 这里可以添加全局强制API模式的逻辑
      console.log(`🔧 强制API翻译模式: ${forceAPIModeEnabled.value ? '开启' : '关闭'}`);
    };

    const clearCache = () => {
      // 触发缓存清除
      localStorage.removeItem('preferredLanguage');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('translation_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ 手动清除翻译缓存');
      // 重置统计
      Object.keys(stats).forEach(key => stats[key] = 0);
    };

    onMounted(() => {
      interceptConsole();
    });

    onUnmounted(() => {
      restoreConsole();
    });

    return {
      showDebugger,
      currentLanguage,
      forceAPIModeEnabled,
      stats,
      toggleDebugger,
      switchLanguage,
      toggleForceAPIMode,
      clearCache
    };
  }
};
</script>

<style scoped>
.translation-debugger {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  background: white;
  border: 2px solid #198754;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  font-size: 12px;
}

.debug-header {
  background: #198754;
  color: white;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-header h4 {
  margin: 0;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.debug-content {
  padding: 12px;
}

.language-info {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-btn {
  background: #198754;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.translation-stats {
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.stat-label {
  font-weight: 500;
}

.stat-value {
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.stat-value.static {
  background: #d1e7dd;
  color: #0f5132;
}

.stat-value.cached {
  background: #fff3cd;
  color: #664d03;
}

.stat-value.api {
  background: #cff4fc;
  color: #055160;
}

.stat-value.failed {
  background: #f8d7da;
  color: #721c24;
}

.force-api-controls {
  border-top: 1px solid #dee2e6;
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.force-api-controls label {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.debug-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: #198754;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10000;
}

.debug-toggle:hover {
  background: #146c43;
}
</style>