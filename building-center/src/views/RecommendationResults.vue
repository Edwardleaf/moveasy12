<template>
  <div class="results-container">
    <!-- 顶部标题和用户偏好摘要 -->
    <div class="results-header">
      <div class="header-icon">✨</div>
      <h1 class="results-title">
        <TranslatedText text="Your Perfect Matches" :use-static="true" />
      </h1>
      <p class="results-subtitle">
        <TranslatedText 
          :text="`Our AI found ${recommendations.length} apartments that match your preferences`" 
          :use-static="true" 
        />
      </p>
    </div>

    <!-- 用户偏好摘要卡片 -->
    <div class="preferences-summary">
      <div class="summary-item">
        <span class="summary-label"><TranslatedText text="Location" :use-static="true" />:</span>
        <span class="summary-value">{{ userPreferences.location || 'Open to Suggestions' }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label"><TranslatedText text="Budget" :use-static="true" />:</span>
        <span class="summary-value">${{ userPreferences.budgetMin }}-${{ userPreferences.budgetMax }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label"><TranslatedText text="Beds" :use-static="true" />:</span>
        <span class="summary-value">{{ formatBedrooms }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label"><TranslatedText text="Lease" :use-static="true" />:</span>
        <span class="summary-value">{{ formatLease }}</span>
      </div>
    </div>

    <!-- 推荐卡片列表 -->
    <div class="recommendations-grid">
      <div 
        v-for="(rec, index) in recommendations" 
        :key="rec.building_id" 
        class="recommendation-card"
      >
        <!-- 建筑图片 -->
        <div class="card-image-container">
          <img 
            :src="getBuildingImage(rec)" 
            :alt="rec.name"
            class="card-image"
          />
          <div class="price-tag">
            <TranslatedText :text="formatPriceRange(rec)" :use-static="true" />
          </div>
          <button class="favorite-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        <!-- 建筑信息 -->
        <div class="card-content">
          <!-- 标题和地址 -->
          <h3 class="building-title">{{ rec.name }}</h3>
          <p class="building-address">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="location-icon">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ rec.address }}
          </p>

          <!-- 通勤时间 (如果用户提供了位置) -->
          <p v-if="userPreferences.coordinates" class="commute-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="clock-icon">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span v-if="getCommuteText(rec.building_id)">
              {{ getCommuteText(rec.building_id) }} <TranslatedText text="to your location" :use-static="true" />
            </span>
            <span v-else class="calculating">
              <TranslatedText text="Calculating..." :use-static="true" />
            </span>
          </p>

          <!-- 推荐理由 -->
          <div class="reasons-section">
            <h4 class="reasons-title">
              <TranslatedText text="Why this is a great match:" :use-static="true" />
            </h4>
            <ul class="reasons-list">
              <li v-for="(reason, idx) in rec.reasons" :key="idx" class="reason-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" class="check-icon">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{{ reason }}</span>
              </li>
              <!-- 如果没有理由，显示默认信息 -->
              <li v-if="!rec.reasons || rec.reasons.length === 0" class="reason-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" class="check-icon">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span><TranslatedText text="Matches your preferences" :use-static="true" /></span>
              </li>
            </ul>
          </div>

          <!-- 联系按钮 -->
          <button class="contact-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <TranslatedText text="Contact Building" :use-static="true" />
          </button>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="results-footer">
      <button class="refine-btn" @click="openRefineModal">
        <TranslatedText text="Not what you're looking for?" :use-static="true" />
      </button>
    </div>

    <!-- 细化偏好弹窗 - 分步骤流程 -->
    <n-modal
      v-model:show="showRefineModal"
      preset="card"
      :title="refineStep === 0 ? undefined : getRefineStepTitle()"
      style="width: 90%; max-width: 600px;"
      :bordered="false"
      size="huge"
      :segmented="true"
      :closable="refineStep === 0"
    >
      <div class="refine-modal-content">
        <!-- Step 0: 欢迎页面 -->
        <div v-if="refineStep === 0" class="refine-welcome">
          <h2 class="welcome-title">
            <TranslatedText text="Let's refine your search!" :use-static="true" />
          </h2>
          <p class="welcome-desc">
            <TranslatedText text="No problem — let's get to know what you are looking for a little better!" :use-static="true" />
          </p>
          <div class="welcome-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#3B82F6" stroke="#3B82F6" stroke-width="1.5"/>
            </svg>
          </div>
        </div>

        <!-- Step 1: 附加设施偏好 -->
        <div v-else-if="refineStep === 1" class="refine-step">
          <h3 class="refine-section-title">
            <TranslatedText text="Additional Amenities" :use-static="true" />
          </h3>
          <p class="refine-section-desc">
            <TranslatedText text="What are some additional amenities you'd love to have in your next apartment?" :use-static="true" />
          </p>
          <div class="amenities-grid">
            <label 
              v-for="amenity in amenityOptions" 
              :key="amenity.value"
              class="amenity-checkbox"
            >
              <input 
                type="checkbox" 
                :value="amenity.value"
                v-model="refinedPreferences.amenities"
              />
              <span>{{ translateText(amenity.label) }}</span>
            </label>
          </div>
          <n-input
            v-model:value="refinedPreferences.customAmenities"
            :placeholder="translateText('Other amenities (comma separated)')"
            class="custom-input"
          />
        </div>

        <!-- Step 2: 通勤偏好 -->
        <div v-else-if="refineStep === 2" class="refine-step">
          <h3 class="refine-section-title">
            <TranslatedText text="Commute Preference" :use-static="true" />
          </h3>
          <p class="refine-section-desc">
            <TranslatedText text="How close do you want your apartment to be from your main destination?" :use-static="true" />
          </p>
          <div class="commute-input-group">
            <label class="input-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="location-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <TranslatedText text="Destination" :use-static="true" />
            </label>
            <n-input
              v-model:value="refinedPreferences.commuteDestination"
              :placeholder="translateText('e.g., Stanford University, Google Campus')"
              class="commute-input"
            />
          </div>
          <div class="commute-time-slider">
            <label class="input-label">
              <TranslatedText text="Max Commute Time" :use-static="true" />
            </label>
            <div class="slider-container">
              <n-slider
                v-model:value="refinedPreferences.maxCommuteTime"
                :min="5"
                :max="120"
                :step="5"
                class="slider"
              />
              <div class="slider-value">{{ refinedPreferences.maxCommuteTime }} min</div>
            </div>
          </div>
        </div>

        <!-- Step 3: 其他需求 -->
        <div v-else-if="refineStep === 3" class="refine-step">
          <h3 class="refine-section-title">
            <TranslatedText text="Anything Else?" :use-static="true" />
          </h3>
          <p class="refine-section-desc">
            <TranslatedText text="Tell us anything else about your ideal apartment" :use-static="true" />
          </p>
          <n-input
            v-model:value="refinedPreferences.additionalNotes"
            :placeholder="translateText('e.g., studio, 2BR, furnished, high floor, south-facing...')"
            type="textarea"
            :autosize="{ minRows: 6, maxRows: 8 }"
            class="notes-input"
          />
        </div>
      </div>

      <!-- 弹窗底部按钮 -->
      <template #footer>
        <div class="modal-footer">
          <!-- 欢迎页面 -->
          <template v-if="refineStep === 0">
            <n-button type="primary" @click="nextRefineStep" class="lets-go-btn" block>
              <TranslatedText text="Let's Go!" :use-static="true" />
            </n-button>
          </template>
          
          <!-- 步骤页面 -->
          <template v-else>
            <n-button @click="prevRefineStep" class="back-btn-step" v-if="refineStep > 1">
              <TranslatedText text="Back" :use-static="true" />
            </n-button>
            <n-button 
              type="primary" 
              @click="refineStep === 3 ? submitRefinedPreferences() : nextRefineStep()" 
              class="continue-btn"
              :block="refineStep === 1"
            >
              <TranslatedText :text="refineStep === 3 ? 'Find My New Apartments' : 'Continue'" :use-static="true" />
            </n-button>
          </template>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NModal, NButton, NInput, NSlider, useMessage } from 'naive-ui'
import TranslatedText from '@/components/TranslatedText.vue'
import { useTranslation } from '@/composables/useTranslation'
import { getCommuteTime, TRANSPORT_MODES } from '@/utils/commuteCalculator'

const router = useRouter()
const route = useRoute()
const { translateText } = useTranslation()
const message = useMessage()

const recommendations = ref([])
const userPreferences = ref({})
const commuteTimes = ref({}) // 存储每个建筑的通勤时间
const showRefineModal = ref(false) // 控制细化偏好弹窗
const refineStep = ref(0) // 细化偏好当前步骤：0=欢迎，1=设施，2=通勤，3=其他

// 细化偏好数据
const refinedPreferences = ref({
  amenities: [],
  customAmenities: '',
  commuteDestination: '',
  maxCommuteTime: 30,
  additionalNotes: ''
})

// 设施选项
const amenityOptions = [
  { value: 'in_unit_laundry', label: 'In-unit laundry' },
  { value: 'full_function_gym', label: 'Full-function gym' },
  { value: 'covered_garage', label: 'Covered garage' },
  { value: 'swimming_pool', label: 'Swimming pool' },
  { value: 'dog_park', label: 'Dog park' },
  { value: '24_hour_front_desk', label: '24-hour front desk' },
  { value: 'rooftop_lounge', label: 'Rooftop lounge' },
  { value: 'co_working_space', label: 'Co-working space' },
  { value: 'package_locker', label: 'Package locker' }
]

onMounted(async () => {
  // 从路由状态获取推荐结果
  if (route.params.data) {
    const data = JSON.parse(decodeURIComponent(route.params.data))
    recommendations.value = data.recommendations || []
    userPreferences.value = data.userPreferences || {}
    
    console.log('📍 用户偏好:', userPreferences.value)
    console.log('📍 用户坐标:', userPreferences.value.coordinates)
    
    // 如果用户提供了位置坐标，计算通勤时间
    if (userPreferences.value.coordinates) {
      console.log('🚗 开始计算通勤时间...')
      await calculateAllCommuteTimes()
    } else {
      console.warn('⚠️ 没有用户坐标，无法计算通勤时间')
    }
  }
})

// 计算所有建筑的通勤时间
const calculateAllCommuteTimes = async () => {
  const origin = userPreferences.value.coordinates
  console.log('🎯 起点坐标:', origin)
  
  if (!origin || !origin.lat || !origin.lon) {
    console.warn('⚠️ 起点坐标无效:', origin)
    return
  }
  
  for (const rec of recommendations.value) {
    const buildingCoords = {
      lat: rec.data.lat,
      lon: rec.data.lon
    }
    
    console.log(`🏢 建筑 ${rec.name} 坐标:`, buildingCoords)
    
    if (buildingCoords.lat && buildingCoords.lon) {
      try {
        // 计算驾车时间
        console.log(`⏱️ 正在计算到 ${rec.name} 的通勤时间...`)
        const result = await getCommuteTime(origin, buildingCoords, TRANSPORT_MODES.DRIVING)
        console.log(`✅ ${rec.name} 通勤时间:`, result)
        if (result) {
          commuteTimes.value[rec.building_id] = result
        }
      } catch (error) {
        console.error(`❌ 计算 ${rec.name} 通勤时间失败:`, error)
      }
    }
  }
  
  console.log('🎉 所有通勤时间:', commuteTimes.value)
}

// 获取建筑的通勤时间文本
const getCommuteText = (buildingId) => {
  const commuteInfo = commuteTimes.value[buildingId]
  if (commuteInfo) {
    // 返回原始数据，让模板处理翻译
    return commuteInfo.durationText
  }
  return null // 如果没有数据，返回null
}

// 检查是否正在计算通勤时间
const isCalculatingCommute = computed(() => {
  return userPreferences.value.coordinates && Object.keys(commuteTimes.value).length === 0
})

const formatBedrooms = computed(() => {
  const bedrooms = userPreferences.value.bedrooms
  if (!bedrooms || bedrooms.length === 0) return 'Flexible'
  if (bedrooms.includes('Flexible')) return 'Flexible'
  return bedrooms.join(', ')
})

const formatLease = computed(() => {
  const timeline = userPreferences.value.moveInTimeline
  const term = userPreferences.value.leaseTerm
  if (timeline && term) {
    return `${timeline}, ${term}`
  }
  return timeline || term || 'Flexible'
})

const getBuildingImage = (rec) => {
  // 从county和building_id构建图片路径
  const county = rec.county || 'san_francisco'
  // building_id格式是 "building_0001"，需要去掉 "building_0" 保留后面的数字
  const buildingNum = rec.building_id.replace('building_0', '').padStart(3, '0')
  return `/images/buildings/${county}/building_${buildingNum}.jpg`
}

const formatPriceRange = (rec) => {
  // 尝试从多个来源获取价格信息
  const pricing = rec.data?.pricing || rec.pricing
  
  // 检查pricing字段
  if (pricing && pricing !== '') {
    if (typeof pricing === 'string') {
      // 如果已经是格式化的字符串（例如："$1,580 - $5,290"）
      if (pricing.includes('$')) {
        return pricing
      }
    }
  }
  
  // 尝试从rentcast_data获取
  const rentcastData = rec.data?.rentcast_data || []
  if (rentcastData && rentcastData.length > 0) {
    const rents = rentcastData
      .map(r => r.rent)
      .filter(r => r && r > 0)
      .sort((a, b) => a - b)
    
    if (rents.length > 0) {
      const minRent = Math.min(...rents)
      const maxRent = Math.max(...rents)
      if (minRent === maxRent) {
        return `$${minRent.toLocaleString()}/mo`
      } else {
        return `$${minRent.toLocaleString()} - $${maxRent.toLocaleString()}/mo`
      }
    }
  }
  
  // 都没有，显示"联系询价"
  return 'Contact for Price'
}

const goBack = () => {
  router.push('/')
}

// 获取当前步骤标题
const getRefineStepTitle = () => {
  const titles = {
    1: 'Additional Amenities',
    2: 'Commute Preference',
    3: 'Anything Else?'
  }
  return titles[refineStep.value] || 'Refine Your Preferences'
}

// 下一步
const nextRefineStep = () => {
  if (refineStep.value < 3) {
    refineStep.value++
  }
}

// 上一步
const prevRefineStep = () => {
  if (refineStep.value > 1) {
    refineStep.value--
  }
}

// 打开弹窗时重置步骤
const openRefineModal = () => {
  refineStep.value = 0
  showRefineModal.value = true
}

// 提交细化偏好
const submitRefinedPreferences = async () => {
  console.log('🔍 提交细化偏好:', refinedPreferences.value)
  
  // 验证输入
  if (!refinedPreferences.value.commuteDestination && 
      refinedPreferences.value.amenities.length === 0 && 
      !refinedPreferences.value.customAmenities && 
      !refinedPreferences.value.additionalNotes) {
    message.warning(translateText('Please fill in at least one preference'))
    return
  }
  
  // 准备细化偏好请求数据
  const refinedRequestData = {
    // 原始偏好（保留用户之前的选择）
    original: {
      location: userPreferences.value.location,
      coordinates: userPreferences.value.coordinates,
      budgetMin: userPreferences.value.budgetMin,
      budgetMax: userPreferences.value.budgetMax
    },
    // 细化偏好
    refined: {
      amenities: refinedPreferences.value.amenities,
      customAmenities: refinedPreferences.value.customAmenities,
      commuteDestination: refinedPreferences.value.commuteDestination,
      maxCommuteTime: refinedPreferences.value.maxCommuteTime,
      additionalNotes: refinedPreferences.value.additionalNotes
    },
    // 标记这是细化请求
    isRefinement: true
  }
  
  try {
    message.loading('Analyzing your refined preferences...', { duration: 0, key: 'refining' })
    
    // 调用后端API
    const response = await fetch('http://localhost:5001/api/ai/recommend/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refinedRequestData)
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const result = await response.json()
    message.destroyAll()
    
    if (result.success && result.recommendations) {
      message.success(`Found ${result.recommendations.length} new recommendations!`)
      
      // 更新推荐结果
      recommendations.value = result.recommendations
      
      // 重置步骤并关闭弹窗
      refineStep.value = 0
      showRefineModal.value = false
      
      // 重置偏好数据（可选）
      refinedPreferences.value = {
        amenities: [],
        customAmenities: '',
        commuteDestination: '',
        maxCommuteTime: 30,
        additionalNotes: ''
      }
      
      // 重新计算通勤时间
      if (userPreferences.value.coordinates) {
        commuteTimes.value = {}
        await calculateAllCommuteTimes()
      }
      
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      throw new Error('Invalid API response')
    }
  } catch (error) {
    console.error('❌ 细化偏好请求失败:', error)
    message.destroyAll()
    message.error(`Request failed: ${error.message}`)
  }
}
</script>

<style scoped>
.results-container {
  min-height: 100vh;
  background: #ffffff;
  padding: 2rem 1rem;
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: none; /* 隐藏星星图标 */
}

.results-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.results-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
}

.preferences-summary {
  max-width: 1000px;
  margin: 0 auto 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.summary-item {
  flex: 1;
  min-width: 200px;
}

.summary-label {
  font-weight: 600;
  color: #4b5563;
  margin-right: 0.5rem;
}

.summary-value {
  color: #1f2937;
}

.recommendations-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.recommendation-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.recommendation-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.card-image-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.price-tag {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  color: #1f2937;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.favorite-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.favorite-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.card-content {
  padding: 1.5rem;
}

.building-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.building-address {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}

.location-icon {
  flex-shrink: 0;
}

.commute-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.clock-icon {
  flex-shrink: 0;
}

.calculating {
  opacity: 0.7;
  font-style: italic;
}

.reasons-section {
  margin: 1.5rem 0;
}

.reasons-title {
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.75rem;
}

.reasons-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.reason-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.5;
}

.check-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.contact-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.contact-btn:hover {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.results-footer {
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.refine-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.refine-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 细化偏好弹窗样式 */
.refine-modal-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 1rem 0;
}

/* 欢迎页面样式 */
.refine-welcome {
  text-align: center;
  padding: 2rem 0;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.welcome-desc {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.welcome-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
}

/* 步骤页面样式 */
.refine-step {
  padding: 0.5rem 0;
}

.refine-section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.refine-section-desc {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.amenity-checkbox {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.amenity-checkbox:hover {
  background: #f3f4f6;
  border-color: #667eea;
}

.amenity-checkbox input[type="checkbox"] {
  margin-right: 0.5rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.amenity-checkbox input[type="checkbox"]:checked + span {
  color: #667eea;
  font-weight: 600;
}

.custom-input,
.commute-input {
  margin-top: 0.5rem;
}

.commute-time-slider {
  margin-top: 1rem;
}

.commute-time-slider label {
  display: block;
  font-size: 0.95rem;
  color: #4b5563;
  margin-bottom: 1rem;
}

.commute-time-slider strong {
  color: #667eea;
  font-size: 1.1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn, .submit-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.back-btn {
  padding: 1rem 2rem;
  background: #f3f4f6;
  color: #1f2937;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .results-container {
    padding: 1rem 0.5rem;
  }

  .results-title {
    font-size: 2rem;
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .preferences-summary {
    flex-direction: column;
    gap: 1rem;
  }

  .summary-item {
    min-width: auto;
  }
}
</style>
