<template>
  <div class="browse-page">
    <Navbar />
    
    <main class="main-content">
      <!-- Map Section -->
      <section class="map-section">
        <div class="map-container">
          <OpenStreetMap 
            ref="mapComponent" 
            @zoom-change="handleZoomChange"
            @search-performed="handleSearchPerformed"
            @filter-clicked="handleFilterClick"
            :initial-search-params="searchParams"
          />
        </div>
      </section>
      
      <!-- Cards Section -->
      <section class="cards-section">
        <div class="section-container">
          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p class="loading-text">
              <TranslatedText text="loading" use-static /> 
              {{ currentZoom <= 14 ? getStaticText('neighborhoods') : getStaticText('buildings') }}...
            </p>
          </div>
          
          <!-- Neighborhood Cards (zoom <= 14) -->
          <div v-else-if="currentZoom <= 14" class="neighborhood-view">
            <h2 class="section-title">
              Popular Neighborhoods<span v-if="searchKeywordLabel"> — {{ searchKeywordLabel }}</span>
              <span class="results-count">({{ searchResults.length }} <TranslatedText text="found" :use-static="true" />)</span>
            </h2>
            
            <div v-if="searchResults.length === 0" class="no-results">
              <p><TranslatedText text="no_results" use-static /></p>
              <button @click="broadenSearch" class="broaden-search-btn">
                <TranslatedText text="try_broader_search" use-static />
              </button>
            </div>
            
            <!-- 复用Home页面的卡片样式 -->
            <div v-else class="cards-grid">
              <div
                v-for="neighborhood in searchResults"
                :key="`neighborhood-${neighborhood.id}`"
                class="neighborhood-card clickable-card"
                @click="selectNeighborhood(neighborhood)"
              >
                <div class="card-image">
                  <img
                    v-if="getNeighborhoodImage(neighborhood)"
                    :src="getNeighborhoodImage(neighborhood)"
                    :alt="neighborhood.name"
                    class="area-image"
                    @error="handleImageError"
                  />
                  <div v-else class="placeholder"></div>
                </div>
                <div class="card-badge" :class="neighborhood.badgeClass">
                  <TranslatedText :text="neighborhood.badgeLabel || neighborhood.name || 'NYC'" :use-static="true" />
                </div>
                <div class="card-content">
                  <div class="card-header">
                    <h3 class="card-title">
                      <TranslatedText :text="neighborhood.name || 'Neighborhood'" debug-context="browse-neighborhood-name" />
                    </h3>
                  </div>

                  <div 
                    v-if="hasDisplayContent(neighborhood.display)"
                    class="info-sections"
                  >
                    <div class="info-section">
                      <div class="card-section-title">
                        <TranslatedText text="Features" :use-static="true" />
                      </div>
                      <div class="chip-row">
                        <span
                          v-for="(feature, featureIndex) in neighborhood.display.features.items"
                          :key="`feature-${feature}`"
                          class="chip chip-feature"
                          :class="featureIndex === 0 ? 'chip-feature-primary' : featureIndex === 1 ? 'chip-feature-secondary' : ''"
                        >
                          <TranslatedText :text="feature" :use-static="true" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div 
                    v-else 
                    class="card-placeholder"
                  >
                    <span><TranslatedText text="Coming soon" :use-static="true" /></span>
                    <span><TranslatedText text="Discover more about this neighbourhood." :use-static="true" /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Building Cards (zoom > 14) -->
          <div v-else class="building-view">
            <h2 class="section-title">
              <TranslatedText text="buildings" use-static />
              <span><TranslatedText text="in" :use-static="true" /> <TranslatedText :text="getLocationDisplayName()" /></span>
              <span class="results-count">({{ searchResults.length }} <TranslatedText text="found" :use-static="true" />)</span>
            </h2>
            
            <div v-if="searchResults.length === 0" class="no-results">
              <p><TranslatedText text="no_results" use-static /></p>
              <button @click="broadenSearch" class="broaden-search-btn">
                <TranslatedText text="try_broader_search" use-static />
              </button>
            </div>
            
            <div v-else class="building-cards-grid">
              <div 
                v-for="building in searchResults" 
                :key="`building-${building.id}`" 
                class="building-card"
              >
                <div class="card-image">
                  <img 
                    v-if="getBuildingImage(building)"
                    :src="getBuildingImage(building)" 
                    :alt="building.name"
                    @error="handleImageError"
                  />
                  <div v-else class="placeholder-image">
                    <span>{{ building.name }}</span>
                  </div>
                  <!-- 收藏按钮在左下角 -->
                  <div class="favorite-overlay" @click.stop="toggleFavorite(building)">
                    <n-icon size="18" :color="favorites.has(building.id) ? '#e74c3c' : '#666'">
                      <HeartOutline v-if="!favorites.has(building.id)" />
                      <Heart v-else />
                    </n-icon>
                  </div>
                  
                  <!-- 小屏幕下的图片底部overlay（评论数） -->
                  <div class="img-cover-bottom-mobile flex">
                    <div class="comments flex mobile-comments">
                      <n-icon size="14" color="#666">
                        <ChatbubbleEllipsesOutline />
                      </n-icon>
                      <span class="number">({{ getBuildingCommentsCount(building) }})</span>
                    </div>
                  </div>
                </div>
                <div class="card-content">
                  <div class="house-card-info">
                    <!-- Title -->
                    <h2 class="title ellipsis2">
                      <TranslatedText 
                        :text="building.name || 'Modern Apartment'" 
                        debug-context="building-name"
                        :force-api="!!building.name"
                      />
                    </h2>
                    
                    <!-- Location -->
                    <div class="location">
                      <TranslatedText 
                        :text="getBuildingLocation(building)" 
                        debug-context="building-location"
                        :force-api="true"
                      />
                    </div>
                    
                    <!-- Distance and Transportation -->
                    <div class="house-distance">
                      <p class="name">
                        <span>{{ getBuildingWalkingInfo(building) }}</span> <TranslatedText text="from_university" use-static />
                      </p>
                      <div class="traffic-list flex">
                        <div class="traffic-item flex">
                          <n-icon size="14" color="#666">
                            <Walk />
                          </n-icon>
                          <p>{{ getBuildingWalkTime(building) }}</p>
                        </div>
                        <div class="traffic-item flex">
                          <n-icon size="14" color="#666">
                            <Bus />
                          </n-icon>
                          <p>{{ getBuildingBusTime(building) }}</p>
                        </div>
                        <div class="traffic-item flex">
                          <n-icon size="14" color="#666">
                            <Train />
                          </n-icon>
                          <p>{{ getBuildingTrainTime(building) }}</p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Tags -->
                    <div class="tags">
                      <div class="tags-box flex">
                        <span 
                          v-for="tag in getBuildingTags(building)" 
                          :key="tag" 
                          class="item"
                          :style="getTagStyle(tag)"
                        >
                          <TranslatedText :text="tag" debug-context="building-tag" />
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 右侧信息区域，完全复刿uhome结构 -->
                  <div class="house-card-right flex">
                    <!-- 评论数 -->
                    <div class="comments flex">
                      <n-icon size="14" color="#666">
                        <ChatbubbleEllipsesOutline />
                      </n-icon>
                      <span class="number">({{ getBuildingCommentsCount(building) }})</span>
                    </div>
                    
                    <!-- 价格 -->
                    <div class="price-box">
                      <div class="current-price">{{ getBuildingPriceRange(building) }}</div>
                      <div class="price-unit"><TranslatedText text="month" use-static /></div>
                    </div>
                    
                    <!-- CTA按钮 -->
                    <div class="btn" @click.stop="goToBuildingDetail(building.id)">
                      <n-icon size="14" color="white">
                        <ArrowForward />
                      </n-icon>
                      <span><TranslatedText text="view" use-static /></span>
                    </div>
                  </div>
                </div>
                
                <!-- 小屏幕下的底部布局 -->
                <div class="house-card-bottom flex mobile-bottom">
                  <div class="house-card-bottom-left">
                    <div class="price-box mobile-price">
                      <div class="current-price">{{ getBuildingPriceRange(building) }}</div>
                      <div class="price-unit"><TranslatedText text="month" use-static /></div>
                    </div>
                  </div>
                  <div class="btn mobile-btn" @click.stop="goToBuildingDetail(building.id)">
                    <TranslatedText text="view" use-static /> <TranslatedText text="details" use-static />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Load More Button -->
          <div v-if="searchResults.length > 0" class="load-more-section">
            <button 
              class="load-more-btn" 
              @click="loadMoreResults"
              :disabled="isLoadingMore"
            >
              {{ isLoadingMore ? getStaticText('loading') + '...' : getStaticText('load_more_results') }}
            </button>
          </div>
        </div>
      </section>
    </main>
    
    <!-- 悬浮箭头组件 -->
    <FloatingArrow />
    
    <!-- 翻译调试器 -->
    <TranslationDebugger />
    
    <Footer />
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import OpenStreetMap from '../components/OpenStreetMap.vue';
import FloatingArrow from '../components/FloatingArrow.vue';
import TranslatedText from '../components/TranslatedText.vue';
import TranslationDebugger from '../components/TranslationDebugger.vue';
import dataService from '../services/dataService.js';
import useTranslation from '../composables/useTranslation';
import { prepareAreaDisplay } from '../utils/areaDisplay.js';
import { NIcon } from 'naive-ui';
import { ChatbubbleEllipsesOutline, ArrowForward, Walk, Bus, Train, Heart, HeartOutline } from '@vicons/ionicons5';

export default {
  name: 'Browse',
  components: {
    Navbar,
    Footer,
    OpenStreetMap,
    FloatingArrow,
    TranslatedText,
    TranslationDebugger,
    NIcon,
    ChatbubbleEllipsesOutline,
    ArrowForward,
    Walk,
    Bus,
    Train,
    Heart,
    HeartOutline
  },
  data() {
    return {
      currentZoom: 14, // Default zoom level
      selectedArea: null,
      searchParams: null,
      searchResults: [],
      isLoading: true, // 初始就显示loading
      isLoadingMore: false,
      currentPage: 1,
      itemsPerPage: 12,
      favorites: new Set(), // 存储收藏的building id
      zoomChangeTimeout: null // 用于防抖zoom变化
    }
  },
  setup() {
    // 初始化翻译系统
    const { getStaticText } = useTranslation();
    
    return {
      getStaticText
    };
  },
  computed: {
    searchKeywordLabel() {
      const fallback = '';

      if (this.searchParams && this.searchParams.location && this.searchParams.location !== 'all') {
        return this.getLocationDisplayName();
      }

      const routeSearch = this.$route?.query?.search;
      if (routeSearch && routeSearch !== 'all') {
        return routeSearch;
      }

      if (this.selectedArea && this.selectedArea !== 'all') {
        return this.selectedArea;
      }

      return fallback;
    }
  },
  async mounted() {
    // 立即显示loading状态
    this.isLoading = true;

    try {
      await this.initializePage();
    } catch (error) {
      console.error('❌ 页面初始化失败:', error);
      this.isLoading = false;
    }
  },
  methods: {
    async initializePage() {
      try {
        // Get parameters from route query
        this.selectedArea = this.$route.query.area;
        const searchQuery = this.$route.query.search;
        const rentType = this.$route.query.rentType || 'all';
        const rawTags = this.$route.query.tags ? this.$route.query.tags.split(',').filter(tag => tag.trim()) : [];

        // 将显示名称转换为数据库键名
        const tags = this.convertDisplayNamesToKeys(rawTags);

        // Build search params object - 优先使用 area 参数，然后是 search 参数
        const locationParam = this.selectedArea || searchQuery || 'all';
        this.searchParams = {
          location: locationParam,
          rentType: rentType,
          tags: tags
        };

        console.log('Browse page initialized with:', {
          area: this.selectedArea,
          searchQuery: searchQuery,
          finalLocation: locationParam,
          searchParams: this.searchParams
        });

        // 实现Browse页面检索逻辑：
        // 有关键词：zoom=15，优先匹配社区然后查找建筑，如果没找到社区就直接查找建筑
        // 无关键词：显示全部社区，zoom=14

        if (!locationParam || locationParam === 'all') {
          // 无关键词：渲染全部社区，zoom=14
          this.currentZoom = 14;
          console.log('📍 No keywords - showing all communities with zoom=14');
        } else {
          // 有关键词：zoom=15，优先匹配社区然后查找建筑
          this.currentZoom = 15;
          console.log(`📍 Has keyword "${locationParam}" - zoom=15, will try community first then buildings`);
        }

        // 并行处理地图定位和数据加载以提高性能
        const promises = [this.loadData()];

        // Center map if we have a location search (非阻塞) - 使用最终确定的位置参数
        if (locationParam && locationParam !== 'all') {
          promises.push(
            this.locateAndFocusArea(locationParam).then(locationResult => {
              // 如果找到位置并居中了地图，更新当前zoom
              if (locationResult && locationResult.coordinates) {
                // 有关键词时保持zoom=15，无关键词时按类型设置zoom
                const hasKeyword = locationParam && locationParam !== 'all';
                if (!hasKeyword) {
                  this.currentZoom = locationResult.type === 'city' ? 12 : 14;
                }
                // 有关键词时，保持之前设置的zoom=15不变
              }
            }).catch(error => {
              console.warn('地图定位失败:', error);
            })
          );
        }

        // 等待所有初始化任务完成
        await Promise.allSettled(promises);

        console.log('✅ Browse页面初始化完成');

      } catch (error) {
        console.error('❌ Browse页面初始化失败:', error);
        throw error;
      }
    },
    
    // 防抖处理zoom变化，避免频繁重新加载数据
    handleZoomChange(newZoom) {
      console.log('Map zoom changed to:', newZoom);
      this.currentZoom = newZoom;

      // 清除之前的定时器
      if (this.zoomChangeTimeout) {
        clearTimeout(this.zoomChangeTimeout);
      }

      // 防抖处理，500ms后才重新加载数据
      this.zoomChangeTimeout = setTimeout(async () => {
        const viewType = newZoom <= 14 ? 'Neighborhood' : 'Building';
        console.log(`Switched to ${viewType} view (zoom: ${newZoom})`);

        try {
          await this.loadData();
        } catch (error) {
          console.error('❌ Zoom变化后数据加载失败:', error);
        }
      }, 500);
    },
    
    // 处理搜索事件，更新当前页面
    async handleSearchPerformed(searchData) {
      console.log('🔍 Browse: handleSearchPerformed called!');
      console.log('🔍 Browse: SearchData received:', searchData);
      
      // 立即显示loading
      this.isLoading = true;
      
      // 实现搜索逻辑：若在无关键词的情况下键入搜索词，优先查找符合要求的社区，若无，则匹配building
      const searchLocation = searchData.location;
      
      // 确定zoom级别和搜索策略
      if (!searchLocation || searchLocation === 'all') {
        // 无关键词：显示所有社区
        this.currentZoom = 14;
      } else {
        // 有搜索关键词：首先尝试查找匹配的社区
        try {
          const communityResults = await dataService.searchCommunities(searchLocation);
          if (communityResults && communityResults.length > 0) {
            // 找到匹配的社区：显示社区视图
            this.currentZoom = 14;
            console.log('📍 Found matching communities, showing community view');
          } else {
            // 没找到匹配的社区：显示建筑视图
            this.currentZoom = 15;
            console.log('📍 No matching communities found, showing building view');
          }
        } catch (error) {
          console.warn('搜索社区时出错，默认显示建筑视图:', error);
          this.currentZoom = 15;
        }
      }
      
      // 更新URL参数但不跳转页面
      this.$router.replace({
        name: 'Browse',
        query: {
          search: searchData.location || 'all',
          rentType: searchData.rentType,
          tags: Array.isArray(searchData.tags) ? searchData.tags.join(',') : '',
          type: 'search'
        }
      });
      
      // 更新页面数据
      this.selectedArea = searchData.location || 'all';
      this.searchParams = searchData;
      
      // 先加载并显示搜索结果
      await this.loadData();
      
      // 然后进行地图定位（非阻塞）
      if (searchData.location && searchData.location !== 'all') {
        this.locateAndFocusArea(searchData.location);
      }
    },
    
    // 处理筛选图标点击事件，更新当前页面
    async handleFilterClick(filterData) {
      console.log('🎛️ Browse: handleFilterClick called!');
      console.log('🎛️ Browse: FilterData received:', filterData);
      
      // 立即显示loading
      this.isLoading = true;
      
      // 更新URL参数但不跳转页面
      this.$router.replace({
        name: 'Browse',
        query: {
          search: filterData.location || 'all',
          rentType: filterData.rentType,
          tags: Array.isArray(filterData.tags) ? filterData.tags.join(',') : '',
          type: 'filter'
        }
      });
      
      // 更新页面数据
      this.selectedArea = filterData.location || 'all';
      this.searchParams = filterData;
      
      // Reload data
      await this.loadData();
    },

    // 根据缩放级别加载数据 - 优化版本
    async loadData() {
      this.isLoading = true;
      this.currentPage = 1;

      // 减少最小loading时间，提高响应速度
      const startTime = Date.now();
      const minLoadingTime = 300; // 减少到300ms

      try {
        console.log(`🔍 [DEBUG-BROWSE] Loading data for zoom: ${this.currentZoom}, params:`, this.searchParams);
        console.log(`🔍 [DEBUG-BROWSE] Will call: ${this.currentZoom <= 14 ? 'loadNeighborhoodData' : 'loadBuildingData'}`);

        // 根据是否有关键词决定加载数据的方式
        const hasKeyword = this.searchParams.location && this.searchParams.location !== 'all';
        let loadDataPromise;

        if (hasKeyword) {
          // 有关键词：优先匹配社区然后查找建筑，如果没找到社区就直接查找建筑
          console.log(`🔍 Has keyword "${this.searchParams.location}" - trying community first then buildings`);
          loadDataPromise = this.loadBuildingsInCommunity();
        } else {
          // 无关键词：显示所有社区
          console.log('🏘️ No keyword - showing all communities');
          loadDataPromise = this.loadNeighborhoodData();
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('数据加载超时')), 10000) // 10秒超时
        );

        const searchResults = await Promise.race([loadDataPromise, timeoutPromise]) || [];

      if (this.currentZoom <= 14) {
          this.searchResults = searchResults.map(result => this.decorateNeighborhoodDisplay(result));
      } else {
          this.searchResults = searchResults;
      }
        console.log(`📊 Search results: ${this.searchResults.length}`);

      } catch (error) {
        console.error('❌ Error loading data:', error);
        this.searchResults = [];

        // 显示用户友好的错误信息
        if (error.message === '数据加载超时') {
          this.$message?.warning('数据加载超时，请稍后重试');
        }
      } finally {
        // 确保loading至少显示足够长的时间，但不要太长
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        setTimeout(() => {
          this.isLoading = false;
        }, remainingTime);
      }
    },

    // 加载社区数据
    async loadNeighborhoodData() {
      try {
        return await dataService.loadNeighborhoodData(this.searchParams);
      } catch (error) {
        console.error('❌ Error loading neighborhood data:', error);
        return [];
      }
    },

    // 加载建筑物数据
    async loadBuildingData() {
      try {
        return await dataService.loadBuildingData(this.searchParams);
      } catch (error) {
        console.error('❌ Error loading building data:', error);
        return [];
      }
    },

    // 从Home页面跳转：优先匹配关键词为社区，然后搜索该社区下的建筑
    async loadBuildingsInCommunity() {
      try {
        console.log(`🏘️➡️🏢 Loading buildings in community: "${this.searchParams.location}"`);
        return await dataService.loadBuildingsInCommunity(this.searchParams.location, this.searchParams);
      } catch (error) {
        console.error('❌ Error loading buildings in community:', error);
        return [];
      }
    },

    // 地图定位功能
    async locateAndFocusArea(keyword) {
      try {
        console.log(`🎯 Attempting to locate: "${keyword}"`);
        
        // 首先尝试数据库查找
        let locationResult = await dataService.locateAndFocusArea(keyword);
        
        // 如果数据库没找到，尝试 Nominatim API
        if (!locationResult) {
          locationResult = await dataService.geocodeWithNominatim(keyword);
        }
        
        if (locationResult && locationResult.coordinates) {
          console.log('📍 Found location, centering map:', locationResult);
          
          // 通过模拟点击区域色块来实现定位
          if (this.$refs.mapComponent && this.$refs.mapComponent.simulateAreaClick) {
            console.log(`📍 Simulating area click for: ${keyword}`);
            this.$refs.mapComponent.simulateAreaClick(keyword);
          }
          
          return locationResult;
        } else {
          console.log('❌ Location not found for:', keyword);
          return null;
        }
      } catch (error) {
        console.error('❌ Error in locateAndFocusArea:', error);
        return null;
      }
    },

    // 将显示名称转换为数据库键名（反向转换）
    convertDisplayNamesToKeys(displayNames) {
      return displayNames.map(displayName => {
        // 先尝试反向查找
        const normalized = displayName.toLowerCase().replace(/\s+/g, '-');

        // 特殊映射的反向转换
        const reverseSpecialMappings = {
          'young pro': 'young-professional',
          'young professional': 'young-professional',
          'family friendly': 'family-friendly',
          'students': 'student-friendly',
          'university': 'university-area',
          'pet friendly': 'pet-friendly',
          'arts & culture': 'arts',
          'arts': 'arts'
        };

        const key = reverseSpecialMappings[displayName.toLowerCase()] || normalized;
        console.log(`🏷️ 转换标签: "${displayName}" -> "${key}"`);
        return key;
      });
    },

    decorateNeighborhoodDisplay(neighborhood) {
      if (!neighborhood) {
        return neighborhood;
      }

      return {
        ...neighborhood,
        badgeClass: this.getAreaBadgeClass(neighborhood),
        badgeLabel: this.getAreaBadgeLabel(neighborhood),
        display: prepareAreaDisplay(neighborhood),
        rawData: neighborhood
      };
    },

    // 获取社区图片
    getNeighborhoodImage(neighborhood) {
      // 优先使用区域自身的图片（从数据库areas表获取）
      if (neighborhood.image_url) {
        return neighborhood.image_url;
      }

      // 如果没有区域图片，直接使用默认图片（移除随机选择逻辑）

      // 返回默认的社区图片，根据区域类型选择
      return this.getDefaultNeighborhoodImage(neighborhood);
    },

    // 获取默认社区图片
    getDefaultNeighborhoodImage(neighborhood) {
      // 统一使用默认NYC图片
      return 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop';
    },

    hasDisplayContent(display) {
      if (!display) return false;
      const features = display.features;
      return features && Array.isArray(features.items) && features.items.length > 0;
    },

    getAreaLocation(area) {
      if (!area) return '';
      if (area.city) {
        return area.city;
      }
      if (area.borough) {
        return area.borough;
      }
      return '';
    },

    getAreaBadgeClass(area) {
      if (!area) return '';

      let badgeClass = '';

      if (area.borough === 'Manhattan' || area.borough === 'Queens') {
        badgeClass = 'badge-east';
      } else {
        badgeClass = 'badge-west';
      }

      const nameLength = area.name ? area.name.length : 0;
      if (nameLength > 25) {
        badgeClass += ' extra-long-text';
      } else if (nameLength > 18) {
        badgeClass += ' long-text';
      }

      return badgeClass;
    },

    getAreaBadgeLabel(area) {
      if (!area) return '';

      const parts = [];

      if (area.borough) {
        parts.push(area.borough);
      }

      if (area.city) {
        parts.push(area.city);
      }

      if (!parts.length && area.name) {
        parts.push(area.name);
      }

      return parts.join(' | ');
    },

    // 获取建筑物图片
    getBuildingImage(building) {
      if (building.image_url) {
        return building.image_url;
      }
      // 使用Manhattan示例图片
      return 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=300&fit=crop';
    },

    // 获取建筑物位置信息
    getBuildingLocation(building) {
      if (building.areas) {
        const locationParts = [building.areas.name, building.areas.city].filter(Boolean);
        return locationParts.join(', ');
      }
      return 'Location not available';
    },

    // 获取建筑物设施
    getBuildingAmenities(building) {
      if (building.amenities && Array.isArray(building.amenities)) {
        return building.amenities.slice(0, 4); // 最多显示4个设施
      }
      return [];
    },

    // 获取建筑物步行信息
    getBuildingWalkingInfo(building) {
      if (building.areas && building.areas.transportation_walking_time) {
        return `${building.areas.transportation_walking_time} min walk`;
      }
      return '5-10 min walk';
    },

    // 获取建筑物家具信息
    getBuildingFurnitureInfo(building) {
      if (building.furnished_status) {
        return building.furnished_status === 'furnished' ? 'Furnished' : 'Unfurnished';
      }
      return 'Furnished Available';
    },

    // 获取建筑物价格范围
    getBuildingPriceRange(building) {
      if (building.rent_range_min && building.rent_range_max) {
        return `$${building.rent_range_min}-${building.rent_range_max}`;
      }
      if (building.rent_range_min) {
        return `From $${building.rent_range_min}`;
      }
      return '$800-$1500';
    },

    // 获取建筑物评论数
    getBuildingCommentsCount(building) {
      if (building.reviews_count) {
        return building.reviews_count;
      }
      return Math.floor(Math.random() * 50) + 10; // 随机生成10-60之间的数字
    },

    // 获取建筑物标签
    getBuildingTags(building) {
      const defaultTags = [
        'Verified',
        'Student Accommodation', 
        'No Service Fee',
        'Near railway station',
        'Walk to school',
        'Gym',
        'Elevator'
      ];
      
      const tags = [];
      if (building.amenities && Array.isArray(building.amenities)) {
        tags.push(...building.amenities.slice(0, 3));
      }
      if (building.areas && building.areas.area_tags && Array.isArray(building.areas.area_tags)) {
        tags.push(...building.areas.area_tags.slice(0, 2));
      }
      
      // 如果没有数据，使用默认标签
      if (tags.length === 0) {
        return defaultTags.slice(0, 6);
      }
      
      return [...tags, ...defaultTags].slice(0, 6);
    },

    // 切换收藏状态
    toggleFavorite(building) {
      console.log('💖 Toggle favorite for:', building.name);
      if (this.favorites.has(building.id)) {
        this.favorites.delete(building.id);
      } else {
        this.favorites.add(building.id);
      }
    },

    // 判断是否已收藏
    isFavorited(buildingId) {
      return this.favorites.has(buildingId);
    },

    // 跳转到建筑详情页
    goToBuildingDetail(buildingId) {
      this.$router.push({ name: 'BuildingDetail', params: { id: buildingId } });
    },

    // 获取步行时间
    getBuildingWalkTime(building) {
      if (building.areas && building.areas.transportation_walking_time) {
        return `${building.areas.transportation_walking_time} min`;
      }
      return '12 min';
    },

    // 获取公交时间
    getBuildingBusTime(building) {
      return '8 min'; // 可以根据实际数据调整
    },

    // 获取地铁时间
    getBuildingTrainTime(building) {
      return '3 min'; // 可以根据实际数据调整
    },

    // 获取评分
    getBuildingRating(building) {
      if (building.rating) {
        return building.rating.toFixed(1);
      }
      return '4.8';
    },

    // 获取标签样式
    getTagStyle(tag) {
      const tagStyles = {
        'Verified': {
          backgroundColor: '#E7F2F5',
          color: '#0C7094',
          fontSize: '12px',
          lineHeight: '18px',
          border: 'none',
          padding: '2px 6px'
        },
        'Student Accommodation': {
          backgroundColor: '#F7E7E7',
          color: '#963434',
          fontSize: '12px',
          lineHeight: '18px',
          border: 'none',
          padding: '2px 6px'
        },
        'No Service Fee': {
          backgroundColor: '#E7F2F5',
          color: '#0C7094',
          fontSize: '12px',
          lineHeight: '18px',
          border: 'none',
          padding: '2px 6px'
        }
      };
      
      return tagStyles[tag] || {
        backgroundColor: '#F5F5F5',
        color: '#555555',
        fontSize: '12px',
        lineHeight: '18px',
        border: 'none',
        padding: '2px 6px'
      };
    },

    // 获取位置显示名称 - 使用翻译后的英文地名
    getLocationDisplayName() {
      // 如果有搜索词且不是'all'，显示搜索词
      if (this.searchParams && this.searchParams.location && this.searchParams.location !== 'all') {
        // 优先使用翻译后的英文地名（如果存在），确保标题语言一致性
        const originalLocation = this.searchParams.location;
        
        // 尝试从本地翻译字典获取英文名称
        const localDict = {
          '哈里森': 'Harrison',
          '曼哈顿': 'Manhattan', 
          '布鲁克林': 'Brooklyn',
          '皇后区': 'Queens',
          '布朗克斯': 'Bronx',
          '史坦顿岛': 'Staten Island',
          '泽西城': 'Jersey City',
          '霍博肯': 'Hoboken',
          '长岛市': 'Long Island City',
          '威廉斯堡': 'Williamsburg',
          '阿斯托利亚': 'Astoria',
          '东村': 'East Village',
          '西村': 'West Village',
          '李堡': 'Fort Lee'
        };
        
        // 如果是中文地名，返回对应的英文名称
        if (localDict[originalLocation]) {
          console.log(`🏷️ 标题地名翻译: "${originalLocation}" -> "${localDict[originalLocation]}"`);
          return localDict[originalLocation];
        }
        
        // 如果不是中文或没有对应翻译，返回原文
        return originalLocation;
      }
      // 没有搜索词时，默认显示NYC（因为demo都是NYC的数据）
      return 'NYC';
    },

    // 选择社区 - 携带关键词搜索建筑
    async selectNeighborhood(neighborhood) {
      console.log('🏘️ Selected neighborhood:', neighborhood.name);

      try {
        // 更新搜索参数，使用社区名称作为关键词
        this.searchParams = {
          ...this.searchParams,
          location: neighborhood.name
        };

        // 设置zoom=15显示建筑视图
        this.currentZoom = 15;

        // 通知地图组件更新zoom
        if (this.$refs.mapComponent && this.$refs.mapComponent.setZoom) {
          this.$refs.mapComponent.setZoom(15);
        }

        // 如果有坐标，居中地图到该社区
        if (neighborhood.general_latitude && neighborhood.general_longitude) {
          const coordinates = [
            parseFloat(neighborhood.general_latitude),
            parseFloat(neighborhood.general_longitude)
          ];

          // 通过模拟点击区域色块来实现定位
          if (this.$refs.mapComponent && this.$refs.mapComponent.simulateAreaClick) {
            console.log(`📍 Simulating area click for neighborhood: ${neighborhood.name}`);
            this.$refs.mapComponent.simulateAreaClick(neighborhood.name);
          }
        }

        // 重新加载数据（现在会加载该社区的建筑）
        await this.loadData();

        console.log(`🔍 Switched to building view for: ${neighborhood.name}`);
      } catch (error) {
        console.error('❌ Error selecting neighborhood:', error);
      }
    },


    // 扩大搜索范围
    async broadenSearch() {
      // 移除位置限制，进行更广泛的搜索
      this.searchParams = {
        ...this.searchParams,
        location: 'all'
      };
      
      this.$router.replace({
        name: 'Browse',
        query: {
          search: 'all',
          rentType: this.searchParams.rentType,
          tags: Array.isArray(this.searchParams.tags) ? this.searchParams.tags.join(',') : '',
          type: 'broadened'
        }
      });
      
      await this.loadData();
    },

    // 加载更多结果
    async loadMoreResults() {
      this.isLoadingMore = true;
      
      try {
        // 这里可以实现分页加载逻辑
        this.currentPage++;
        // 暂时只是一个占位符
        console.log('Loading more results...');
        
        setTimeout(() => {
          this.isLoadingMore = false;
        }, 1000);
        
      } catch (error) {
        console.error('❌ Error loading more results:', error);
        this.isLoadingMore = false;
      }
    },

    // 处理图片加载错误
    handleImageError(event) {
      event.target.style.display = 'none';
      event.target.nextElementSibling?.classList.add('show-placeholder');
    },

  }
}
</script>

<style scoped>
.browse-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

/* Map Section */
.map-section {
  height: 50vh;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Cards Section */
.cards-section {
  min-height: 50vh;
  padding: 2rem 0;
  background-color: #f8f9fa;
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  color: #0f5132;
  margin-bottom: 2rem;
  text-align: center;
}

.results-count {
  font-size: 16px;
  font-weight: 400;
  color: #6c757d;
  margin-left: 0.5rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
  color: #6c757d;
  min-height: 300px;
  opacity: 0;
  animation: fadeInLoading 0.3s ease-out forwards;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #e9ecef;
  border-left: 6px solid #198754;
  border-top: 6px solid #198754;
  border-radius: 50%;
  animation: spinSmooth 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(25, 135, 84, 0.3);
  position: relative;
}

.loading-spinner::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: #198754;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: #555;
  margin: 0;
  text-align: center;
  animation: textPulse 2s ease-in-out infinite;
}

@keyframes fadeInLoading {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spinSmooth {
  0% { 
    transform: rotate(0deg);
    box-shadow: 0 4px 20px rgba(25, 135, 84, 0.3);
  }
  25% {
    box-shadow: 0 6px 25px rgba(25, 135, 84, 0.4);
  }
  50% { 
    transform: rotate(180deg);
    box-shadow: 0 8px 30px rgba(25, 135, 84, 0.5);
  }
  75% {
    box-shadow: 0 6px 25px rgba(25, 135, 84, 0.4);
  }
  100% { 
    transform: rotate(360deg);
    box-shadow: 0 4px 20px rgba(25, 135, 84, 0.3);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* No Results */
.no-results {
  text-align: center;
  padding: 4rem 0;
  color: #6c757d;
}

.broaden-search-btn {
  background-color: #198754;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s ease;
}

.broaden-search-btn:hover {
  background-color: #146c43;
}

/* 复用Home页面的卡片网格样式 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(16px, 2vw, 24px);
  margin-top: 16px;
  align-items: stretch;
  width: 100%;
  padding: 0 clamp(20px, 6vw, 80px);
  box-sizing: border-box;
}

/* 复用Home页面的社区卡片样式 */
.neighborhood-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: white;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 可点击卡片的悬停效果 */
.clickable-card {
  cursor: pointer;
}

.clickable-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

/* 复用Home页面的卡片图片样式 */
.neighborhood-card .card-image {
  height: 120px;
  background-color: #e0e0e0;
  overflow: hidden;
  position: relative;
}

.neighborhood-card .area-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}

.neighborhood-card .placeholder {
  width: 100%;
  height: auto;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.neighborhood-card .placeholder::before {
  content: '🏘️';
  font-size: 24px;
  opacity: 0.5;
}

/* Badge样式 - 使用默认主题绿色 */
.card-badge {
  position: absolute;
  top: 102px;
  left: 50px;
  right: 50px;
  padding: 6px 12px;
  color: white;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-badge.long-text {
  font-size: 9px;
  padding: 4px 8px;
}

.card-badge.extra-long-text {
  font-size: 8px;
  padding: 3px 6px;
}

.badge-east {
  background-color: #198754;
}

.badge-west {
  background-color: #47976f;
}

/* 复用Home页面的卡片内容样式 */
.neighborhood-card .card-content {
  padding: 18px 16px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.neighborhood-card .card-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.neighborhood-card .card-title {
  font-size: 14px;
  font-weight: 600;
  color: #0a3622;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  word-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-placeholder {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  background: rgba(25, 135, 84, 0.05);
  border: 1px dashed rgba(25, 135, 84, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4b5563;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.chip-transport {
  background: rgba(96, 125, 139, 0.14);
  border: 1px solid rgba(96, 125, 139, 0.25);
  color: #2d5061;
}

.chip-amenity {
  background: rgba(221, 160, 221, 0.18);
  border: 1px solid rgba(221, 160, 221, 0.28);
  color: #6d3b8f;
}

.chip-feature {
  background: rgba(25, 135, 84, 0.12);
  border: 1px solid rgba(25, 135, 84, 0.3);
  color: #1a5b3b;
}

.chip-feature-primary {
  background: rgba(244, 143, 177, 0.16);
  border: 1px solid rgba(244, 114, 167, 0.4);
  color: #b23a73;
}

.chip-feature-secondary {
  background: rgba(144, 202, 249, 0.18);
  border: 1px solid rgba(100, 181, 246, 0.42);
  color: #0c4a99;
}

.chip-more {
  background: transparent;
  border: 1px dashed rgba(55, 65, 81, 0.4);
  color: #4b5563;
  min-width: 38px;
  justify-content: center;
}

/* 统计信息容器 */
/* 响应式设计 - 复用Home页面的响应式逻辑 */
@media (max-width: 1200px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 0 clamp(12px, 2vw, 24px);
  }

  .card-badge {
    font-size: 9px;
    padding: 4px 8px;
    left: 40px;
    right: 40px;
  }

  .card-badge.long-text {
    font-size: 8px;
    padding: 3px 6px;
  }

  .card-badge.extra-long-text {
    font-size: 7px;
    padding: 2px 4px;
  }
}

@media (max-width: 480px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 clamp(8px, 2vw, 16px);
  }
}

/* Building Cards Grid - 左右布局 */
.building-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  justify-content: center;
  max-width: 900px;
  margin: 0 auto 2rem;
}

/* 超大屏幕 1957px及以上 - 2列布局 */
@media (min-width: 1920px) {
  .building-cards-grid {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    max-width: 1800px;
    justify-items: center;
  }
}

.building-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: row;
  width: 873px; /* 287px(img) + 586px(info) */
  height: 244px;
  margin: 0 auto;
}

.building-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* Card Image - 287/234 比例，左侧固定 */
.card-image {
  width: 287px;
  height: 244px;
  margin: 0;
  border-radius: 12px 0 0 12px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  display: block;
}

/* 收藏按钮在左下角 */
.favorite-overlay {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.favorite-overlay:hover {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.favorite-overlay:active {
  transform: scale(0.95);
}

.favorite-overlay .n-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.favorite-overlay:hover .n-icon {
  transform: scale(1.2);
}

.building-card .card-image img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

.placeholder-image {
  height: 100%;
  background: linear-gradient(45deg, #e0e0e0 25%, #f0f0f0 25%, #f0f0f0 50%, #e0e0e0 50%, #e0e0e0 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 12px;
  font-weight: 500;
}

/* uhome风格布局 - 左中右布局 */
.card-content {
  width: 586px;
  padding: 0;
  display: flex;
  flex-direction: row; /* 确保左右布局 */
  border-radius: 0 12px 12px 0;
  position: relative;
}

/* 主信息区域 - 左侧占据大部分空间 */
.house-card-info {
  flex: 1;
  padding:20px;
  padding-right: 8px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 8px 0 8px 0;
  line-height: 1.4;
}

.ellipsis2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.location {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.4;
}

/* 距离和交通信息 */
.house-distance {
  margin-bottom: 12px;
}

.house-distance .name {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.traffic-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.traffic-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.traffic-item .mfont {
  font-size: 14px;
}

.traffic-item p {
  font-size: 12px;
  color: #666;
  margin: 0;
  font-weight: 600;
}

/* 标签区域 */
.tags {
  margin-bottom: 16px;
}

.tags-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tags .item {
  border-radius: 4px;
  font-size: 12px;
  line-height: 18px;
  padding: 2px 6px;
  white-space: nowrap;
}

/* 右侧固定信息区域 - 左中右布局 */
.house-card-right {
  width: 120px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
  flex-shrink: 0;
  height: 264px;
  box-sizing: border-box;
}

.comments {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.comments .mfont {
  font-size: 14px;
}

.comments .number {
  color: #666;
  font-size: 12px;
  font-weight: 600;
}

.price-box {
  text-align: right;
  font-size: 12px;
  color: #666;
}

.current-price {
  font-size: 18px;
  font-weight: 800;
  color: #198754;
  display: block;
  line-height: 1.2;
}

.price-unit {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.btn {
  background-color: #198754;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
}

.btn:hover {
  background-color: #146c43;
}

.btn-icon {
  font-size: 14px;
}

.btn span {
  font-size: 13px;
  font-weight: 600;
}

/* Flex 工具类 */
.flex {
  display: flex;
}

.mfont {
  font-family: inherit;
}

/* 小屏幕下的图片底部overlay */
.img-cover-bottom-mobile {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  padding: 8px 12px;
  justify-content: flex-end;
  align-items: center;
  display: none; /* 默认隐藏 */
}

.mobile-comments {
  background: rgba(255,255,255,0.95);
  padding: 4px 8px;
  border-radius: 16px;
  gap: 4px;
}

/* 小屏幕下的底部布局 */
.house-card-bottom {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  justify-content: space-between;
  align-items: center;
  display: none; /* 默认隐藏 */
}

.mobile-price {
  text-align: left;
  margin-bottom: 0;
}

.mobile-btn {
  padding: 8px 16px;
  font-size: 14px;
}

/* Responsive Design - 左右布局响应式 */

/* 1440px及以上: 287px(img) + 586px(info) = 873px */
@media (min-width: 1440px) {
  .building-card {
    width: 873px;
    height: 264px;
  }
  
  .card-image {
    width: 287px;
    height: 264px;
  }
  
  .card-content {
    width: 586px;
  }
  
  .house-card-right {
    height: 264px;
    padding: 16px;
    gap: 16px;
  }
}

/* 1200px-1439px: 按比例缩放 */
@media (max-width: 1439px) and (min-width: 1000px) {
  .building-card {
    width: 800px; /* 260px + 540px */
    height: 242px;
    margin: 0 auto;
  }
  
  .card-image {
    width: 260px;
    height: 242px;
  }
  
  .card-content {
    width: 540px;
  }
  
  .house-card-right {
    height: 242px;
    gap: 16px;
  }
  
  .building-cards-grid {
    justify-items: center;
  }
}

/* 770px-999px: 中等屏幕 - 单列居中 */
@media (max-width: 999px) and (min-width: 770px) {
  .building-card {
    width: 700px; /* 240px + 460px */
    height: 220px;
    margin: 0 auto;
  }
  
  .card-image {
    width: 240px;
    height: 220px;
  }
  
  .card-content {
    width: 460px;
    padding: 12px;
  }
  
  .house-card-right {
    height: 220px;
    width: 100px;
    padding: 16px 8px;
    gap: 16px;
  }
  
  .building-cards-grid {
    justify-items: center;
    max-width: 720px;
  }
  
  .map-section {
    height: 40vh;
  }
  
  .section-title {
    font-size: 24px;
  }
}

/* 1000px以下: 修复垂直对齐问题 */
@media (max-width: 999px) {
  .house-card-info {
    padding: 12px;
    padding-right: 8px;
  }
  
  .house-card-right {
    padding: 12px 8px;
  }
}

/* 767px及以下: 手机端 - uhome小屏布局 */
@media (max-width: 767px) {
  .building-cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 1rem;
    max-width: none;
  }
  
  .building-card {
    width: 100%;
    height: auto;
    flex-direction: column;
  }
  
  .card-image {
    width: 100%;
    height: 200px;
    border-radius: 12px 12px 0 0;
  }
  
  /* 在小屏幕下显示图片底部overlay */
  .img-cover-bottom-mobile {
    display: flex;
  }
  
  .card-content {
    flex-direction: column;
    width: 100%;
    border-radius: 0;
  }
 
  
  /* 隐藏桌面版的右侧信息 */
  .house-card-right {
    display: none;
  }
  
  /* 显示小屏幕版的底部布局 */
  .house-card-bottom {
    display: flex;
    border-radius: 0 0 12px 12px;
  }
  
  .map-section {
    height: 35vh;
  }
  
  .section-container {
    padding: 0 0.5rem;
  }
  
  .section-title {
    font-size: 20px;
    margin-bottom: 1rem;
  }
  
  .title {
    font-size: 15px;
  }
  
  .location {
    font-size: 13px;
  }
  
  .house-distance .name {
    font-size: 13px;
  }
  
  .traffic-list {
    gap: 6px;
  }
  
  .traffic-item p {
    font-size: 11px;
    font-weight: 600;
  }
  
  .tags .item {
    font-size: 11px;
    padding: 1px 4px;
  }
  
  .current-price {
    font-size: 16px;
    font-weight: 800;
  }
  

}

/* Load More Section */
.load-more-section {
  text-align: center;
  padding: 2rem 0;
}

.load-more-btn {
  background-color: #198754;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background-color: #146c43;
}

.load-more-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
