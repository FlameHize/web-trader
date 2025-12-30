<template>
  <div class="contract-query-container">
    <div class="query-controls">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="输入合约代码、交易所或名称，留空则查询所有合约"
        class="search-input"
        @keyup.enter="handleSearch"
      />      
      <button 
        class="search-action-btn"
        @click="handleSearch"
        :disabled="isSearching"
      >
        <span v-if="!isSearching">🔍 查询</span>
        <span v-else>⏳ 查询中...</span>
      </button>
      
      <button 
        class="refresh-btn"
        @click="refreshData"
        :disabled="isSearching"
      >
        <i>🔄</i> 刷新
      </button>
    </div>
    
    <!-- Directly use the contract components -->
    <ContractTable 
      :contracts="allContracts"
      :is-loading="isSearching"
      :search-keyword="searchKeyword"
      :has-searched="hasSearched"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import ContractTable from '../components/ContractTable.vue'

const router = useRouter()

const allContracts = ref<any[]>([])
const searchKeyword = ref('')
const isSearching = ref(false)
const hasSearched = ref(false)

const getToken = (): string => {
  return localStorage.getItem('vnpy_token') || ''
}

const handleSearch = async () => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }
  isSearching.value = true
  hasSearched.value = true
  try {
    const response = await axios.get('/api/contract', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    })
    if (response.data && Array.isArray(response.data)) {
      allContracts.value = response.data
    } else {
      allContracts.value = []
      alert('接口返回数据格式不正确')
    }
  } catch (error: any) {
    allContracts.value = []
    if (error.response?.status === 401) {
      localStorage.removeItem('vnpy_token')
      router.push('/login')
    } else if (error.code === 'ECONNABORTED') {
      alert('请求超时，请检查网络连接')
    } else {
      alert(`查询失败: ${error.response?.data?.detail || error.message || '未知错误'}`)
    }
  } finally {
    isSearching.value = false
  }
}

const refreshData = () => {
  handleSearch()
}
</script>

<style scoped>
.contract-query-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.query-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.search-input-group {
  flex: 1;
  position: relative;
}

.search-input {
  flex: 1;
  position: relative;
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: 2px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.search-action-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.search-action-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.search-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>