<template>
  <div class="page-container">
    <!-- 地图容器 - 全屏 -->
    <div class="map-wrapper" @mouseleave="handleMapMouseLeave">
      <LMap
      ref="map"
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
      class="leaflet-map"
      @ready="onMapReady"
    >
      <LTileLayer
        :url="tileUrl"
        :attribution="attribution"
        :options="tileOptions"
      />
      
      <!-- 纽约五大区真实边界 (GeoJSON) -->
      <LGeoJson
        v-if="nycBoroughsGeoJSON"
        :geojson="nycBoroughsGeoJSON"
        :options="{
          style: getFeatureStyle,
          onEachFeature: onEachFeature
        }"
        @ready="onGeoJsonReady"
      />
      
      <!-- 备用多边形 (如果GeoJSON加载失败) -->
      <LPolygon
        v-else
        v-for="district in nyDistricts"
        :key="district.id"
        :lat-lngs="district.boundaries"
        :options="district.style"
      >
        <LPopup :content="district.popup" />
      </LPolygon>
      
      <!-- 社区信息标记 -->
      <LMarker
        v-for="community in communityData"
        :key="community.id"
        :lat-lng="community.position"
        :options="{ 
          title: community.name,
          riseOnHover: true
        }"
      >
        <LPopup>
          <div class="community-popup">
            <h3 class="community-name">{{ community.name }}</h3>
            <div class="community-details">
              <div class="rent-info">
                <strong>{{ getStaticText('平均租金') }}:</strong> {{ community.avgRent }}/{{ getStaticText('月') }}
                <br>
                <small>{{ getStaticText('范围') }}: {{ community.rentRange }}</small>
              </div>
              <div class="walk-score">
                <strong>{{ getStaticText('步行指数') }}:</strong> {{ community.walkScore }}/100
              </div>
              <div class="distance">
                <strong>{{ getStaticText('距离') }}:</strong> {{ community.distance }}
              </div>
              <div class="description">
                {{ community.description }}
              </div>
              <div class="tags">
                <span 
                  v-for="tag in community.tags" 
                  :key="tag" 
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </LPopup>
      </LMarker>
      
      <!-- 地标点 -->
      <LMarker
        v-for="marker in markers"
        :key="marker.id"
        :lat-lng="marker.position"
        :options="marker.options"
      >
        <LPopup :content="marker.popup" />
      </LMarker>
    </LMap>
    </div>
    
    <!-- 底部搜索框 - 100%宽度单行 -->
    <div class="bottom-search-container">
      <!-- 全宽度单行搜索栏 - 新布局: type-location-input-icon -->
      <div class="search-bar">
        <!-- 搜索输入框组 (包含type dropdown + location icon + input + search icon) -->
        <div class="search-input-group">
          <!-- AI助手按钮 - 最左侧 -->
          <div class="ai-assistant-btn" 
               @click="openAIChat" 
               @mouseenter="handleAIButtonHover"
               title="AI找房助手">
            <img src="@/assets/images/robot.png" alt="AI助手" class="ai-icon" />
          </div>
          
          <!-- 定位图标 - 左侧圆角 -->
          <div class="location-icon-left" @click="handleLocationClick">
            <img src="@/assets/images/location.svg" width="20" height="20" alt="location" />
          </div>
          
          <!-- 搜索输入框 -->
          <div class="search-input-wrapper">
            <!-- 内容容器：包含关键词 + 输入框 -->
            <div class="search-content-container">
              <!-- 关键词标签区域 -->
              <div v-if="searchKeywords.length > 0" class="keywords-area">
                <span 
                  v-for="(keyword, index) in searchKeywords" 
                  :key="index"
                  :class="['keyword-tag', `keyword-${keyword.type}`]"
                >
                  <span class="keyword-tag-text" :title="keyword.text">
                    <TranslatedText :text="keyword.text" />
                  </span>
                  <button 
                    class="keyword-remove"
                    @click.stop="removeKeyword(index)"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              </div>
              <!-- 输入区域 -->
              <div class="input-area">
                <input 
                  type="text" 
                  :placeholder="getPlaceholderText()"
                  class="location-input"
                  :disabled="searchKeywords.length >= 3"
                  v-model="currentInputValue"
                  @keyup.enter="addKeyword"
                  @focus="handleInputFocus"
                  @blur="handleInputBlur"
                  @input="handleInputChange"
                  ref="searchInput"
                />
              </div>
            </div>
          </div>
          
          <!-- 推荐框 -->
          <div v-if="showRecommendations" :class="['recommendations-dropdown', `dropdown-${dropdownDirection}`]" ref="recommendationsDropdown">
            <div class="recommendations-content">
              <!-- 热门搜索标题 -->
              <div class="recommendations-header">
                <h3 class="recommendations-title">
                  <TranslatedText text="热门搜索" :use-static="true" />
                </h3>
              </div>
              
              <!-- 搜索结果 -->
              <div v-if="currentInputValue.trim()" class="search-results">
                <div v-if="filteredRecommendations.universities.length > 0" class="recommendation-section">
                  <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 0 5-1 8-1s5 1 8 1v-5"/>
                    </svg>
                    <span class="section-label">
                      <TranslatedText text="School" :use-static="true" />
                    </span>
                  </div>
                  <div class="items-grid">
                    <span 
                      v-for="university in filteredRecommendations.universities.slice(0, 8)" 
                      :key="university.id"
                      class="item-chip"
                      :title="getStaticText(university.name)"
                      @mousedown="selectRecommendation(university.name)"
                    >
                      {{ getStaticText(university.name) }}
                    </span>
                  </div>
                </div>
                
                <div v-if="filteredRecommendations.cities.length > 0" class="recommendation-section">
                  <div class="section-divider"></div>
                  <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span class="section-label">
                      <TranslatedText text="City" :use-static="true" />
                    </span>
                  </div>
                  <div class="items-grid">
                    <span 
                      v-for="city in filteredRecommendations.cities.slice(0, 12)" 
                      :key="city.id"
                      class="item-chip"
                      :title="getStaticText(city.name)"
                      @mousedown="selectRecommendation(city.name)"
                    >
                      {{ getStaticText(city.name) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- 默认推荐 -->
              <div v-else class="default-recommendations">
                <div class="recommendation-section">
                  <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span class="section-label">
                      <TranslatedText text="City" :use-static="true" />
                    </span>
                  </div>
                  <div class="items-grid">
                    <span 
                      v-for="city in defaultRecommendations.cities" 
                      :key="city.id"
                      class="item-chip"
                      :title="getStaticText(city.name)"
                      @mousedown="selectRecommendation(city.name)"
                    >
                      {{ getStaticText(city.name) }}
                    </span>
                  </div>
                </div>
                
                <div class="recommendation-section">
                  <div class="section-divider"></div>
                  <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 0 5-1 8-1s5 1 8 1v-5"/>
                    </svg>
                    <span class="section-label">
                      <TranslatedText text="School" :use-static="true" />
                    </span>
                  </div>
                  <div class="items-grid">
                    <span 
                      v-for="university in defaultRecommendations.universities" 
                      :key="university.id"
                      class="item-chip"
                      :title="getStaticText(university.name)"
                      @mousedown="selectRecommendation(university.name)"
                    >
                      {{ getStaticText(university.name) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 搜索按钮 - 右侧圆角 -->
          <button class="search-button" @click="performSearch">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>


        </div>
        
        <!-- 筛选标签 - 弹性布局，支持左右滑动 -->
        <div class="filter-tags-container">
          <div class="filter-tags" ref="filterTags">
            <!-- 显示部分标签 -->
            <span 
              v-for="tag in visibleTags" 
              :key="tag.value"
              :class="['filter-tag', { active: selectedTags.includes(tag.value) }]"
              @click="toggleTag(tag.value)"
            >
              {{ getStaticText(tag.value) }}
            </span>
            
            <!-- 更多按钮（如果有隐藏的标签） -->
            <span 
              v-if="hiddenTags.length > 0"
              class="filter-tag more-tag"
              @click="openTagsModal"
            >
              +{{ hiddenTags.length }}
            </span>
            
            <!-- 筛选图标 - 最右侧| 暂时注释用 +N 代替 -->
            <!-- <div class="filter-icon" @click="handleFilterIconClick">
              <img src="@/assets/images/fliter.svg" width="25" height="23" alt="filter" />
            </div> -->
          </div>
        </div>
        
        <!-- 640-500px范围的移动端+N按钮 -->
        <div class="filter-tags-container mobile-only">
          <button 
            class="mobile-filter-btn"
            @click="openTagsModal"
          >
            +{{ availableFilterTags.length }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 标签选择模态框 -->
    <div v-if="showTagsModal" class="tags-modal-overlay" @click="showTagsModal = false">
      <div :class="['tags-modal', `modal-${modalPosition}`]" @click.stop>
        <div class="modal-header">
          <h3>{{ getStaticText('选择标签') }}</h3>
          <button class="modal-close" @click="showTagsModal = false">&times;</button>
        </div>
        <div class="modal-content">
          <div class="tags-grid">
            <span 
              v-for="tag in availableFilterTags" 
              :key="tag.value"
              :class="['modal-tag', { active: selectedTags.includes(tag.value) }]"
              @click="toggleTag(tag.value)"
            >
              {{ getStaticText(tag.value) }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-confirm" @click="showTagsModal = false">{{ getStaticText('确定') }}</button>
        </div>
      </div>
    </div>
    
    <!-- AI聊天助手弹窗 -->
    <StepByStepChat 
      v-if="showAIChat"
      @close="closeAIChat"
      @recommendations="handleAIRecommendations"
      @view-on-map="handleViewOnMap"
    />
    
    <!-- 视频介绍模态框 -->
    <VideoIntroModal 
      :visible="showVideoModal"
      :auto-close="videoAutoCloseTime"
      @close="closeVideoModal"
    />
    
    <!-- AI助手提示卡片 -->
    <div class="ai-tip-wrapper">
      <AIAssistantTip 
        :visible="showAITip"
        :auto-hide="5000"
        @close="closeAITip"
      />
    </div>
    
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup, LPolygon, LGeoJson } from "@vue-leaflet/vue-leaflet";
import osmtogeojson from 'osmtogeojson';
import simplify from '@turf/simplify';

// 导入AI聊天组件
import StepByStepChat from './StepByStepChat.vue';
import VideoIntroModal from './VideoIntroModal.vue';
import AIAssistantTip from './AIAssistantTip.vue';

// 导入外部数据文件
import { mapConfig } from '@/data/mapConfig.js';
// 导入官方NYC社区区域数据
import ntaData from '@/data/NTA.json';
// 导入社区标签映射
import { getDefaultLabel } from '@/data/communityLabels.js';
// 导入数据服务
import { dataService } from '@/services/dataService.js';
// 导入推荐数据
import { getSearchRecommendations, searchRecommendationData } from '@/data/recommendationsData.js';
import TranslatedText from './TranslatedText.vue';
import useTranslation from '@/composables/useTranslation';

export default {
  name: 'OpenStreetMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LPolygon,
    LGeoJson,
    TranslatedText,
    StepByStepChat,
    VideoIntroModal,
    AIAssistantTip
  },
  props: {
    initialSearchParams: {
      type: Object,
      default: () => null
    }
  },
  emits: ['zoom-change', 'search-performed', 'filter-clicked'],
  data() {
    return {
      // Koreatown 中心 (韩国城)
      center: [40.7505, -73.9863],
      zoom: 14,
      
      // OpenStreetMap 瓦片服务
      tileUrl: mapConfig.tileLayer.url,
      attribution: mapConfig.tileLayer.attribution,
      
      // 地图配置
      mapOptions: mapConfig.mapOptions,
      
      // 瓦片层配置
      tileOptions: mapConfig.tileOptions,
      
      // NYC社区区域数据 (NTA数据)
      nycBoroughsGeoJSON: ntaData,
      
      // 地图容器DOM引用
      mapContainer: null,
      
      // 全局鼠标事件处理函数引用
      handleGlobalMouseOver: null,
      
      // AI聊天助手相关状态
      showAIChat: false,
      aiRecommendations: [],
      highlightedCommunities: [],
      
      // 视频模态框状态
      showVideoModal: false,
      videoAutoCloseTime: 0,
      
      // AI提示卡片状态
      showAITip: false,
      
      // 显示控制策略
      displayStrategy: 'first_visit', // 'first_visit', 'always_show', 'smart_trigger'
      hasSeenVideo: false,
      userIdleTimer: null,
      userActivityTimeout: 10000, // 10秒无操作显示视频
      
      // 默认颜色配置
      boroughColors: {
        'Manhattan': { color: '#FF6B6B', fillColor: '#FF6B6B', fillOpacity: 0.2 },
        'Brooklyn': { color: '#4ECDC4', fillColor: '#4ECDC4', fillOpacity: 0.2 },
        'Queens': { color: '#45B7D1', fillColor: '#45B7D1', fillOpacity: 0.2 },
        'Bronx': { color: '#96CEB4', fillColor: '#96CEB4', fillOpacity: 0.2 },
        'Staten Island': { color: '#FECA57', fillColor: '#FECA57', fillOpacity: 0.2 }
      },
      
      // POI 标签颜色映射表 - 优化配色方案
      tagColorMap: {
        quiet: '#CAB8D9',      // 宁静社区 – 柔和灰紫，安静、低饱和
        nightlife: '#C34A45',  // 夜生活 – 深砖红，更有能量感
        shopping: '#EE9B3B',   // 购物区 – 明亮南瓜橙，醒目但不刺眼
        dining: '#B07AD6',     // 餐饮区 – 中度紫，和quiet灰紫区分明显
        arts: '#FF9DB1',       // 艺术区 – 清爽樱花粉，较原色稍深以增强可读性
        parks: '#3FAA4C',      // 公园绿地 – 经典草绿，饱和度中等，和quiet灰紫对比足
        default: 'transparent' // 默认透明 - 测试是否支持不绘制
      },
      
      // Info 控件引用
      infoControl: null,
      
      // GeoJSON 图层引用
      geojsonLayer: null,
      
      // 社区数据
      communityData: [],
      markers: [],
      
      // 悬浮卡片相关
      hoverCardElement: null,
      hoverCardPixelWidth: 0,
      lastPointerPosition: null,
      isCardVisible: false,
      
      // 搜索框输入
      searchLocation: '',
      searchKeywords: [], // 存储关键词对象数组 { text: string, type: 'user'|'location'|'map' }
      currentInputValue: '', // 当前输入值
      
      
      // 筛选标签相关
      selectedTags: [],
      availableFilterTags: [], // 将从数据库动态加载
      showTagsModal: false, // 模态框显示状态
      
      // 弹出方向控制
      dropdownDirection: 'down', // 'up' 或 'down'
      modalPosition: 'bottom', // 'top' 或 'bottom'
      
      // 推荐框相关
      showRecommendations: false,
      defaultRecommendations: getSearchRecommendations(),
      filteredRecommendations: {
        universities: [],
        cities: [],
        keywords: []
      },
      
      // 性能优化
      resizeTimer: null,
    };
  },
  computed: {
    // 根据屏幕宽度精确计算可见标签数量
    visibleTagsCount() {
      if (typeof window === 'undefined') return this.availableFilterTags.length;
      
      const width = window.innerWidth;
      
      // 小屏（≤500px）显示0个标签，使用+N按钮
      if (width <= 500) return 0;
      
      // 中等屏幕（500-640px）显示0个标签，使用mobile +N按钮
      if (width <= 640) return 0;
      
      // 860px及以下只显示1个标签
      if (width <= 860) return 1;
      
      // 1600px以上显示最多9个标签
      if (width >= 1600) return Math.min(9, this.availableFilterTags.length);
      
      // 1600px以下按每150px减少2个标签规则计算
      const baseWidth = 1600;
      const baseTagCount = 9;
      const pixelStep = 150;
      const tagReduction = 2;
      
      const widthDiff = baseWidth - width;
      const steps = Math.floor(widthDiff / pixelStep);
      const calculatedTags = baseTagCount - (steps * tagReduction);
      
      // 确保至少显示1个标签，最多显示总标签数量
      return Math.max(1, Math.min(calculatedTags, this.availableFilterTags.length));
    },
    
    // 可见的标签
    visibleTags() {
      return this.availableFilterTags.slice(0, this.visibleTagsCount);
    },
    
    // 隐藏的标签
    hiddenTags() {
      return this.availableFilterTags.slice(this.visibleTagsCount);
    }
  },
  watch: {
    // 监听props变化，重新初始化
    initialSearchParams: {
      handler(newParams) {
        console.log('🔧 Props changed, reinitializing:', newParams);
        this.initializeFromProps();
      },
      deep: true,
      immediate: false // 不需要immediate，因为mounted已经调用了initializeFromProps
    },
    '$route'() {
      // 路由变化时强制清理所有tooltip
      this.hideHoverCard();
      this.forceCleanupTooltips();
    }
  },
  async mounted() {
    this.initializeLeafletIcons();
    
    // 🧪 测试透明效果 - 临时去掉中心3个区域数据
    // this.testTransparencyEffect(); // 已禁用测试，显示所有区域
    
    // 初始化显示策略
    this.initializeDisplayStrategy();
    
    this.enhanceGeoJSONData();
    
    // 🔍 调试：检查加载的NTA数据
    this.logNTADataStats();
    
    // 添加全局点击事件监听
    document.addEventListener('click', this.handleGlobalClick);
    
    // 添加地图容器mouseleave事件监听，确保鼠标离开地图时隐藏tooltip
    this.$nextTick(() => {
      const mapContainer = this.$refs.map?.$el;
      if (mapContainer) {
        mapContainer.addEventListener('mouseleave', this.hideHoverCard);
        // 保存引用用于清理
        this.mapContainer = mapContainer;
      }
    });
    
    // 添加全局mouseover事件监听，当鼠标移动到地图外的其他元素时隐藏tooltip
    this.handleGlobalMouseOver = (e) => {
      // 检查鼠标是否在地图容器外
      if (this.mapContainer && !this.mapContainer.contains(e.target)) {
        this.hideHoverCard();
        // 额外的安全措施：如果鼠标移动到导航栏、页脚、搜索栏或其他主要区域，强制清理
        if (e.target.closest('nav, .navbar-container, .bottom-search-container, footer, .content-section, .hero-section')) {
          this.forceCleanupTooltips();
        }
      }
    };
    document.addEventListener('mouseover', this.handleGlobalMouseOver, { passive: true });
    
    // 初始化filter tags滚动功能
    this.$nextTick(() => {
      this.initializeFilterTagsScroll();
    });

    // 初始化来自props的搜索参数
    this.initializeFromProps();
    
    
    // 加载筛选标签数据
    this.loadFilterTags();
    
    // 添加窗口大小变化监听器
    this.handleResize = () => {
      // 防抖处理，避免频繁计算
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        // 强制更新computed属性以重新计算可见标签数量
        this.$forceUpdate();
        // 重新检测弹出方向
        this.detectDropdownDirection();
        // 更新滚动指示器
        this.$nextTick(() => {
          this.updateScrollIndicators();
        });
      }, 100);
    };
    window.addEventListener('resize', this.handleResize);
    
    // 初始检测弹出方向
    this.$nextTick(() => {
      this.detectDropdownDirection();
    });
  },
  beforeUnmount() {
    // 强制清理所有tooltip残留
    this.forceCleanupTooltips();
    
    // 清理悬浮卡片
    if (this.hoverCardElement) {
      document.body.removeChild(this.hoverCardElement);
      this.hoverCardElement = null;
    }
    
    // 移除全局点击事件监听
    document.removeEventListener('click', this.handleGlobalClick);
    
    // 移除全局mouseover事件监听
    if (this.handleGlobalMouseOver) {
      document.removeEventListener('mouseover', this.handleGlobalMouseOver);
      this.handleGlobalMouseOver = null;
    }
    
    // 移除地图容器mouseleave事件监听
    if (this.mapContainer) {
      this.mapContainer.removeEventListener('mouseleave', this.hideHoverCard);
      this.mapContainer = null;
    }
    
    // 清理resize监听器和定时器
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    
    // 移除filter tags滚动监听器
    const container = this.$refs.filterTags;
    if (container) {
      container.removeEventListener('scroll', this.updateScrollIndicators);
    }
    window.removeEventListener('resize', this.updateScrollIndicators);
    
    // 清理窗口大小变化监听器
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
  },
  setup() {
    const { getStaticText } = useTranslation();
    return {
      getStaticText
    };
  },
  methods: {
    // 处理鼠标离开地图容器
    handleMapMouseLeave() {
      this.hideHoverCard();
      this.forceCleanupTooltips();
    },

    // 🧪 测试透明效果 - 去掉曼哈顿中心3个区域数据
    testTransparencyEffect() {
      console.log('🧪 测试开始：去掉中心3个区域数据，验证透明效果');
      
      const testAreasToRemove = [
        "Hell's Kitchen",                        // 地狱厨房
        "Midtown-Times Square",                  // 中城-时代广场  
        "East Midtown-Turtle Bay"                // 东中城-龟湾
      ];
      
      // 过滤掉测试区域的数据
      if (this.nycBoroughsGeoJSON && this.nycBoroughsGeoJSON.features) {
        const originalCount = this.nycBoroughsGeoJSON.features.length;
        
        this.nycBoroughsGeoJSON.features = this.nycBoroughsGeoJSON.features.filter(feature => {
          const ntaName = feature.properties.NTAName;
          const shouldRemove = testAreasToRemove.includes(ntaName);
          
          if (shouldRemove) {
            console.log(`🗑️ 移除测试区域: ${ntaName}`);
          }
          
          return !shouldRemove;
        });
        
        const newCount = this.nycBoroughsGeoJSON.features.length;
        console.log(`📊 区域数据: ${originalCount} → ${newCount} (移除了 ${originalCount - newCount} 个区域)`);
        console.log(`💡 这些区域现在应该显示为透明/不绘制（如果transparent有效）`);
      }
    },
    
    onMapReady() {
      // 添加比例尺控件到右下角
      if (window.L) {
        window.L.control.scale({
          position: 'bottomright',
          metric: true,
          imperial: false
        }).addTo(this.$refs.map.leafletObject);
        
        // 监听zoom变化并记录
        this.$refs.map.leafletObject.on('zoomend', () => {
          const currentZoom = this.$refs.map.leafletObject.getZoom();
          console.log(`🔍 当前Zoom级别: ${currentZoom}`);
          // Emit zoom change to parent
          this.$emit('zoom-change', currentZoom);
        });
        
        // 记录初始zoom
        console.log(`📍 地图初始化 - 中心点: Koreatown, 初始Zoom: ${this.zoom}`);
      }
    },
    
    // 根据feature.properties.tag返回填充颜色
    getFillColor(feature) {
      const tag = feature.properties.tag || 'default'; // 没有tag使用default（透明）
      const color = this.tagColorMap[tag] || this.tagColorMap.default;
      return color;
    },
    
    // 简单的hash函数，确保相同输入总是产生相同输出
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      return hash;
    },

    // 检查字符串是否为有效的UUID格式
    isValidUUID(str) {
      if (!str || typeof str !== 'string') {
        return false;
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    },
    
    // 初始化信息卡片控件
    initInfoControl() {
      if (!window.L || this.infoControl) return;
      
      this.infoControl = window.L.control({ position: 'topright' });
      
      this.infoControl.onAdd = () => {
        const div = window.L.DomUtil.create('div', 'info-card');
        div.style.cssText = `
          padding: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-family: Arial, sans-serif;
          min-width: 200px;
        `;
        this.infoControl._div = div;
        return div;
      };
      
      this.infoControl.update = (props) => {
        if (this.infoControl._div) {
          if (props) {
            const feature = {properties: props};
            const fillColor = this.getFillColor(feature);
            // 获取推断的标签
            const inferredTag = this.getInferredTag(props);
            
            this.infoControl._div.innerHTML = `
              <div class="info-content">
                <strong>${props.name || props.NTAName || props.BoroCD || this.getStaticText('未知社区')}</strong><br>
                <span style="color: ${fillColor}; font-weight: bold;">
                  ${this.getTagDisplayName(inferredTag)}
                </span><br>
                <small>${this.getStaticText('点击查看详情')}</small>
              </div>`;
          } else {
            this.infoControl._div.innerHTML = `<div class="info-content">${this.getStaticText('鼠标悬停在社区上查看信息')}</div>`;
          }
        }
      };
      
      this.infoControl.addTo(this.$refs.map.leafletObject);
      this.infoControl.update();
    },
    
    // 增强GeoJSON数据，为每个社区预设label和颜色
    enhanceGeoJSONData() {
      if (!this.nycBoroughsGeoJSON || !this.nycBoroughsGeoJSON.features) return;
      
      this.nycBoroughsGeoJSON.features.forEach((feature) => {
        const props = feature.properties;
        
        // 如果没有tag，使用智能分配
        if (!props.tag) {
          const ntaName = props.NTAName || '';
          const nta2020 = props.NTA2020 || '';
          
          // 使用导入的标签分配函数
          props.tag = getDefaultLabel(ntaName, nta2020);
        }
        
      });
    },
    
    // 获取推断的标签
    getInferredTag(props) {
      let tag = props.tag || props.category;
      
      if (!tag) {
        const boroCD = props.BoroCD;
        const name = props.NTAName || props.name || '';
        
        if (boroCD) {
          const lastDigit = parseInt(boroCD.toString().slice(-1));
          const tagTypes = ['quiet', 'nightlife', 'shopping', 'dining', 'arts', 'parks'];
          tag = tagTypes[lastDigit % tagTypes.length];
        } else if (name.includes('Park') || name.includes('Green')) {
          tag = 'parks';
        } else if (name.includes('Village') || name.includes('SoHo')) {
          tag = 'arts';
        } else if (name.includes('Financial') || name.includes('Midtown')) {
          tag = 'shopping';
        } else {
          tag = 'default';
        }
      }
      
      return tag;
    },
    
    // 获取标签的英文显示名称
    getTagDisplayName(tag) {
      const tagNames = {
        quiet: 'Quiet',
        nightlife: 'Nightlife',
        shopping: 'Shopping',
        dining: 'Dining',
        arts: 'Arts',
        parks: 'Parks',
        default: 'Mixed'
      };
      
      return tagNames[tag] || 'Mixed';
    },
    
    // 新的样式函数 - 基于标签的颜色
    getFeatureStyle(feature) {
      const fillColor = this.getFillColor(feature);
      
      return {
        color: '#fff',           // 白色边框更清晰
        weight: 1,               // 细边框  
        fillColor: fillColor,    // 彩色填充
        fillOpacity: 0.65,       // 用户设置的透明度
        interactive: true
      };
    },
    
    // 为每个要素绑定事件
    onEachFeature(feature, layer) {
      layer.on({
        mouseover: this.highlightLayer,
        mouseout: this.resetHighlight,
        click: this.clickToZoom
      });
    },
    
    // GeoJSON图层就绪时保存引用并应用样式
    onGeoJsonReady(geojsonLayer) {
      this.geojsonLayer = geojsonLayer;
      
      // 🔍 调试：统计地图上成功渲染的区域数量
      let renderedCount = 0;
      const renderedAreas = [];
      
      // 手动应用样式到每个图层
      geojsonLayer.eachLayer((layer) => {
        if (layer.feature) {
          const style = this.getFeatureStyle(layer.feature);
          layer.setStyle(style);
          
          // 统计渲染的区域
          const props = layer.feature.properties || {};
          const areaName = props.NTAName || props.name || props.BoroName || '未知区域';
          renderedAreas.push(areaName);
          renderedCount++;
        }
      });
      
      console.log('📊 地图渲染完成统计:', {
        totalRendered: renderedCount,
        expectedTotal: 104,
        missingCount: 104 - renderedCount,
        renderedAreasList: renderedAreas.slice(0, 10) + (renderedCount > 10 ? ' ... 等' + renderedCount + '个区域' : '')
      });
    },
    
    // 鼠标悬停高亮
    async highlightLayer(e) {
      // 如果AI聊天窗口打开，则不执行高亮和hover效果
      if (this.showAIChat) {
        return;
      }
      
      // 如果当前页面是登录/注册/admin dashboard，不显示hover卡片
      const currentPath = this.$route.path;
      if (currentPath.includes('/login') || currentPath.includes('/register') || currentPath.includes('/admin')) {
        return;
      }
      
      const layer = e.target;
      const feature = layer.feature;
      const fillColor = this.getFillColor(feature);
      
      // 提升亮度 + 彩色虚线边框
      layer.setStyle({
        weight: 2,
        color: fillColor,           // 边框使用与填充相同的颜色
        dashArray: '5, 5',          // 2px虚线效果
        fillOpacity: 0.8,           // 提升填充透明度(亮度)
        opacity: 1.0                // 边框100%透明度
      });
      
      // 显示悬浮卡片在鼠标位置
      await this.showHoverCard(e, layer.feature.properties);
    },
    
    // 重置高亮效果
    resetHighlight(e) {
      const layer = e.target;
      
      // 重置为原始样式
      layer.setStyle({
        weight: 1,
        color: '#fff',
        dashArray: null,              // 移除虚线
        fillOpacity: 0.55,            // 恢复原始透明度
        opacity: 1.0
      });
      
      // 隐藏悬浮卡片
      this.hideHoverCard();
    },
    
    // 重置所有图层的高亮效果
    resetAllHighlights() {
      if (this.geojsonLayer) {
        this.geojsonLayer.eachLayer((layer) => {
          if (layer.feature) {
            const style = this.getFeatureStyle(layer.feature);
            layer.setStyle(style);
          }
        });
      }
    },
    
    // 处理数据库tags：拆分、首字母大写、按长度排序
    processAreaTags(areaTags) {
      if (!areaTags || !Array.isArray(areaTags)) {
        return [];
      }
      
      return areaTags
        .filter(tag => tag && tag !== 'undefined' && tag !== 'null') // 过滤无效标签
        .map(tag => {
          // 检查是否为UUID格式
          if (this.isValidUUID(tag)) {
            return this.getStaticText('Unknown', null, 'hover-tag'); // UUID标签替换为"未知"
          }
          
          // 首先尝试从静态翻译中获取翻译
          const translatedTag = this.getStaticText(tag, null, 'hover-tag');
          if (translatedTag !== tag) {
            return translatedTag;
          }
          
          // 如果没有找到翻译，拆分连字符或下划线，首字母大写
          return tag.split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        })
        .sort((a, b) => b.length - a.length); // 按字数长度排序，长的在前面
    },

    // 显示骨架屏
    ensureHoverCardElement() {
      if (!this.hoverCardElement) {
        this.hoverCardElement = document.createElement("div");
        this.hoverCardElement.className = "hover-tooltip-container";
        this.hoverCardElement.style.cssText = `
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          display: none;
        `;
        document.body.appendChild(this.hoverCardElement);
      }
      return this.hoverCardElement;
    },

    computeHoverCardSizing() {
      const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const minWidth = 17 * remSize;
      const maxWidth = 22 * remSize;
      const hasWindow = typeof window !== "undefined";
      const baseWidth = hasWindow && window.innerWidth ? window.innerWidth * 0.25 : minWidth;
      const pixelWidth = Math.min(Math.max(baseWidth, minWidth), maxWidth);
      const widthRem = Math.round((pixelWidth / remSize) * 1000) / 1000;
      return {
        pixelWidth,
        widthValue: `${widthRem}rem`,
      };
    },

    applyHoverCardDimensions() {
      if (!this.hoverCardElement) {
        return;
      }
      const { pixelWidth, widthValue } = this.computeHoverCardSizing();
      this.hoverCardPixelWidth = pixelWidth;
      this.hoverCardElement.style.width = widthValue;
    },

    positionHoverCard(mouseEvent) {
      if (!this.hoverCardElement || !mouseEvent) {
        return;
      }
      const cardWidth = this.hoverCardPixelWidth || this.hoverCardElement.offsetWidth || 280;
      const cardHeight = this.hoverCardElement.offsetHeight || 240;
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : null;
      let x = mouseEvent.clientX - cardWidth / 2;
      let y = mouseEvent.clientY - cardHeight - 20;
      if (x < 10) {
        x = 10;
      } else if (viewportWidth && x + cardWidth > viewportWidth - 10) {
        x = viewportWidth - cardWidth - 10;
      }
      if (y < 10) {
        y = mouseEvent.clientY + 20;
      }
      this.hoverCardElement.style.left = `${Math.round(x)}px`;
      this.hoverCardElement.style.top = `${Math.round(y)}px`;
      this.lastPointerPosition = {
        clientX: mouseEvent.clientX,
        clientY: mouseEvent.clientY,
        left: Math.round(x),
        top: Math.round(y)
      };
    },
    showSkeletonCard(e, communityName) {
      // 如果AI聊天窗口打开，则不显示骨架屏
      if (this.showAIChat) {
        return;
      }
      
      // 使用静态翻译立即显示区域名称，确保不显示undefined
      const displayName = communityName ? this.getStaticText(communityName) : this.getStaticText('未知社区');
      const skeletonContent = `
        <!-- 气泡卡片骨架 -->
        <div class="bubble-card">
          <!-- 倒三角 -->
          <div class="bubble-arrow"></div>

          <!-- 顶部图片骨架 -->
          <div class="image-container skeleton-shimmer"></div>

          <!-- 卡片核心内容骨架 -->
          <div class="card-content">
            <div class="community-header">
              <span class="community-name">${displayName}</span>
            </div>

            <div class="info-sections">
              <div class="info-section">
                <div class="section-title skeleton-shimmer" style="width: 38%; height: 0.75rem;"></div>
                <div class="chip-row">
                  <span class="chip skeleton-shimmer" style="width: 36%; height: 1.25rem;"></span>
                  <span class="chip skeleton-shimmer" style="width: 32%; height: 1.25rem;"></span>
                </div>
              </div>
              <div class="info-section">
                <div class="section-title skeleton-shimmer" style="width: 45%; height: 0.75rem;"></div>
                <div class="chip-row">
                  <span class="chip skeleton-shimmer" style="width: 42%; height: 1.25rem;"></span>
                  <span class="chip skeleton-shimmer" style="width: 28%; height: 1.25rem;"></span>
                </div>
              </div>
              <div class="info-section">
                <div class="section-title skeleton-shimmer" style="width: 40%; height: 0.75rem;"></div>
                <div class="chip-row">
                  <span class="chip skeleton-shimmer" style="width: 38%; height: 1.25rem;"></span>
                  <span class="chip skeleton-shimmer" style="width: 30%; height: 1.25rem;"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const container = this.ensureHoverCardElement();
      container.innerHTML = skeletonContent;
      container.style.display = "block";
      container.style.visibility = "visible";

      this.applyHoverCardDimensions();

      const mouseEvent = e.originalEvent || e;
      if (mouseEvent && mouseEvent.clientX) {
        const positionFn = () => this.positionHoverCard(mouseEvent);
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          window.requestAnimationFrame(positionFn);
        } else {
          positionFn();
        }
      }

      this.isCardVisible = true;
    },

    // 显示悬浮卡片
    async showHoverCard(e, properties) {
      // 如果AI聊天窗口打开，则不显示hover卡片
      if (this.showAIChat) {
        return;
      }
      
      // 🔍 调试：显示hover卡片时的区域信息
      console.log('🏠 Hover卡片显示:', {
        properties: properties,
        NTAName: properties.NTAName,
        name: properties.name,
        BoroName: properties.BoroName,
        NTACode: properties.NTACode
      });
      
      const rawCommunityName = properties.NTAName || properties.name;
      // 检查是否为UUID格式（使用正确的UUID正则表达式）
      const isUUID = this.isValidUUID(rawCommunityName);
      const communityName = (rawCommunityName && !isUUID) ? rawCommunityName : this.getStaticText('未知社区');
      
      // 立即显示骨架屏
      this.showSkeletonCard(e, communityName);
      
      // 尝试从数据库获取真实数据（缓存优化，不查询borough）
      let areaData = null;
      if (!this.areaDataCache) {
        this.areaDataCache = new Map();
      }
      
      if (this.areaDataCache.has(communityName)) {
        areaData = this.areaDataCache.get(communityName);
      } else {
        try {
          areaData = await dataService.getAreaByName(communityName);
          this.areaDataCache.set(communityName, areaData);
        } catch (error) {
          console.warn('获取区域数据失败，使用默认数据:', error);
          this.areaDataCache.set(communityName, null);
        }
      }
      
      // 使用真实数据或回退到默认值（不包含borough）
      const rawDisplayName = areaData?.name || rawCommunityName;
      // 检查displayName是否为UUID格式或undefined（使用正确的UUID正则表达式）
      const isDisplayUUID = this.isValidUUID(rawDisplayName);
      const displayName = (rawDisplayName && !isDisplayUUID) ?
        this.getStaticText(rawDisplayName, null, 'hover-name') :
        this.getStaticText(communityName, null, 'hover-name');
      const dbTags = areaData?.area_tags || [];
      
      // 处理数据库tags
      const processedTags = this.processAreaTags(dbTags);
      
      const displayTags = processedTags;
      
      const amenityList = Array.isArray(areaData?.amenities)
        ? areaData.amenities
            .map(item => typeof item === 'string' ? item : item?.name)
            .filter(Boolean)
        : [];
      const amenityItems = amenityList;

      const rawTransportData = Array.isArray(areaData?.transportation)
        ? areaData.transportation
        : (Array.isArray(areaData?.transport) ? areaData.transport : []);

      const transportList = rawTransportData
        .map(item => typeof item === 'string' ? item : item?.name)
        .filter(Boolean);
      const transportItems = transportList;

      const featureTags = displayTags;

      const imageUrl = areaData?.image_url || areaData?.image || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=225&fit=crop';

      const cardContent = `
        <!-- 气泡卡片：整体卡片容器 -->
        <div class="bubble-card">
          <!-- 倒三角 -->
          <div class="bubble-arrow"></div>

          <!-- 社区图片 -->
          <div class="image-container">
            <img src="${imageUrl}" alt="${displayName}" class="area-image">
          </div>

          <!-- 卡片核心内容（位于图片下方） -->
          <div class="card-content">
            <!-- 社区名称 -->
            <div class="community-header">
              <span class="community-name">${displayName}</span>
            </div>

            <div class="info-sections">
              ${transportItems.length ? `
                <div class="info-section">
                  <div class="section-title">${this.getStaticText('Transportation', null, 'hover-section')}</div>
                  <div class="chip-row">
                    ${transportItems.map(t => `
                      <span class="chip chip-transport">${this.getStaticText(t, null, 'hover-transport')}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${amenityItems.length ? `
                <div class="info-section">
                  <div class="section-title">${this.getStaticText('Amenities', null, 'hover-section')}</div>
                  <div class="chip-row">
                    ${amenityItems.map(amenity => `
                      <span class="chip chip-amenity">${this.getStaticText(amenity, null, 'hover-amenity')}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${featureTags.length ? `
                <div class="info-section">
                  <div class="section-title">${this.getStaticText('Features', null, 'hover-section')}</div>
                  <div class="chip-row">
                    ${featureTags.map(tag => `
                      <span class="chip chip-feature">${tag}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      const container = this.ensureHoverCardElement();
      container.innerHTML = cardContent;
      container.style.display = "block";
      container.style.visibility = "visible";

      this.applyHoverCardDimensions();

      const mouseEvent = e.originalEvent || e;
      if (mouseEvent && mouseEvent.clientX) {
        const positionFn = () => this.positionHoverCard(mouseEvent);
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          window.requestAnimationFrame(positionFn);
        } else {
          positionFn();
        }
      }

      this.isCardVisible = true;
    },
    
    // 🔍 搜索和筛选功能
    
    toggleTag(tagValue) {
      const index = this.selectedTags.indexOf(tagValue);
      if (index > -1) {
        this.selectedTags.splice(index, 1);
      } else {
        this.selectedTags.push(tagValue);
      }
      console.log(`🏷️ 当前筛选标签:`, this.selectedTags);
      this.applyFilters();
    },
    
    // 添加关键词到搜索列表
    addKeyword() {
      const keyword = this.currentInputValue.trim();
      if (keyword && !this.searchKeywords.some(k => k.text === keyword) && this.searchKeywords.length < 3) {
        this.searchKeywords.push({ text: keyword, type: 'user' });
        this.currentInputValue = '';
        this.updateSearchLocation();
        // 重新聚焦到输入框
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus();
          }
        });
      }
    },
    
    // 移除关键词
    removeKeyword(index) {
      this.searchKeywords.splice(index, 1);
      this.updateSearchLocation();
      // 重新聚焦到输入框
      this.$nextTick(() => {
        if (this.$refs.searchInput) {
          this.$refs.searchInput.focus();
        }
      });
    },
    
    // 更新搜索位置字符串
    updateSearchLocation() {
      this.searchLocation = this.searchKeywords.map(k => k.text).join(' ');
    },
    
    // 推荐框相关方法
    handleInputFocus() {
      this.showRecommendations = true;
      // 显示推荐框时检测弹出方向
      this.$nextTick(() => {
        this.detectDropdownDirection();
      });
    },
    
    handleInputChange() {
      const query = this.currentInputValue.trim();
      if (query) {
        this.filteredRecommendations = searchRecommendationData(query);
      } else {
        this.filteredRecommendations = {
          universities: [],
          cities: [],
          keywords: []
        };
      }
    },
    
    handleInputBlur() {
      // 延迟隐藏推荐框，让用户有时间点击推荐项
      setTimeout(() => {
        this.showRecommendations = false;
      }, 200);
    },
    
    selectRecommendation(value) {
      // 在input中显示选择的推荐项以增强用户体验
      this.currentInputValue = value;
      
      // 隐藏推荐框
      this.showRecommendations = false;
      
      // 直接跳转到browse页面，携带搜索词
      this.navigateToBrowseWithSearch(value);
    },
    
    // 跳转到browse页面并携带搜索参数
    navigateToBrowseWithSearch(searchTerm) {
      const params = {
        search: searchTerm, // Browse页面期望的是search参数
        tags: this.selectedTags.length > 0 ? this.selectedTags.join(',') : undefined
      };
      
      // 移除undefined的参数
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      );
      
      console.log(`🔍 推荐搜索跳转: ${searchTerm}`, cleanParams);
      
      // 跳转到browse页面
      this.$router.push({
        name: 'Browse',
        query: cleanParams
      });
    },
    
    performSearch() {
      // 如果当前输入框有内容，先添加为关键词
      if (this.currentInputValue.trim()) {
        this.addKeyword();
      }
      
      const searchData = {
        location: this.searchLocation,
        tags: this.selectedTags
      };
      
      console.log(`🔍 执行搜索:`, searchData);
      
      // Emit search event to parent
      console.log('🔍 OpenStreetMap: Emitting search-performed event');
      this.$emit('search-performed', searchData);
      console.log('🔍 OpenStreetMap: search-performed event emitted');
      
      this.applyFilters();
    },
    
    // 处理筛选图标点击事件
    handleFilterIconClick() {
      const filterData = {
        location: this.searchLocation || 'all',
        tags: this.selectedTags
      };
      
      console.log('🎛️ Filter icon clicked, navigating to browse page:', filterData);
      
      // Emit filter click event to parent
      this.$emit('filter-clicked', filterData);
    },
    
    getCurrentLocation() {
      console.log(`📍 获取当前位置`);
      // 这里可以集成浏览器定位API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log(`📍 当前位置: ${lat}, ${lng}`);
          
          // 将地图中心移到当前位置
          this.center = [lat, lng];
          if (this.$refs.map && this.$refs.map.leafletObject) {
            this.$refs.map.leafletObject.setView([lat, lng], this.zoom);
          }
        }, (error) => {
          console.warn('⚠️ 定位失败:', error.message);
        });
      }
    },
    
    
    applyFilters() {
      // 应用筛选逻辑
      console.log(`🎯 应用筛选条件:`, {
        tags: this.selectedTags,
        location: this.searchLocation
      });
      
      // 这里后续可以连接数据库筛选
      // 现在先更新地图显示逻辑
      this.updateMapDisplay();
    },
    
    updateMapDisplay() {
      // 根据筛选条件更新地图显示
      if (this.geojsonLayer) {
        this.geojsonLayer.eachLayer((layer) => {
          const feature = layer.feature;
          const shouldShow = this.shouldShowFeature(feature);
          
          if (shouldShow) {
            layer.setStyle({ fillOpacity: 0.65 });
          } else {
            layer.setStyle({ fillOpacity: 0.1 }); // 淡化不符合条件的区域
          }
        });
      }
    },
    
    shouldShowFeature(feature) {
      // 判断区域是否符合筛选条件
      const featureTag = feature.properties.tag;
      
      // 如果有选中的标签，只显示匹配的
      if (this.selectedTags.length > 0) {
        return this.selectedTags.includes(featureTag);
      }
      
      // 默认显示所有
      return true;
    },
    
    // 🌍 全局点击事件处理
    handleGlobalClick(event) {
      
      // 检查是否点击在推荐框外部
      const recommendationsDropdown = this.$refs.recommendationsDropdown;
      const searchInput = this.$refs.searchInput;
      if (this.showRecommendations && 
          recommendationsDropdown && 
          !recommendationsDropdown.contains(event.target) &&
          searchInput && 
          !searchInput.contains(event.target)) {
        this.showRecommendations = false;
      }
    },
    
    // 隐藏悬浮卡片
    hideHoverCard() {
      if (this.hoverCardElement) {
        this.hoverCardElement.style.display = "none";
      }
      this.isCardVisible = false;
      this.lastPointerPosition = null;
      
      // 强制清理页面上所有可能残留的tooltip
      this.forceCleanupTooltips();
    },
    // 强制清理所有tooltip残留
    forceCleanupTooltips() {
      // 清理我们自定义的hover-tooltip-container
      const customTooltips = document.querySelectorAll('.hover-tooltip-container');
      customTooltips.forEach(tooltip => {
        if (tooltip !== this.hoverCardElement) {
          tooltip.style.display = 'none';
        }
      });
      
      // 清理可能存在的Leaflet原生popup残留
      const leafletPopups = document.querySelectorAll('.leaflet-popup');
      leafletPopups.forEach(popup => {
        if (popup.style.opacity !== '0') {
          popup.style.display = 'none';
        }
      });
    },
    
    // 更新卡片位置
    updateCardPosition(mouseEvent) {
      if (!this.hoverCardElement || !this.isCardVisible || !mouseEvent) {
        return;
      }
      this.applyHoverCardDimensions();
      const positionFn = () => this.positionHoverCard(mouseEvent);
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        window.requestAnimationFrame(positionFn);
      } else {
        positionFn();
      }
    },
    
    // 生成多个标签 (通常3个)
    generateMultipleTags(primaryTag, communityName) {
      const allTagTypes = ['quiet', 'nightlife', 'shopping', 'dining', 'arts', 'parks'];
      const tags = [primaryTag]; // 第一个标签决定颜色
      
      // 基于社区名称hash生成另外两个标签
      const hash = this.hashCode(communityName);
      const hash2 = this.hashCode(communityName + '_secondary');
      
      // 确保不重复，添加第二个和第三个标签
      const remainingTags = allTagTypes.filter(tag => tag !== primaryTag);
      const secondTag = remainingTags[Math.abs(hash) % remainingTags.length];
      tags.push(secondTag);
      
      const finalRemainingTags = remainingTags.filter(tag => tag !== secondTag);
      const thirdTag = finalRemainingTags[Math.abs(hash2) % finalRemainingTags.length];
      tags.push(thirdTag);
      
      return tags;
    },

    // 生成模拟租金数据
    generateMockRent(communityName) {
      const hash = this.hashCode(communityName);
      const baseRent = 2000 + (Math.abs(hash) % 3000); // 2000-5000范围
      const minRent = Math.max(1500, baseRent - 500);
      const maxRent = baseRent + 500;
      return `$${baseRent}-$${maxRent}/月`;
    },
    
    // 生成模拟英文描述
    generateMockDescriptionEn(tagDisplayName) {
      const descriptions = {
        'Quiet': 'Peaceful residential area',
        'Nightlife': 'Vibrant bars & restaurants',
        'Shopping': 'Commercial hub district',
        'Dining': 'Diverse culinary scene',
        'Arts': 'Cultural & creative district',
        'Parks': 'Green spaces & nature',
        'Mixed': 'Well-rounded community'
      };
      return descriptions[tagDisplayName] || 'Great neighborhood';
    },
    
    // 点击放大并显示详细卡片
    clickToZoom(e) {
      const layer = e.target;
      const map = this.$refs.map.leafletObject;
      const props = layer.feature.properties;
      const communityName = props.name || props.NTAName || props.BoroCD || this.getStaticText('未知社区');
      
      console.log('🎯 Map area clicked:', communityName);
      
      // 将社区名称添加为关键词标签
      this.addCommunityKeyword(communityName);
      
      // Emit community click event to parent
      this.$emit('community-clicked', {
        name: communityName,
        properties: props,
        bounds: layer.getBounds()
      });
      
      // 放大完成后显示详细弹窗
      map.once('zoomend', () => {
        this.showDetailPopup(layer);
      });
      
      // 放大到要素边界
      map.fitBounds(layer.getBounds(), { maxZoom: 17 });
    },
    
    // 显示详细信息弹窗
    showDetailPopup(layer) {
      const props = layer.feature.properties;
      const communityName = props.name || props.NTAName || props.BoroCD || this.getStaticText('未知社区');
      const inferredTag = this.getInferredTag(props);
      const tagDisplayName = this.getTagDisplayName(inferredTag);
      const tagColor = this.getFillColor(layer.feature);
      
      // Use getStaticText for translated description
      const defaultDescription = this.getStaticText('这是一个') + tagDisplayName + this.getStaticText('，包含多种类型的建筑和设施。');
      
      const popupContent = `
        <div class="detail-popup">
          <h3 style="color: ${tagColor}; margin: 0 0 10px 0;">
            ${communityName}
          </h3>
          <div class="popup-info">
            <div class="tag-badge" style="background-color: ${tagColor}; color: white; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px;">
              ${tagDisplayName}
            </div>
            <p style="margin: 10px 0; color: #666;">
              ${props.description || defaultDescription}
            </p>
          </div>
        </div>
      `;
      
      // 不再使用Leaflet原生popup，已由hover-tooltip-container替代
      // 点击区域后只进行缩放和添加关键词，不显示popup
    },
    
    // 打印当前地图参数的方法
    printMapParameters() {
      if (this.$refs.map && this.$refs.map.leafletObject) {
        const map = this.$refs.map.leafletObject;
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        console.log('=== 🗺️  当前地图参数 ===');
        console.log('中心点:', `[${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}]`);
        console.log('缩放级别:', zoom);
        console.log('边界:', map.getBounds().toString());
        console.log('复制以下代码到组件中:');
        console.log(`center: [${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}],`);
        console.log(`zoom: ${zoom},`);
        console.log('====================');
      }
    },
    
    // 加载纽约五大区的真实GeoJSON边界数据 (优先使用本地官方数据)
    async loadNYCBoroughs() {
      try {
        this.isLoadingBoroughs = true;
        this.loadingStatus = 'Fetching NYC borough boundaries...';
        console.log('🗺️ 开始加载纽约五大区边界数据...');
        
        // 首先尝试使用Overpass API
        console.log('📡 尝试Overpass API...');
        this.loadingStatus = 'Querying OpenStreetMap API...';
        await this.loadFromOverpassAPI();
        
        // 备选方案2: 尝试NYC Open Data API
        if (!this.nycBoroughsGeoJSON) {
          console.log('📡 Overpass API失败，尝试NYC Open Data API...');
          this.loadingStatus = 'Trying NYC Open Data API...';
          await this.loadFromNYCOpenData();
        }
        
        // 最后备选: 使用内置数据
        if (!this.nycBoroughsGeoJSON) {
          console.log('📦 使用内置数据作为最后备选...');
          this.loadingStatus = 'Using fallback data...';
          this.useBuiltinBoroughData();
        }
        
        // 无论何种数据源，都进行后处理
        if (this.nycBoroughsGeoJSON) {
          this.loadingStatus = 'Processing boundary data...';
          await this.processGeoJSONData();
        }
        
        this.loadingStatus = 'Rendering map...';
        // 延迟一下让用户看到完成状态
        setTimeout(() => {
          this.isLoadingBoroughs = false;
        }, 500);
        
      } catch (error) {
        console.error('❌ 加载边界数据时发生错误:', error);
        this.loadingStatus = 'Error occurred, using fallback...';
        await this.useBuiltinBoroughData();
        setTimeout(() => {
          this.isLoadingBoroughs = false;
        }, 1000);
      }
    },
    
    // 使用Overpass API从OpenStreetMap获取数据 (正确实现)
    async loadFromOverpassAPI() {
      try {
        console.log('🔍 使用Overpass API查询纽约五大区...');
        
        // 正确的Overpass查询 - 关键是使用 out geom;
        const overpassQuery = `
          [out:json][timeout:30];
          (
            relation["admin_level"="5"]["name"~"New York|Manhattan|Brooklyn|Queens|Bronx|Staten Island"];
            relation["admin_level"="6"]["name"~"Manhattan|Brooklyn|Queens|Bronx|Staten Island"];
          );
          out geom;
        `;
        
        const url = 'https://overpass-api.de/api/interpreter';
        const response = await fetch(url, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(overpassQuery),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        });
        
        if (response.ok) {
          const osmData = await response.json();
          console.log('📡 OSM数据获取成功:', osmData.elements?.length, '个要素');
          
          if (osmData.elements && osmData.elements.length > 0) {
            // 使用osmtogeojson转换
            const geoJSON = osmtogeojson(osmData);
            console.log('🔄 转换为GeoJSON成功:', geoJSON.features?.length, '个区域');
            
            // 过滤纽约的区域
            const boroughFeatures = geoJSON.features.filter(feature => {
              const name = feature.properties.name || '';
              return ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].some(borough => 
                name.includes(borough)
              );
            });
            
            if (boroughFeatures.length > 0) {
              this.nycBoroughsGeoJSON = {
                type: 'FeatureCollection',
                features: boroughFeatures
              };
              console.log('✅ Overpass API成功，获得', boroughFeatures.length, '个区域');
              return true;
            }
          }
        }
        
        console.warn('⚠️ Overpass API未能获得有效数据');
        return false;
        
      } catch (error) {
        console.warn('❌ Overpass API错误:', error);
        return false;
      }
    },
    
    
    // 备用：使用NYC官方API数据
    async loadFromNYCOpenData() {
      try {
        const response = await fetch('https://data.cityofnewyork.us/api/geospatial/tqmj-j8zm?method=export&format=GeoJSON');
        if (response.ok) {
          this.nycBoroughsGeoJSON = await response.json();
          console.log('✅ NYC Open Data API加载成功');
          return true;
        }
      } catch (error) {
        console.warn('❌ NYC Open Data API错误:', error);
      }
      return false;
    },
    
    // 使用NYC官方社区区域数据 (已在data中初始化为NTA数据)
    useBuiltinBoroughData() {
      console.log('🔄 使用已加载的NTA数据...');
      console.log('✅ NTA数据已可用，包含', this.nycBoroughsGeoJSON.features.length, '个社区区域');
    },
    
    // 🔧 关键步骤：处理GeoJSON数据 (去重、合并、简化、优化)
    async processGeoJSONData() {
      try {
        console.log('🔧 开始处理GeoJSON数据...');
        
        if (!this.nycBoroughsGeoJSON || !this.nycBoroughsGeoJSON.features) {
          return;
        }
        
        let features = this.nycBoroughsGeoJSON.features;
        console.log('原始特征数量:', features.length);
        
        // 1. 按区域名称分组和合并
        const boroughGroups = new Map(); // 用于按区域名称分组
        
        // 遍历并分组所有特征
        for (const feature of features) {
          const boroughName = this.getBoroughName(feature);
          
          // 如果无法确定区域名称则跳过
          if (!boroughName) {
            console.warn('⚠️ 跳过无法识别区域名称的要素:', feature);
            continue;
          }
          
          // 将特征按区域名称分组
          if (!boroughGroups.has(boroughName)) {
            boroughGroups.set(boroughName, []);
          }
          
          boroughGroups.get(boroughName).push(feature);
        }
        
        console.log('识别到的区域:', Array.from(boroughGroups.keys()));
        
        // 2. 合并同一区域的多个特征为一个
        const uniqueFeatures = [];
        
        for (const [boroughName, featureGroup] of boroughGroups.entries()) {
          if (featureGroup.length === 1) {
            // 只有一个特征，直接使用
            uniqueFeatures.push(featureGroup[0]);
            console.log(`区域 ${boroughName}: 单一区域`);
          } else {
            // 多个特征，需要合并
            console.log(`区域 ${boroughName}: ${featureGroup.length} 个组件需要合并`);
            
            // 合并特征的属性
            const properties = {
              boro_name: boroughName,
              name: boroughName,
              chinese_name: this.getChinese(boroughName),
              description: this.getDescription(boroughName)
            };
            
            // 创建合并的特征
            uniqueFeatures.push({
              type: 'Feature',
              properties: properties,
              geometry: featureGroup[0].geometry  // 使用第一个几何形状
            });
          }
        }
        
        console.log('处理后特征数量:', uniqueFeatures.length);
        
        // 3. 使用turf.simplify简化几何图形，让边界更圆润
        const simplifiedFeatures = uniqueFeatures.map(feature => {
          try {
            // tolerance 控制简化程度：越大越圆润，但可能失真
            const simplified = simplify(feature, {
              tolerance: 0.001,  // 适中的简化
              highQuality: true
            });
            
            console.log(`简化 ${this.getBoroughName(feature)}: 顶点减少`);
            return simplified;
          } catch (error) {
            console.warn('简化失败，使用原始数据:', this.getBoroughName(feature));
            return feature;
          }
        });
        
        // 3. 更新数据
        this.nycBoroughsGeoJSON = {
          type: 'FeatureCollection',
          features: simplifiedFeatures
        };
        
        console.log('✅ GeoJSON数据处理完成');
        
      } catch (error) {
        console.error('❌ 处理GeoJSON数据时出错:', error);
      }
    },
    
    // 辅助方法：获取区域名称
    getBoroughName(feature) {
      // 支持多种可能的属性名称格式
      return feature.properties.boro_name || 
             feature.properties.NAME || 
             feature.properties.name ||
             feature.properties.borough ||
             feature.properties.BoroName ||
             // NYC官方数据的BoroCD格式: 第一位是区编号
             (feature.properties.BoroCD ? this.getBoroNameFromCD(feature.properties.BoroCD) : null);
    },
    
    // 从BoroCD获取区域名称 (NYC官方数据格式)
    getBoroNameFromCD(boroCD) {
      if (!boroCD) return null;
      
      // BoroCD首位数字对应区域:
      // 1=Manhattan, 2=Bronx, 3=Brooklyn, 4=Queens, 5=Staten Island
      const boroCode = String(boroCD).charAt(0);
      const boroughMap = {
        '1': 'Manhattan',
        '2': 'Bronx',
        '3': 'Brooklyn',
        '4': 'Queens',
        '5': 'Staten Island'
      };
      
      return boroughMap[boroCode] || null;
    },
    
    // 获取区域的中文名称
    getChinese(boroughName) {
      const chineseMap = {
        'Manhattan': '曼哈顿区',
        'Brooklyn': '布鲁克林区',
        'Queens': '皇后区',
        'Bronx': '布朗克斯区',
        'The Bronx': '布朗克斯区',
        'Staten Island': '史泰登岛'
      };
      
      return chineseMap[boroughName] || boroughName;
    },
    
    // 获取区域描述
    getDescription(boroughName) {
      const descMap = {
        'Manhattan': '纽约市的心脏地带',
        'Brooklyn': '充满活力的多元化社区',
        'Queens': '纽约最多元化的行政区',
        'Bronx': '历史悠久的住宅区',
        'The Bronx': '历史悠久的住宅区',
        'Staten Island': '宁静的岛屿行政区'
      };
      
      return descMap[boroughName] || '';
    },
    
    // GeoJSON样式函数 (优化版本)
    getBoroughStyle(feature) {
      const boroughName = this.getBoroughName(feature);
      console.log('🎨 应用样式到区域:', boroughName);
      
      const colorConfig = this.boroughColors[boroughName] || { color: '#999999' };
      
      // 按照最佳实践的样式配置
      return {
        color: colorConfig.color,     // 边框颜色
        weight: 3,                    // 适中的边框宽度
        opacity: 0.8,                 // 边框透明度
        fillColor: colorConfig.color, // 填充颜色
        fillOpacity: 0.35,            // 填充透明度 (避免重叠过暗)
        dashArray: '10, 5',           // 虚线样式
        lineJoin: 'round',            // 圆润的线条连接
        lineCap: 'round',             // 圆润的线条端点
        smoothFactor: 2.0,            // Leaflet平滑因子 (1-3范围内)
        interactive: true,            // 允许交互
        bubblingMouseEvents: false    // 防止事件冒泡
      };
    },
    
    // 处理区域点击事件
    onBoroughClick(event) {
      const feature = event.target.feature;
      const boroughName = feature.properties.boro_name || feature.properties.NAME;
      const colorConfig = this.boroughColors[boroughName];
      
      if (colorConfig) {
        event.target.bindPopup(`
          <div class="borough-popup">
            <h3 style="color: ${colorConfig.color}; margin: 0 0 8px 0; font-size: 16px;">
              ${colorConfig.name}
            </h3>
            <p style="margin: 0; font-size: 14px; color: #666;">
              纽约市五大行政区之一
            </p>
          </div>
        `).openPopup();
      }
    },
    
    // 修复 Leaflet 默认图标问题
    initializeLeafletIcons() {
      // Import Leaflet dynamically to fix icon issues
      import('leaflet').then(L => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
          iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
          shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
        });
      });
    },
    
    // 添加新地标
    addMarker(lat, lng, popup, title = '') {
      const newMarker = {
        id: Date.now(),
        position: [lat, lng],
        popup: popup,
        options: { title: title }
      };
      this.markers.push(newMarker);
    },
    
    // 设置地图中心
    setCenter(lat, lng, zoom = this.zoom) {
      this.center = [lat, lng];
      this.zoom = zoom;
    },
    
    // 清除所有地标
    clearMarkers() {
      this.markers = [];
    },
    
    // 初始化filter tags滚动功能
    initializeFilterTagsScroll() {
      const container = this.$refs.filterTags;
      const tagsContainer = container?.parentElement;
      
      if (!container || !tagsContainer) return;
      
      // 添加滚动事件监听
      container.addEventListener('scroll', this.updateScrollIndicators);
      
      // 添加触摸事件监听（移动端）
      this.addTouchScrollEvents(container);
      
      // 初始化滚动指示器
      this.updateScrollIndicators();
      
      // 监听窗口大小变化
      window.addEventListener('resize', this.updateScrollIndicators);
    },
    
    // 更新滚动指示器
    updateScrollIndicators() {
      const container = this.$refs.filterTags;
      const tagsContainer = container?.parentElement;
      
      if (!container || !tagsContainer) return;
      
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;
      
      // 判断是否可以向左/右滚动
      const canScrollLeft = scrollLeft > 0;
      const canScrollRight = scrollLeft < maxScrollLeft - 1; // -1 for rounding errors
      
      // 添加/移除CSS类
      if (canScrollLeft) {
        tagsContainer.classList.add('can-scroll-left');
      } else {
        tagsContainer.classList.remove('can-scroll-left');
      }
      
      if (canScrollRight) {
        tagsContainer.classList.add('can-scroll-right');
      } else {
        tagsContainer.classList.remove('can-scroll-right');
      }
    },
    
    // 添加触摸滚动事件（移动端优化）
    addTouchScrollEvents(container) {
      let startX = 0;
      let startScrollLeft = 0;
      let isDown = false;
      
      // 鼠标事件（桌面端）
      container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        startScrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
      });
      
      container.addEventListener('mouseleave', () => {
        isDown = false;
        container.style.cursor = 'grab';
      });
      
      container.addEventListener('mouseup', () => {
        isDown = false;
        container.style.cursor = 'grab';
      });
      
      container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // 滚动速度倍数
        container.scrollLeft = startScrollLeft - walk;
      });
      
      // 触摸事件（移动端）
      container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX - container.offsetLeft;
        startScrollLeft = container.scrollLeft;
      }, { passive: true });
      
      container.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // 移动端滚动速度
        container.scrollLeft = startScrollLeft - walk;
      }, { passive: true });
      
      // 设置初始cursor样式
      container.style.cursor = 'grab';
    },

    // 地图居中到指定位置 (暂时保留但不使用)
    centerMapToLocation(coordinates, zoomLevel = 14) {
      if (this.$refs.map && this.$refs.map.leafletObject && coordinates) {
        console.log(`📍 Centering map to coordinates: ${coordinates}, zoom: ${zoomLevel}`);
        this.$refs.map.leafletObject.setView(coordinates, zoomLevel);
        
        // Update local zoom and center data
        this.center = coordinates;
        this.zoom = zoomLevel;
      }
    },

    // TODO: 新的定位方式 - 通过模拟点击区域色块来实现定位
    simulateAreaClick(areaName) {
      console.log(`🎯 准备模拟点击区域: ${areaName}`);
      
      // 查找对应的地图图层
      if (this.geojsonLayer) {
        this.geojsonLayer.eachLayer((layer) => {
          const props = layer.feature.properties;
          const layerName = props.name || props.NTAName || props.BoroCD;
          
          if (layerName && layerName.toLowerCase().includes(areaName.toLowerCase())) {
            console.log(`✅ 找到匹配图层，模拟点击: ${layerName}`);
            
            // 模拟点击事件
            layer.fire('click', {
              target: layer,
              latlng: layer.getBounds().getCenter()
            });
            
            return; // 找到第一个匹配就退出
          }
        });
      } else {
        console.warn('⚠️ GeoJSON图层尚未就绪，无法模拟点击');
      }
    },


    // 处理筛选图标点击
    handleFilterIconClick() {
      const filterData = {
        location: this.searchLocation || '',
        tags: this.selectedTags
      };
      
      console.log('🎛️ OpenStreetMap: Emitting filter-clicked event');
      this.$emit('filter-clicked', filterData);
    },

    applyFilters() {
      // 应用筛选逻辑
      console.log(`🎯 应用筛选条件:`, {
        tags: this.selectedTags,
        location: this.searchLocation
      });
    },

    // 切换筛选标签
    toggleTag(tagValue) {
      const index = this.selectedTags.indexOf(tagValue);
      if (index > -1) {
        this.selectedTags.splice(index, 1);
      } else {
        this.selectedTags.push(tagValue);
      }
      console.log('🏷️ 当前筛选标签:', this.selectedTags);
    },
    
    // 检测dropdown弹出方向
    detectDropdownDirection() {
      if (typeof window === 'undefined') return;
      
      const filterContainer = this.$el?.querySelector('.bottom-search-container');
      if (!filterContainer) return;
      
      const rect = filterContainer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const containerCenterY = rect.top + (rect.height / 2);
      const viewportCenterY = viewportHeight / 2;
      
      // 如果filter容器在视口下半部分，向上弹出
      if (containerCenterY > viewportCenterY) {
        this.dropdownDirection = 'up';
        this.modalPosition = 'top';
      } else {
        this.dropdownDirection = 'down';
        this.modalPosition = 'bottom';
      }
      
      console.log(`📍 Filter position: ${containerCenterY}px, Viewport center: ${viewportCenterY}px, Direction: ${this.dropdownDirection}`);
    },

    // 初始化搜索参数（从props接收）
    initializeFromProps() {
      if (this.initialSearchParams) {
        console.log('🔧 Initializing from props:', this.initialSearchParams);

        if (this.initialSearchParams.location) {
          this.searchLocation = this.initialSearchParams.location;
          // 将位置信息作为单个关键词，不拆分空格
          if (this.searchLocation && this.searchLocation !== 'all') {
            this.searchKeywords = [{ text: this.searchLocation.trim(), type: 'location' }];
            console.log('🔧 Created search keywords:', this.searchKeywords);
          } else {
            this.searchKeywords = [];
          }
        }

        if (this.initialSearchParams.tags && Array.isArray(this.initialSearchParams.tags)) {
          this.selectedTags = [...this.initialSearchParams.tags];
        }

        console.log('🔧 Initialization complete:', {
          searchLocation: this.searchLocation,
          searchKeywords: this.searchKeywords,
          selectedTags: this.selectedTags
        });
      }
    },
    
    // 获取placeholder文本
    getPlaceholderText() {
      if (this.searchKeywords.length >= 3) {
        return this.getStaticText('Max 3'); // 简洁的提示，节省空间
      } else if (this.searchKeywords.length > 0) {
        return ''; // 有关键词时不显示placeholder
      } else {
        return this.getStaticText('Manhattan'); // 默认提示
      }
    },
    
    // 处理定位图标点击
    handleLocationClick() {
      this.getUserLocation();
    },
    
    // 获取用户当前位置
    async getUserLocation() {
      // 检查HTTPS协议
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('⚠️ 地理定位需要HTTPS协议');
        alert('Location access requires HTTPS. Please use https:// or localhost for testing.');
        return;
      }
      
      if (!navigator.geolocation) {
        console.warn('⚠️ 浏览器不支持地理定位');
        alert('Your browser does not support geolocation.');
        return;
      }
      
      console.log('🔄 开始获取当前位置...');
      
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5分钟缓存
          });
        });
        
        const { latitude, longitude } = position.coords;
        console.log(`📍 获取到位置: ${latitude}, ${longitude}`);
        
        // 反向地理编码获取城市名称
        const cityName = await this.reverseGeocode(latitude, longitude);
        
        if (cityName) {
          // 定位成功后，创建带黄色背景的keyword标签以保持UI一致性
          this.searchKeywords = [{ text: cityName, type: 'location' }];
          this.currentInputValue = ''; // 清空input，keyword标签已显示
          console.log(`📍 已添加定位keyword标签: ${cityName}`);
          
          // 更新搜索位置
          this.updateSearchLocation();
          
          // 地图中心移动到该位置
          this.center = [latitude, longitude];
          if (this.$refs.map && this.$refs.map.leafletObject) {
            this.$refs.map.leafletObject.setView([latitude, longitude], 14);
          }
        }
        
      } catch (error) {
        console.warn('⚠️ 定位失败:', error.message);
        
        // 根据错误类型提供不同的提示
        if (error.code === 1) {
          alert('Location access denied. Please enable location permissions in your browser.');
        } else if (error.code === 2) {
          alert('Location unavailable. Please check your GPS/network connection.');
        } else if (error.code === 3) {
          alert('Location timeout. Please try again.');
        } else {
          alert('Location failed. Please ensure you are using HTTPS and have location permissions enabled.');
        }
      }
    },
    
    // 反向地理编码 - 根据Nominatim API文档优化
    async reverseGeocode(lat, lng) {
      try {
        console.log(`🌐 Calling Nominatim API for: ${lat}, ${lng}`);
        
        // 构建符合Nominatim API规范的请求
        const params = new URLSearchParams({
          lat: lat.toFixed(6),
          lon: lng.toFixed(6),
          format: 'json',
          addressdetails: '1',
          zoom: '12', // 城市级别的zoom
          'accept-language': 'en', // 优先返回英文结果
          namedetails: '1'
        });
        
        const url = `https://nominatim.openstreetmap.org/reverse?${params}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Moveasy-Housing-App/1.0' // Nominatim要求User-Agent
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('🌐 Nominatim response:', data);
        
        if (data.error) {
          throw new Error(`Nominatim error: ${data.error}`);
        }
        
        // 按优先级提取位置信息
        const address = data.address || {};
        const cityName = 
          address.city ||           // 城市
          address.town ||           // 城镇
          address.village ||        // 村庄
          address.municipality ||   // 自治市
          address.borough ||        // 区
          address.county ||         // 县
          address.state_district || // 州区
          address.neighbourhood ||  // 社区
          data.display_name?.split(',')[0]?.trim(); // 显示名称的第一部分
        
        console.log(`🏙️ Extracted city name: ${cityName}`);
        return cityName;
        
      } catch (error) {
        console.warn('⚠️ Nominatim geocoding failed:', error.message);
        return null;
      }
    },
    
    // 判断是否为纽约地区
    isNYCArea(cityName) {
      const nycKeywords = ['New York', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'NYC'];
      return nycKeywords.some(keyword => 
        cityName.toLowerCase().includes(keyword.toLowerCase())
      );
    },


    // 加载筛选标签数据（从areas表的area_tags字段）
    async loadFilterTags() {
      try {
        console.log('🏷️ Loading filter tags from database...');
        
        const supabase = await dataService.ensureSupabase();
        
        // 获取所有区域的标签
        const { data, error } = await supabase
          .from('areas')
          .select('area_tags')
          .not('area_tags', 'is', null)
          .not('area_tags', 'eq', '[]');
          
        if (error) {
          console.error('❌ Failed to load area tags:', error);
          this.availableFilterTags = this.getDefaultFilterTags();
          return;
        }

        // 统计所有标签的出现频率
        const tagCounts = {};
        
        if (data && data.length > 0) {
          data.forEach(area => {
            const areaTags = area.area_tags || [];
            areaTags.forEach(tag => {
              if (tag && tag.trim()) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              }
            });
          });

          // 获取最常见的前10个标签（或全部如果少于10个）
          const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

          // 转换为组件需要的格式
          this.availableFilterTags = sortedTags.map(([tag, count]) => ({
            value: tag,
            label: this.formatTagLabel(tag),
            count: count
          }));

          console.log('✅ Filter tags loaded:', this.availableFilterTags);
        } else {
          // 使用默认标签作为备用
          this.availableFilterTags = this.getDefaultFilterTags();
          console.log('⚠️ No tags found, using default filter tags');
        }
      } catch (error) {
        console.error('❌ Failed to load filter tags:', error);
        this.availableFilterTags = this.getDefaultFilterTags();
      }
    },

    // 格式化标签显示名称（自动格式化，标签选择界面显示完整名称）
    formatTagLabel(tag) {
      // 首先尝试从静态翻译中获取翻译
      const translatedTag = this.getStaticText(tag);
      if (translatedTag !== tag) {
        return translatedTag;
      }
      
      // 特殊映射（处理一些特殊情况）
      const specialMappings = {
        'young-professional': 'Young Professional', // 标签选择界面显示完整名称
        'family-friendly': 'Family Friendly',
        'student-friendly': 'Students',
        'university-area': 'University',
        'pet-friendly': 'Pet Friendly',
        'arts': 'Arts & Culture'
      };

      if (specialMappings[tag]) {
        return specialMappings[tag];
      }

      // 自动转换：kebab-case -> Title Case
      return tag.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    },

    // 默认筛选标签（备用）
    getDefaultFilterTags() {
      return [
        { value: 'quiet', label: 'Quiet' },
        { value: 'nightlife', label: 'Nightlife' }, 
        { value: 'shopping', label: 'Shopping' },
        { value: 'dining', label: 'Dining' },
        { value: 'arts', label: 'Arts' },
        { value: 'parks', label: 'Parks' },
        { value: 'transit', label: 'Transit' },
        { value: 'affordable', label: 'Affordable' },
        { value: 'family-friendly', label: 'Family Friendly' },
        { value: 'trendy', label: 'Trendy' }
      ];
    },

    
    // 添加社区关键词到搜索标签（单选模式）
    addCommunityKeyword(communityName) {
      // 检查是否已经是当前唯一的关键词
      if (this.searchKeywords.length === 1 && this.searchKeywords[0].text === communityName) {
        console.log('🏷️ Community keyword already selected:', communityName);
        return;
      }
      
      // 清空所有现有关键词，只保留当前点击的社区名称
      this.searchKeywords = [{ text: communityName, type: 'map' }];
      console.log('🏷️ Set single community keyword:', communityName);
      
      // 清空input以避免重复显示（keyword标签已经显示了）
      this.currentInputValue = '';
      
      // 更新搜索位置
      this.updateSearchLocation();
    },
    
    // 打开标签模态框
    openTagsModal() {
      this.detectDropdownDirection();
      this.showTagsModal = true;
    },
    
    // AI聊天助手相关方法
    openAIChat() {
      this.showAIChat = true;
      this.closeAITip(); // 关闭提示卡片
      this.hideTooltip(); // 隐藏当前显示的hover卡片
      this.resetAllHighlights(); // 重置所有高亮效果
    },
    
    closeAIChat() {
      this.showAIChat = false;
      // 聊天窗口关闭后，hover效果会自动恢复（因为条件判断会通过）
    },
    
    handleAIRecommendations(recommendations) {
      this.aiRecommendations = recommendations;
      this.highlightedCommunities = recommendations.map(rec => rec.name);
      console.log('🤖 AI推荐结果:', recommendations);
      // 这里可以在地图上高亮推荐的社区
      this.highlightRecommendationsOnMap(recommendations);
    },
    
    // 视频模态框相关方法
    closeVideoModal() {
      this.showVideoModal = false;
      this.hasSeenVideo = true;
      // 保存到localStorage，避免重复显示
      localStorage.setItem('hasSeenIntroVideo', 'true');
      
      // 显示AI提示卡片
      this.scheduleAITip();
    },
    
    // AI提示卡片相关方法
    closeAITip() {
      this.showAITip = false;
    },
    
    scheduleAITip() {
      // 延迟显示AI提示
      setTimeout(() => {
        if (!this.showAIChat && !this.showVideoModal) {
          this.showAITip = true;
        }
      }, 1000);
    },
    
    // 初始化显示策略
    initializeDisplayStrategy() {
      // 从localStorage检查是否已看过视频
      const hasSeenVideo = localStorage.getItem('hasSeenIntroVideo') === 'true';
      this.hasSeenVideo = hasSeenVideo;
      
      switch (this.displayStrategy) {
        case 'first_visit':
          this.handleFirstVisitStrategy(hasSeenVideo);
          break;
        case 'always_show':
          this.handleAlwaysShowStrategy();
          break;
        case 'smart_trigger':
          this.handleSmartTriggerStrategy(hasSeenVideo);
          break;
        default:
          this.handleFirstVisitStrategy(hasSeenVideo);
      }
    },
    
    // 方案1：首次访问用户方案
    handleFirstVisitStrategy(hasSeenVideo) {
      if (!hasSeenVideo) {
        // 首次访问，显示视频
        setTimeout(() => {
          this.showVideoModal = true;
          this.videoAutoCloseTime = 0; // 需要手动关闭
        }, 1000);
      } else {
        // 已看过视频，直接显示AI提示
        this.scheduleAITip();
      }
    },
    
    // 方案2：定时展示方案
    handleAlwaysShowStrategy() {
      // 每次进入都显示视频（3秒自动关闭）
      setTimeout(() => {
        this.showVideoModal = true;
        this.videoAutoCloseTime = 3000;
      }, 500);
      
      // AI按钮提示每次都显示5秒
      setTimeout(() => {
        this.showAITip = true;
      }, 4000);
    },
    
    // 方案3：智能触发方案
    handleSmartTriggerStrategy(hasSeenVideo) {
      if (!hasSeenVideo) {
        // 用户在页面停留10秒无操作时显示视频
        this.setupUserIdleDetection();
      } else {
        // 鼠标接近AI按钮时显示提示卡片
        this.setupAIButtonHoverDetection();
      }
    },
    
    // 用户空闲检测
    setupUserIdleDetection() {
      const resetIdleTimer = () => {
        if (this.userIdleTimer) {
          clearTimeout(this.userIdleTimer);
        }
        this.userIdleTimer = setTimeout(() => {
          if (!this.hasSeenVideo && !this.showVideoModal && !this.showAIChat) {
            this.showVideoModal = true;
            this.videoAutoCloseTime = 0;
          }
        }, this.userActivityTimeout);
      };
      
      // 监听用户活动
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetIdleTimer, { passive: true });
      });
      
      // 初始启动计时器
      resetIdleTimer();
    },
    
    // AI按钮hover检测
    setupAIButtonHoverDetection() {
      // 这个方法将在AI按钮获得焦点时触发提示
      // 实际实现需要配合CSS hover事件或者添加事件监听器
    },
    
    // AI按钮hover处理
    handleAIButtonHover() {
      if (this.displayStrategy === 'smart_trigger' && this.hasSeenVideo) {
        // 只有在智能触发模式且已看过视频时才显示提示
        if (!this.showAITip && !this.showAIChat && !this.showVideoModal) {
          this.showAITip = true;
        }
      }
    },
    
    handleViewOnMap(recommendation) {
      console.log('🗺️ 在地图上查看:', recommendation);
      // 这里可以跳转到地图上的具体社区位置
      this.focusOnCommunity(recommendation.name);
    },
    
    highlightRecommendationsOnMap(recommendations) {
      // 占位符方法：在地图上高亮推荐的社区
      console.log('🎯 在地图上高亮推荐社区:', recommendations.map(r => r.name));
      // TODO: 实现地图高亮逻辑
    },
    
    // 🔍 调试：统计NTA数据信息
    logNTADataStats() {
      if (!this.nycBoroughsGeoJSON || !this.nycBoroughsGeoJSON.features) {
        console.error('❌ NTA数据未加载或格式错误');
        return;
      }
      
      const features = this.nycBoroughsGeoJSON.features;
      const areaStats = {
        totalAreas: features.length,
        areaNames: [],
        boroughs: {},
        missingNames: 0
      };
      
      features.forEach((feature, index) => {
        const props = feature.properties || {};
        const areaName = props.NTAName || props.name || props.BoroName || null;
        const boroName = props.BoroName || '未知行政区';
        
        if (areaName) {
          areaStats.areaNames.push({
            index,
            name: areaName,
            borough: boroName,
            hasGeometry: !!feature.geometry
          });
          
          if (!areaStats.boroughs[boroName]) {
            areaStats.boroughs[boroName] = 0;
          }
          areaStats.boroughs[boroName]++;
        } else {
          areaStats.missingNames++;
        }
      });
      
      console.log('🗂️ NTA数据加载统计:', {
        总区域数量: areaStats.totalAreas,
        命名区域数量: areaStats.areaNames.length,
        缺失名称区域: areaStats.missingNames,
        按行政区分布: areaStats.boroughs,
        前10个区域: areaStats.areaNames.slice(0, 10).map(area => `${area.name} (${area.borough})`)
      });
    },
    
    focusOnCommunity(communityName) {
      // 占位符方法：聚焦到特定社区
      console.log('🔍 聚焦社区:', communityName);
      // TODO: 实现地图聚焦逻辑
    }
  }
};
</script>

<style scoped>
/* 页面容器 */
.page-container {
  position: relative;
  height: 100%; /* 继承父容器高度 */
  z-index: 1; /* 降低z-index，确保不会覆盖nav */
}

/* 地图包装器 - 适应剩余高度 */
.map-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden; /* 防止地图内容溢出到导航栏等其他区域 */
}

/* 底部搜索容器 - 只在地图模块显示 */
.bottom-search-container {
  position: absolute; /* 只在地图容器内显示 */
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 16px;
  bottom: 0;
  left: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 全宽度单行搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 44px; /* 固定高度，确保单行 */
  width: 100%;
  padding: 0 clamp(16px, 3vw, 80px); /* 响应式padding */
}

/* 搜索输入框组 - input和button连体，包含type dropdown */
.search-input-group {
  position: relative;
  display: flex;
  height: 100%;
  min-width: 240px; /* 设置合适的最小宽度 */
  width: clamp(240px, 40vw, 420px); /* 调整为40vw，在小屏幕时更紧凑 */
  flex-shrink: 1; /* 允许适当压缩 */
}

/* Location Icon Left - 左侧圆角，无右边框 */
/* AI助手按钮样式 */
.ai-assistant-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  height: 100%;
  background: transparent;
  border: 1px solid #198754;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
  transition: all 0.3s ease;
}

.ai-assistant-btn:hover {
  background: rgba(25, 135, 84, 0.1);
  border-color: #146c43;
  transform: translateY(-1px);
}

.ai-assistant-btn:active {
  transform: translateY(0);
}

.ai-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  animation: aiPulse 3s infinite;
}

@keyframes aiPulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.85; 
    transform: scale(1.05);
  }
}

.location-icon-left {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  height: 100%;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-right: none; /* 去掉右边框，与input连接 */
  border-left: 1px solid #E5E7EB; /* 保持左边框，与AI按钮分割 */
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
}

/* 分割线样式 */
.divider {
  width: 1px;
  background-color: #3E4958;
  flex-shrink: 0;
}

.divider-79 {
  height: 79%;
  align-self: center;
}









/* 定位图标 - 连接在分割线之间 */
.location-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 8px;
  flex-shrink: 0;
  background: #F9FAFB;
  border-top: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
  border-left: none;
  border-right: none;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
}

.location-input {
  width: 100%;
  height: 100%;
  padding: 0 12px 0 8px; /* 左边距较小，右边正常 */
  border: 1px solid #E5E7EB; /* 默认保持灰色边框 */
  border-left: none; /* 去掉左边框，与分割线连接 */
  border-right: none; /* 去掉右边框，与按钮连接 */
  border-radius: 0;
  font-size: 14px;
  background: transparent;
  color: #374151;
  outline: none;
  box-sizing: border-box;
  line-height: 1;
}

/* 当容器内有关键词时，完全移除input的边框和focus效果 */
.search-content-container .location-input {
  border: none !important;
}

.search-content-container .location-input:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 禁用状态样式 */
.location-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.location-input:disabled::placeholder {
  color: #9ca3af;
  font-size: 13px;
}

.location-input::placeholder {
  color: #9CA3AF;
}

/* 搜索内容容器 - flex布局 */
.search-content-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  background: white;
  border: 1px solid #E5E7EB;
  border-left: none;
  border-right: none;
  gap: 0;
}

/* 关键词区域 */
.keywords-area {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 0 0 8px;
  flex-shrink: 1; /* 允许适当压缩 */
  height: 100%;
  max-width: calc(100% - 100px); /* 为input预留最小空间 */
  overflow: hidden; /* 隐藏超出的关键词 */
}

/* 输入区域 */
.input-area {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  min-width: 80px; /* 确保最小宽度能显示placeholder */
}

.keyword-tag {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(246, 192, 2, 0.26);
  border: 1px solid rgba(246, 192, 2, 0.5);
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 12px;
  color: #333;
  max-width: clamp(80px, 20vw, 200px); /* 允许更大宽度显示完整文本 */
  min-width: 40px; /* 确保最小宽度能容纳关闭按钮 */
  flex-shrink: 0; /* 防止标签被压缩 */
  margin-right: 4px; /* 标签之间的间距 */
}

/* 所有关键词统一样式 - 黄色背景 */
.keyword-user,
.keyword-map,
.keyword-location {
  background: rgba(246, 192, 2, 0.35);
  border-color: rgba(246, 192, 2, 0.6);
  color: #2c1810;
}

.keyword-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 20px); /* 为关闭按钮留出空间 */
}

.keyword-remove {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 0;
  margin: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.keyword-remove:hover {
  background: rgba(25, 135, 84, 0.1); /* 主题绿色背景 */
  color: #198754; /* 主题绿色文字 */
}

/* 搜索按钮 - 连接在input右边，右侧圆角 */
.search-button {
  height: 100%;
  padding: 0 16px;
  background: #198754;
  border: 1px solid #198754;
  border-left: none; /* 去掉左边框，与input连接 */
  border-radius: 0 8px 8px 0; /* 只有右侧圆角 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.search-button:hover {
  background: #198754;
}



/* Filter Tags Container - 支持滚动 */
.filter-tags-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Filter Tags - 弹性布局，支持滚动 */
.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  padding: 0 12px;
  scroll-behavior: smooth; /* 平滑滚动 */
  /* 启用触摸滚动 */
  -webkit-overflow-scrolling: touch;
  /* 允许水平滚动但禁止垂直滚动 */
  overscroll-behavior-x: contain;
  overscroll-behavior-y: none;
}

.filter-tags::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 添加渐变遮罩，指示可以滚动 */
.filter-tags-container::before,
.filter-tags-container::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 20px;
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.3s ease;
}

/* 左侧渐变遮罩 */
.filter-tags-container::before {
  left: 0;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.9), transparent);
  opacity: 0;
}

/* 右侧渐变遮罩 */
.filter-tags-container::after {
  right: 0;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent);
  opacity: 1;
}

/* 当容器可滚动时显示渐变 */
.filter-tags-container.can-scroll-left::before {
  opacity: 1;
}

.filter-tags-container.can-scroll-right::after {
  opacity: 1;
}

/* 当不能再向右滚动时隐藏右侧渐变 */
.filter-tags-container:not(.can-scroll-right)::after {
  opacity: 0;
}

/* 筛选图标 */
.filter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.filter-icon:hover {
  opacity: 0.7;
}

/* 更多标签按钮 */
.more-tag {
  background: #f3f4f6 !important;
  color: #6b7280 !important;
  border: 1px dashed #d1d5db !important;
  font-weight: 500;
}

.more-tag:hover {
  background: #e5e7eb !important;
  border-color: #9ca3af !important;
}

/* 定位图标可点击样式 */
.location-icon {
  cursor: pointer;
  transition: opacity 0.2s;
}

.location-icon:hover {
  opacity: 0.7;
}

.filter-tag {
  padding: 0 12px;
  height: 75%;
  display: flex;
  align-items: center;
  background: transparent;
  border: 1px solid #3E4958;
  border-radius: 30px;
  font-size: 15px;
  color: #3E4958;
  cursor: pointer;
  font-weight: 400;
  transition: all 0.2s;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
  /* 提升触摸体验 */
  touch-action: manipulation;
}

.filter-tag:hover {
  background: rgba(246, 192, 2, 0.15); /* 使用金黄色作为点缀色，15%透明度 */
  border-color: rgba(246, 192, 2, 0.3);
}

.filter-tag.active {
  background: #198754;
  color: white;
}

/* Loading状态标签 */
.loading-tag {
  background: #f3f4f6 !important;
  color: #9ca3af !important;
  cursor: default !important;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 更多标签按钮样式 */
.more-tag {
  background: #e5e7eb !important;
  color: #6b7280 !important;
  font-weight: 600 !important;
}

/* 移动端+N按钮默认隐藏 */
.filter-tags-container.mobile-only {
  display: none;
  flex: none; /* 覆盖基础样式的flex: 1 */
  width: auto; /* 确保宽度自适应内容 */
}

.leaflet-map {
  height: 100%;
  width: 100%;
  z-index: 1;
}

/* 自定义 Leaflet 控件样式 */
:deep(.leaflet-control-zoom) {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

:deep(.leaflet-control-zoom a) {
  background-color: white !important;
  color: #198754 !important;
  border: 1px solid #198754 !important;
  font-weight: bold !important;
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: #198754 !important;
  color: white !important;
}

/* 自定义 Scale 控件样式 */
:deep(.leaflet-control-scale) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 4px !important;
  padding: 2px 6px !important;
}

:deep(.leaflet-control-scale-line) {
  border: 2px solid #198754 !important;
  border-top: none !important;
  color: #198754 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 1.2 !important;
  padding: 2px 4px 1px !important;
  background: white !important;
  text-align: center !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 16px !important;
}

/* 移除scale hover效果 */
:deep(.leaflet-control-scale-line:hover) {
  background: white !important;
  color: #198754 !important;
  transform: none !important;
  transition: none !important;
}

/* Leaflet原生popup样式已移除，使用自定义hover-tooltip-container */

/* 社区弹窗样式 */
:deep(.community-popup) {
  min-width: 20%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:deep(.community-name) {
  color: #198754;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  border-bottom: 2px solid #198754;
  padding-bottom: 6px;
}

:deep(.community-details) {
  line-height: 1.5;
}

:deep(.rent-info) {
  background-color: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

:deep(.walk-score), 
:deep(.distance) {
  margin-bottom: 6px;
  font-size: 14px;
}

:deep(.description) {
  color: #555;
  font-style: italic;
  margin: 8px 0;
  font-size: 14px;
}

:deep(.tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

:deep(.tag) {
  background-color: #e8f5e8;
  color: #198754;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

/* 信息卡片样式 */
:deep(.info-card) {
  background: white !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
  font-family: Arial, sans-serif !important;
  min-width: 200px !important;
}

:deep(.info-content) {
  line-height: 1.4;
  font-size: 14px;
}

/* 详细弹窗样式已移除，使用自定义hover-tooltip-container */

:deep(.tag-badge) {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

:deep(.building-section) {
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-top: 10px;
}

:deep(.detail-btn) {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  margin: 2px 4px;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.detail-btn:hover) {
  background-color: #0056b3;
}

/* 悬浮提示样式 - 按照设计图实现 */
:global(.hover-tooltip-container) {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: clamp(17rem, 26vw, 22rem);
  box-sizing: border-box;
}

/* 气泡卡片 - 保留倒三角 */
:global(.bubble-card) {
  position: relative;
  width: 100%;
  height: auto;
  background: #FFFFFF;
  opacity: 0.95;
  box-shadow: 8px 9px 5px rgba(0, 0, 0, 0.01), 4px 5px 4px rgba(0, 0, 0, 0.05), 2px 2px 3px rgba(0, 0, 0, 0.09), 0px 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-sizing: border-box;
}

/* 倒三角箭头 */
:global(.bubble-arrow) {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #FFFFFF;
  opacity: 0.9;
}

/* 卡片内容容器 */
:global(.card-content) {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* 社区名称头部 */
:global(.community-header) {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px 10px;
  height: 36px;
  background: rgba(253, 253, 253, 0.8);
  border-radius: 15px;
  margin-bottom: 7px;
}

:global(.community-name) {
  font-family: 'ADLaM Display', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 149.8%;
  color: #000000;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 骨架屏动画效果 */
:global(.skeleton-shimmer) {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
/* 图片容器样式 */
:global(.image-container) {
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 8rem; /* 保留最小高度以兼容骨架 */
  margin: 0;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}
:global(.area-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 标签容器 - 支持多个标签，移至底部，优先单行显示 */
/* 租金容器 */
:global(.rent-container) {
  display: flex;
  justify-content: center;
  margin-bottom: 7px;
}

:global(.rent-pill) {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px 10px;
  height: 25px;
  background: rgba(253, 253, 253, 0.8);
  border-radius: 15px;
  min-width: 109px;
}

:global(.rent-pill span) {
  font-family: 'Actor', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 149.8%;
  color: #000000;
  text-align: center;
}


/* 图标容器 - 居中对齐鼠标位置 */
:global(.icon-container) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 43px;
  height: 42px;
  position: absolute;
  z-index: 1;
  /* 计算居中位置：卡片宽度的一半减去icon宽度的一半 */
  left: calc(50% - 21.5px); /* 85px - 21.5px = 卡片中心位置 */
  bottom: -47px; /* 位于卡片下方 */
}

/* 新增的amenities、transport、rent容器样式 */
:global(.amenities-container),
:global(.transport-container),
:global(.rent-container) {
  margin-bottom: 5px;
}

:global(.section-title) {
  font-family: 'Actor', sans-serif;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: #5c5c5c;
  text-transform: uppercase;
  text-align: left;
}

/* 信息分组布局 */
:global(.info-sections) {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
:global(.info-section) {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
:global(.chip-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
:global(.chip) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-family: 'Actor', sans-serif;
  font-weight: 500;
  font-size: 11px;
  line-height: 1.15;
  color: #4a4a4a;
  background: rgba(0, 0, 0, 0.04);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}
:global(.chip-amenity) {
  background: rgba(221, 160, 221, 0.18);
  color: #6d3b8f;
  box-shadow: none;
  border: 1px solid rgba(221, 160, 221, 0.28);
}
:global(.chip-transport) {
  background: rgba(96, 125, 139, 0.14);
  color: #2d5061;
  box-shadow: none;
  border: 1px solid rgba(96, 125, 139, 0.25);
}
/* 特征标签样式 */
:global(.chip-feature) {
  background: rgba(25, 135, 84, 0.12);
  color: #1a5b3b;
  border: 1px solid rgba(25, 135, 84, 0.3);
}
:global(.chip-more) {
  background: transparent;
  border: 1px dashed rgba(0, 0, 0, 0.25);
  color: #555555;
}


:global(.amenities-list),
:global(.transport-list) {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
}

:global(.amenity-tag),
:global(.transport-tag) {
  display: inline-flex; /* 便于垂直居中 */
  align-items: center;
  padding: 2px 6px;
  height: 1.25rem; /* 约20px，与骨架一致 */
  background: rgba(221, 160, 221, 0.8);
  color: #ffffff;
  border-radius: 8px;
  font-family: 'Actor', sans-serif;
  font-weight: 400;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 0 1 auto;
  max-width: 100%;
}

:global(.rent-info) {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  align-items: center;
}

:global(.rent-info span) {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(253, 253, 253, 0.9);
  color: #000;
  border-radius: 12px;
  font-family: 'Actor', sans-serif;
  font-weight: 500;
  font-size: 10px;
  white-space: nowrap;
}



/* 响应式设计 - 重新设计 */

/* 平板和大屏设备 (769px以上) - 完整UI */
@media (min-width: 769px) {
  .bottom-search-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 12px 16px;
    z-index: 1000;
  }
  
  .search-bar {
    flex-direction: row;
    height: 44px;
    gap: 12px;
  }
  
  .search-input-group {
    width: 550px; /* 进一步增加大屏宽度 */
    flex-shrink: 0;
  }
  
  .filter-tags-container {
    display: block;
    flex: 1;
  }
}

/* 小平板 (481px-768px) - 保留tags但优化布局 */
/* 中等屏幕优化 - 780-640px */
@media (max-width: 780px) and (min-width: 640px) {
  .search-input-group {
    width: 300px;
    flex-shrink: 0;
  }
  
  .keywords-area {
    max-width: calc(100% - 120px); /* 为input预留更多空间 */
  }
  
  .keyword-tag {
    max-width: 80px; /* 限制关键词标签宽度 */
    font-size: 11px;
  }
  
  .input-area {
    min-width: 100px; /* 确保input区域有足够空间 */
  }
}

/* 750px以下优化搜索按钮 */
@media (max-width: 750px) {
  .search-button {
    padding: 0 18px !important; /* 增加padding让按钮更大 */
    min-width: 50px; /* 确保最小宽度 */
    height: 100% !important; /* 确保高度对齐 */
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .search-button svg {
    width: 22px !important; /* 增大icon尺寸 */
    height: 22px !important;
  }
}

@media (max-width: 768px) and (min-width: 481px) {
  .bottom-search-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 10px 12px;
    z-index: 1000;
  }
  
  .search-bar {
    flex-direction: row;
    height: 40px;
    gap: 8px;
  }
  
  .search-input-group {
    width: 380px; /* 增加小平板宽度 */
    flex-shrink: 0;
  }
  
  .filter-tags-container {
    display: block;
    flex: 1;
  }
  
  .filter-tag {
    font-size: 13px;
    padding: 0 8px;
    min-width: 60px; /* 设置最小宽度确保可点击 */
  }
  
  /* 增强小平板的滚动提示 */
  .filter-tags-container::after {
    width: 30px; /* 更宽的渐变提示 */
  }
  
  .filter-tags-container::before {
    width: 30px;
  }
}

/* 手机设备 (≤480px) - 隐藏tags，垂直布局 */
@media (max-width: 480px) {
  /* 默认情况下保持absolute定位（适用于Browse页面） */
  .bottom-search-container {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    padding: 6px 8px !important;
    z-index: 1001 !important;
    background: rgba(255, 255, 255, 0.98) !important;
    backdrop-filter: blur(15px) !important;
  }
  
  /* 只有home页面才使用fixed定位 */
  .home-page .bottom-search-container {
    position: fixed !important;
  }
  
  .search-bar {
    flex-direction: row !important; /* 强制单排 */
    height: 38px !important;
    gap: 4px !important;
  }
  
  .search-input-group {
    flex: 1;
    height: 38px !important;
    min-width: 160px;
    max-width: calc(100% - 45px); /* 为+N按钮预留空间 */
  }
  
  .location-icon-left {
    padding: 0 8px !important;
    min-width: 50px !important;
  }
  
  .location-input {
    padding: 0 8px !important;
    font-size: 14px !important;
  }
  
  .search-button {
    padding: 0 12px !important;
  }
  
  /* 显示+N按钮在单排中 */
  .filter-tags-container.mobile-only {
    display: flex !important;
    align-items: center;
    flex-shrink: 0;
    margin-left: 4px;
    width: auto; /* 确保宽度自适应内容 */
  }
  
  .mobile-filter-btn {
    background: #f3f4f6;
    color: #6b7280;
    border: 1px dashed #d1d5db;
    border-radius: 20px;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mobile-filter-btn:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
  
  /* 隐藏原来的filter-tags-container */
  .filter-tags-container:not(.mobile-only) {
    display: none !important;
  }
  
  /* 移动端关键词样式优化 */
  .keyword-tag {
    font-size: 10px !important;
    padding: 1px 4px !important;
    max-width: 60px !important; /* 增加宽度确保关闭按钮可见 */
    min-width: 35px !important; /* 确保最小宽度 */
    margin-right: 2px !important;
  }
  
  .keyword-tag-text {
    font-size: 10px !important;
  }
  
  .keyword-remove {
    width: 12px !important;
    height: 12px !important;
    font-size: 12px !important;
  }
  
  /* 移动端输入区域优化 */
  .keywords-area {
    padding: 0 0 0 4px !important;
    max-width: calc(100% - 60px) !important; /* 小屏下给input更多空间 */
  }
  
  .input-area {
    min-width: 60px !important; /* 小屏下确保input最小宽度 */
  }
  
  .location-input {
    padding: 0 8px 0 4px !important;
    font-size: 12px !important;
  }
  
  /* 手机端高度优化 */
  .page-container {
    height: 100% !important; /* 保持继承高度 */
    min-height: auto; /* 移除webkit填充，避免冲突 */
  }
}

/* 标签选择模态框样式 */
.tags-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  z-index: 9999;
  transition: all 0.2s ease;
}

.tags-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 480px;
  width: 90%;
  max-height: 70vh;
  overflow: hidden;
  position: relative;
  margin: auto;
  transition: all 0.3s ease;
}

/* 模态框在底部时 - 向上显示 */
.modal-top {
  align-self: flex-start;
  margin-top: 10vh;
}

/* 模态框在顶部时 - 向下显示 */
.modal-bottom {
  align-self: flex-end;
  margin-bottom: 10vh;
}

/* 根据位置调整对齐方式 */
.tags-modal-overlay {
  align-items: center;
  justify-content: center;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.modal-tag {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  background: white;
  white-space: nowrap;
}

.modal-tag:hover {
  background: #f9fafb;
  border-color: #198754;
}

.modal-tag.active {
  background: #198754;
  color: white;
  border-color: #198754;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.modal-confirm {
  background: #198754;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-confirm:hover {
  background: #157347;
}

/* 移动端模态框优化 */
@media (max-width: 768px) {
  .tags-modal {
    width: 95%;
    max-height: 80vh;
  }
  
  .tags-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .modal-tag {
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* AI聊天弹窗样式 */
.ai-chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* AI提示卡片包装器 */
.ai-tip-wrapper {
  position: fixed;
  bottom: 0;
  left: 20px; /* 对应AI助手按钮的位置 */
  z-index: 5000;
  pointer-events: none;
}

/* AI聊天弹窗响应式优化 */
@media (max-width: 480px) {
  .ai-chat-overlay {
    align-items: flex-start;
    padding: 20px 10px;
  }
}

/* 小手机优化 (≤360px) */
@media (max-width: 360px) {
  .page-container {
    width: 100vw !important; /* 确保容器占满视口宽度 */
    height: 100vh !important; /* 确保容器占满视口高度 */
    margin: 0 !important;
    padding: 0 !important;
  }
  
  .map-wrapper {
    width: 100vw !important; /* 确保地图包装器占满视口宽度 */
    height: 100vh !important; /* 确保地图包装器占满视口高度 */
  }
  
  .bottom-search-container {
    padding: 4px 6px !important;
    left: 0 !important;
    right: 0 !important;
    width: 100vw !important;
  }
  
  .search-input-group {
    height: 34px !important;
  }
  
  .location-icon-left {
    min-width: 40px !important;
    padding: 0 4px !important;
  }
  
  .location-input {
    font-size: 12px !important;
    padding: 0 4px !important;
  }
  
  .search-button {
    padding: 0 8px !important;
  }
  
}

/* 推荐框样式 - 完全复刻uhomes设计 */
.recommendations-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999; /* 提高z-index确保在Browse页面中不被遮挡 */
  max-height: 600px; /* 进一步增加高度避免滚动条 */
  overflow-y: auto;
}

/* 向下弹出（默认） */
.recommendations-dropdown.dropdown-down {
  top: 100%;
  margin-top: 4px;
}

/* 向上弹出 */
.recommendations-dropdown.dropdown-up {
  bottom: 100%;
  margin-bottom: 4px;
}

.recommendations-content {
  padding: 0;
}

/* 推荐框头部 - 热门搜索标题 */
.recommendations-header {
  padding: 16px 16px 8px 16px;
  border-bottom: none;
}

.recommendations-title {
  font-size: 16px;
  font-weight: 600;
  color: #198754;
  margin: 0;
  position: relative;
  display: inline-block;
}

.recommendations-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #198754;
  border-radius: 1px;
}

/* 推荐分区 */
.recommendation-section {
  padding: 0 16px 16px 16px;
}

.recommendation-section:last-child {
  padding-bottom: 16px;
}

/* 分区头部 - Icon + Label */
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 0 8px 0;
}

.section-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
  margin-right: 8px;
  flex-shrink: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex: 1;
}

/* 分割线 */
.section-divider {
  height: 1px;
  background-color: #f3f4f6;
  margin: 8px 0 0 0;
}

/* 内容网格 */
.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

/* 内容项 */
.item-chip {
  display: inline-block;
  color: #374151;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
  line-height: 1.2;
  background: transparent;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.item-chip:hover {
  background: #f3f4f6;
  color: #198754;
  border-color: #198754;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(25, 135, 84, 0.1);
}

.item-chip:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(25, 135, 84, 0.1);
}

/* 确保推荐框在搜索框相对定位 */
.search-input-wrapper {
  position: relative;
}

/* 响应式设计 - 商业化的移动端优化 */
@media (max-width: 768px) {
  .bottom-search-container {
    padding: 8px 12px;
  }
  
  .search-bar {
    gap: 8px;
    height: 40px;
    padding: 0 8px;
  }
  
  .search-input-group {
    min-width: 240px;
    width: clamp(240px, 100vw, 320px);
  }
  
  .location-icon-left {
    padding: 0 8px;
  }
  
  
  .location-input {
    font-size: 14px;
  }
  
  /* 移动端推荐框优化 */
  .recommendations-dropdown {
    max-height: 70vh; /* 移动端使用视口高度的70% */
  }
  
  .search-button {
    width: 36px;
    height: 36px;
  }
  
  .keyword-tag {
    max-width: 80px;
    font-size: 11px;
    padding: 1px 4px;
  }
  
  .keyword-tag-text {
    max-width: calc(100% - 16px);
  }
}

/* 小屏幕 - 隐藏filter tags组，只显示+N图标 */
/* 640-500px范围：隐藏tags，显示+N按钮 */
@media (max-width: 640px) and (min-width: 500px) {
  .filter-tags-container {
    display: none;
  }
  
  .search-bar {
    justify-content: space-between;
    flex-direction: row !important; /* 强制单排 */
  }
  
  .search-input-group {
    flex: 1;
    min-width: 200px;
    max-width: calc(100% - 60px); /* 减少预留空间，让input更宽 */
  }
  
  /* 显示+N按钮用于快速检索 */
  .filter-tags-container.mobile-only {
    display: flex !important;
    align-items: center;
    flex-shrink: 0;
    margin-left: 8px;
    width: auto; /* 确保宽度自适应内容 */
  }
  
  .mobile-filter-btn {
    background: #f3f4f6;
    color: #6b7280;
    border: 1px dashed #d1d5db;
    border-radius: 20px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mobile-filter-btn:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
}

/* 500px以下：强制单排，显示+N按钮 */
@media (max-width: 500px) {
  .search-bar {
    flex-direction: row !important; /* 强制单排 */
    height: 44px !important; /* 恢复固定高度 */
    gap: 8px !important;
  }
  
  .search-input-group {
    flex: 1;
    height: 100% !important;
    min-width: 180px;
    max-width: calc(100% - 50px); /* 为+N按钮预留更少空间 */
  }
  
  /* 显示+N按钮 */
  .filter-tags-container.mobile-only {
    display: flex !important;
    align-items: center;
    flex-shrink: 0;
    margin-left: 4px;
    width: auto; /* 确保宽度自适应内容 */
  }
  
  .mobile-filter-btn {
    background: #f3f4f6;
    color: #6b7280;
    border: 1px dashed #d1d5db;
    border-radius: 20px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mobile-filter-btn:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .bottom-search-container {
    padding: 6px 8px;
  }
  
  .search-bar {
    gap: 6px;
    height: 36px;
    padding: 0 4px;
  }
  
  .search-input-group {
    min-width: 180px;
    width: 100%;
  }
  
  .location-icon-left {
    padding: 0 6px;
  }
  
  
  .location-input {
    font-size: 13px;
  }
  
  .search-button {
    width: 32px;
    height: 32px;
  }
  
  .keyword-tag {
    max-width: 60px;
    font-size: 10px;
    padding: 1px 3px;
    margin-right: 2px;
  }
  
  .keyword-tag-text {
    max-width: calc(100% - 14px);
  }
  
  .keyword-remove {
    width: 12px;
    height: 12px;
    font-size: 10px;
  }
}
</style>
