<template>
  <div class="ai-recommendation-container">
    <!-- 语言切换器 - 右上角 -->
    <div class="language-switcher-wrapper" :class="{ 'light-theme': currentPhase === 3 }">
      <LanguageSwitcher />
    </div>

    <!-- 开发模式快捷按钮 - 左上角 -->
    <div class="dev-controls" v-if="showDevControls">
      <div class="dev-panel">
        <div class="dev-title">Dev Mode</div>
        <div class="dev-buttons">
          <button @click="devSkipToPhase(1)" class="dev-btn">Cards</button>
          <button @click="devSkipToPhase(2)" class="dev-btn">Transition</button>
          <button @click="devSkipToQuestion(1)" class="dev-btn">Q1</button>
          <button @click="devSkipToQuestion(2)" class="dev-btn">Q2</button>
          <button @click="devSkipToQuestion(3)" class="dev-btn">Q3</button>
          <button @click="devSkipToQuestion(4)" class="dev-btn">Q4</button>
          <button @click="devSkipToQuestion(5)" class="dev-btn">Q5</button>
          <button @click="devSkipToPhase(4)" class="dev-btn">AI分析</button>
          <button @click="devSubmitRecommendation" class="dev-btn dev-btn-highlight">🚀 快速推荐</button>
          <button 
            v-if="showPerformancePanel" 
            @click="showPerformancePanel = false" 
            class="dev-btn dev-btn-warning"
            title="关闭性能监控"
          >
            ⏱️ 关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 性能监控面板 -->
    <div v-if="showPerformancePanel" class="performance-panel">
      <div class="performance-header">
        <h3>⏱️ 性能监控 & 数据流转</h3>
        <button @click="showPerformancePanel = false" class="close-btn">×</button>
      </div>
      <div class="performance-content">
        <div class="performance-summary">
          <div class="metric">
            <span class="metric-label">总耗时:</span>
            <span class="metric-value">
              {{ performanceMetrics.steps.length > 0 
                ? (Date.now() - performanceMetrics.startTime) + 'ms' 
                : '-' }}
            </span>
          </div>
          <div class="metric" v-if="performanceMetrics.apiStartTime && performanceMetrics.apiEndTime">
            <span class="metric-label">API耗时:</span>
            <span class="metric-value highlight">
              {{ performanceMetrics.apiEndTime - performanceMetrics.apiStartTime }}ms
            </span>
          </div>
        </div>
        <div class="performance-steps">
          <div 
            v-for="(step, index) in performanceMetrics.steps" 
            :key="index"
            class="step-item"
            :class="{ 'step-error': step.name.includes('❌') }"
          >
            <div class="step-header">
              <span class="step-name">{{ step.name }}</span>
              <span class="step-badge">步骤 {{ index + 1 }}</span>
            </div>
            <div class="step-timing">
              <span class="step-duration">耗时: {{ step.duration }}ms</span>
              <span class="step-relative">累计: {{ step.relativeTime }}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 阶段1：风格偏好卡片 -->
    <div class="content-wrapper" v-if="currentPhase === 1">
      <!-- 标题 -->
      <div class="header">
        <h1>
          <TranslatedText text="Like what you see?" :use-static="true" />
        </h1>
        <p class="subtitle">
          <TranslatedText text="Swipe to build your style profile." :use-static="true" />
        </p>
      </div>

      <!-- 进度条和计数 -->
      <div class="progress-section">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        <div class="progress-count">{{ currentCardIndex + 1 }}/{{ totalStyleCards }}</div>
      </div>

      <!-- 卡片区域 -->
      <div class="card-area">
        <div class="card-stack">
          <transition name="swipe">
            <div
              v-if="currentCardIndex < buildingImages.length"
              class="style-card"
              :key="buildingImages[currentCardIndex].id"
            >
              <div class="card-image-wrapper">
                <img
                  :src="buildingImages[currentCardIndex].url"
                  :alt="buildingImages[currentCardIndex].name"
                  class="card-image"
                  @error="handleImageError"
                />
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn dislike-btn" @click="handleDislike">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <button class="action-btn like-btn" @click="handleLike">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 阶段2：过渡页面 -->
    <div class="transition-wrapper" v-if="currentPhase === 2">
      <div class="transition-content">
        <div class="ai-icons">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2a9 9 0 0 1 9 9v4.5c0 1.5 1.5 3 3 3"/>
            <path d="M3 14.5c1.5 0 3-1.5 3-3V11a9 9 0 0 1 9-9"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18"/>
            <path d="M9 21V9"/>
          </svg>
        </div>
        <h1 class="transition-title">
          <TranslatedText text="Analyzing your preferences..." :use-static="true" />
        </h1>
        <p class="transition-subtitle">
          <TranslatedText text="Building your personalized housing profile" :use-static="true" />
        </p>
      </div>
    </div>

    <!-- 阶段3：问题页面 -->
    <div class="question-wrapper" v-if="currentPhase === 3">
      <div class="question-container">
        <!-- 顶部标题 -->
        <div class="question-header">
          <h1>
            <TranslatedText text="Find your perfect home" :use-static="true" />
          </h1>
          <p class="question-subtitle">
            <TranslatedText text="Answer 5 quick questions to get personalized recommendations" :use-static="true" />
          </p>
        </div>

        <!-- 进度条 -->
        <div class="question-progress">
          <div class="progress-info">
            <span>
              <TranslatedText text="Question" :use-static="true" /> 
              {{ currentQuestion }} 
              <TranslatedText text="of" :use-static="true" /> 
              {{ totalQuestions }}
            </span>
            <span class="progress-percent">{{ (currentQuestion / totalQuestions * 100).toFixed(0) }}%</span>
          </div>
          <div class="question-progress-bar">
            <div 
              class="question-progress-fill" 
              :style="{ width: (currentQuestion / totalQuestions * 100) + '%' }"
            ></div>
          </div>
        </div>

        <!-- 问题卡片 -->
        <div class="question-card">
          <!-- 问题1：位置 -->
          <div v-if="currentQuestion === 1" class="question-content">
            <div class="question-icon">
              <div class="icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
            
            <h2 class="question-title">
              <TranslatedText text="Where are you looking?" :use-static="true" />
            </h2>
            
            <p class="question-description">
              <TranslatedText text="Enter one or more locations anywhere in the U.S. You can use city, neighborhood, ZIP code, school, or a landmark." :use-static="true" />
            </p>

            <div class="question-form">
              <label class="form-label">
                <TranslatedText text="Enter Location(s)" :use-static="true" />
              </label>
              <n-input
                v-model:value="questionAnswers.location"
                placeholder="e.g., NYU, Jersey City, Downtown Brooklyn"
                size="large"
                class="location-input"
              />

              <div class="location-buttons">
                <n-button 
                  @click="handleUseLocation"
                  :type="questionAnswers.useMyLocation ? 'primary' : 'default'"
                  :loading="isLocating"
                  class="location-btn"
                >
                  <template #icon>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </template>
                  <TranslatedText text="Use my location" :use-static="true" />
                </n-button>

                <n-button 
                  @click="questionAnswers.openToSuggestions = !questionAnswers.openToSuggestions"
                  :type="questionAnswers.openToSuggestions ? 'primary' : 'default'"
                  class="location-btn"
                >
                  <template #icon>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
                    </svg>
                  </template>
                  <TranslatedText text="I'm open to suggestions" :use-static="true" />
                </n-button>
              </div>

              <div class="search-radius">
                <label class="form-label">
                  <TranslatedText text="Search Radius" :use-static="true" />
                </label>
                <div class="radius-slider">
                  <div class="slider-wrapper">
                    <input 
                      type="range" 
                      v-model="questionAnswers.searchRadius"
                      min="1"
                      max="50"
                      step="1"
                      class="custom-slider"
                    />
                    <div class="slider-marks">
                      <span>1</span>
                      <span>25</span>
                      <span>50</span>
                    </div>
                  </div>
                  <div class="radius-value">{{ questionAnswers.searchRadius }} mi</div>
                </div>
              </div>

              <n-button 
                type="primary" 
                size="large" 
                block
                class="continue-btn"
                @click="handleQuestionContinue"
              >
                <TranslatedText text="Continue" :use-static="true" />
              </n-button>
            </div>
          </div>

          <!-- 问题2：预算范围 -->
          <div v-if="currentQuestion === 2" class="question-content">
            <div class="question-icon">
              <div class="icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            
            <h2 class="question-title">
              <TranslatedText text="Budget Range" :use-static="true" />
            </h2>
            
            <p class="question-description">
              <TranslatedText text="Drag the sliders to set your price range" :use-static="true" />
            </p>

            <div class="question-form budget-form">
              <!-- 预算显示 -->
              <div class="budget-display">
                <div class="budget-value-item">
                  <label><TranslatedText text="Minimum" :use-static="true" /></label>
                  <div class="budget-amount">${{ formatCurrency(questionAnswers.budgetMin) }}</div>
                </div>
                <div class="budget-value-item">
                  <label><TranslatedText text="Maximum" :use-static="true" /></label>
                  <div class="budget-amount">${{ formatCurrency(questionAnswers.budgetMax) }}</div>
                </div>
              </div>

              <!-- 双滑块 -->
              <div class="budget-slider-container">
                <div class="budget-slider-wrapper">
                  <!-- 填充条（放在滑块下面） -->
                  <div class="budget-slider-track">
                    <div 
                      class="budget-slider-fill" 
                      :style="budgetSliderFillStyle"
                    ></div>
                  </div>
                  
                  <!-- 最小值滑块 -->
                  <input 
                    type="range" 
                    v-model.number="questionAnswers.budgetMin"
                    min="0"
                    max="10000"
                    step="100"
                    class="budget-slider budget-slider-min"
                    :style="{ zIndex: budgetMin >= budgetMax ? 5 : 4 }"
                    @input="handleBudgetMinChange"
                  />
                  <!-- 最大值滑块 -->
                  <input 
                    type="range" 
                    v-model.number="questionAnswers.budgetMax"
                    min="0"
                    max="10000"
                    step="100"
                    class="budget-slider budget-slider-max"
                    :style="{ zIndex: budgetMax <= budgetMin ? 5 : 4 }"
                    @input="handleBudgetMaxChange"
                  />
                </div>
                
                <!-- 标记 -->
                <div class="budget-slider-labels">
                  <span>$0</span>
                  <span>$10,000/mo</span>
                </div>
              </div>

              <!-- 预算总结卡片 -->
              <div class="budget-summary">
                <div class="budget-summary-title">
                  <TranslatedText text="Your Monthly Budget" :use-static="true" />
                </div>
                <div class="budget-summary-range">
                  ${{ formatCurrency(questionAnswers.budgetMin) }} – ${{ formatCurrency(questionAnswers.budgetMax) }}
                </div>
                <div class="budget-summary-subtitle">
                  <TranslatedText text="per month" :use-static="true" />
                </div>
              </div>

              <!-- 按钮组 -->
              <div class="question-buttons">
                <n-button 
                  size="large"
                  class="back-btn"
                  @click="handleQuestionBack"
                >
                  <TranslatedText text="Back" :use-static="true" />
                </n-button>
                <n-button 
                  type="primary" 
                  size="large"
                  class="continue-btn"
                  @click="handleQuestionContinue"
                >
                  <TranslatedText text="Continue" :use-static="true" />
                </n-button>
              </div>
            </div>
          </div>

          <!-- 问题3：首要诉求 -->
          <div v-if="currentQuestion === 3" class="question-content">
            <div class="question-icon">
              <div class="icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
            </div>
            
            <h2 class="question-title">
              <TranslatedText text="Top Priorities" :use-static="true" />
            </h2>
            
            <p class="question-description">
              <TranslatedText text="Select and rank what matters most to you" :use-static="true" />
            </p>

            <div class="question-form priorities-form">
              <!-- 优先级选项网格 -->
              <div class="priorities-grid">
                <div 
                  v-for="option in priorityOptions" 
                  :key="option.id"
                  class="priority-card"
                  :class="{ 'selected': isPrioritySelected(option.id) }"
                  @click="handlePriorityToggle(option.id)"
                >
                  <!-- 排名标记 -->
                  <div v-if="getPriorityRank(option.id)" class="priority-rank">
                    {{ getPriorityRank(option.id) }}
                  </div>
                  
                  <!-- 图标 -->
                  <div class="priority-icon">
                    <!-- Shield -->
                    <svg v-if="option.icon === 'shield'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    
                    <!-- Bus/Commute -->
                    <svg v-else-if="option.icon === 'bus'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="6" width="18" height="13" rx="2"/>
                      <path d="M3 11h18M8 6V4M16 6V4M8 19v2M16 19v2"/>
                      <circle cx="8" cy="16" r="1"/>
                      <circle cx="16" cy="16" r="1"/>
                    </svg>
                    
                    <!-- Transit -->
                    <svg v-else-if="option.icon === 'transit'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="5" y="4" width="14" height="16" rx="2"/>
                      <path d="M5 10h14M9 4v2M15 4v2"/>
                      <circle cx="9" cy="16" r="1"/>
                      <circle cx="15" cy="16" r="1"/>
                      <path d="M7 20l-2 2M17 20l2 2"/>
                    </svg>
                    
                    <!-- Cart -->
                    <svg v-else-if="option.icon === 'cart'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    
                    <!-- Car -->
                    <svg v-else-if="option.icon === 'car'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M5 17h14v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1H9v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3z"/>
                      <path d="M5 17V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10"/>
                      <circle cx="7" cy="14" r="1"/>
                      <circle cx="17" cy="14" r="1"/>
                    </svg>
                    
                    <!-- Heart -->
                    <svg v-else-if="option.icon === 'heart'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    
                    <!-- Pet -->
                    <svg v-else-if="option.icon === 'pet'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="4" r="2"/>
                      <circle cx="18" cy="8" r="2"/>
                      <circle cx="20" cy="16" r="2"/>
                      <circle cx="9" cy="20" r="2"/>
                      <path d="M8.35 14a4 4 0 0 1 7.3 0"/>
                    </svg>
                    
                    <!-- Star/Amenities -->
                    <svg v-else-if="option.icon === 'star'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  
                  <!-- 标签 -->
                  <div class="priority-label">
                    <TranslatedText :text="option.label" :use-static="true" />
                  </div>
                </div>
              </div>

              <!-- 提示信息 -->
              <div class="priorities-hint">
                <TranslatedText text="You can select up to 5 priorities." :use-static="true" />
              </div>

              <!-- 按钮组 -->
              <div class="question-buttons">
                <n-button 
                  size="large"
                  class="back-btn"
                  @click="handleQuestionBack"
                >
                  <TranslatedText text="Back" :use-static="true" />
                </n-button>
                <n-button 
                  type="primary" 
                  size="large"
                  class="continue-btn"
                  @click="handleQuestionContinue"
                >
                  <TranslatedText text="Continue" :use-static="true" />
                </n-button>
              </div>
            </div>
          </div>

          <!-- 问题4：居住安排偏好 -->
          <div v-if="currentQuestion === 4" class="question-content">
            <div class="question-header-inline">
              <div class="question-icon-inline">
                <div class="icon-circle-inline">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
              </div>
              
              <div class="question-title-wrapper">
                <h2 class="question-title-inline">
                  <TranslatedText text="Living Arrangement Preferences" :use-static="true" />
                </h2>
                <p class="question-description-inline">
                  <TranslatedText text="Tell us how you'd like to live and what type of home fits your lifestyle." :use-static="true" />
                </p>
              </div>
            </div>

            <div class="question-form living-form">
              <!-- 1. 首选房型 -->
              <div class="living-section">
                <h3 class="section-title">
                  <TranslatedText text="1. Preferred Housing Type" :use-static="true" />
                </h3>
                <div class="housing-type-grid">
                  <div 
                    v-for="type in housingTypeOptions" 
                    :key="type.id"
                    class="housing-type-btn"
                    :class="{ 'selected': questionAnswers.housingTypes.includes(type.id) }"
                    @click="toggleHousingType(type.id)"
                  >
                    <TranslatedText :text="type.label" :use-static="true" />
                  </div>
                </div>
              </div>

              <!-- 2. 室友偏好 -->
              <div class="living-section">
                <h3 class="section-title">
                  <TranslatedText text="2. Roommate Preference" :use-static="true" />
                </h3>
                <div class="roommate-options">
                  <div 
                    v-for="option in roommateOptions" 
                    :key="option.id"
                    class="roommate-btn"
                    :class="{ 'selected': questionAnswers.roommatePreference === option.id }"
                    @click="selectRoommatePreference(option.id)"
                  >
                    {{ option.label }}
                  </div>
                </div>
              </div>

              <!-- 3. 布局要求 -->
              <div class="living-section">
                <h3 class="section-title">
                  <TranslatedText text="3. Layout Requirements" :use-static="true" />
                </h3>
                
                <!-- 卧室 -->
                <div class="layout-subsection">
                  <div class="layout-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M2 8h20"/>
                    </svg>
                    <span><TranslatedText text="Bedrooms" :use-static="true" /></span>
                  </div>
                  <div class="layout-numbers">
                    <div 
                      v-for="num in layoutNumbers" 
                      :key="'bed-' + num"
                      class="layout-number-btn"
                      :class="{ 'selected': questionAnswers.bedrooms.includes(num) }"
                      @click="toggleBedroom(num)"
                    >
                      {{ num }}
                    </div>
                  </div>
                </div>

                <!-- 浴室 -->
                <div class="layout-subsection">
                  <div class="layout-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 6l11 0M9 18h11M5 12h14M7 6v12"/>
                    </svg>
                    <span><TranslatedText text="Bathrooms" :use-static="true" /></span>
                  </div>
                  <div class="layout-numbers">
                    <div 
                      v-for="num in layoutNumbers" 
                      :key="'bath-' + num"
                      class="layout-number-btn"
                      :class="{ 'selected': questionAnswers.bathrooms.includes(num) }"
                      @click="toggleBathroom(num)"
                    >
                      {{ num }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 按钮组 -->
              <div class="question-buttons">
                <n-button 
                  size="large"
                  class="back-btn"
                  @click="handleQuestionBack"
                >
                  <TranslatedText text="Back" :use-static="true" />
                </n-button>
                <n-button 
                  type="primary" 
                  size="large"
                  class="continue-btn"
                  @click="handleQuestionContinue"
                >
                  <TranslatedText text="Continue" :use-static="true" />
                </n-button>
              </div>
            </div>
          </div>

          <!-- 问题5：时间线和租赁偏好 -->
          <div v-if="currentQuestion === 5" class="question-content">
            <div class="question-header-inline">
              <div class="question-icon-inline">
                <div class="icon-circle-inline">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
              </div>
              
              <div class="question-title-wrapper">
                <h2 class="question-title-inline">
                  <TranslatedText text="Timeline & Lease Preferences" :use-static="true" />
                </h2>
                <p class="question-description-inline">
                  <TranslatedText text="Tell us when you're planning to move and how long you'd like to stay." :use-static="true" />
                </p>
              </div>
            </div>

            <div class="question-form timeline-form">
              <!-- 移入时间 -->
              <div class="timeline-section">
                <label class="timeline-label">
                  <TranslatedText text="How soon do you need to move?" :use-static="true" />
                </label>
                <n-select
                  v-model:value="questionAnswers.moveInTimeline"
                  :options="moveInTimelineOptions"
                  :placeholder="getStaticText('Select move-in date')"
                  size="large"
                  class="timeline-select"
                />
              </div>

              <!-- 租期 -->
              <div class="timeline-section">
                <label class="timeline-label">
                  <TranslatedText text="Planned Lease Term" :use-static="true" />
                </label>
                <n-select
                  v-model:value="questionAnswers.leaseTerm"
                  :options="leaseTermOptions"
                  :placeholder="getStaticText('Select duration')"
                  size="large"
                  class="timeline-select"
                />
              </div>

              <!-- 选择总结 -->
              <div v-if="questionAnswers.moveInTimeline || questionAnswers.leaseTerm" class="timeline-summary">
                <div v-if="questionAnswers.moveInTimeline" class="summary-item">
                  <div class="summary-label">
                    <TranslatedText text="Move-in Timeline" :use-static="true" />
                  </div>
                  <div class="summary-value">{{ getMoveInTimelineLabel }}</div>
                </div>
                <div v-if="questionAnswers.leaseTerm" class="summary-item">
                  <div class="summary-label">
                    <TranslatedText text="Lease Term" :use-static="true" />
                  </div>
                  <div class="summary-value">{{ getLeaseTermLabel }}</div>
                </div>
              </div>

              <!-- 按钮组 -->
              <div class="question-buttons">
                <n-button 
                  size="large"
                  class="back-btn"
                  @click="handleQuestionBack"
                >
                  <TranslatedText text="Back" :use-static="true" />
                </n-button>
                <n-button 
                  type="primary" 
                  size="large"
                  class="continue-btn find-home-btn"
                  @click="handleQuestionContinue"
                >
                  <TranslatedText text="Find My Home" :use-static="true" />
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 阶段4：AI分析加载页面 -->
    <div class="analysis-wrapper" v-if="currentPhase === 4">
      <div class="analysis-container">
        <h1 class="analysis-title">
          <TranslatedText text="Finding your perfect home" :use-static="true" />
        </h1>
        <p class="analysis-subtitle">
          <TranslatedText text="Our AI is analyzing your preferences..." :use-static="true" />
        </p>

        <div class="analysis-steps">
          <div 
            v-for="step in analysisSteps" 
            :key="step.id"
            class="analysis-step"
            :class="{ 
              'step-completed': step.completed, 
              'step-active': step.active,
              'step-pending': !step.completed && !step.active
            }"
          >
            <div class="step-icon-wrapper">
              <div class="step-icon">
                <!-- Location Icon -->
                <svg v-if="step.icon === 'location'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                
                <!-- Trending Icon -->
                <svg v-else-if="step.icon === 'trending'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                
                <!-- Building Icon -->
                <svg v-else-if="step.icon === 'building'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="4" y="2" width="16" height="20" rx="2"/>
                  <path d="M9 6h6M9 10h6M9 14h6M9 18h6"/>
                </svg>
                
                <!-- Star Icon -->
                <svg v-else-if="step.icon === 'star'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
            </div>
            
            <span class="step-label">{{ step.label }}</span>
            
            <!-- Loading spinner for active step -->
            <div v-if="step.active" class="step-spinner">
              <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" stroke-dashoffset="10"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import TranslatedText from '../components/TranslatedText.vue'
import useTranslation from '../composables/useTranslation'
import { buildingImages as defaultBuildingImages } from '../config/buildingImages'
import { smartGeocode } from '../utils/addressParser'

const router = useRouter()
const message = useMessage()
const { getStaticText } = useTranslation()

// 开发模式
const isDev = import.meta.env.DEV
const showDevControls = ref(isDev)

// 当前步骤：1=风格偏好卡片, 2=过渡页面, 3=问题页面, 4=AI分析加载页面
const currentPhase = ref(1)

// 风格偏好数据
const totalStyleCards = 8
const currentCardIndex = ref(0)
const stylePreferences = ref([])

// 问卷数据
const currentQuestion = ref(1)
const totalQuestions = 5
const questionAnswers = ref({
  // Q1: 位置
  location: '',
  searchRadius: 5, // 默认5英里
  useMyLocation: false,
  openToSuggestions: false,
  coordinates: null, // 存储用户坐标 { latitude, longitude }
  geocodeData: null,  // 存储反向地理编码结果
  
  // Q2: 预算
  budgetMin: 1500,  // 最小预算
  budgetMax: 4000,  // 最大预算
  
  // Q3: 优先级
  topPriorities: [],  // 最多5个，按选择顺序存储
  
  // Q4: 居住安排偏好
  housingTypes: [],  // 可多选：entire_apartment, private_room, studio, shared_room, flexible
  roommatePreference: '',  // 单选：want_roommates, have_roommates, live_alone, open_either
  bedrooms: [],  // 可多选：1, 2, 3, 4, 5+, flexible
  bathrooms: [],  // 可多选：1, 2, 3, 4, 5+, flexible
  
  // Q5: 时间线和租赁偏好
  moveInTimeline: '',  // 单选：within_1_month, within_3_months, within_6_months, within_1_year, after_1_year
  leaseTerm: ''  // 单选：6_12_months, 12_plus_months
})

// 定位加载状态
const isLocating = ref(false)

// Q3: 优先级选项
const priorityOptions = [
  {
    id: 'safety',
    label: 'Safety',
    icon: 'shield'
  },
  {
    id: 'commute',
    label: 'Commute',
    icon: 'bus'
  },
  {
    id: 'public_transit',
    label: 'Public Transit',
    icon: 'transit'
  },
  {
    id: 'near_grocery',
    label: 'Near Grocery',
    icon: 'cart'
  },
  {
    id: 'car_friendly',
    label: 'Car Friendly',
    icon: 'car'
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    icon: 'heart'
  },
  {
    id: 'pet_friendly',
    label: 'Pet Friendly',
    icon: 'pet'
  },
  {
    id: 'amenities',
    label: 'Amenities',
    icon: 'star'
  }
]

// 处理优先级选择
const handlePriorityToggle = (optionId) => {
  const index = questionAnswers.value.topPriorities.indexOf(optionId)
  
  if (index > -1) {
    // 已选中，取消选择
    questionAnswers.value.topPriorities.splice(index, 1)
  } else {
    // 未选中，添加（如果未达到5个上限）
    if (questionAnswers.value.topPriorities.length < 5) {
      questionAnswers.value.topPriorities.push(optionId)
    }
  }
}

// 获取选项的排名（1-5，未选中返回null）
const getPriorityRank = (optionId) => {
  const index = questionAnswers.value.topPriorities.indexOf(optionId)
  return index > -1 ? index + 1 : null
}

// 检查选项是否已选中
const isPrioritySelected = (optionId) => {
  return questionAnswers.value.topPriorities.includes(optionId)
}

// Q4: 居住安排偏好选项
const housingTypeOptions = [
  { id: 'entire_apartment', label: 'Entire Apartment' },
  { id: 'private_room', label: 'Private Room' },
  { id: 'studio', label: 'Studio' },
  { id: 'shared_room', label: 'Shared Room' },
  { id: 'flexible', label: 'Flexible / Open to All' }
]

const roommateOptions = [
  { id: 'want_roommates', label: 'I want roommates to save costs 💸' },
  { id: 'have_roommates', label: 'I already have roommates 👥' },
  { id: 'live_alone', label: 'I prefer to live alone 🏡' },
  { id: 'open_either', label: "I'm open to either" }
]

const layoutNumbers = ['1', '2', '3', '4', '5+', 'flexible']

// 处理房型选择（可多选）
const toggleHousingType = (typeId) => {
  const index = questionAnswers.value.housingTypes.indexOf(typeId)
  if (index > -1) {
    questionAnswers.value.housingTypes.splice(index, 1)
  } else {
    questionAnswers.value.housingTypes.push(typeId)
  }
}

// 处理室友偏好选择（单选）
const selectRoommatePreference = (prefId) => {
  questionAnswers.value.roommatePreference = prefId
}

// 处理卧室数量选择（可多选）
const toggleBedroom = (num) => {
  const index = questionAnswers.value.bedrooms.indexOf(num)
  if (index > -1) {
    questionAnswers.value.bedrooms.splice(index, 1)
  } else {
    questionAnswers.value.bedrooms.push(num)
  }
}

// 处理浴室数量选择（可多选）
const toggleBathroom = (num) => {
  const index = questionAnswers.value.bathrooms.indexOf(num)
  if (index > -1) {
    questionAnswers.value.bathrooms.splice(index, 1)
  } else {
    questionAnswers.value.bathrooms.push(num)
  }
}

// Q5: 时间线和租赁偏好选项
const moveInTimelineOptions = [
  { value: 'within_1_month', label: 'Within 1 month' },
  { value: 'within_3_months', label: 'Within 3 months' },
  { value: 'within_6_months', label: 'Within 6 months' },
  { value: 'within_1_year', label: 'Within 1 year' },
  { value: 'after_1_year', label: 'After 1 year' }
]

const leaseTermOptions = [
  { value: '6_12_months', label: '6–12 months' },
  { value: '12_plus_months', label: '12+ months' }
]

// 获取移入时间的显示文本
const getMoveInTimelineLabel = computed(() => {
  const option = moveInTimelineOptions.find(opt => opt.value === questionAnswers.value.moveInTimeline)
  return option ? option.label : ''
})

// 获取租期的显示文本
const getLeaseTermLabel = computed(() => {
  const option = leaseTermOptions.find(opt => opt.value === questionAnswers.value.leaseTerm)
  return option ? option.label : ''
})

// AI分析步骤状态管理
const analysisSteps = ref([
  { 
    id: 1, 
    label: 'Analyzing your preferences...', 
    icon: 'location',
    completed: false,
    active: false
  },
  { 
    id: 2, 
    label: 'Querying thousands of listings...', 
    icon: 'trending',
    completed: false,
    active: false
  },
  { 
    id: 3, 
    label: 'Finding properties that match your timeline...', 
    icon: 'building',
    completed: false,
    active: false
  },
  { 
    id: 4, 
    label: 'Ranking your top 3 personalized matches...', 
    icon: 'star',
    completed: false,
    active: false
  }
])

const currentAnalysisStep = ref(0)
const isApiReturned = ref(false) // API是否已返回
const apiReturnTime = ref(null) // API返回的时间
let animationTimers = [] // 存储所有动画定时器

// 开始AI分析动画（智能动画：根据API返回时间调整）
const startAnalysis = () => {
  currentAnalysisStep.value = 0
  isApiReturned.value = false
  apiReturnTime.value = null
  animationTimers = []
  
  const totalSteps = analysisSteps.value.length // 4步
  const normalStepDuration = 30000 // 每步30秒
  const startTime = Date.now()
  
  const animateStep = (stepIndex) => {
    if (stepIndex >= totalSteps) {
      // 所有步骤完成，等待API返回
      if (isApiReturned.value) {
        // API已返回，立即跳转
        setTimeout(() => {
          navigateToResults()
        }, 500)
      } else {
        // API还没返回，等待API返回后再跳转
        console.log('⏳ 动画完成，等待API返回...')
      }
      return
    }
    
    // 激活当前步骤
    analysisSteps.value[stepIndex].active = true
    
    // 计算当前步骤的持续时间
    let stepDuration = normalStepDuration
    
    // 如果是最后一步，检查是否需要延长时间
    if (stepIndex === totalSteps - 1) {
      const elapsedTime = Date.now() - startTime
      const remainingTime = 120000 - elapsedTime // 120秒总时长
      
      // 如果API已返回，快速完成最后一步
      if (isApiReturned.value) {
        stepDuration = 2000 // 2秒快速完成
        console.log('✅ API已返回，加速完成最后一步')
      } else if (remainingTime > normalStepDuration) {
        // 如果还有很多时间剩余，延长最后一步
        stepDuration = remainingTime
        console.log(`⏱️ 延长最后一步到 ${Math.round(remainingTime/1000)} 秒，等待API返回`)
      }
    } else {
      // 前面的步骤：如果API已返回，加速完成
      if (isApiReturned.value) {
        stepDuration = 2000 // 2秒快速完成
        console.log('✅ API已返回，加速动画')
      }
    }
    
    const timer = setTimeout(() => {
      analysisSteps.value[stepIndex].completed = true
      analysisSteps.value[stepIndex].active = false
      currentAnalysisStep.value = stepIndex + 1
      
      // 继续下一步
      animateStep(stepIndex + 1)
    }, stepDuration)
    
    animationTimers.push(timer)
  }
  
  // 开始第一步
  animateStep(0)
  
  // 同时开始API请求
  handleSubmitAll()
}

// 当API返回时调用此函数
const onApiReturned = (recommendations) => {
  isApiReturned.value = true
  apiReturnTime.value = Date.now()
  
  // 存储推荐结果
  window.aiRecommendations = recommendations
  
  console.log('✅ API返回，立即跳转到结果页面')
  
  // 清除所有动画定时器
  animationTimers.forEach(timer => clearTimeout(timer))
  animationTimers = []
  
  // 立即跳转到结果页面，不等动画完成
  setTimeout(() => {
    navigateToResults()
  }, 300)
}

// 跳转到结果页面
const navigateToResults = () => {
  if (showPerformancePanel.value) {
    addPerformanceStep('🎯 跳转到结果页面')
    performanceMetrics.value.totalTime = Date.now() - performanceMetrics.value.startTime
    console.log(`\n📊 总耗时: ${performanceMetrics.value.totalTime}ms`)
    console.log(`📊 API耗时: ${performanceMetrics.value.apiEndTime - performanceMetrics.value.apiStartTime}ms`)
  }
  
  const recommendations = window.aiRecommendations
  if (!recommendations) {
    console.error('❌ 没有推荐结果')
    message.error('推荐数据丢失，请重试')
    // 返回首页
    setTimeout(() => {
      router.push('/')
    }, 1500)
    return
  }
  
  // 检查是否有实际推荐
  if (!recommendations.recommendations || recommendations.recommendations.length === 0) {
    console.warn('⚠️ 推荐列表为空')
    message.warning('未找到符合条件的房源，请调整筛选条件后重试')
    // 返回首页
    setTimeout(() => {
      router.push('/')
    }, 2000)
    return
  }
  
  router.push({
    name: 'RecommendationResults',
    params: {
      data: encodeURIComponent(JSON.stringify(recommendations))
    }
  })
}

// 格式化货币显示（添加千位分隔符）
const formatCurrency = (value) => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 便捷访问预算值
const budgetMin = computed(() => questionAnswers.value.budgetMin)
const budgetMax = computed(() => questionAnswers.value.budgetMax)

// 处理预算最小值变化
const handleBudgetMinChange = () => {
  // 确保最小值不超过最大值
  if (questionAnswers.value.budgetMin > questionAnswers.value.budgetMax) {
    questionAnswers.value.budgetMin = questionAnswers.value.budgetMax
  }
}

// 处理预算最大值变化
const handleBudgetMaxChange = () => {
  // 确保最大值不低于最小值
  if (questionAnswers.value.budgetMax < questionAnswers.value.budgetMin) {
    questionAnswers.value.budgetMax = questionAnswers.value.budgetMin
  }
}

// 计算预算滑块填充条样式
const budgetSliderFillStyle = computed(() => {
  const min = questionAnswers.value.budgetMin
  const max = questionAnswers.value.budgetMax
  const total = 10000
  
  const leftPercent = (min / total) * 100
  const rightPercent = ((total - max) / total) * 100
  
  return {
    left: `${leftPercent}%`,
    right: `${rightPercent}%`
  }
})

// 建筑图片列表（从3个县随机选择8张）
// 每次页面加载都会随机选择不同的8张建筑
const buildingImages = ref([...defaultBuildingImages])

// 进度百分比
const progressPercentage = computed(() => {
  return (currentCardIndex.value / buildingImages.value.length) * 100
})

// 风格偏好卡片操作
const handleLike = () => {
  if (currentCardIndex.value < buildingImages.value.length) {
    stylePreferences.value.push({
      ...buildingImages.value[currentCardIndex.value],
      liked: true,
      timestamp: Date.now()
    })
    currentCardIndex.value++
    
    // 如果所有卡片都完成了，进入过渡页面
    if (currentCardIndex.value >= buildingImages.value.length) {
      setTimeout(() => {
        currentPhase.value = 2 // 进入过渡页面
        // 1.5秒后进入问题页面
        setTimeout(() => {
          currentPhase.value = 3
        }, 1500)
      }, 300)
    }
  }
}

const handleDislike = () => {
  if (currentCardIndex.value < buildingImages.value.length) {
    stylePreferences.value.push({
      ...buildingImages.value[currentCardIndex.value],
      liked: false,
      timestamp: Date.now()
    })
    currentCardIndex.value++
    
    // 如果所有卡片都完成了，进入过渡页面
    if (currentCardIndex.value >= buildingImages.value.length) {
      setTimeout(() => {
        currentPhase.value = 2 // 进入过渡页面
        // 1.5秒后进入问题页面
        setTimeout(() => {
          currentPhase.value = 3
        }, 1500)
      }, 300)
    }
  }
}

const handleImageError = (event) => {
  // 图片加载失败时使用占位图
  console.warn('图片加载失败:', event.target.src)
  event.target.src = 'https://via.placeholder.com/800x600/e0e0e0/666666?text=Building+Image'
}

// 反向地理编码：将坐标转换为地址
const reverseGeocode = async (latitude, longitude) => {
  try {
    // 使用 BigDataCloud 免费API（无需API key）
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    )
    
    if (!response.ok) throw new Error('Geocoding failed')
    
    const data = await response.json()
    
    // 提取有用的地址信息
    const parts = []
    if (data.city) parts.push(data.city)
    if (data.locality) parts.push(data.locality)
    if (data.principalSubdivision) parts.push(data.principalSubdivision) // 州
    
    const address = parts.join(', ')
    
    // 检查是否在目标县（County）内
    const county = data.localityInfo?.administrative?.find(
      item => item.adminLevel === 6 // County level
    )?.name || ''
    
    // 检查是否属于目标区域
    const targetCounties = [
      'San Francisco County',
      'Santa Clara County', 
      'San Mateo County'
    ]
    
    const isInTargetArea = targetCounties.some(tc => 
      county.toLowerCase().includes(tc.toLowerCase().split(' ')[0])
    )
    
    return {
      address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: data.city || '',
      county: county,
      state: data.principalSubdivision || '',
      country: data.countryName || '',
      isInTargetArea,
      fullData: data
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    // 如果API失败，返回坐标
    return {
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: '',
      county: '',
      state: '',
      country: '',
      isInTargetArea: false
    }
  }
}

// 处理定位请求
const handleUseLocation = async () => {
  if (!navigator.geolocation) {
    const msg = getStaticText('your browser does not support geolocation')
    message.error(msg)
    return
  }

  isLocating.value = true
  
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })

    const { latitude, longitude } = position.coords
    questionAnswers.value.coordinates = { latitude, longitude }
    
    // 调用反向地理编码获取地址
    const geocodeResult = await reverseGeocode(latitude, longitude)
    
    questionAnswers.value.useMyLocation = true
    
    // 检查是否在目标区域
    if (geocodeResult.isInTargetArea) {
      // 在目标区域内，使用实际位置
      questionAnswers.value.location = geocodeResult.address
      questionAnswers.value.geocodeData = geocodeResult
      
      const successMsg = getStaticText('location detected successfully')
      message.success(`${successMsg} - ${geocodeResult.city || geocodeResult.county}`, {
        duration: 3000
      })
      
      console.log('Location details:', {
        coordinates: { latitude, longitude },
        address: geocodeResult.address,
        county: geocodeResult.county,
        isInTargetArea: true
      })
    } else {
      // 不在目标区域内，给出提示并强制设置为旧金山
      const warningMsg = getStaticText('you are outside our service area. defaulting to san francisco.')
      message.warning(warningMsg, {
        duration: 5000
      })
      
      // 强制设置为旧金山
      questionAnswers.value.location = 'San Francisco, California'
      questionAnswers.value.coordinates = { 
        latitude: 37.7749,  // 旧金山市中心坐标
        longitude: -122.4194 
      }
      questionAnswers.value.geocodeData = {
        address: 'San Francisco, California',
        city: 'San Francisco',
        county: 'San Francisco County',
        state: 'California',
        country: 'United States',
        isInTargetArea: true,
        isDefaultLocation: true // 标记这是默认位置
      }
      
      console.log('Location outside service area:', {
        originalLocation: geocodeResult.address,
        county: geocodeResult.county,
        defaultedTo: 'San Francisco, California'
      })
    }
    
  } catch (error) {
    console.error('Geolocation error:', error)
    
    let errorKey = 'unable to get your location'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorKey = 'location permission denied. please enable location access in your browser settings.'
        break
      case error.POSITION_UNAVAILABLE:
        errorKey = 'location information is unavailable. please try again.'
        break
      case error.TIMEOUT:
        errorKey = 'location request timed out. please try again.'
        break
    }
    
    const errorMessage = getStaticText(errorKey)
    message.error(errorMessage)
    questionAnswers.value.useMyLocation = false
  } finally {
    isLocating.value = false
  }
}

// 开发模式：快速跳转到指定阶段
const devSkipToPhase = (phase) => {
  currentPhase.value = phase
  if (phase === 3) {
    // 跳到问题页面，假装已经完成卡片
    currentCardIndex.value = buildingImages.value.length
  } else if (phase === 4) {
    // 跳到AI分析页面，启动动画
    setTimeout(() => {
      startAnalysis()
    }, 300)
  }
}

// 开发模式：快速跳转到指定问题
const devSkipToQuestion = (questionNum) => {
  currentPhase.value = 3
  currentQuestion.value = questionNum
  currentCardIndex.value = buildingImages.value.length
}

// 性能监控数据
const performanceMetrics = ref({
  startTime: null,
  steps: [],
  apiStartTime: null,
  apiEndTime: null,
  totalTime: null
})

const showPerformancePanel = ref(false)

// 添加性能记录
const addPerformanceStep = (stepName, duration = null) => {
  const now = Date.now()
  const step = {
    name: stepName,
    timestamp: now,
    duration: duration || (performanceMetrics.value.steps.length > 0 
      ? now - performanceMetrics.value.steps[performanceMetrics.value.steps.length - 1].timestamp 
      : now - performanceMetrics.value.startTime),
    relativeTime: now - performanceMetrics.value.startTime
  }
  performanceMetrics.value.steps.push(step)
  console.log(`⏱️ [${step.relativeTime}ms] ${stepName} (耗时: ${step.duration}ms)`)
}

// 开发模式：一键提交推荐（使用测试数据）
const devSubmitRecommendation = () => {
  // 重置性能监控
  performanceMetrics.value = {
    startTime: Date.now(),
    steps: [],
    apiStartTime: null,
    apiEndTime: null,
    totalTime: null
  }
  showPerformancePanel.value = true
  
  addPerformanceStep('📝 填充测试数据')
  
  // 填充测试数据 - 使用旧金山位置以获得实际推荐
  questionAnswers.value.location = 'San Francisco State University'
  questionAnswers.value.coordinates = { lat: 37.7219, lon: -122.4782 }
  questionAnswers.value.searchRadius = 5
  questionAnswers.value.budgetMin = 1000
  questionAnswers.value.budgetMax = 3000
  questionAnswers.value.selectedPriorities = ['Safety', 'Transit', 'Lifestyle']
  questionAnswers.value.housingType = ['Entire Apartment']
  questionAnswers.value.roommatePreference = 'alone'
  questionAnswers.value.bedrooms = ['2']
  questionAnswers.value.bathrooms = ['1']
  questionAnswers.value.moveInTimeline = 'within_1_month'
  questionAnswers.value.leaseTerm = '6_12_months'
  
  // 添加一些喜欢的建筑风格（模拟卡片选择）
  stylePreferences.value = [
    { id: 'sf_1', liked: true, county: 'san_francisco', name: 'SF Building 1' },
    { id: 'sf_2', liked: true, county: 'san_francisco', name: 'SF Building 2' }
  ]
  
  addPerformanceStep('🎬 启动AI分析动画')
  
  // 跳转到AI分析动画
  currentPhase.value = 4
  setTimeout(() => {
    startAnalysis()
  }, 300)
}

// 问题返回按钮
const handleQuestionBack = () => {
  if (currentQuestion.value > 1) {
    currentQuestion.value--
  }
}

// 地理编码：将地址转换为坐标
const geocodeAddress = async (address) => {
  try {
    return await smartGeocode(address)
  } catch (error) {
    console.error('地理编码失败:', error)
    return null
  }
}

// 问题继续按钮
const handleQuestionContinue = async () => {
  if (currentQuestion.value === 1) {
    // 验证位置输入
    if (!questionAnswers.value.location && !questionAnswers.value.useMyLocation && !questionAnswers.value.openToSuggestions) {
      message.warning('Please enter a location or select an option')
      return
    }
    
    // 如果用户手动输入了地址，尝试地理编码
    if (questionAnswers.value.location && !questionAnswers.value.useMyLocation && !questionAnswers.value.openToSuggestions) {
      const loadingMsg = message.loading('Geocoding your location...', { duration: 0 })
      
      const geocodeResult = await geocodeAddress(questionAnswers.value.location)
      loadingMsg.destroy()
      
      if (geocodeResult) {
        // 成功获取坐标
        questionAnswers.value.coordinates = {
          lat: geocodeResult.lat,
          lon: geocodeResult.lon
        }
        
        console.log('✅ 地理编码成功:', geocodeResult)
        message.success(`Location found: ${geocodeResult.displayName}`, { duration: 3000 })
      } else {
        // 地理编码失败，警告用户但允许继续
        console.warn('⚠️ 地理编码失败，将无法计算通勤时间')
        message.warning('Could not find exact coordinates for this location. Commute times will not be available.', { duration: 5000 })
        questionAnswers.value.coordinates = null
      }
    }
  }
  
  if (currentQuestion.value === 2) {
    // 验证预算范围
    if (questionAnswers.value.budgetMin >= questionAnswers.value.budgetMax) {
      message.warning('Maximum budget must be greater than minimum budget')
      return
    }
  }
  
  // 如果完成所有问题，跳转到AI分析页面
  if (currentQuestion.value >= totalQuestions) {
    currentPhase.value = 4
    // 短暂延迟后开始分析动画
    setTimeout(() => {
      startAnalysis()
    }, 300)
    return
  }
  
  // 进入下一个问题
  currentQuestion.value++
}

// 提交所有答案
const handleSubmitAll = async () => {
  if (showPerformancePanel.value) {
    addPerformanceStep('🔧 构建请求数据')
  }
  
  // 构建前端问卷完整数据
  const fullData = {
    timestamp: new Date().toISOString(),
    questionnaire_version: '2.0',
    style_preferences: {
      total_cards: totalStyleCards,
      completed: currentCardIndex.value,
      liked_styles: stylePreferences.value
        .filter(p => p.liked)
        .map(p => ({
          id: p.id,
          name: p.name,
          style: p.style,
          url: p.url
        })),
      disliked_styles: stylePreferences.value
        .filter(p => !p.liked)
        .map(p => ({
          id: p.id,
          name: p.name,
          style: p.style,
          url: p.url
        }))
    },
    questionnaire_answers: questionAnswers.value
  }
  
  console.log('📋 完整问卷数据:', fullData)
  
  // 构建AI推荐API需要的格式
  const aiRequestData = {
    stylePreferences: stylePreferences.value
      .filter(p => p.liked)
      .map(p => ({
        id: p.id,
        url: p.url,
        name: p.name,
        county: p.county
      })),
    location: {
      address: questionAnswers.value.location,
      coordinates: questionAnswers.value.locationCoordinates,
      radius: questionAnswers.value.searchRadius || 5
    },
    budget: {
      min: questionAnswers.value.budgetMin || 0,
      max: questionAnswers.value.budgetMax || 10000
    },
    priorities: questionAnswers.value.selectedPriorities || [],
    housingType: questionAnswers.value.housingType || [],
    roommatePreference: questionAnswers.value.roommatePreference || '',
    bedrooms: questionAnswers.value.bedrooms || [],
    bathrooms: questionAnswers.value.bathrooms || [],
    moveInTimeline: questionAnswers.value.moveInTimeline || '',
    leaseTerm: questionAnswers.value.leaseTerm || ''
  }
  
  console.log('🤖 AI推荐请求数据:', aiRequestData)
  
  if (showPerformancePanel.value) {
    addPerformanceStep('🚀 发送API请求')
    performanceMetrics.value.apiStartTime = Date.now()
  }
  
  try {
    // 调用AI推荐API
    const response = await fetch('http://localhost:5001/api/ai/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestData)
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('✅ AI推荐结果:', result)
    
    if (showPerformancePanel.value) {
      performanceMetrics.value.apiEndTime = Date.now()
      const apiDuration = performanceMetrics.value.apiEndTime - performanceMetrics.value.apiStartTime
      addPerformanceStep(`✅ API返回成功 (${result.recommendations?.length || 0}个推荐)`, apiDuration)
    }
    
    if (result.success) {
      // 检查是否有推荐结果
      if (!result.recommendations || result.recommendations.length === 0) {
        message.warning('未找到符合条件的推荐，请尝试调整筛选条件')
        // 仍然需要通知动画系统
        onApiReturned({
          recommendations: [],
          userPreferences: {
            location: questionAnswers.value.location,
            coordinates: questionAnswers.value.coordinates,
            budgetMin: questionAnswers.value.budgetMin || 0,
            budgetMax: questionAnswers.value.budgetMax || 10000,
            bedrooms: questionAnswers.value.bedrooms || [],
            moveInTimeline: questionAnswers.value.moveInTimeline,
            leaseTerm: questionAnswers.value.leaseTerm
          }
        })
        return
      }
      
      message.success(`成功获得 ${result.recommendations.length} 个推荐！`)
      
      // 准备推荐数据
      const recommendationsData = {
        recommendations: result.recommendations,
        userPreferences: {
          location: questionAnswers.value.location,
          coordinates: questionAnswers.value.coordinates, 
          budgetMin: questionAnswers.value.budgetMin || 0,
          budgetMax: questionAnswers.value.budgetMax || 10000,
          bedrooms: questionAnswers.value.bedrooms || [],
          moveInTimeline: questionAnswers.value.moveInTimeline,
          leaseTerm: questionAnswers.value.leaseTerm
        }
      }
      
      // 通知动画系统：API已返回
      onApiReturned(recommendationsData)
      
      if (showPerformancePanel.value) {
        addPerformanceStep('📦 数据处理完成')
      }
    } else {
      throw new Error('API返回数据格式不正确')
    }
  } catch (error) {
    console.error('❌ AI推荐请求失败:', error)
    message.error(`推荐请求失败: ${error.message}`)
    
    if (showPerformancePanel.value) {
      addPerformanceStep('❌ API请求失败: ' + error.message)
    }
    
    // 失败时也可以选择跳转到浏览页面
    setTimeout(() => {
      router.push('/browse')
    }, 2000)
  }
}
</script>

<style scoped>
.ai-recommendation-container {
  min-height: 100vh;
  height: 100vh;
  background: rgb(15, 23, 42);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.language-switcher-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
}

/* 默认样式 - 深色背景（风格卡片和过渡阶段） */
.language-switcher-wrapper :deep(.language-display) {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  transition: all 0.3s ease;
}

.language-switcher-wrapper :deep(.language-display:hover) {
  background: rgba(255, 255, 255, 0.15);
}

/* 浅色主题 - 问题阶段 */
.language-switcher-wrapper.light-theme :deep(.language-display) {
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  color: #1e293b;
}

.language-switcher-wrapper.light-theme :deep(.language-display:hover) {
  background: rgba(0, 0, 0, 0.08);
}

.dev-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
}

.dev-panel {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 16px;
  border-radius: 12px;
}

.dev-title {
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dev-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dev-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.dev-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.dev-btn-highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.dev-btn-highlight:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
}

.dev-btn-warning {
  background: rgba(251, 191, 36, 0.2);
  border-color: #fbbf24;
  color: #fbbf24;
}

.dev-btn-warning:hover {
  background: rgba(251, 191, 36, 0.3);
  border-color: #f59e0b;
  color: #f59e0b;
}

/* 性能监控面板 */
.performance-panel {
  position: fixed;
  top: 100px;
  right: 20px;
  width: 420px;
  max-height: 70vh;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 99;
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.performance-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.performance-content {
  padding: 16px;
  max-height: calc(70vh - 65px);
  overflow-y: auto;
}

.performance-content::-webkit-scrollbar {
  width: 6px;
}

.performance-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.performance-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.performance-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.performance-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.metric-value.highlight {
  color: #667eea;
}

.performance-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: all 0.2s;
}

.step-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.step-item.step-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.step-name {
  font-size: 0.875rem;
  color: #ffffff;
  font-weight: 500;
  flex: 1;
}

.step-badge {
  font-size: 0.65rem;
  background: rgba(102, 126, 234, 0.2);
  color: #a5b4fc;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.step-timing {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.step-duration {
  color: #10b981;
  font-weight: 600;
}

.step-relative {
  color: rgba(255, 255, 255, 0.5);
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: #ffffff;
  font-weight: 600;
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 30px;
  width: 100%;
}

.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  transition: width 0.5s ease;
}

.progress-count {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.card-area {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 60vh;
  margin-bottom: 20px;
}

.card-stack {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.style-card {
  position: absolute;
  width: 100%;
  height: 100%;
  max-height: 550px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  background: white;
  transition: transform 0.3s ease;
}

.style-card:hover {
  transform: scale(1.02);
}

.card-image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.completion-message {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.completion-content {
  text-align: center;
  color: white;
}

.completion-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

.completion-content h2 {
  font-size: 2rem;
  margin: 0 0 10px 0;
  color: white;
}

.completion-content p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 60px;
  padding: 20px 0;
}

.action-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dislike-btn {
  border: 2px solid rgba(239, 68, 68, 0.8);
  color: rgb(239, 68, 68);
}

.dislike-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid rgb(239, 68, 68);
  transform: scale(1.15);
  box-shadow: 0 12px 40px rgba(239, 68, 68, 0.3);
}

.like-btn {
  border: 2px solid rgba(34, 197, 94, 0.8);
  color: rgb(34, 197, 94);
}

.like-btn:hover {
  background: rgba(34, 197, 94, 0.2);
  border: 2px solid rgb(34, 197, 94);
  transform: scale(1.15);
  box-shadow: 0 12px 40px rgba(34, 197, 94, 0.3);
}

.action-btn:active {
  transform: scale(1.05);
}

.btn-icon {
  font-size: 2rem;
  line-height: 1;
}

/* 卡片滑动动画 */
.swipe-enter-active {
  transition: all 0.5s ease;
}

.swipe-leave-active {
  transition: all 0.5s ease;
}

.swipe-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.swipe-leave-to {
  opacity: 0;
  transform: translateX(-100px) rotate(-10deg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 15px;
  }

  .header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .card-area {
    max-height: 55vh;
  }

  .action-buttons {
    gap: 50px;
    padding: 15px 0;
  }

  .action-btn {
    width: 65px;
    height: 65px;
  }

  .btn-icon {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .language-switcher-wrapper {
    top: 15px;
    right: 15px;
  }

  .header h1 {
    font-size: 1.8rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .card-area {
    max-height: 50vh;
  }

  .action-buttons {
    gap: 40px;
    padding: 10px 0;
  }

  .action-btn {
    width: 60px;
    height: 60px;
  }

  .btn-icon {
    font-size: 1.6rem;
  }
}

@media (max-height: 700px) {
  .header {
    margin-bottom: 15px;
  }

  .header h1 {
    font-size: 1.8rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .progress-bar {
    margin-bottom: 20px;
  }

  .card-area {
    max-height: 50vh;
  }

  .action-buttons {
    padding: 10px 0;
  }

  .action-btn {
    width: 60px;
    height: 60px;
  }
}

/* ==================== 过渡页面样式 ==================== */
.transition-wrapper {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.transition-content {
  text-align: center;
  animation: fadeInScale 0.5s ease-out;
}

.ai-icons {
  font-size: 5rem;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
  animation: pulse 1.5s ease-in-out infinite;
}

.transition-title {
  font-size: 3rem;
  color: white;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.transition-subtitle {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.emoji-brain, .emoji-sparkle {
  margin-left: 8px;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* ==================== 问题页面样式 ==================== */
.question-wrapper {
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}

.question-container {
  max-width: 800px;
  width: 100%;
  animation: slideInUp 0.5s ease-out;
}

.question-header {
  text-align: center;
  margin-bottom: 30px;
}

.question-header h1 {
  font-size: 2.5rem;
  color: #1e293b;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.question-subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
}

.question-progress {
  margin-bottom: 40px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: #475569;
}

.progress-percent {
  color: #0ea5e9;
  font-weight: 600;
}

.question-progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.question-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #06b6d4);
  transition: width 0.5s ease;
}

.question-card {
  background: white;
  border-radius: 24px;
  padding: 50px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.question-content {
  max-width: 600px;
  margin: 0 auto;
}

/* 并排布局样式 - Q4使用 */
.question-header-inline {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  margin-bottom: 25px;
}

.question-icon-inline {
  flex-shrink: 0;
}

.icon-circle-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
}

.question-title-wrapper {
  flex: 1;
}

.question-title-inline {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 8px 0;
  font-weight: 600;
  line-height: 1.3;
}

.question-description-inline {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.question-icon {
  margin-bottom: 20px;
}

.icon-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  font-size: 1.8rem;
}

.question-title {
  font-size: 2rem;
  color: #1e293b;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.question-description {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 30px;
}

.question-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.location-input {
  font-size: 1rem;
}

.location-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.location-btn {
  flex: 1;
  min-width: 200px;
}

.search-radius {
  margin-top: 10px;
}

.slider-wrapper {
  position: relative;
  width: 100%;
}

.custom-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 12px;
  border-radius: 6px;
  background: #e2e8f0;
  outline: none;
  transition: background 0.3s;
}

.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.4);
  transition: all 0.3s;
}

.custom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.6);
}

.custom-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.4);
  transition: all 0.3s;
}

.custom-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.6);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #64748b;
}

.radius-slider {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radius-value {
  text-align: right;
  font-size: 1.2rem;
  font-weight: 600;
  color: #0ea5e9;
}

.continue-btn {
  margin-top: 20px;
  height: 50px !important;
  min-height: 50px !important;
  max-height: 50px !important;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4) !important;
  border: none !important;
  color: white !important;
  padding: 0 24px !important;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 - 问题页面 */
@media (max-width: 768px) {
  .question-wrapper {
    padding: 30px 15px;
  }

  .question-header h1 {
    font-size: 2rem;
  }

  .question-card {
    padding: 30px 25px;
  }

  .question-title {
    font-size: 1.6rem;
  }

  .location-buttons {
    flex-direction: column;
  }

  .location-btn {
    min-width: 100%;
  }

  .transition-title {
    font-size: 2rem;
  }

  .transition-subtitle {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .question-card {
    padding: 25px 20px;
  }

  .question-header h1 {
    font-size: 1.8rem;
  }

  .question-title {
    font-size: 1.4rem;
  }

  .icon-circle {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .ai-icons {
    font-size: 4rem;
  }

  .transition-title {
    font-size: 1.8rem;
  }
}

/* ==================== 预算问题样式 ==================== */
.budget-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.budget-display {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.budget-value-item {
  flex: 1;
  text-align: center;
}

.budget-value-item label {
  display: block;
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 8px;
}

.budget-amount {
  font-size: 2rem;
  font-weight: 700;
  color: #0ea5e9;
}

.budget-slider-container {
  margin: 10px 0;
}

.budget-slider-wrapper {
  position: relative;
  height: 12px;
  margin: 15px 0;
}

.budget-slider-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  pointer-events: none;
}

.budget-slider-fill {
  position: absolute;
  top: 0;
  height: 12px;
  background: linear-gradient(90deg, #0ea5e9, #06b6d4);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.budget-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 12px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  pointer-events: none;
  margin: 0;
  padding: 0;
}

.budget-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: 3px solid #0ea5e9;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.4);
  transition: all 0.3s;
  pointer-events: auto;
}

.budget-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.6);
}

.budget-slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.budget-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: 3px solid #0ea5e9;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.4);
  transition: all 0.3s;
  pointer-events: auto;
}

.budget-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.6);
}

.budget-slider::-moz-range-thumb:active {
  transform: scale(1.1);
}

.budget-slider-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #64748b;
}

.budget-summary {
  background: linear-gradient(135deg, #e0f2fe, #dbeafe);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin: 15px 0;
}

.budget-summary-title {
  font-size: 0.95rem;
  color: #475569;
  margin-bottom: 10px;
  font-weight: 500;
}

.budget-summary-range {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.budget-summary-subtitle {
  font-size: 0.95rem;
  color: #64748b;
}

.question-buttons {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.back-btn,
.question-buttons .continue-btn {
  flex: 1;
  height: 50px !important;
  min-height: 50px !important;
  max-height: 50px !important;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0 24px !important;
}

.back-btn {
  background: white !important;
  border: 2px solid #e2e8f0 !important;
  color: #64748b !important;
}

.back-btn:hover {
  border-color: #cbd5e1 !important;
  background: #f8fafc !important;
}

.question-buttons .continue-btn {
  background: linear-gradient(135deg, #0ea5e9, #06b6d4) !important;
  border: none !important;
  color: white !important;
}

/* 响应式 - 预算问题 */
@media (max-width: 768px) {
  .budget-display {
    flex-direction: column;
    gap: 20px;
  }

  .budget-amount {
    font-size: 1.8rem;
  }

  .budget-summary-range {
    font-size: 2rem;
  }

  .question-buttons {
    flex-direction: column;
  }

  .back-btn,
  .question-buttons .continue-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .budget-amount {
    font-size: 1.5rem;
  }

  .budget-summary {
    padding: 20px;
  }

  .budget-summary-range {
    font-size: 1.8rem;
  }
}

/* 优先级问题样式 */
.priorities-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.priorities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.priority-card {
  position: relative;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.priority-card:hover {
  border-color: #0ea5e9;
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);
  transform: translateY(-2px);
}

.priority-card.selected {
  background: linear-gradient(135deg, #e0f2fe 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.25);
}

.priority-rank {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.4);
  z-index: 1;
}

.priority-icon {
  color: #64748b;
  transition: all 0.3s ease;
}

.priority-card.selected .priority-icon {
  color: #0ea5e9;
}

.priority-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

.priorities-hint {
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
  padding: 15px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

/* 响应式 - 优先级问题 */
@media (max-width: 768px) {
  .priorities-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .priority-card {
    padding: 16px;
  }
  
  .priority-icon svg {
    width: 32px;
    height: 32px;
  }
  
  .priority-label {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .priorities-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .priority-card {
    padding: 12px;
  }
  
  .priority-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .priority-label {
    font-size: 0.8rem;
  }
  
  .priority-rank {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}

/* 居住安排偏好问题样式 */
.living-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.living-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* 房型选择 */
.housing-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.housing-type-btn {
  padding: 12px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.housing-type-btn:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.housing-type-btn.selected {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: white;
}

/* 室友偏好 */
.roommate-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roommate-btn {
  padding: 12px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.roommate-btn:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.roommate-btn.selected {
  background: #e0f2fe;
  border-color: #0ea5e9;
  color: #0369a1;
}

/* 布局要求 */
.layout-subsection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layout-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
}

.layout-label svg {
  color: #94a3b8;
}

.layout-numbers {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.layout-number-btn {
  padding: 10px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.layout-number-btn:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.layout-number-btn.selected {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: white;
}

/* 响应式 - 居住安排偏好问题 */
@media (max-width: 768px) {
  .question-header-inline {
    gap: 12px;
  }
  
  .icon-circle-inline {
    width: 40px;
    height: 40px;
  }
  
  .icon-circle-inline svg {
    width: 20px;
    height: 20px;
  }
  
  .question-title-inline {
    font-size: 1.3rem;
  }
  
  .question-description-inline {
    font-size: 0.85rem;
  }
  
  .housing-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .layout-numbers {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .question-card {
    padding: 25px 20px;
    max-height: calc(100vh - 250px);
  }
  
  .question-header-inline {
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .icon-circle-inline {
    width: 36px;
    height: 36px;
  }
  
  .icon-circle-inline svg {
    width: 18px;
    height: 18px;
  }
  
  .question-title-inline {
    font-size: 1.1rem;
  }
  
  .question-description-inline {
    font-size: 0.8rem;
  }
  
  .living-form {
    gap: 15px;
  }
  
  .living-section {
    gap: 10px;
  }
  
  .section-title {
    font-size: 0.95rem;
  }
  
  .housing-type-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .housing-type-btn {
    padding: 10px 14px;
    font-size: 0.85rem;
  }
  
  .roommate-btn {
    padding: 10px 14px;
    font-size: 0.85rem;
  }
  
  .layout-numbers {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  
  .layout-number-btn {
    padding: 8px;
    font-size: 0.8rem;
  }
}

/* 时间线和租赁偏好问题样式 */
.timeline-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  display: block;
}

.timeline-select {
  width: 100%;
}

.timeline-summary {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #93c5fd;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.summary-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.summary-label {
  font-size: 0.95rem;
  color: #475569;
  font-weight: 600;
  flex-shrink: 0;
}

.summary-value {
  font-size: 1rem;
  color: #0c4a6e;
  font-weight: 700;
  text-align: right;
}

.find-home-btn {
  position: relative;
  overflow: hidden;
}

.find-home-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.find-home-btn:hover::before {
  left: 100%;
}

/* 响应式 - 时间线和租赁偏好问题 */
@media (max-width: 480px) {
  .timeline-form {
    gap: 15px;
  }
  
  .timeline-label {
    font-size: 0.95rem;
  }
  
  .timeline-summary {
    padding: 16px 18px;
    gap: 10px;
  }
  
  .summary-item {
    gap: 12px;
  }
  
  .summary-label {
    font-size: 0.85rem;
  }
  
  .summary-value {
    font-size: 0.9rem;
  }
}

/* AI分析加载页面样式 */
.analysis-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.analysis-container {
  max-width: 800px;
  width: 100%;
}

.analysis-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 15px;
}

.analysis-subtitle {
  font-size: 1.2rem;
  color: #7dd3fc;
  text-align: center;
  margin-bottom: 60px;
}

.analysis-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-step {
  background: rgba(51, 65, 85, 0.6);
  border: 2px solid rgba(71, 85, 105, 0.5);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

/* 待处理状态 */
.analysis-step.step-pending {
  background: rgba(51, 65, 85, 0.3);
  border-color: rgba(71, 85, 105, 0.3);
}

.analysis-step.step-pending .step-icon-wrapper {
  background: rgba(71, 85, 105, 0.5);
}

.analysis-step.step-pending .step-icon {
  color: #94a3b8;
}

.analysis-step.step-pending .step-label {
  color: #94a3b8;
}

/* 激活状态 - 蓝色高亮 */
.analysis-step.step-active {
  background: rgba(14, 165, 233, 0.1);
  border-color: #0ea5e9;
  box-shadow: 0 0 30px rgba(14, 165, 233, 0.3);
}

.analysis-step.step-active .step-icon-wrapper {
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);
}

.analysis-step.step-active .step-icon {
  color: white;
}

.analysis-step.step-active .step-label {
  color: white;
  font-weight: 600;
}

/* 完成状态 - 保持蓝色 */
.analysis-step.step-completed {
  background: rgba(14, 165, 233, 0.1);
  border-color: #0ea5e9;
}

.analysis-step.step-completed .step-icon-wrapper {
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
}

.analysis-step.step-completed .step-icon {
  color: white;
}

.analysis-step.step-completed .step-label {
  color: #e0f2fe;
}

.step-icon-wrapper {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;
}

.step-icon {
  transition: all 0.4s ease;
}

.step-label {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.4s ease;
}

.step-spinner {
  flex-shrink: 0;
  margin-left: auto;
}

.spinner {
  animation: spin 1s linear infinite;
  color: #0ea5e9;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 - AI分析页面 */
@media (max-width: 768px) {
  .analysis-title {
    font-size: 2rem;
  }
  
  .analysis-subtitle {
    font-size: 1rem;
    margin-bottom: 40px;
  }
  
  .analysis-steps {
    gap: 16px;
  }
  
  .analysis-step {
    padding: 16px 18px;
    gap: 12px;
  }
  
  .step-icon-wrapper {
    width: 48px;
    height: 48px;
  }
  
  .step-icon svg {
    width: 20px;
    height: 20px;
  }
  
  .step-label {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .analysis-title {
    font-size: 1.6rem;
  }
  
  .analysis-subtitle {
    font-size: 0.9rem;
    margin-bottom: 30px;
  }
  
  .analysis-steps {
    gap: 12px;
  }
  
  .analysis-step {
    padding: 14px 16px;
    gap: 10px;
  }
  
  .step-icon-wrapper {
    width: 44px;
    height: 44px;
  }
  
  .step-icon svg {
    width: 18px;
    height: 18px;
  }
  
  .step-label {
    font-size: 0.85rem;
  }
  
  .step-spinner svg {
    width: 20px;
    height: 20px;
  }
}
</style>
