<template>
  <div v-if="visible" class="ai-tip-container">
    <!-- 气泡卡片样式，参考地图tooltip -->
    <div class="tip-bubble" @click.stop>
      <!-- 倒三角箭头 -->
      <div class="tip-arrow"></div>
      
      <!-- 卡片内容 -->
      <div class="tip-content">
        <div class="tip-icon">
          <img src="@/assets/images/robot.png" alt="AI" class="ai-avatar" />
        </div>
        
        <div class="tip-text">
          <div class="tip-title">AI Assistant</div>
          <div class="tip-subtitle">Answer questions, AI helps you recommend</div>
        </div>
        
        <button class="tip-close" @click.stop="closeTip">
          <span class="close-icon">✕</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIAssistantTip',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    autoHide: {
      type: Number,
      default: 5000 // 5秒后自动隐藏
    }
  },
  mounted() {
    if (this.visible && this.autoHide > 0) {
      setTimeout(() => {
        this.closeTip()
      }, this.autoHide)
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.autoHide > 0) {
        setTimeout(() => {
          this.closeTip()
        }, this.autoHide)
      }
    }
  },
  methods: {
    closeTip() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.ai-tip-container {
  position: absolute;
  bottom: 70px; /* AI按钮上方 */
  left: 0;
  z-index: 15000;
  animation: tipSlideUp 0.3s ease-out;
}

@keyframes tipSlideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 气泡卡片 - 参考地图tooltip样式 */
.tip-bubble {
  position: relative;
  width: 280px;
  background: #FFFFFF;
  opacity: 0.95;
  box-shadow: 8px 9px 5px rgba(0, 0, 0, 0.01), 4px 5px 4px rgba(0, 0, 0, 0.05), 2px 2px 3px rgba(0, 0, 0, 0.09), 0px 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 倒三角箭头 - 指向AI按钮 */
.tip-arrow {
  position: absolute;
  bottom: -8px;
  left: 30px; /* 箭头指向AI助手按钮位置 */
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #FFFFFF;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
}

.tip-content {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tip-icon {
  flex-shrink: 0;
}

.ai-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: contain;
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.tip-subtitle {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.tip-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tip-close:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.close-icon {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-tip-container {
    bottom: 60px;
    left: 0;
  }
  
  .tip-bubble {
    width: 260px;
    margin: 0 10px;
  }
  
  .tip-arrow {
    left: 25px; /* 移动端调整箭头位置 */
  }
  
  .tip-content {
    padding: 14px;
    gap: 10px;
  }
  
  .ai-avatar {
    width: 28px;
    height: 28px;
  }
  
  .tip-title {
    font-size: 15px;
  }
  
  .tip-subtitle {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .ai-tip-container {
    bottom: 55px;
  }
  
  .tip-bubble {
    width: 240px;
  }
  
  .tip-arrow {
    left: 20px; /* 小屏幕进一步调整箭头位置 */
  }
  
  .tip-content {
    padding: 12px;
    gap: 8px;
  }
  
  .ai-avatar {
    width: 24px;
    height: 24px;
  }
  
  .tip-title {
    font-size: 14px;
  }
  
  .tip-subtitle {
    font-size: 12px;
  }
  
  .tip-close {
    width: 20px;
    height: 20px;
  }
  
  .close-icon {
    font-size: 10px;
  }
}

/* 高度小的设备 */
@media (max-height: 600px) {
  .ai-tip-container {
    bottom: 50px;
  }
  
  .tip-bubble {
    width: 220px;
  }
  
  .tip-content {
    padding: 10px;
  }
  
  .tip-title {
    font-size: 13px;
    margin-bottom: 2px;
  }
  
  .tip-subtitle {
    font-size: 11px;
  }
}
</style>