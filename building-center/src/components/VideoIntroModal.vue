<template>
  <div v-if="visible" class="video-modal-overlay" @click="handleOverlayClick">
    <div class="video-modal-container" @click.stop>
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeModal">
        <span class="close-icon">✕</span>
      </button>
      
      <!-- 视频内容 -->
      <div class="video-content">
        <iframe
          :src="videoUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          class="video-iframe"
        ></iframe>
      </div>
      
      <!-- 标题和描述 -->
      <div class="modal-info">
        <h3 class="modal-title">AI Assistant Demo</h3>
        <p class="modal-description">
          Discover how our AI assistant can help you find the perfect apartment
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VideoIntroModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    autoClose: {
      type: Number,
      default: 0 // 0 means no auto close, otherwise close after X milliseconds
    }
  },
  data() {
    return {
      // 使用一个高质量的抽象科技视频，无品牌内容
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=1&showinfo=0&rel=0&modestbranding=1'
    }
  },
  mounted() {
    if (this.visible && this.autoClose > 0) {
      setTimeout(() => {
        this.closeModal()
      }, this.autoClose)
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.autoClose > 0) {
        setTimeout(() => {
          this.closeModal()
        }, this.autoClose)
      }
      
      // 控制页面滚动
      if (newVal) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    
    handleOverlayClick() {
      this.closeModal()
    }
  },
  
  beforeUnmount() {
    // 恢复页面滚动
    document.body.style.overflow = 'auto'
  }
}
</script>

<style scoped>
.video-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.video-modal-container {
  position: relative;
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.close-icon {
  font-size: 18px;
  font-weight: bold;
}

.video-content {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  background: #000;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.modal-info {
  padding: 24px;
  text-align: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.modal-description {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-modal-container {
    width: 95vw;
    margin: 0 10px;
  }
  
  .modal-info {
    padding: 20px;
  }
  
  .modal-title {
    font-size: 20px;
  }
  
  .modal-description {
    font-size: 14px;
  }
  
  .close-btn {
    width: 36px;
    height: 36px;
    top: 12px;
    right: 12px;
  }
  
  .close-icon {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .video-modal-container {
    width: 98vw;
    border-radius: 12px;
  }
  
  .modal-info {
    padding: 16px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .modal-description {
    font-size: 13px;
  }
}

@media (max-height: 600px) {
  .video-modal-container {
    max-height: 95vh;
  }
  
  .modal-info {
    padding: 16px;
  }
  
  .modal-title {
    font-size: 18px;
    margin-bottom: 8px;
  }
  
  .modal-description {
    font-size: 14px;
  }
}
</style>