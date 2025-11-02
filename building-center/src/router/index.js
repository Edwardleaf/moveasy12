import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ConfirmSignUp from '../views/ConfirmSignUp.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import HomePage from '../views/HomePage.vue'
import Browse from '../views/Browse.vue'
import BuildingDetail from '../views/BuildingDetail.vue'
import AIRecommendation from '../views/AIRecommendation.vue'
import RecommendationResults from '../views/RecommendationResults.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import BuildingUpload from '../views/admin/BuildingUpload.vue'
import { isAuthenticated } from '../services/supabaseAuthService'
import useAdmin from '../composables/useAdmin'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: false }
  },
  {
    path: '/browse',
    name: 'Browse',
    component: Browse,
    meta: { requiresAuth: false }
  },
  {
    path: '/ai',
    name: 'AIRecommendation',
    component: AIRecommendation,
    meta: { requiresAuth: false }
  },
  {
    path: '/recommendations/:data',
    name: 'RecommendationResults',
    component: RecommendationResults,
    meta: { requiresAuth: false }
  },
  {
    path: '/building/:id',
    name: 'BuildingDetail',
    component: BuildingDetail,
    meta: { requiresAuth: false }
  },
  {
    path: '/sign-in',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/signup',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/signup/tenant',
    name: 'TenantRegister',
    component: Register,
    props: { defaultTab: 'tenant' },
    meta: { requiresAuth: false }
  },
  {
    path: '/signup/landlord',
    name: 'LandlordRegister',
    component: Register,
    props: { defaultTab: 'landlord' },
    meta: { requiresAuth: false }
  },
  // Redirects for backward compatibility
  {
    path: '/login',
    redirect: '/sign-in'
  },
  {
    path: '/register',
    redirect: '/signup'
  },
  {
    path: '/register/tenant',
    redirect: '/signup/tenant'
  },
  {
    path: '/register/landlord',
    redirect: '/signup/landlord'
  },
  {
    path: '/confirm-signup',
    name: 'ConfirmSignUp',
    component: ConfirmSignUp,
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { requiresAuth: false }
  },
  {
    path: '/auth/confirm',
    name: 'AuthConfirm',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/confirm',
    name: 'EmailConfirm',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/auth/google/callback',
    name: 'GoogleAuthCallback',
    component: Login,
    meta: { requiresAuth: false }
  },
  // Admin routes
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'buildings',
        name: 'AdminBuildings',
        component: () => import('../views/admin/BuildingList.vue')
      },
      {
        path: 'buildings/new',
        name: 'AdminBuildingNew',
        component: BuildingUpload
      },
      {
        path: 'buildings/:id/edit',
        name: 'AdminBuildingEdit',
        component: () => import('../views/admin/BuildingEdit.vue'),
        props: true
      },
      {
        path: 'areas',
        name: 'AdminAreas',
        component: () => import('../views/admin/AreaList.vue')
      },
      {
        path: 'areas/new',
        name: 'AdminAreaNew',
        component: () => import('../views/admin/AreaForm.vue')
      },
      {
        path: 'areas/:id/edit',
        name: 'AdminAreaEdit',
        component: () => import('../views/admin/AreaForm.vue'),
        props: true
      },
      {
        path: 'amenities',
        name: 'AdminAmenities',
        component: () => import('../views/admin/AmenityList.vue')
      },
      {
        path: 'transportation',
        name: 'AdminTransportation',
        component: () => import('../views/admin/TransportationList.vue')
      },
    ]
  },
  // 未来添加更多路由...
  {
    path: '/:pathMatch(.*)*',
    redirect: '/sign-in'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的滚动位置(如浏览器前进后退)，使用保存的位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则总是滚动到页面顶部
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 默认需要认证
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true
  
  if (requiresAuth) {
    try {
      // 检查用户是否已登录
      const authenticated = await isAuthenticated()
      if (authenticated) {
        // 如果需要admin权限，进行额外检查
        if (requiresAdmin) {
          const { getCurrentUser, isAdmin } = useAdmin()
          await getCurrentUser()
          
          if (isAdmin.value) {
            // 用户是admin，允许访问
            next()
          } else {
            // 用户不是admin，重定向到首页
            next('/')
          }
        } else {
          // 用户已登录且不需要admin权限，允许访问
          next()
        }
      } else {
        // 用户未登录，重定向到登录页
        next({ 
          path: '/sign-in',
          query: { redirect: to.fullPath }
        })
      }
    } catch (error) {
      console.error('路由守卫错误:', error)
      // 发生错误，重定向到登录页
      next({ 
        path: '/sign-in',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 不需要认证的路由，直接允许访问
    next()
  }
})

export default router 