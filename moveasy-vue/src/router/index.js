import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout.vue'
import RoleSelect from '@/views/RoleSelect.vue'
import OwnerDashboard from '@/views/OwnerDashboard.vue'
export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/role' },
    { path: '/role', name: 'RoleSelect', component: RoleSelect },
    { path: '/', component: Layout, children: [
      { path: '/owner', name: 'Owner', component: OwnerDashboard },
    ]}
  ]
})
