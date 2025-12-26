<template>
  <div class="system-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>Web Trader</h3>
        <div class="user-info">
          <i class="user-icon">👤</i>
          <span>{{ username }}</span>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <div class="menu-section">
          <h4>账户管理</h4>
          <button 
            class="menu-btn"
            :class="{ 'active': activeMenu === 'account' }"
            @click="fetchAccountInfo"
          >
            <i>💰</i> 账户信息
          </button>
          <button 
            class="menu-btn"
            :class="{ 'active': activeMenu === 'position' }"
            @click="fetchPositions"
          >
            <i>📊</i> 持仓信息
          </button>
        </div>
        
        <div class="menu-section">
          <h4>行情数据</h4>
          <button 
            class="menu-btn"
            :class="{ 'active': activeMenu === 'tick' }"
            @click="fetchTickData"
          >
            <i>📈</i> 查询行情
          </button>
          <div class="subscribe-section">
            <input 
              v-model="subscribeSymbol"
              placeholder="输入合约代码"
              @keyup.enter="subscribeTick"
            />
            <button 
              class="subscribe-btn"
              @click="subscribeTick"
              :disabled="!subscribeSymbol"
            >
              订阅行情
            </button>
          </div>
        </div>
        
        <div class="menu-section">
          <h4>交易管理</h4>
          <button 
            class="menu-btn"
            :class="{ 'active': activeMenu === 'order' }"
            @click="fetchOrders"
          >
            <i>📝</i> 委托查询
          </button>
          <button 
            class="menu-btn"
            :class="{ 'active': activeMenu === 'trade' }"
            @click="fetchTrades"
          >
            <i>🔄</i> 成交查询
          </button>
          <button 
            class="menu-btn"
            :class="{ 'active': activeMenu === 'contract' }"
            @click="fetchContracts"
          >
            <i>📄</i> 合约查询
          </button>
        </div>
        
        <div class="menu-section">
          <button class="menu-btn logout-btn" @click="handleLogout">
            <i>🚪</i> 退出登录
          </button>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-header">
        <h2>{{ currentTitle }}</h2>
        <div class="status-indicator" :class="statusClass">
          {{ statusText }}
        </div>
      </div>
      
      <div class="content-body">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>数据加载中...</p>
        </div>
        
        <!-- 数据显示 -->
        <div v-else-if="currentData" class="data-display">
          <div class="data-header">
            <h3>{{ currentTitle }}</h3>
            <button class="refresh-btn" @click="refreshData">
              <i>🔄</i> 刷新
            </button>
          </div>
          
          <div class="data-content">
            <template v-if="activeMenu === 'account'">
              <AccountInfo :data="currentData" />
            </template>
            <template v-else-if="activeMenu === 'position'">
              <PositionInfo :data="currentData" />
            </template>
            <template v-else-if="activeMenu === 'contract'">
              <ContractInfo :contracts="currentData" />
            </template>
            <template v-else>
              <pre class="json-data">{{ JSON.stringify(currentData, null, 2) }}</pre>
            </template>
          </div>
        </div>
        
        <!-- 默认提示 -->
        <div v-else class="welcome-message">
          <div class="welcome-icon">📊</div>
          <h3>欢迎使用 VN.PY 量化交易系统</h3>
          <p>请从左侧菜单选择功能开始操作</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import { defineAsyncComponent } from 'vue'
const AccountInfo = defineAsyncComponent(() => import('../components/AccountInfo.vue'))
const PositionInfo = defineAsyncComponent(() => import('../components/PositionInfo.vue'))
const ContractInfo = defineAsyncComponent(() => import('../components/ContractInfo.vue'))

const router = useRouter()

// 1. 定义类型
type MenuKey = 'account' | 'position' | 'tick' | 'order' | 'trade' | 'contract'

// 响应式数据
const username = ref(localStorage.getItem('vnpy_username') || '')
const token = ref(localStorage.getItem('vnpy_token') || '')
const activeMenu = ref<MenuKey | ''>('') 
const currentData = ref<any>(null)
const loading = ref(false)
const subscribeSymbol = ref('cu2512.SHFE')
const connectionStatus = ref<'connected' | 'connecting' | 'error' | 'disconnected'>('disconnected')

// 2. 菜单标题映射 - 使用明确的类型
const menuTitles: Record<MenuKey, string> = {
  account: '账户信息',
  position: '持仓信息',
  tick: '最新行情',
  order: '委托查询',
  trade: '成交查询',
  contract: '合约查询'
}

// 3. 计算当前标题（安全访问）
const currentTitle = computed(() => {
  if (activeMenu.value && activeMenu.value in menuTitles) {
    return menuTitles[activeMenu.value as MenuKey]
  }
  return '系统面板'
})

// 状态显示
const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'error': return '连接异常'
    default: return '未连接'
  }
})

const statusClass = computed(() => `status-${connectionStatus.value}`)

// 检查登录状态
onMounted(() => {
  if (!token.value) {
    router.push('/login')
  }
})

// 通用API请求函数
const apiRequest = async (endpoint: string) => {
  if (!token.value) {
    router.push('/login')
    return null
  }

  loading.value = true
  try {
    const response = await axios.get(`api/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    connectionStatus.value = 'connected'
    return response.data
  } catch (err: any) {
    console.error(`请求${endpoint}失败:`, err)
    
    if (err.response?.status === 401) {
      // token过期，跳转登录
      localStorage.removeItem('vnpy_token')
      router.push('/login')
    } else if (err.response?.status === 404) {
      console.warn(`接口 ${endpoint} 不存在`)
      connectionStatus.value = 'error'
    } else {
      connectionStatus.value = 'error'
    }
    
    return null
  } finally {
    loading.value = false
  }
}

// 订阅行情
const subscribeTick = async () => {
  if (!subscribeSymbol.value) return
  
  loading.value = true
  try {
    await axios.post(
      `api/tick/${subscribeSymbol.value}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      }
    )
    alert(`成功订阅 ${subscribeSymbol.value}`)
  } catch (err: any) {
    alert(`订阅失败: ${err.response?.data?.detail || err.message}`)
  } finally {
    loading.value = false
  }
}

const fetchAccountInfo = async () => {
  activeMenu.value = 'account'
  const data = await apiRequest(activeMenu.value)
  console.log('account:',data)
  if (data) {
    if (Array.isArray(data) && data.length > 0) {
      currentData.value = data[0]
    } else if (typeof data === 'object') {
      currentData.value = data
    } else {
      currentData.value = {}
    }
  }
}

const fetchPositions = async () => {
  activeMenu.value = 'position'
  const data = await apiRequest('position')
  if (data) currentData.value = data
}

const fetchTickData = async () => {
  activeMenu.value = 'tick'
  const data = await apiRequest('tick')
  if (data) currentData.value = data
}

const fetchOrders = async () => {
  activeMenu.value = 'order'
  const data = await apiRequest('order')
  if (data) currentData.value = data
}

const fetchTrades = async () => {
  activeMenu.value = 'trade'
  const data = await apiRequest('trade')
  if (data) currentData.value = data
}

const fetchContracts = async () => {
  activeMenu.value = 'contract'
  const data = await apiRequest('contract')
  if (data) currentData.value = data
  console.log(data)
}

// 刷新数据
const refreshData = () => {
  const menuHandlers: Record<MenuKey, Function> = {
    account: fetchAccountInfo,
    position: fetchPositions,
    tick: fetchTickData,
    order: fetchOrders,
    trade: fetchTrades,
    contract: fetchContracts
  }
  
  if (activeMenu.value && activeMenu.value in menuHandlers) {
    menuHandlers[activeMenu.value as MenuKey]()
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('vnpy_token')
  localStorage.removeItem('vnpy_username')
  router.push('/login')
}
</script>

<style scoped>
/* 全局重置 */
:deep(*) {
  box-sizing: border-box;
}

.system-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: #f5f5f5;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
  flex-shrink: 0;
}

.sidebar-header h3 {
  margin: 0 0 10px 0;
  color: #ecf0f1;
}

.user-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #bdc3c7;
}

.user-icon {
  margin-right: 8px;
}

.sidebar-menu {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.menu-section {
  margin-bottom: 30px;
}

.menu-section h4 {
  color: #95a5a6;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.menu-btn {
  width: 100%;
  padding: 12px 15px;
  background: transparent;
  color: #ecf0f1;
  border: none;
  border-radius: 6px;
  text-align: left;
  margin-bottom: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-btn.active {
  background: #3498db;
  color: white;
}

.menu-btn i {
  margin-right: 10px;
  font-style: normal;
}

.subscribe-section {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.subscribe-section input {
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
}

.subscribe-btn {
  width: 100%;
  padding: 8px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.subscribe-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logout-btn {
  color: #e74c3c;
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.1);
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  width: calc(100vw - 280px); /* 减去侧边栏宽度 */
}

.content-header {
  padding: 20px 30px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.content-header h2 {
  margin: 0;
  color: #2c3e50;
}

.status-indicator {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status-connected {
  background: #d4edda;
  color: #155724;
}

.status-connecting {
  background: #fff3cd;
  color: #856404;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.status-disconnected {
  background: #f8f9fa;
  color: #6c757d;
}

.content-body {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  min-height: 0; /* 重要：允许flex item收缩 */
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 数据展示 */
.data-display {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.data-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.refresh-btn {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.refresh-btn i {
  margin-right: 5px;
}

.json-data {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  height: 100%;
  overflow-y: auto;
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #7f8c8d;
}

.welcome-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.welcome-message h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

/* 确保表格内容可以滚动 */
:deep(.contract-table-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.contract-table) {
  flex: 1;
  min-height: 0;
}

:deep(table) {
  height: 100%;
}
</style>