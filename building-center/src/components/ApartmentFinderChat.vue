<template>
  <teleport to="body">
    <div class="ai-chat-overlay-teleport" @click.self="$emit('close')">
      <div class="ai-chat-container" @click.stop @wheel.stop>
    <!-- 聊天窗口 -->
    <div class="chat-window">
      <!-- 标题栏 -->
      <div class="chat-header">
        <div class="chat-title">
          <img src="@/assets/images/robot.png" alt="AI助手" class="chat-icon" />
          <span class="title-text">AI Assistant</span>
        </div>
        <n-button @click="$emit('close')" tertiary class="close-btn">
          Skip for now
        </n-button>
      </div>

      <!-- 消息区域 -->
      <n-scrollbar class="chat-messages" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.type]"
        >
          <div class="message-bubble">
            <div v-if="message.type === 'bot'" class="bot-avatar">
              <img src="@/assets/images/robot.png" alt="AI助手" class="bot-avatar-img" />
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.text }}</div>
              
              <!-- 选项按钮组 -->
              <div v-if="message.options" class="message-options">
                <div v-if="message.multiple" class="multiple-choice-container">
                  <n-checkbox-group v-model:value="currentMultipleSelection" class="checkbox-group">
                    <n-checkbox 
                      v-for="option in message.options" 
                      :key="option.value"
                      :value="option.value"
                      :label="option.label"
                      class="checkbox-item"
                    />
                  </n-checkbox-group>
                  <n-button 
                    @click="submitMultipleChoice" 
                    :disabled="currentMultipleSelection.length === 0"
                    type="primary"
                    class="submit-multiple-btn"
                  >
                    Confirm Selection
                  </n-button>
                </div>
                <div v-else class="single-choice-container">
                  <n-button
                    v-for="option in message.options"
                    :key="option.value"
                    @click="selectOption(option)"
                    class="option-btn"
                    secondary
                    block
                  >
                    {{ option.label }}
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载动画 -->
        <div v-if="isTyping" class="message bot">
          <div class="message-bubble">
            <div class="bot-avatar">
              <img src="@/assets/images/robot.png" alt="AI助手" class="bot-avatar-img" />
            </div>
            <div class="typing-indicator">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      </n-scrollbar>

      <!-- 推荐结果面板 -->
      <div v-if="recommendations.length > 0" class="recommendations-panel" @wheel.stop>
        <div class="recommendations-header">
          <span class="recommendations-title">🎯 Recommendations</span>
        </div>
        <div class="recommendations-list">
          <div 
            v-for="rec in recommendations" 
            :key="rec.id"
            class="community-bubble-card"
          >
            <!-- 社区名称头部 -->
            <div class="community-header">
              <span class="community-name">{{ rec.name }}</span>
              <span class="community-score">{{ rec.score }}</span>
            </div>
            
            <!-- 图片容器 -->
            <div class="image-container">
              <img :src="rec.image || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'" 
                   :alt="rec.name" 
                   class="area-image">
            </div>
            
            <!-- 描述容器 -->
            <div class="desc-container">
              <div class="desc-pill">
                <span>{{ rec.description }}</span>
              </div>
            </div>
            
            <!-- 详细信息 -->
            <div class="info-pills">
              <div class="info-pill budget">💰 {{ rec.budget }}</div>
              <div class="info-pill commute">🚊 {{ rec.commute }}</div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="card-actions">
              <n-button @click="viewOnMap(rec)" type="primary" size="small" class="view-map-btn">
                View on Map
              </n-button>
            </div>
          </div>
        </div>
        <div class="recommendations-actions">
          <n-button @click="getMoreRecommendations" secondary class="more-btn">
            More Recommendations
          </n-button>
          <n-button @click="restartChat" secondary class="restart-btn">
            Start Over
          </n-button>
        </div>
      </div>

    </div>
  </div>
</div>
  </teleport>
</template>

<script>
import { NScrollbar } from 'naive-ui'

export default {
  name: 'ApartmentFinderChat',
  components: {
    NScrollbar
  },
  emits: ['close', 'recommendations', 'view-on-map'],
  
  mounted() {
    // 添加更强力的滚轮事件阻止
    this.$nextTick(() => {
      const chatContainer = this.$el;
      if (chatContainer) {
        const preventMapZoom = (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        };
        
        // 添加原生事件监听器
        chatContainer.addEventListener('wheel', preventMapZoom, { 
          passive: false, 
          capture: true 
        });
        chatContainer.addEventListener('DOMMouseScroll', preventMapZoom, { 
          passive: false, 
          capture: true 
        });
        
        // 保存引用以便清理
        this._preventMapZoom = preventMapZoom;
        this._chatContainer = chatContainer;
      }
    });
  },
  
  beforeUnmount() {
    // 清理事件监听器
    if (this._chatContainer && this._preventMapZoom) {
      this._chatContainer.removeEventListener('wheel', this._preventMapZoom, { capture: true });
      this._chatContainer.removeEventListener('DOMMouseScroll', this._preventMapZoom, { capture: true });
    }
  },
  
  data() {
    return {
      messages: [],
      currentQuestion: 0,
      isTyping: false,
      answers: {},
      currentMultipleSelection: [],
      recommendations: [],
      
      // 占位符问题配置
      questions: [
        {
          id: 'budget',
          type: 'single_choice',
          text: 'PLACEHOLDER_H?',
          options: [
            { value: 'low', label: 'PLACEHOLDER_I' },
            { value: 'mid', label: 'PLACEHOLDER_J' },
            { value: 'high', label: 'PLACEHOLDER_K' },
            { value: 'premium', label: 'PLACEHOLDER_L' }
          ]
        },
        {
          id: 'commute',
          type: 'single_choice',
          text: 'PLACEHOLDER_M?',
          options: [
            { value: 'downtown', label: 'PLACEHOLDER_N' },
            { value: 'midtown', label: 'PLACEHOLDER_O' },
            { value: 'brooklyn', label: 'PLACEHOLDER_P' },
            { value: 'queens', label: 'PLACEHOLDER_Q' },
            { value: 'remote', label: 'PLACEHOLDER_R' }
          ]
        },
        {
          id: 'lifestyle',
          type: 'multiple_choice',
          text: 'PLACEHOLDER_S?',
          multiple: true,
          options: [
            { value: 'quiet', label: 'PLACEHOLDER_T' },
            { value: 'nightlife', label: 'PLACEHOLDER_U' },
            { value: 'transit', label: 'PLACEHOLDER_V' },
            { value: 'shopping', label: 'PLACEHOLDER_W' },
            { value: 'parks', label: 'PLACEHOLDER_X' },
            { value: 'family', label: 'PLACEHOLDER_Y' }
          ]
        }
      ]
    }
  },

  mounted() {
    this.startChat();
  },

  methods: {
    startChat() {
      this.addBotMessage('PLACEHOLDER_Z');
      setTimeout(() => {
        this.askNextQuestion();
      }, 1000);
    },

    addBotMessage(text, options = null) {
      const message = {
        id: Date.now() + Math.random(),
        type: 'bot',
        text: text,
        options: options,
        multiple: options && this.questions[this.currentQuestion]?.type === 'multiple_choice'
      };
      this.messages.push(message);
      this.scrollToBottom();
    },

    addUserMessage(text) {
      const message = {
        id: Date.now() + Math.random(),
        type: 'user',
        text: text
      };
      this.messages.push(message);
      this.scrollToBottom();
    },

    askNextQuestion() {
      if (this.currentQuestion < this.questions.length) {
        const question = this.questions[this.currentQuestion];
        this.addBotMessage(question.text, question.options);
      } else {
        this.generateRecommendations();
      }
    },

    selectOption(option) {
      const question = this.questions[this.currentQuestion];
      this.answers[question.id] = option.value;
      this.addUserMessage(option.label);
      
      this.currentQuestion++;
      setTimeout(() => {
        this.askNextQuestion();
      }, 800);
    },

    updateMultipleSelection() {
      // 多选逻辑处理
    },

    submitMultipleChoice() {
      const question = this.questions[this.currentQuestion];
      this.answers[question.id] = [...this.currentMultipleSelection];
      
      const selectedLabels = question.options
        .filter(opt => this.currentMultipleSelection.includes(opt.value))
        .map(opt => opt.label)
        .join(', ');
      
      this.addUserMessage(selectedLabels);
      this.currentMultipleSelection = [];
      this.currentQuestion++;
      
      setTimeout(() => {
        this.askNextQuestion();
      }, 800);
    },

    generateRecommendations() {
      this.isTyping = true;
      this.scrollToBottom(); // 显示打字动画时滚动
      
      setTimeout(() => {
        this.isTyping = false;
        this.addBotMessage('PLACEHOLDER_AA');
        
        // 生成占位符推荐结果
        this.recommendations = [
          {
            id: 1,
            name: 'PLACEHOLDER_BB',
            score: 92,
            budget: 'PLACEHOLDER_CC',
            commute: 'PLACEHOLDER_DD',
            description: 'PLACEHOLDER_EE',
            image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
          },
          {
            id: 2,
            name: 'PLACEHOLDER_FF',
            score: 87,
            budget: 'PLACEHOLDER_GG',
            commute: 'PLACEHOLDER_HH',
            description: 'PLACEHOLDER_II',
            image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
          },
          {
            id: 3,
            name: 'PLACEHOLDER_JJ',
            score: 83,
            budget: 'PLACEHOLDER_KK',
            commute: 'PLACEHOLDER_LL',
            description: 'PLACEHOLDER_MM',
            image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
          }
        ];
        
        this.$emit('recommendations', this.recommendations);
        
        // 推荐结果显示后滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }, 2000);
    },

    viewOnMap(recommendation) {
      this.$emit('view-on-map', recommendation);
      this.$emit('close');
    },

    getMoreRecommendations() {
      // 获取更多推荐
      this.addBotMessage('PLACEHOLDER_NN');
    },

    restartChat() {
      this.messages = [];
      this.currentQuestion = 0;
      this.answers = {};
      this.recommendations = [];
      this.startChat();
    },

    skipQuestions() {
      this.$emit('close');
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const scrollbar = this.$refs.messagesContainer;
        if (scrollbar && scrollbar.scrollTo) {
          // Naive UI NScrollbar API
          scrollbar.scrollTo({ top: 999999, behavior: 'smooth' });
        } else if (scrollbar && scrollbar.$el) {
          // 备选方案：直接操作DOM
          const container = scrollbar.$el.querySelector('.n-scrollbar-container');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      });
    }
  }
}
</script>

<style scoped>
.ai-chat-overlay-teleport {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000; /* 更高的z-index确保在地图之上 */
  
  /* 完全隔离滚轮事件 */
  touch-action: none;
  overscroll-behavior: none;
}

.ai-chat-container {
  position: relative;
  width: 85vw;  /* 使用视口宽度百分比 */
  height: 80vh; /* 使用视口高度百分比 */
  max-width: 520px;  /* 中等屏幕最大宽度 */
  max-height: 760px; /* 中等屏幕最大高度 */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  /* 强制隔离滚轮事件 */
  touch-action: pan-y;
  overscroll-behavior: contain;
  isolation: isolate;
}

.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #198754 0%, #20c997 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.chat-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.title-text {
  font-weight: 600;
  font-size: 16px;
}

.close-btn {
  margin-left: 12px;
  font-size: 15px;
  color: white;
  border: 1px solid white;
  box-shadow: 0 0 10px 0 rgba(2, 116, 73, 0.5);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.message {
  margin-bottom: 16px;
}

.message-bubble {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.bot-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bot-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.message.user {
  display: flex;
  justify-content: flex-end;
}

.message.user .message-bubble {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-content {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 14px 18px;
  border-radius: 20px;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.message.user .message-content {
  background: linear-gradient(135deg, #198754 0%, #20c997 100%);
  color: white;
  box-shadow: 
    0 4px 15px rgba(25, 135, 84, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.message-text {
  line-height: 1.4;
}

.message-options {
  margin-top: 12px;
}

.single-choice-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-btn {
  margin-bottom: 8px;
}

.multiple-choice-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  margin-bottom: 8px;
}

.submit-multiple-btn {
  align-self: center;
  margin-top: 12px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: #6c757d;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.recommendations-panel {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(222, 226, 230, 0.3);
  /* 移除独立滚动，让它与父容器一起滚动 */
}

.recommendations-header {
  padding: 16px;
  border-bottom: 1px solid #f1f3f4;
}

.recommendations-title {
  font-weight: 600;
  color: #333;
}

.recommendations-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 社区气泡卡片 - 参考地图tooltip样式 */
.community-bubble-card {
  position: relative;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  background: #FFFFFF;
  opacity: 0.95;
  box-shadow: 8px 9px 5px rgba(0, 0, 0, 0.01), 4px 5px 4px rgba(0, 0, 0, 0.05), 2px 2px 3px rgba(0, 0, 0, 0.09), 0px 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s ease;
}

.community-bubble-card:hover {
  transform: translateY(-2px);
  box-shadow: 8px 12px 8px rgba(0, 0, 0, 0.02), 4px 8px 6px rgba(0, 0, 0, 0.08), 2px 4px 4px rgba(0, 0, 0, 0.12), 0px 2px 3px rgba(0, 0, 0, 0.15);
}

/* 社区名称头部 */
.community-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 8px 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.community-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.community-score {
  font-size: 14px;
  font-weight: 600;
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

/* 图片容器 */
.image-container {
  width: 100%;
  height: 140px; /* 从120px增加到140px */
  overflow: hidden;
  background: #f0f0f0;
}

.area-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.community-bubble-card:hover .area-image {
  transform: scale(1.05);
}

/* 描述容器 */
.desc-container {
  padding: 8px 12px;
}

.desc-pill {
  background: rgba(108, 117, 125, 0.1);
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 12px;
  color: #666;
  text-align: center;
  line-height: 1.3;
}

/* 详细信息区域 */
.info-pills {
  padding: 8px 12px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.info-pill {
  background: rgba(13, 110, 253, 0.1);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  color: #0d6efd;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.info-pill.budget {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.info-pill.commute {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

/* 操作按钮 */
.card-actions {
  padding: 8px 12px 12px 12px;
  display: flex;
  justify-content: center;
}

.view-map-btn {
  width: 100%;
  border-radius: 8px;
}

.recommendations-actions {
  padding: 16px;
  display: flex;
  gap: 12px;
  justify-content: center;
  border-top: 1px solid #f1f3f4;
}

.more-btn, .restart-btn {
  margin: 0 6px;
}

/* chat-footer 和 skip-btn 样式已移除，因为底部按钮已删除 */

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-chat-container {
    width: 95vw;
    height: 85vh; /* 确保留出一些空间 */
    max-width: 480px; /* 移动端最大宽度 */
    max-height: 85vh;
  }
  
  .checkbox-group {
    gap: 6px;
  }
  
  .chat-header {
    padding: 16px;
  }
  
  .chat-messages {
    padding: 16px;
  }
  
  .message-bubble {
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .ai-chat-container {
    width: 98vw;  /* 小屏幕占用更多宽度 */
    height: 90vh; /* 小屏幕占用更多高度 */
    max-width: none; /* 小屏幕不限制最大宽度 */
    max-height: 90vh;
    border-radius: 16px;
  }
  
  .chat-header {
    padding: 14px;
  }
  
  .title-text {
    font-size: 14px;
  }
  
  .chat-messages {
    padding: 14px;
  }
  
  .message-content {
    padding: 12px 16px;
  }
  
  .option-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  /* 移除推荐面板的高度限制 */
}

@media (min-width: 769px) {
  .ai-chat-container {
    width: 70vw;   /* 桌面端使用视口宽度的70% */
    height: 75vh;  /* 桌面端使用视口高度的75% */
    max-width: 600px;  /* 桌面端最大宽度 */
    max-height: 800px; /* 桌面端最大高度 */
  }
}

/* 大屏幕进一步优化 */
@media (min-width: 1200px) {
  .ai-chat-container {
    width: 60vw;   /* 大屏幕使用视口宽度的60% */
    height: 70vh;  /* 大屏幕使用视口高度的70% */
    max-width: 750px;  /* 大屏幕最大宽度 */
    max-height: 850px; /* 大屏幕最大高度 */
  }
}

/* 超大屏幕优化 (1440px+) */
@media (min-width: 1440px) {
  .ai-chat-container {
    width: 50vw;   /* 超大屏幕使用视口宽度的50% */
    height: 65vh;  /* 超大屏幕使用视口高度的65% */
    max-width: 900px;  /* 超大屏幕最大宽度 */
    max-height: 900px; /* 超大屏幕最大高度 */
  }
}

@media (max-height: 600px) {
  .ai-chat-container {
    height: 95vh;
    max-height: 500px;
  }
  
  /* 移除推荐面板的高度限制 */
}
</style>