<template>
  <div class="contract-table-container">
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-input-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="输入合约代码或者交易所,留空则查询所有合约"
          class="search-input"
          @input="onSearchInput"
        />
        <button @click="clearSearch" class="clear-btn" v-if="searchQuery">
        ×
        </button>
    </div>

    </div>
    <!-- 表格容器 -->
    <div class="table-wrapper">
      <table class="contract-table">
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
            <th v-if="hasOptionData">交易接口<br>gateway_name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contract in paginatedContracts" :key="contract.symbol">
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
              {{ searchQuery ? '未找到匹配的合约' : '暂无合约数据' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-controls" v-if="showPagination">
      <div class="pagination-info">
        显示 {{ startItem }}-{{ endItem }} 条，共 {{ totalItems }} 条
        <span v-if="searchQuery" class="search-count">
          (共 {{ totalItems }} 条，筛选出 {{ filteredItems }} 条)
        </span>
      </div>
      <div class="pagination-buttons-center">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="pagination-btn"
          >
          上一页
        </button>
        <span class="page-numbers">
          <span class="current-page-info">
            第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
          </span>
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
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

enum Exchange {
    // Chinese
    CFFEX = "CFFEX",         // China Financial Futures Exchange
    SHFE = "SHFE",           // Shanghai Futures Exchange
    CZCE = "CZCE",           // Zhengzhou Commodity Exchange
    DCE = "DCE",             // Dalian Commodity Exchange
    INE = "INE",             // Shanghai International Energy Exchange
    GFEX = "GFEX",           // Guangzhou Futures Exchange
    SSE = "SSE",             // Shanghai Stock Exchange
    SZSE = "SZSE",           // Shenzhen Stock Exchange
    BSE = "BSE",             // Beijing Stock Exchange
    SHHK = "SHHK",           // Shanghai-HK Stock Connect
    SZHK = "SZHK",           // Shenzhen-HK Stock Connect
    SGE = "SGE",             // Shanghai Gold Exchange
    WXE = "WXE",             // Wuxi Steel Exchange
    CFETS = "CFETS",         // CFETS Bond Market Maker Trading System
    XBOND = "XBOND",         // CFETS X-Bond Anonymous Trading System

    // Global
    SMART = "SMART",         // Smart Router for US stocks
    NYSE = "NYSE",           // New York Stock Exchnage
    NASDAQ = "NASDAQ",       // Nasdaq Exchange
    ARCA = "ARCA",           // ARCA Exchange
    EDGEA = "EDGEA",         // Direct Edge Exchange
    ISLAND = "ISLAND",       // Nasdaq Island ECN
    BATS = "BATS",           // Bats Global Markets
    IEX = "IEX",             // The Investors Exchange
    AMEX = "AMEX",           // American Stock Exchange
    TSE = "TSE",             // Toronto Stock Exchange
    NYMEX = "NYMEX",         // New York Mercantile Exchange
    COMEX = "COMEX",         // COMEX of CME
    GLOBEX = "GLOBEX",       // Globex of CME
    IDEALPRO = "IDEALPRO",   // Forex ECN of Interactive Brokers
    CME = "CME",             // Chicago Mercantile Exchange
    ICE = "ICE",             // Intercontinental Exchange
    SEHK = "SEHK",           // Stock Exchange of Hong Kong
    HKFE = "HKFE",           // Hong Kong Futures Exchange
    SGX = "SGX",             // Singapore Global Exchange
    CBOT = "CBOT",           // Chicago Board of Trade
    CBOE = "CBOE",           // Chicago Board Options Exchange
    CFE = "CFE",             // CBOE Futures Exchange
    DME = "DME",             // Dubai Mercantile Exchange
    EUREX = "EUX",           // Eurex Exchange
    APEX = "APEX",           // Asia Pacific Exchange
    LME = "LME",             // London Metal Exchange
    BMD = "BMD",             // Bursa Malaysia Derivatives
    TOCOM = "TOCOM",         // Tokyo Commodity Exchange
    EUNX = "EUNX",           // Euronext Exchange
    KRX = "KRX",             // Korean Exchange
    OTC = "OTC",             // OTC Product (Forex/CFD/Pink Sheet Equity)
    IBKRATS = "IBKRATS",     // Paper Trading Exchange of IB

    // Special Function
    LOCAL = "LOCAL",         // For local generated data
    GLOBAL = "GLOBAL",       // For those exchanges not supported yet
}

const productMap: Record<string,string> = {
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

const getProductText = (product: string) : string => {
  return productMap[product] || product
}

// Contract data contains basic information about contract traded
interface Contract {
  vt_symbol: string,
  symbol: string,
  exchange: Exchange
  name: string,
  product: string,
  size: number,
  pricetick: number,

  min_volume: number,                     // minimum order volume
  max_volume: number | null,              // maximum order volume
  stop_supported: boolean,                // whether server supports stop order
  net_position: boolean,                  // whether gateway uses net position volume
  history_data: boolean,                  // whether gateway provides bar history data

  option_strike?: number | null,          // option exercise price
  option_underlying?: string | null,      // vt_symbol of underlying contract
  option_type?: string | null,         
  option_listed?: string | null,          
  option_expiry?: string | null,
  option_portfolio?: string | null,
  option_index?: string | null,           // for identifying options with same strike price.

  gateway_name: string,
}

const props = defineProps<{
  contracts?: Contract[]
}>()

// Pagination-related status
const currentPage = ref(1)
const pageSize = ref(20)
const jumpPage = ref(1)
const searchQuery = ref('')

// Filtered contract data
const filteredContracts = computed(() => {
  if (!props.contracts) return []
  if (!searchQuery.value.trim()) {
    return props.contracts
  }
  const query = searchQuery.value.trim().toLowerCase()
  return props.contracts.filter(contract => {
    return (
      contract.exchange.toLowerCase().includes(query) ||
      contract.vt_symbol.toLowerCase().includes(query) ||
      contract.symbol.toLowerCase().includes(query) ||
      contract.name.toLowerCase().includes(query) ||
      contract.product.toLowerCase().includes(query) ||
      getProductText(contract.product).toLowerCase().includes(query)
    )
  })
})

// Reset to the first page when the search term changes
watch(searchQuery, () => {
  currentPage.value = 1
  jumpPage.value = 1
})

const onSearchInput = () => {
  // empty temp
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Calculate the total number of entries
const totalItems = computed(() => {
  return props.contracts?.length || 0
})

// Calculate the total number of filter entries
const filteredItems = computed(() => {
  return filteredContracts.value.length
})

// Calculate total number of pages
const totalPages = computed(() => {
  return Math.ceil(filteredItems.value / pageSize.value)
})

// Calculate the data displayed on the current page
const paginatedContracts = computed(() => {
  if(filteredItems.value === 0) return []
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredContracts.value.slice(start, end)
})

// Calculate the start and end entries for display
const startItem = computed(() => {
  return (currentPage.value - 1) * pageSize.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * pageSize.value
  return end > totalItems.value ? totalItems.value : end
})

// Whether need to show pageination
const showPagination = computed(() => {
  return totalItems.value > 0
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

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    jumpPage.value = page
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

// Computed property: Check if option data needs to be displayed
const hasOptionData = computed(() => {
  return filteredContracts.value?.some(contract => 
    contract.option_type || contract.option_strike
  ) ?? false
})
</script>

<style scoped>
.contract-table-container {
  padding: 20px;
}

.pagination-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.pagination-info {
  color: #666;
  font-size: 14px;
  display: flex;
}

.pagination-buttons-center {
  display: flex;
  align-items: center;
  gap: 8px;
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

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: rgb(255, 255, 255);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #409eff;
  border-color: #ccc;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 2px;
}

.table-wrapper {
  width: 100%;
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  background: white;
}

.contract-table {
  min-width: 1200px;
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.contract-table th {
  min-width: 100px;
  background-color: #f5f5f5;
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.contract-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contract-table tbody tr:hover {
  background-color: #f9f9f9;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 40px !important;
}

.page-info {
  color: #666;
  font-size: 14px;
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

.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* search box */
.search-container {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.search-input-group {
  position: relative;
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #dee2e6;
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

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #adb5bd;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #6c757d;
}

.search-count {
  color: #f56c6c;
  font-size: 12px;
  margin-left: 8px;
}

</style>