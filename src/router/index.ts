// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const Login = () => import('../views/Login.vue')
const System = () => import('../views/System.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/system',
    name: 'System',
    component: System,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('vnpy_token')
  
  // If authentication is required but there is no token, return to the login page.
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // If already logged in but accessing the login page
  if (to.path === '/login' && token) {
    next('/system')
    return
  }
  
  // Other conditions are normally allowed to pass.
  next()
})

export default router