<template>
  <teleport to="body">
    <div class="chat-overlay" @click.self="$emit('close')">
      <div class="step-chat-container">
        <!-- 顶部头部 -->
        <div class="chat-header">
          <div class="chat-title">
            <img src="@/assets/images/robot.png" alt="AI助手" class="chat-icon" />
            <span class="title-text">AI Assistant</span>
          </div>
          <n-button @click="$emit('close')" text class="close-btn">
            ✕
          </n-button>
        </div>

        <!-- 步骤指示器 -->
        <div class="step-indicator">
          <div class="steps-progress">
            <div 
              v-for="(step, index) in totalSteps" 
              :key="index"
              :class="['step-dot', { 
                'active': index === currentStep, 
                'completed': index < currentStep 
              }]"
            ></div>
          </div>
          <div class="step-text">Step {{ currentStep + 1 }} of {{ totalSteps }}</div>
        </div>

        <!-- 主要内容区域 -->
        <div class="content-area">
          <!-- 问答阶段 -->
          <div v-if="!showResults" class="question-phase">
            <!-- AI 头像和问题 -->
            <div class="ai-question">
              <div class="bot-avatar">
                <img src="@/assets/images/robot.png" alt="AI助手" class="bot-avatar-img" />
              </div>
              <div class="question-bubble">
                <div v-if="!isTyping" class="question-text">
                  {{ currentQuestionData?.text || 'Welcome! Let me help you find the perfect apartment.' }}
                </div>
                <!-- 打字动画 -->
                <div v-else class="typing-indicator">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>

            <!-- 选项区域 -->
            <div v-if="currentQuestionData && !isTyping" class="options-area">
              <!-- 多选模式 -->
              <div v-if="currentQuestionData.type === 'multiple_choice'" class="multiple-choice">
                <n-checkbox-group v-model:value="currentMultipleSelection" class="checkbox-group">
                  <n-checkbox 
                    v-for="option in currentQuestionData.options" 
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                    class="checkbox-item"
                  />
                </n-checkbox-group>
              </div>
              
              <!-- 单选模式 -->
              <div v-else class="single-choice">
                <n-button
                  v-for="option in currentQuestionData.options"
                  :key="option.value"
                  @click="selectOption(option)"
                  class="option-btn"
                  size="large"
                  secondary
                >
                  {{ option.label }}
                </n-button>
              </div>
            </div>
          </div>

          <!-- 结果阶段 -->
          <div v-else class="results-phase">
            <div class="results-header">
              <div class="bot-avatar">
                <img src="@/assets/images/robot.png" alt="AI助手" class="bot-avatar-img" />
              </div>
              <div class="results-title">
                🎯 Perfect Matches Found!
              </div>
            </div>
            
            <!-- 当前推荐卡片 -->
            <div v-if="currentRecommendation" class="recommendation-display">
              <div class="rec-card">
                <div class="card-header">
                  <h3 class="community-name">{{ currentRecommendation.name }}</h3>
                  <div class="match-score">{{ currentRecommendation.score }}% Match</div>
                </div>
                
                <div class="card-image">
                  <img :src="currentRecommendation.image" :alt="currentRecommendation.name" />
                </div>
                
                <div class="card-details">
                  <p class="description">{{ currentRecommendation.description }}</p>
                  <div class="info-tags">
                    <span class="tag">{{ currentRecommendation.budget }}</span>
                    <span class="tag">{{ currentRecommendation.commute }}</span>
                  </div>
                </div>
              </div>

              <!-- 推荐导航 -->
              <div v-if="recommendations.length > 1" class="rec-navigation">
                <n-button 
                  @click="previousRecommendation" 
                  :disabled="currentRecIndex === 0"
                  circle
                  secondary
                  size="large"
                >
                  ‹
                </n-button>
                
                <div class="rec-counter">
                  {{ currentRecIndex + 1 }} of {{ recommendations.length }}
                </div>
                
                <n-button 
                  @click="nextRecommendation" 
                  :disabled="currentRecIndex === recommendations.length - 1"
                  circle
                  secondary
                  size="large"
                >
                  ›
                </n-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="action-area">
          <div v-if="!showResults" class="question-actions">
            <!-- 多选提交按钮 -->
            <n-button 
              v-if="currentQuestionData?.type === 'multiple_choice'"
              @click="submitMultipleChoice" 
              :disabled="currentMultipleSelection.length === 0"
              type="primary"
              size="large"
              block
              class="submit-btn"
            >
              Continue
            </n-button>

            <!-- 导航按钮 -->
            <div class="nav-buttons">
              <n-button 
                v-if="currentStep > 0" 
                @click="goToPreviousQuestion"
                secondary
                class="nav-btn"
              >
                ‹ Back
              </n-button>
              
              <n-button 
                @click="$emit('close')"
                tertiary
                class="nav-btn"
              >
                Skip for now
              </n-button>
            </div>
          </div>

          <!-- 结果操作 -->
          <div v-else class="result-actions">
            <n-button 
              @click="viewOnMap(currentRecommendation)" 
              type="primary" 
              size="large" 
              block
              class="view-map-btn"
            >
              View on Map
            </n-button>
            
            <div class="secondary-actions">
              <n-button @click="getMoreRecommendations" secondary>
                More Options
              </n-button>
              <n-button @click="restartChat" tertiary>
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
export default {
  name: 'StepByStepChat',
  emits: ['close', 'recommendations', 'view-on-map'],
  
  data() {
    return {
      currentStep: 0,
      isTyping: false,
      answers: {},
      currentMultipleSelection: [],
      recommendations: [],
      currentRecIndex: 0,
      showResults: false,
      
      questions: [
        {
          id: 'budget',
          type: 'single_choice',
          text: 'What\'s your budget range?',
          options: [
            { value: 'low', label: 'Under $2,000/month' },
            { value: 'mid', label: '$2,000 - $3,500/month' },
            { value: 'high', label: '$3,500 - $5,000/month' },
            { value: 'premium', label: 'Over $5,000/month' }
          ]
        },
        {
          id: 'region',
          type: 'single_choice',
          text: 'Which region would you prefer?',
          options: [
            { value: 'nyc', label: 'New York City (NYC)' },
            { value: 'nj', label: 'New Jersey (NJ)' }
          ]
        },
        {
          id: 'preferences',
          type: 'multiple_choice',
          text: 'What\'s important to you? (Select all that apply)',
          options: [
            { value: 'transit', label: 'Good public transport' },
            { value: 'nightlife', label: 'Nightlife & dining' },
            { value: 'quiet', label: 'Quiet neighborhood' },
            { value: 'family', label: 'Family-friendly' }
          ]
        }
      ]
    }
  },

  computed: {
    totalSteps() {
      return this.questions.length;
    },
    
    currentQuestionData() {
      return this.questions[this.currentStep];
    },
    
    currentRecommendation() {
      return this.recommendations[this.currentRecIndex];
    }
  },

  mounted() {
    this.startChat();
  },

  methods: {
    startChat() {
      this.isTyping = true;
      setTimeout(() => {
        this.isTyping = false;
      }, 1500);
    },

    selectOption(option) {
      this.answers[this.currentQuestionData.id] = option.value;
      this.nextQuestion();
    },

    submitMultipleChoice() {
      if (this.currentMultipleSelection.length > 0) {
        this.answers[this.currentQuestionData.id] = [...this.currentMultipleSelection];
        this.currentMultipleSelection = [];
        this.nextQuestion();
      }
    },

    nextQuestion() {
      if (this.currentStep < this.questions.length - 1) {
        this.currentStep++;
        this.isTyping = true;
        setTimeout(() => {
          this.isTyping = false;
        }, 1000);
      } else {
        this.generateRecommendations();
      }
    },

    goToPreviousQuestion() {
      if (this.currentStep > 0) {
        this.currentStep--;
      }
    },

    generateRecommendations() {
      this.isTyping = true;
      
      setTimeout(() => {
        this.isTyping = false;
        this.showResults = true;
        
        // 根据用户选择的区域生成推荐结果
        this.recommendations = this.generateRecommendationsByRegion(this.answers.region);
        this.currentRecIndex = 0;
        this.$emit('recommendations', this.recommendations);
        
      }, 2000);
    },
    
    generateRecommendationsByRegion(region) {
      const nycRecommendations = [
        {
          id: 1,
          name: 'Williamsburg Lofts',
          score: 95,
          budget: 'Mid-range',
          commute: '20 min to Manhattan',
          description: 'Modern lofts in trendy Williamsburg with great nightlife and restaurants.',
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
        },
        {
          id: 2,
          name: 'Park Slope Gardens',
          score: 87,
          budget: 'Affordable',
          commute: '25 min to Downtown',
          description: 'Family-friendly neighborhood with tree-lined streets and excellent schools.',
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
        },
        {
          id: 3,
          name: 'LIC Towers',
          score: 83,
          budget: 'Premium',
          commute: '15 min to Midtown',
          description: 'Luxury high-rise with Manhattan skyline views and modern amenities.',
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
        }
      ];
      
      const njRecommendations = [
        {
          id: 4,
          name: 'Jersey City Heights',
          score: 92,
          budget: 'Mid-range',
          commute: '30 min to Manhattan',
          description: 'Stunning Manhattan views with affordable living and easy NYC access.',
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
        },
        {
          id: 5,
          name: 'Hoboken Waterfront',
          score: 88,
          budget: 'Premium',
          commute: '25 min to Midtown',
          description: 'Charming waterfront community with historic charm and modern amenities.',
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
        },
        {
          id: 6,
          name: 'Newark Downtown',
          score: 81,
          budget: 'Affordable',
          commute: '35 min to Manhattan',
          description: 'Revitalized downtown area with great value and improving neighborhoods.',
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=180&fit=crop'
        }
      ];
      
      return region === 'nj' ? njRecommendations : nycRecommendations;
    },

    previousRecommendation() {
      if (this.currentRecIndex > 0) {
        this.currentRecIndex--;
      }
    },

    nextRecommendation() {
      if (this.currentRecIndex < this.recommendations.length - 1) {
        this.currentRecIndex++;
      }
    },

    viewOnMap(recommendation) {
      this.$emit('view-on-map', recommendation);
      this.$emit('close');
    },

    getMoreRecommendations() {
      // 扩展推荐逻辑
    },

    restartChat() {
      this.currentStep = 0;
      this.showResults = false;
      this.answers = {};
      this.recommendations = [];
      this.currentRecIndex = 0;
      this.startChat();
    }
  }
}
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
}

.step-chat-container {
  width: 90vw;
  height: 85vh;
  max-width: 480px;
  max-height: 700px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

/* 头部 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #198754, #0f5132);
  color: white;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 6px;
  box-sizing: border-box;
  object-fit: contain;
  object-position: center;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  color: white !important;
  font-size: 18px;
}

/* 步骤指示器 */
.step-indicator {
  padding: 16px 20px;
  background: rgba(248, 249, 250, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.steps-progress {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e9ecef;
  transition: all 0.3s ease;
}

.step-dot.active {
  background: #198754;
  box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.2);
}

.step-dot.completed {
  background: #28a745;
}

.step-text {
  font-size: 14px;
  color: #6c757d;
  text-align: center;
}

/* 内容区域 */
.content-area {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* 改为顶部对齐，不再居中 */
}

/* 问答阶段 */
.ai-question {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
  margin-top: 0; /* 确保紧贴顶部 */
}

.bot-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  background: rgba(25, 135, 84, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
}

.bot-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为contain确保PNG完整显示 */
  object-position: center;
  border-radius: 0; /* PNG本身可能有透明背景，不需要圆角裁剪 */
}

.question-bubble {
  flex: 1;
  background: #f8f9fa;
  border-radius: 18px;
  padding: 16px 20px;
  position: relative;
}

.question-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 16px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-right-color: #f8f9fa;
}

.question-text {
  font-size: 16px;
  line-height: 1.5;
  color: #212529;
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #6c757d;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

/* 选项区域 */
.options-area {
  margin-bottom: 20px;
}

.single-choice {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  text-align: left;
  white-space: normal;
  height: auto;
  min-height: 48px;
  padding: 16px;
  font-size: 15px;
}

.multiple-choice .checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
}

/* 结果阶段 */
.results-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  margin-top: 0; /* 确保紧贴顶部 */
}

.results-title {
  font-size: 20px;
  font-weight: 600;
  color: #198754;
}

.rec-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
}

.community-name {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  margin: 0;
  flex: 1;
}

.match-score {
  background: #198754;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.card-image {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
  margin-bottom: 12px;
}

.info-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.rec-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.rec-counter {
  font-size: 14px;
  color: #6c757d;
  min-width: 80px;
  text-align: center;
}

/* 操作区域 */
.action-area {
  padding: 20px;
  background: rgba(248, 249, 250, 0.8);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.nav-btn {
  min-width: 80px;
}

.secondary-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.secondary-actions .n-button {
  flex: 1;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .step-chat-container {
    width: 70vw;
    max-width: 600px;
    height: 80vh;
    max-height: 800px;
  }
}

@media (min-width: 1200px) {
  .step-chat-container {
    width: 50vw;
    max-width: 700px;
  }
}

@media (max-width: 480px) {
  .step-chat-container {
    width: 98vw;
    height: 95vh;
    border-radius: 12px;
  }
  
  .content-area {
    padding: 16px;
  }
  
  .action-area {
    padding: 16px;
  }
  
  .chat-header {
    padding: 16px;
  }
  
  .option-btn {
    min-height: 44px;
    padding: 14px;
    font-size: 14px;
  }
  
  /* 移动端头像优化 */
  .bot-avatar {
    width: 44px;
    height: 44px;
    padding: 6px;
  }
  
  .chat-icon {
    width: 28px;
    height: 28px;
    padding: 4px;
  }
  
  .ai-question {
    gap: 12px;
    margin-bottom: 24px;
  }
}
</style>
