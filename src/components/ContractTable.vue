<template>
  <div class="contract-table-wrapper">
    <div v-if="hasSearched" class="search-stats">
      <span class="stats-total">共 {{ totalItems }} 条记录</span>
      <span v-if="searchKeyword && filteredItems !== totalItems" class="stats-filtered">
        (筛选出 {{ filteredItems }} 条)
      </span>
    </div>
    
    <div v-if="isLoading" class="table-loading">
      <div class="loading-spinner"></div>
      <p>数据加载中...</p>
    </div>
    
    <div v-else-if="showData" class="table-container">
      <table class="contract-data-table">
        <thead>
          <tr>
            <th>本地代码<br>vt_symbol</th>
            <th>代码<br>symbol</th>
            <th>交易所<br>exchange</th>
            <th>名称<br>name</th>
            <th>合约分类<br>product</th>
            <th>合约乘数<br>size</th>
            <th>价格跳动<br>pricetick</th>
            <th>委托范围<br>volume</th>
            <th v-if="hasOptionData">期权产品<br>option_portfolio</th>
            <th v-if="hasOptionData">期权标的合约<br>option_underlying</th>
            <th v-if="hasOptionData">期权到期日<br>option_expiry</th>
            <th v-if="hasOptionData">期权行权价<br>option_strike</th>
            <th v-if="hasOptionData">期权类型<br>option_type</th>
            <th>交易接口<br>gateway_name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contract in paginatedContracts" :key="contract.vt_symbol">
            <td>{{ contract.vt_symbol }}</td>
            <td>{{ contract.symbol }}</td>
            <td>{{ contract.exchange }}</td>
            <td>{{ contract.name }}</td>
            <td>{{ getProductText(contract.product) }}</td>
            <td>{{ contract.size }}</td>
            <td>{{ contract.pricetick }}</td>
            <td>{{ contract.min_volume }} - {{ contract.max_volume }}</td>
            <td v-if="hasOptionData">
              <span v-if="contract.option_portfolio">
                {{contract.option_portfolio}}
              </span>
              <span v-else>--</span>
            </td>
            <td v-if="hasOptionData">
              <span v-if="contract.option_underlying">
                {{contract.option_underlying}}
              </span>
              <span v-else>--</span>
            </td>
            <td v-if="hasOptionData">
              <span v-if="contract.option_expiry">
                {{contract.option_expiry}}
              </span>
              <span v-else>--</span>
            </td>
            <td v-if="hasOptionData">
              <span v-if="contract.option_strike">
                {{contract.option_strike}}
              </span>
              <span v-else>--</span>
            </td>
            <td v-if="hasOptionData">
              <span v-if="contract.option_type">
                {{ contract.option_type === 'CALL' ? '看涨' : "看跌" }}
              </span>
              <span v-else>--</span>
            </td>
            <td>{{ contract.gateway_name }}</td>
          </tr>
          <tr v-if="!paginatedContracts || paginatedContracts.length === 0">
            <td :colspan="hasOptionData ? 14 : 10" class="no-data">
              {{ searchKeyword ? '未找到匹配的合约' : '暂无合约数据' }}
            </td>
          </tr>
        </tbody>
      </table>

      
      <div class="pagination-controls" v-if="showPagination">
        <div class="pagination-info">
          显示 {{ startItem }}-{{ endItem }} 条，共 {{ totalItems }} 条
        </div>
        <div class="pagination-buttons-center">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            上一页
          </button>
          <span class="current-page-info">
            第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
          </span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            下一页
          </button>
        </div>
        <div class="page-jump-container">
          <span class="page-jump">
            跳至
            <input 
              type="number" 
              v-model.number="jumpPage" 
              :min="1" 
              :max="totalPages"
              @keyup.enter="goToJumpPage"
            >
            页
          </span>
        </div>
      </div>
    </div>
    
    <div v-else-if="hasSearched && !showData">
      <h4>{{ searchKeyword ? '未找到匹配的合约' : '暂无合约数据' }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Contract {
  vt_symbol: string,
  symbol: string,
  exchange: string,
  name: string,
  product: string,
  size: number,
  pricetick: number,
  min_volume: number,
  max_volume: number | null,
  stop_supported: boolean,
  net_position: boolean,
  history_data: boolean,
  option_strike?: number | null,
  option_underlying?: string | null,
  option_type?: string | null,
  option_listed?: string | null,
  option_expiry?: string | null,
  option_portfolio?: string | null,
  option_index?: string | null,
  gateway_name: string,
}

const props = defineProps<{
  contracts?: Contract[]
  isLoading?: boolean
  searchKeyword?: string
  hasSearched?: boolean
}>()

const productMap: Record<string, string> = {
  'Equity': '股票',
  'Futures': '期货',
  'Option': '期权',
  'Index': '指数',
  'Forex': '外汇',
  'Spot': '现货',
  'ETF': 'ETF',
  'Bond': '债券',
  'Warrant': '权证',
  'Spread': '价差',
  'Fund': '基金',
  'CFD': 'CFD',
  'SWAP': '互换',
}

const getProductText = (product: string): string => {
  return productMap[product] || product
}

const currentPage = ref(1)
const pageSize = ref(10)
const jumpPage = ref(1)

const totalItems = computed(() => props.contracts?.length || 0)

const filteredItems = computed(() => {
  if (!props.searchKeyword?.trim()) return totalItems.value
  
  const query = props.searchKeyword.trim().toLowerCase()
  return props.contracts?.filter(contract => {
    return (
      contract.exchange?.toLowerCase().includes(query) ||
      contract.vt_symbol?.toLowerCase().includes(query) ||
      contract.symbol?.toLowerCase().includes(query) ||
      contract.name?.toLowerCase().includes(query)
    )
  }).length || 0
})

const showData = computed(() => {
  return props.hasSearched && !props.isLoading && props.contracts && props.contracts.length > 0
})

const hasOptionData = computed(() => {
  return props.contracts?.some(contract => 
    contract.option_type || contract.option_strike
  ) ?? false
})

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value / pageSize.value)
})

const paginatedContracts = computed(() => {
  if(!props.contracts || props.contracts.length === 0) return []
  
  let data = props.contracts
  
  if (props.searchKeyword?.trim()) {
    const query = props.searchKeyword.trim().toLowerCase()
    data = data.filter(contract => {
      return (
        contract.exchange?.toLowerCase().includes(query) ||
        contract.vt_symbol?.toLowerCase().includes(query) ||
        contract.symbol?.toLowerCase().includes(query) ||
        contract.name?.toLowerCase().includes(query)
      )
    })
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

const startItem = computed(() => {
  return (currentPage.value - 1) * pageSize.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * pageSize.value
  return end > filteredItems.value ? filteredItems.value : end
})

const showPagination = computed(() => {
  return filteredItems.value > 0
})

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    jumpPage.value = currentPage.value
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    jumpPage.value = currentPage.value
  }
}

const goToJumpPage = () => {
  if (jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
    currentPage.value = jumpPage.value
  } else if (jumpPage.value < 1) {
    jumpPage.value = 1
    currentPage.value = 1
  } else if (jumpPage.value > totalPages.value) {
    jumpPage.value = totalPages.value
    currentPage.value = totalPages.value
  }
}

watch(
  () => props.searchKeyword,
  () => {
    currentPage.value = 1
    jumpPage.value = 1
  }
)

watch(
  () => props.contracts,
  (newContracts) => {
    if (!newContracts || newContracts.length === 0) {
      currentPage.value = 1
      jumpPage.value = 1
    }
  }
)
</script>

<style scoped>
.contract-table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-stats {
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-total {
  font-weight: 500;
}

.stats-filtered {
  color: #67c23a;
}

.table-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.table-container {
  flex: 1;                  /* Tell the parent element: Give me all the remaining space */    
  display: flex;            /* Tell the parent element: To the child element: Now arrange according to my rules */ 
  flex-direction: column;   /* Child elements arranged vertically */ 
}

.contract-data-table {
  min-width: 1400px;
  width: 100%;                /* Fill the width of the parent container */
  border-collapse: collapse;  /* Merge table borders */
  font-size: 13px;
}

.contract-data-table th {
  position: sticky;
  top: 0;
  background-color: #fafafa;
  padding: 12px 10px;
  text-align: center;
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #ebeef5;
  white-space: nowrap;
  z-index: 10;
}

.contract-data-table td {
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.contract-data-table tbody tr:hover {
  background-color: #f5f7fa;
}

.contract-data-table .no-data {
  text-align: center;
  color: #c0c4cc;
  padding: 40px !important;
  font-size: 14px;
}

.pagination-controls {
  display: grid;
  /* 
  Three-column layout 
  1fr: Flexible space, occupies 1 part of the remaining space
  auto: Adaptive width, determined by content
  */
  grid-template-columns: 1fr auto 1fr;  
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #eee;
}

.pagination-info {
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-buttons-center {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.current-page-info {
  padding: 6px 16px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.page-jump-container {
  display: flex;
  justify-content: flex-end;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.page-jump input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}
</style>