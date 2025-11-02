<template>
  <div class="home-page">
    <Navbar />
    
    <main class="main-content">
      <!-- Map Section -->
      <section id="map-section" class="map-section">
        <div class="map-container">
          <OpenStreetMap 
            ref="mapComponent" 
            @community-clicked="handleCommunityClick"
            @search-performed="handleSearchPerformed"
            @filter-clicked="handleFilterClick"
          />
          <div class="map-overlay">
            <div class="hero-content">
              <h1 class="hero-title">
                <TranslatedText text="Moving Made Easy" :use-static="true" />
              </h1>
              <p class="hero-subtitle">
                <TranslatedText text="Find your perfect home near the best universities & cities in the world" :use-static="true" />
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Neighborhood Section -->
      <section id="neighborhood-section" class="neighborhood-section">
        <div class="section-container">
          <h2 class="section-title">
            <TranslatedText text="Find Your Ideal Neighborhood" :use-static="true" />
          </h2>
          <p class="section-subtitle">
            <TranslatedText text="Explore diverse neighborhoods with unique character and amenities" :use-static="true" />
          </p>
          
          <!-- 自定义简单tabs - 避免Naive UI复杂性 -->
          <div class="simple-tabs">
            <div class="tabs-header">
              <button 
                v-for="tab in tabOptions" 
                :key="tab.key"
                class="tab-button"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
              >
                <TranslatedText :text="tab.label" :use-static="true" />
              </button>
            </div>
            <div class="tabs-content">
              <!-- 动态渲染所有tab内容 -->
              <div v-for="tabOption in tabOptions" :key="tabOption.key" v-show="activeTab === tabOption.key" class="cards-grid">
                <div v-for="(neighborhood, index) in areasByTag[tabOption.key]" :key="neighborhood.id || index" class="neighborhood-card">
                  <div class="card-image">
                    <img 
                      v-if="neighborhood.image_url" 
                      :src="neighborhood.image_url" 
                      :alt="neighborhood.name"
                      class="area-image"
                      @error="handleImageError"
                    />
                    <div v-else class="placeholder"></div>
                  </div>
                  <div class="card-badge" :class="neighborhood.badgeClass">
                    <TranslatedText :text="neighborhood.badgeLabel" :use-static="true" />
                  </div>
                  <div class="card-content">
                    <div class="card-header">
                      <h3 class="card-title">
                        <TranslatedText :text="neighborhood.name" />
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
                            v-for="feature in neighborhood.display.features.items" 
                            :key="`feature-${feature}`" 
                            class="chip chip-feature"
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

                    <n-button class="explore-btn" ghost @click="exploreAreaOnMap(neighborhood)">
                      <TranslatedText text="Explore on Map" :use-static="true" /> +
                    </n-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="view-more">
            <n-button class="view-more-btn" ghost @click="searchMoreAreas">
              <TranslatedText text="Search More" :use-static="true" /> 
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.41z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </section>
      
      <!-- Cities Section -->
      <section id="cities-section" class="cities-section">
        <div class="section-container">
          <h2 class="section-title">
            <TranslatedText text="Find Properties in These Cities" :use-static="true" />
          </h2>
          <p class="section-subtitle">
            <TranslatedText text="Discover amazing properties in top cities worldwide" :use-static="true" />
          </p>
          
          <div class="cities-grid">
            <div v-for="city in cities" :key="city.id" class="city-card" @click="searchCity(city.name)">
              <img :src="city.image_url" :alt="city.name" class="city-image" />
              <div class="city-overlay">
                <h3 class="city-name">
                  <TranslatedText :text="city.name + ', ' + city.state" :use-static="true" />
                </h3>
                <p class="city-description">
                  <TranslatedText :text="city.description" :use-static="true" />
                </p>
              </div>
            </div>
          </div>
          
          <!-- <div class="view-all-cities">
            <n-button class="view-all-btn">View All Cities</n-button>
          </div> -->
        </div>
      </section>
      
    </main>
    
    <!-- 悬浮箭头组件 -->
    <FloatingArrow />
    
    <div id="footer-section">
      <Footer />
    </div>
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import OpenStreetMap from '../components/OpenStreetMap.vue';
import FloatingArrow from '../components/FloatingArrow.vue';
import TranslatedText from '../components/TranslatedText.vue';
import dataService from '../services/dataService.js';
import { prepareAreaDisplay } from '../utils/areaDisplay.js';

export default {
  name: 'HomePage',
  components: {
    Navbar,
    Footer,
    OpenStreetMap,
    FloatingArrow,
    TranslatedText
  },
  data() {
    return {
      sections: ['map-section', 'neighborhood-section', 'cities-section', 'footer-section'],
      activeTab: null, // 将在数据加载后动态设置
      tabOptions: [], // 将根据数据库标签动态生成
      cities: [],
      neighborhoods: [],
      allAreas: [],
      areasByTag: {} // 将动态生成
    }
  },
  mounted() {
    this.initializeScrollControl();
    this.loadCities();
    this.loadAreas();
    console.log('🏠 HomePage mounted, events should be working');
    
    // 确保ref是可用的
    this.$nextTick(() => {
      if (this.$refs.mapComponent) {
        console.log('🏠 HomePage: Map component ref is available');
      } else {
        console.error('🏠 HomePage: Map component ref is NOT available');
      }
    });
    
    // 添加全局测试方法
    window.testSearchEvent = () => {
      console.log('🧪 Testing search event handler...');
      this.handleSearchPerformed({
        location: 'test',
        rentType: 'all',
        tags: ['quiet']
      });
    };
  },
  beforeUnmount() {
    this.removeScrollControl();
  },
  methods: {
    // 加载城市数据
    async loadCities() {
      try {
        const supabase = await dataService.ensureSupabase();
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .eq('is_featured', true)
          .order('name');

        if (error) {
          console.error('❌ Error loading cities:', error);
          return;
        }

        this.cities = data || [];
        console.log('🏙️ Cities loaded:', this.cities.length);
      } catch (error) {
        console.error('❌ Error loading cities:', error);
      }
    },

    // 加载区域数据
    async loadAreas() {
      try {
        const supabase = await dataService.ensureSupabase();
        const { data, error } = await supabase
          .from('areas')
          .select('*')
          .not('total_buildings', 'is', null)
          .order('total_buildings', { ascending: false });

        if (error) {
          console.error('❌ Error loading areas:', error);
          return;
        }

        this.allAreas = data || [];
        this.generateDynamicTabs();
        this.categorizeAreas();
        console.log('🏘️ Areas loaded:', this.allAreas.length);
      } catch (error) {
        console.error('❌ Error loading areas:', error);
      }
    },

    // 根据数据库标签动态生成Tab选项
    generateDynamicTabs() {
      console.log('🏷️ Generating dynamic tabs from area tags...');
      
      // 统计所有标签的出现频率
      const tagCounts = {};
      
      this.allAreas.forEach(area => {
        const areaTags = area.area_tags || [];
        areaTags.forEach(tag => {
          if (tag && tag.trim()) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      });

      console.log('📊 Tag counts:', tagCounts);

      // 获取最常见的前4个标签
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      console.log('🔝 Top 4 tags:', sortedTags);

      // 生成tab选项和标签映射
      this.tabOptions = sortedTags.map(([tag, count]) => ({
        key: tag,
        label: tag, 
        count: count
      }));

      // 设置默认激活tab
      if (this.tabOptions.length > 0) {
        this.activeTab = this.tabOptions[0].key;
      }

      // 初始化areasByTag对象
      this.areasByTag = {};
      this.tabOptions.forEach(option => {
        this.areasByTag[option.key] = [];
      });

      console.log('🏷️ Generated tabs:', this.tabOptions);
    },

    // 格式化标签显示名称（HomePage标签页显示，可以更描述性）
    formatTagLabel(tag) {
      const labelMap = {
        'trendy': 'Trendy & Popular',
        'affordable': 'Affordable',
        'family-friendly': 'Family Friendly',
        'quiet': 'Quiet & Peaceful',
        'student-friendly': 'Best for Students',
        'university-area': 'University Area',
        'residential': 'Residential',
        'diverse': 'Diverse Community',
        'transit': 'Great Transit',
        'nightlife': 'Nightlife',
        'arts': 'Arts & Culture',
        'dining': 'Great Dining',
        'shopping': 'Shopping',
        'walkable': 'Walkable',
        'waterfront': 'Waterfront',
        'luxury': 'Luxury',
        'safe': 'Safe',
        'parks': 'Parks & Recreation',
        'historic': 'Historic',
        'young-professional': 'Young Professional'
      };

      return labelMap[tag] || tag.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    },

    // 对区域进行分类
    categorizeAreas() {
      // 重置所有分类
      Object.keys(this.areasByTag).forEach(key => {
        this.areasByTag[key] = [];
      });

      // 先选择有建筑的区域，优先显示
      const areasWithBuildings = this.allAreas.filter(area => area.total_buildings > 0);
      const remainingAreas = this.allAreas.filter(area => area.total_buildings === 0);

      // 合并所有区域，有建筑的优先
      const allAreasToProcess = [...areasWithBuildings, ...remainingAreas];

      // 根据动态生成的标签分类区域
      allAreasToProcess.forEach(area => {
        const areaTags = area.area_tags || [];
        const processedArea = this.processAreaData(area);

        // 为每个动态标签分类添加区域
        this.tabOptions.forEach(tabOption => {
          const tagKey = tabOption.key;
          if (this.areasByTag[tagKey].length < 8) {
            // 检查区域是否包含此标签
            if (areaTags.includes(tagKey) && !this.areasByTag[tagKey].find(a => a.id === area.id)) {
              this.areasByTag[tagKey].push(processedArea);
            }
          }
        });
      });

      // 如果某些标签分类的区域不足8个，添加更多区域
      this.tabOptions.forEach(tabOption => {
        const tagKey = tabOption.key;
        if (this.areasByTag[tagKey].length < 8) {
          const additionalAreas = allAreasToProcess.filter(area => {
            const areaTags = area.area_tags || [];
            return areaTags.some(tag => tag.includes(tagKey) || tagKey.includes(tag)) &&
                   !this.areasByTag[tagKey].find(a => a.id === area.id);
          }).slice(0, 8 - this.areasByTag[tagKey].length);
          
          additionalAreas.forEach(area => {
            this.areasByTag[tagKey].push(this.processAreaData(area));
          });
        }
      });

      // 更新neighborhoods为第一个tab的类别
      if (this.tabOptions.length > 0) {
        this.neighborhoods = this.areasByTag[this.tabOptions[0].key];
      }
    },

    // 处理图片加载错误
    handleImageError(event) {
      console.warn('❌ Image failed to load:', event.target.src);
      // 隐藏失败的图片，显示placeholder
      event.target.style.display = 'none';
      const cardImage = event.target.parentElement;
      if (cardImage) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        cardImage.appendChild(placeholder);
      }
    },

    // 处理区域数据
    processAreaData(area) {
      const display = prepareAreaDisplay(area);
      return {
        id: area.id,
        name: area.name,
        badgeClass: this.getAreaBadgeClass(area),
        badgeLabel: this.getAreaBadgeLabel(area),
        display,
        image_url: area.image_url, // 添加图片URL
        rawData: area
      };
    },

    // 获取区域徽章样式
    getAreaBadgeClass(area) {
      let badgeClass = '';
      
      // 根据区域位置设置颜色
      if (area.borough === 'Manhattan' || area.borough === 'Queens') {
        badgeClass = 'badge-east';
      } else {
        badgeClass = 'badge-west';
      }
      
      // 根据名称长度添加文本大小类
      const nameLength = area.name ? area.name.length : 0;
      if (nameLength > 25) {
        badgeClass += ' extra-long-text'; // 超过25个字符使用最小字体
      } else if (nameLength > 18) {
        badgeClass += ' long-text'; // 超过18个字符使用小字体
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

    // 搜索城市
    searchCity(cityName) {
      console.log('🔍 Searching for city:', cityName);
      this.$router.push({
        name: 'Browse',
        query: {
          search: cityName,
          type: 'city'
        }
      });
    },

    // 探索区域
    // CTA按钮点击 - 携带关键词跳转Browse (zoom=14)
    exploreAreaOnMap(neighborhood) {
      console.log('🗺️ Exploring area on map:', neighborhood.name);
      this.$router.push({
        name: 'Browse',
        query: {
          area: neighborhood.name,
          type: 'area',
          zoom: '14'
        }
      });
    },

    // Search More按钮点击 - 不带关键词跳转Browse
    searchMoreAreas() {
      console.log('🔍 Searching more areas...');
      this.$router.push({
        name: 'Browse'
      });
    },

    // 保留原方法以防其他地方使用
    exploreArea(neighborhood) {
      console.log('🏘️ Exploring area:', neighborhood.name);
      this.$router.push({
        name: 'Browse',
        query: {
          area: neighborhood.name,
          type: 'area'
        }
      });
    },

    initializeScrollControl() {
      // 不再需要滚动控制，因为已经使用FloatingArrow组件
    },
    
    removeScrollControl() {
      // 不再需要
    },
    
    // 处理社区点击事件，跳转到浏览页面
    handleCommunityClick(communityData) {
      console.log('🏠 Navigating to browse page for community:', communityData.name);
      
      this.$router.push({
        name: 'Browse',
        query: {
          area: communityData.name,
          type: 'community'
        }
      });
    },
    
    // 处理搜索事件，跳转到浏览页面
    handleSearchPerformed(searchData) {
      console.log('🔍 HomePage: handleSearchPerformed called!');
      console.log('🔍 SearchData received:', searchData);
      console.log('🔍 Navigating to browse page for search:', searchData);
      
      try {
        this.$router.push({
          name: 'Browse',
          query: {
            search: searchData.location || 'all',
            rentType: searchData.rentType,
            tags: Array.isArray(searchData.tags) ? searchData.tags.join(',') : '',
            type: 'search'
          }
        });
        console.log('🔍 Router.push executed successfully');
      } catch (error) {
        console.error('🔍 Router navigation error:', error);
      }
    },
    
    // 处理筛选图标点击事件，跳转到浏览页面
    handleFilterClick(filterData) {
      console.log('🎛️ Navigating to browse page for filter:', filterData);
      
      this.$router.push({
        name: 'Browse',
        query: {
          search: filterData.location || 'all',
          rentType: filterData.rentType,
          tags: Array.isArray(filterData.tags) ? filterData.tags.join(',') : '',
          type: 'filter'
        }
      });
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
  margin: 0;
  padding: 0;
}

/* 优化scroll-snap */
#map-section {
  scroll-snap-align: start;
}

#neighborhood-section,
#cities-section,
#footer-section {
  scroll-snap-align: start;
}

.main-content {
  flex: 1;
}

/* Map Section Styles */
.map-section {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: calc(100vh - 4rem); /* navbar高度(4rem) + map section = 100vh */
  max-height: calc(100vh - 4rem); /* 确保不超过视口 */
  box-sizing: border-box;
  overflow: hidden; /* 确保不会有滚动条 */
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  text-align: center;
  color: white;
  padding: 20px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 18px;
  font-weight: 400;
}

/* Neighborhood Section Styles */
.neighborhood-section {
  padding: 60px 0 40px 0; /* 使用固定px值，更合理的间距 */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: auto; /* 移除固定高度，让内容决定高度 */
}

.section-container {
  margin: 0 auto;
  padding: 0 2vw; /* 使用vw单位的百分比padding */
}

.section-title {
  font-size: clamp(24px, 2.5vw, 36px); /* 响应式字体，但有最小和最大值 */
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px; /* 使用固定px值 */
  color: #0f5132; /* Green-700 */
}

.section-subtitle {
  font-size: clamp(14px, 1.2vw, 18px); /* 响应式字体，但有最小和最大值 */
  text-align: center;
  margin-bottom: 32px; /* 使用固定px值 */
  color: #555;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(16px, 2vw, 24px); /* 响应式间距 */
  margin-top: 16px;
  align-items: stretch;
  width: 100%;
  padding: 0 clamp(20px, 6vw, 80px); /* 响应式padding */
  box-sizing: border-box;
}

.neighborhood-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: white;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-image {
  height: 120px; /* 大幅减少图片高度 */
  background-color: #e0e0e0;
  overflow: hidden; /* 隐藏溢出部分 */
  position: relative;
}

.area-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持比例并填满容器 */
  object-position: center; /* 居中显示 */
}

.placeholder {
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  position: relative;
}

.placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background-color: #ccc;
  border-radius: 50%;
}

.card-badge {
  position: absolute;
  top: 102px; /* 调整位置匹配新的图片高度 */
  left: 50px;
  right: 50px;
  padding: 6px 12px; /* 减小内边距 */
  border-radius: 6px;
  font-size: 11px; /* 默认字体大小 */
  font-weight: 600;
  color: white;
  text-align: center;
  z-index: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  white-space: nowrap; /* 防止换行 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 显示省略号 */
  min-height: 20px; /* 固定最小高度确保一致性 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 长文本badge自动缩小字体 */
.card-badge.long-text {
  font-size: 9px; /* 更小的字体用于长文本 */
  padding: 4px 8px; /* 减少内边距 */
}

/* 超长文本badge进一步缩小 */
.card-badge.extra-long-text {
  font-size: 8px; /* 最小字体 */
  padding: 3px 6px; /* 最少内边距 */
}

/* 移动端badge字体进一步优化 */
@media (max-width: 768px) {
  .card-badge {
    font-size: 10px; /* 移动端默认更小 */
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

.badge-east {
  background-color: #198754; 
}

.badge-west {
  background-color: #198754; 
}

.card-content {
  padding: 18px 16px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
  min-height: 200px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title {
  font-size: 14px; /* 减小字体 */
  font-weight: 600;
  color: #0a3622; /* Green-800 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3; /* 减小行高 */
}

.card-address {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
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
  letter-spacing: 0.06em;
  text-transform: uppercase;
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

.chip-more {
  background: transparent;
  border: 1px dashed rgba(55, 65, 81, 0.4);
  color: #4b5563;
  min-width: 38px;
  justify-content: center;
}

.explore-btn {
  width: 100%;
  border-color: #198754; /* Green-500 */
  color: #198754; /* Green-500 */
  height: 26px; /* 进一步减小按钮高度 */
  font-size: 11px; /* 进一步减小按钮字体 */
  margin-top: 8px;
}

.explore-btn:hover {
  border-color: #146c43; /* Green-600 */
  color: #146c43; /* Green-600 */
}

/* 简单的自定义tabs样式 */
.simple-tabs {
  width: 100%;
  margin-bottom: 6px;
}

.tabs-header {
  display: flex;
  width: 88%; /* 与卡片网格宽度保持一致 */
  margin: 0 auto;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.3vw;
  margin-bottom: 1.5vh;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-button {
  flex: 1;
  padding: 10px 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 2px;
}

.tab-button:hover {
  color: #198754;
  background: rgba(25, 135, 84, 0.08);
}

.tab-button.active {
  color: white;
  font-weight: 600;
  background: #198754;
  box-shadow: 0 2px 4px rgba(25, 135, 84, 0.3);
}

.tabs-content {
  width: 100%;
}

.view-more {
  text-align: right;
  margin-top: 24px;
  padding-right: clamp(20px, 6vw, 80px); /* 与卡片grid的padding保持一致 */
  margin-bottom: 0; /* 移除底部边距 */
}

.view-more-btn {
  border-color: #198754; /* Green-500 */
  color: #198754; /* Green-500 */
  font-weight: 600;
}

.view-more-btn:hover {
  border-color: #146c43; /* Green-600 */
  color: #146c43; /* Green-600 */
}

/* Cities Section Styles */
.cities-section {
  padding: 60px 0 60px 0; /* 使用固定px值，合理的上下间距 */
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  min-height: auto; /* 移除固定高度，让内容决定高度 */
}

.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(12px, 2vw, 24px);
  margin-top: 32px;
  padding: 0 clamp(16px, 3vw, 32px);
  width: 100%;
  max-width: 1400px;
}

.city-card {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 1.3;
  min-height: 180px;
  max-height: 240px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.city-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.city-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.city-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 16px;
  color: white;
}

.city-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.city-description {
  font-size: 12px;
  font-weight: 400;
  margin: 0;
  opacity: 0.9;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.view-all-cities {
  text-align: center;
  margin-top: 40px;
}

.view-all-btn {
  background-color: transparent;
  border: 2px solid #198754; /* Green-500 */
  color: #198754; /* Green-500 */
  padding: 12px 32px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 16px;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  background-color: #198754; /* Green-500 */
  color: white;
}

.placeholder-text {
  text-align: center;
  color: #888;
  padding: 32px;
}


/* Custom Tab Styles */
:deep(.custom-tabs) {
  text-align: center;
  width: 100%;
}

:deep(.custom-tabs .n-tabs-nav) {
  justify-content: center;
  background: transparent !important;
  border-radius: 0;
  padding: 0 40px;
  margin-bottom: 10px;
  display: flex;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

:deep(.custom-tabs .n-tabs-tab) {
  font-size: 16px !important;
  font-weight: 500 !important;
  padding: 12px 20px !important;
  border-radius: 0 !important;
  color: #666 !important;
  transition: all 0.3s ease !important;
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  flex: 1;
  text-align: center;
}

:deep(.custom-tabs .n-tabs-tab:hover) {
  background: transparent !important;
  color: #198754 !important;
}

:deep(.custom-tabs .n-tabs-tab--active) {
  background: transparent !important;
  color: #198754 !important;
  font-weight: 600 !important;
  border-bottom: 5px solid #198754 !important;
}

:deep(.custom-tabs .n-tabs-tab-pad) {
  display: none !important;
}

:deep(.custom-tabs .n-tabs-rail) {
  display: none !important;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .neighborhood-section {
    padding: 50px 0 30px 0;
  }
  
  .cities-section {
    padding: 50px 0 50px 0;
  }
  
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .cities-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    padding: 0 clamp(12px, 2vw, 24px);
  }
}

/* 中等屏幕 (769px-1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  
  .neighborhood-section {
    padding: 40px 0 30px 0;
  }
  
  .cities-section {
    padding: 40px 0 40px 0;
  }
  
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .cities-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: clamp(10px, 2.5vw, 20px);
    padding: 0 clamp(12px, 2vw, 24px);
  }
  
  .city-card {
    min-height: 160px;
    max-height: 200px;
  }
}

@media (max-width: 768px) {
  
  .hero-title {
    font-size: 28px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .neighborhood-section {
    padding: 30px 0 20px 0;
  }
  
  .cities-section {
    padding: 30px 0 30px 0;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .cities-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: clamp(8px, 2vw, 16px);
    padding: 0 clamp(8px, 2vw, 16px);
  }
  
  .city-card {
    min-height: 140px;
    max-height: 180px;
    aspect-ratio: 1.25;
  }
  
  .tabs-header {
    width: 95%; /* 手机上增加tabs宽度 */
    padding: 4px;
  }
  
  .tab-button {
    font-size: 11px;
    padding: 8px 4px;
  }
}

@media (max-width: 480px) {
  
  .hero-title {
    font-size: 24px;
  }
  
  .hero-subtitle {
    font-size: 14px;
  }
  
  .neighborhood-section {
    padding: 20px 0 15px 0;
  }
  
  .cities-section {
    padding: 20px 0 20px 0;
  }
  
  .cities-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: clamp(6px, 2vw, 12px);
    padding: 0 clamp(6px, 2vw, 12px);
  }
  
  .city-card {
    min-height: 120px;
    max-height: 160px;
    aspect-ratio: 1.35;
  }
  
  .city-name {
    font-size: 14px;
  }
  
  .city-description {
    font-size: 10px;
  }
  
  .tab-button {
    font-size: 10px;
    padding: 6px 2px;
  }
  
}

/* 超小屏幕优化 (≤360px) - 确保正确的100vh布局 */
@media (max-width: 360px) {
  .map-section {
    height: calc(100vh - 4rem) !important; /* 保持navbar + map section = 100vh */
    max-height: calc(100vh - 4rem) !important;
  }
  
  .map-container {
    width: 100vw !important; /* 确保宽度占满视口 */
    margin: 0 !important;
    border-radius: 0 !important; /* 移除圆角，铺满边缘 */
  }
  
  .hero-title {
    font-size: 20px;
  }
  
  .hero-subtitle {
    font-size: 12px;
  }
  
  .cities-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: clamp(4px, 1.5vw, 8px);
    padding: 0 clamp(4px, 1.5vw, 8px);
  }
  
  .city-card {
    min-height: 100px;
    max-height: 140px;
    aspect-ratio: 1.4;
  }
  
  .city-name {
    font-size: 12px;
  }
  
  .city-description {
    font-size: 9px;
  }
  
  .city-overlay {
    padding: 12px;
  }
  
}

</style> 
