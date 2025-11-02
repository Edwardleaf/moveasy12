<template>
  <div class="admin-dashboard">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h1 class="page-title">
        <TranslatedText :use-static="true">Admin Dashboard</TranslatedText>
      </h1>
      <p class="page-subtitle">
        <TranslatedText :use-static="true">Manage your building listings and system data</TranslatedText>
      </p>
    </div>

    <!-- Loading状态 -->
    <div v-if="isLoading" class="loading-container">
      <n-spin size="large">
        <template #description>
          <TranslatedText>Loading dashboard data...</TranslatedText>
        </template>
      </n-spin>
    </div>

    <!-- 主要内容 -->
    <div v-else>
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <n-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon buildings">
              <n-icon size="32"><BusinessOutline /></n-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalBuildings }}</div>
              <div class="stat-label">
                <TranslatedText :use-static="true">buildings</TranslatedText>
              </div>
            </div>
          </div>
        </n-card>

        <n-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon areas">
              <n-icon size="32"><LocationOutline /></n-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalAreas }}</div>
              <div class="stat-label">
                <TranslatedText :use-static="true">Total Areas</TranslatedText>
              </div>
            </div>
          </div>
        </n-card>

      <!-- 
      <n-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon users">
            <n-icon size="32"><PeopleOutline /></n-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.totalUsers }}</div>
            <div class="stat-label">
              <TranslatedText>Users</TranslatedText>
            </div>
          </div>
        </div>
      </n-card>
      -->

        <n-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active">
              <n-icon size="32"><CheckmarkCircleOutline /></n-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.activeBuildings }}</div>
              <div class="stat-label">
                <TranslatedText :use-static="true">Active Buildings</TranslatedText>
              </div>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h2 class="section-title">
        <TranslatedText :use-static="true">Quick Actions</TranslatedText>
      </h2>
      
      <div class="actions-grid">
        <n-card class="action-card" hoverable @click="goToAddBuilding">
          <div class="action-content">
            <n-icon size="48" class="action-icon">
              <AddOutline />
            </n-icon>
            <h3 class="action-title">
              <TranslatedText :use-static="true">Add Building</TranslatedText>
            </h3>
            <p class="action-description">
              <TranslatedText :use-static="true">Create a new building listing</TranslatedText>
            </p>
          </div>
        </n-card>

        <n-card class="action-card" hoverable @click="goToBuildings">
          <div class="action-content">
            <n-icon size="48" class="action-icon">
              <BusinessOutline />
            </n-icon>
            <h3 class="action-title">
              <TranslatedText :use-static="true">Manage Buildings</TranslatedText>
            </h3>
            <p class="action-description">
              <TranslatedText :use-static="true">View and edit existing buildings</TranslatedText>
            </p>
          </div>
        </n-card>

        <n-card class="action-card" hoverable @click="goToAreas">
          <div class="action-content">
            <n-icon size="48" class="action-icon">
              <LocationOutline />
            </n-icon>
            <h3 class="action-title">
              <TranslatedText :use-static="true">Manage Areas</TranslatedText>
            </h3>
            <p class="action-description">
              <TranslatedText :use-static="true">View and edit NYC neighborhood areas</TranslatedText>
            </p>
          </div>
        </n-card>

        <!-- 
        <n-card class="action-card" hoverable @click="goToUsers">
          <div class="action-content">
            <n-icon size="48" class="action-icon">
              <PeopleOutline />
            </n-icon>
            <h3 class="action-title">
              <TranslatedText>Manage Users</TranslatedText>
            </h3>
            <p class="action-description">
              <TranslatedText>View and manage user accounts</TranslatedText>
            </p>
          </div>
        </n-card>
        -->
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activity">
      <h2 class="section-title">
        <TranslatedText :use-static="true">Recent Buildings</TranslatedText>
      </h2>
      
      <n-card>
        <n-data-table
          :columns="buildingColumns"
          :data="recentBuildings"
          :loading="buildingsLoading"
          :pagination="false"
          size="small"
        />
        
        <div class="table-footer">
          <n-button text type="primary" @click="goToBuildings">
            <TranslatedText :use-static="true">View All Buildings</TranslatedText>
            <template #icon>
              <n-icon><ArrowForwardOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  BusinessOutline,
  LocationOutline,
  PeopleOutline,
  CheckmarkCircleOutline,
  AddOutline,
  ArrowForwardOutline
} from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'
import useTranslation from '@/composables/useTranslation'
import { getSupabase } from '@/services/supabaseConfig'

export default {
  name: 'AdminDashboard',
  components: {
    TranslatedText,
    BusinessOutline,
    LocationOutline,
    PeopleOutline,
    CheckmarkCircleOutline,
    AddOutline,
    ArrowForwardOutline
  },
  setup() {
    const router = useRouter()
    const message = useMessage()
    const { getStaticText } = useTranslation()

    // Loading状态
    const isLoading = ref(true)
    const statsLoading = ref(false)
    const buildingsLoading = ref(false)
    const recentBuildings = ref([])

    // 统计数据
    const stats = reactive({
      totalBuildings: 0,
      totalAreas: 0,
      totalUsers: 0,
      activeBuildings: 0
    })

    // 表格列定义
    const buildingColumns = [
      {
        title: () => h(TranslatedText, { 'use-static': true }, { default: () => 'Name' }),
        key: 'name',
        ellipsis: true
      },
      {
        title: () => h(TranslatedText, { 'use-static': true }, { default: () => 'Area' }),
        key: 'area_name'
      },
      {
        title: () => h(TranslatedText, { 'use-static': true }, { default: () => 'Created' }),
        key: 'created_at',
        render: (row) => {
          return new Date(row.created_at).toLocaleDateString()
        }
      }
    ]

    // 加载统计数据
    const loadStats = async () => {
      try {
        statsLoading.value = true
        const supabaseClient = await getSupabase();

        // 并行加载所有统计数据以提高性能
        const [buildingResult, activeBuildingResult, areaResult] = await Promise.all([
          supabaseClient
            .from('buildings')
            .select('*', { count: 'exact', head: true }),
          supabaseClient
            .from('buildings')
            .select('*', { count: 'exact', head: true }),
          supabaseClient
            .from('areas')
            .select('*', { count: 'exact', head: true })
        ])

        // 加载用户统计 (如果有用户表)
        let userCount = 0
        try {
          const { count } = await supabaseClient
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
          userCount = count || 0
        } catch (error) {
          console.warn('用户统计加载失败:', error)
          userCount = 0
        }

        stats.totalBuildings = buildingResult.count || 0
        stats.activeBuildings = activeBuildingResult.count || 0
        stats.totalAreas = areaResult.count || 0
        stats.totalUsers = userCount

        console.log('📊 统计数据加载完成:', stats)

      } catch (error) {
        console.error('Error loading stats:', error)
        message.error('统计数据加载失败')
      } finally {
        statsLoading.value = false
      }
    }

    // 加载最近建筑
    const loadRecentBuildings = async () => {
      try {
        buildingsLoading.value = true
        const supabaseClient = await getSupabase();

        const { data, error } = await supabaseClient
          .from('buildings')
          .select(`
            id,
            name,
            created_at,
            areas(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error

        recentBuildings.value = data.map(building => ({
          ...building,
          area_name: building.areas?.name || 'Unknown Area'
        }))

      } catch (error) {
        console.error('Error loading recent buildings:', error)
        message.error('Failed to load recent buildings')
      } finally {
        buildingsLoading.value = false
      }
    }

    // 导航方法
    const goToAddBuilding = () => {
      router.push('/admin/buildings/new')
    }

    const goToBuildings = () => {
      router.push('/admin/buildings')
    }

    const goToAreas = () => {
      router.push('/admin/areas')
    }

    const goToUsers = () => {
      router.push('/admin/users')
    }

    // 初始化页面数据
    const initializePage = async () => {
      try {
        isLoading.value = true

        // 并行加载统计数据和最近建筑
        await Promise.all([
          loadStats(),
          loadRecentBuildings()
        ])

        console.log('✅ Dashboard初始化完成')
      } catch (error) {
        console.error('❌ Dashboard初始化失败:', error)
        message.error('页面初始化失败')
      } finally {
        isLoading.value = false
      }
    }

    // 初始化
    onMounted(() => {
      initializePage()
    })

    return {
      // 状态
      isLoading,
      statsLoading,
      buildingsLoading,

      // 数据
      stats,
      recentBuildings,
      buildingColumns,

      // 方法
      getStaticText,
      goToAddBuilding,
      goToBuildings,
      goToAreas,
      goToUsers
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  flex-direction: column;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.buildings {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.stat-icon.areas {
  background: linear-gradient(135deg, #10b981, #047857);
}

.stat-icon.users {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.stat-icon.active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* 快速操作 */
.quick-actions {
  margin-bottom: 3rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  border-color: #198754;
  box-shadow: 0 4px 12px rgba(25, 135, 84, 0.15);
  transform: translateY(-2px);
}

.action-content {
  text-align: center;
  padding: 1rem;
}

.action-icon {
  color: #198754;
  margin-bottom: 1rem;
}

.action-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.action-description {
  color: #6b7280;
  margin: 0;
}

/* 最近活动 */
.recent-activity {
  margin-bottom: 2rem;
}

.table-footer {
  margin-top: 1rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

:deep(.status-active) {
  color: #059669;
  font-weight: 500;
}

:deep(.status-inactive) {
  color: #dc2626;
  font-weight: 500;
}

:deep(.n-card) {
  border-radius: 12px;
}

:deep(.n-data-table-th) {
  font-weight: 600;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>