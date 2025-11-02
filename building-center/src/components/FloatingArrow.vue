<template>
  <!-- 悬浮箭头 - 只在第一屏和最后一屏显示 -->
  <div v-if="showFloatingArrow" class="floating-arrow" @click="handleArrowClick">
    <div class="arrow-container">
      <!-- 第一屏显示向下箭头 -->
      <svg v-if="isFirstScreen" class="arrow-icon down" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 16l-6-6h12l-6 6z"/>
      </svg>
      <!-- 最后一屏显示向上箭头 -->
      <svg v-else class="arrow-icon up" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 8l6 6H6l6-6z"/>
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloatingArrow',
  data() {
    return {
      isFirstScreen: true,
      isLastScreen: false
    }
  },
  computed: {
    // 显示悬浮箭头的条件
    showFloatingArrow() {
      return this.isFirstScreen || this.isLastScreen;
    }
  },
  mounted() {
    this.initializeScrollListener();
  },
  beforeUnmount() {
    this.removeScrollListener();
  },
  methods: {
    initializeScrollListener() {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
    },
    
    removeScrollListener() {
      window.removeEventListener('scroll', this.handleScroll);
    },
    
    // 检测当前滚动位置
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 检测是否在第一屏 (距离顶部小于一个屏幕高度)
      this.isFirstScreen = scrollTop < windowHeight * 0.5;
      
      // 检测是否在最后一屏 (接近底部)
      this.isLastScreen = scrollTop + windowHeight >= documentHeight - 100;
    },

    // 处理箭头点击
    handleArrowClick() {
      if (this.isFirstScreen) {
        // 第一屏，滚动到下一个内容区域
        window.scrollTo({
          top: window.innerHeight,
          behavior: 'smooth'
        });
      } else if (this.isLastScreen) {
        // 最后一屏，回到顶部
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  }
}
</script>

<style scoped>
/* 悬浮箭头样式 - 匹配scroll-guide-button */
.floating-arrow {
  position: fixed;
  bottom: 70px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: white;
  border: 2px solid #3E4958;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(62, 73, 88, 0.2), 0 2px 6px rgba(62, 73, 88, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9998;
  transition: all 0.3s ease;
}

.floating-arrow:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(62, 73, 88, 0.25), 0 3px 8px rgba(62, 73, 88, 0.15);
  border-color: #2A3441;
}

.floating-arrow:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(62, 73, 88, 0.2);
}

.arrow-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: #3E4958;
  transition: all 0.3s ease;
}

.floating-arrow:hover .arrow-icon {
  color: #2A3441;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .floating-arrow {
    right: 20px;
    bottom: 60px;
    width: 44px;
    height: 44px;
  }
  
  .arrow-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 360px) {
  .floating-arrow {
    right: 16px;
    bottom: 50px;
    width: 40px;
    height: 40px;
  }
  
  .arrow-icon {
    width: 16px;
    height: 16px;
  }
}
</style>