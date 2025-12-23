<template>
  <div class="position-info">
    <!-- 汇总信息 -->
    <div class="position-summary">
      <div class="summary-card">
        <div class="summary-label">总持仓</div>
        <div class="summary-value">{{ totalPositions }}</div>
        <div class="summary-sub">持仓数量</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">总市值</div>
        <div class="summary-value">{{ formatNumber(totalMarketValue) }}</div>
        <div class="summary-sub">市场价值</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">总浮动盈亏</div>
        <div class="summary-value" :class="getProfitClass(totalProfit)">
          {{ formatNumber(totalProfit) }}
        </div>
        <div class="summary-sub">未实现盈亏</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">总保证金</div>
        <div class="summary-value">{{ formatNumber(totalMargin) }}</div>
        <div class="summary-sub">占用资金</div>
      </div>
    </div>

    <!-- 持仓列表 -->
    <div class="position-table-container">
      <div class="table-header">
        <h3>持仓明细</h3>
        <div class="table-actions">
          <button class="action-btn" @click="refresh">
            <i>🔄</i> 刷新
          </button>
          <div class="filter-controls">
            <select v-model="filterDirection" class="filter-select">
              <option value="all">全部方向</option>
              <option value="LONG">多头</option>
              <option value="SHORT">空头</option>
            </select>
            <input 
              v-model="filterSymbol" 
              placeholder="搜索合约代码" 
              class="filter-input"
            />
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="position-table">
          <thead>
            <tr>
              <th @click="sortBy('symbol')" class="sortable">
                合约代码
                <span v-if="sortField === 'symbol'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('direction')" class="sortable">
                方向
                <span v-if="sortField === 'direction'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('volume')" class="sortable">
                持仓量
                <span v-if="sortField === 'volume'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('price')" class="sortable">
                持仓均价
                <span v-if="sortField === 'price'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th>最新价</th>
              <th @click="sortBy('profit')" class="sortable">
                浮动盈亏
                <span v-if="sortField === 'profit'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('profit_ratio')" class="sortable">
                盈亏比例
                <span v-if="sortField === 'profit_ratio'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('margin')" class="sortable">
                保证金
                <span v-if="sortField === 'margin'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="position in filteredPositions" 
              :key="position.symbol + position.direction"
              :class="getRowClass(position)"
            >
              <td class="symbol-cell">
                <div class="symbol-info">
                  <span class="symbol-code">{{ position.symbol }}</span>
                  <span class="symbol-name">{{ position.name || position.symbol }}</span>
                </div>
              </td>
              <td>
                <span class="direction-badge" :class="position.direction.toLowerCase()">
                  {{ getDirectionText(position.direction) }}
                </span>
              </td>
              <td>
                <div class="volume-info">
                  <span class="volume-value">{{ position.volume }}</span>
                  <span class="volume-unit">手</span>
                </div>
              </td>
              <td>{{ formatNumber(position.price) }}</td>
              <td>
                <div class="price-info">
                  <span class="price-value">{{ formatNumber(position.last_price) }}</span>
                  <span 
                    v-if="position.last_price && position.price" 
                    class="price-change"
                    :class="getPriceChangeClass(position.last_price, position.price)"
                  >
                    {{ getPriceChange(position.last_price, position.price) }}
                  </span>
                </div>
              </td>
              <td>
                <div class="profit-info" :class="getProfitClass(position.profit)">
                  <span class="profit-value">{{ formatNumber(position.profit) }}</span>
                  <span v-if="position.profit" class="profit-icon">
                    {{ position.profit > 0 ? '📈' : position.profit < 0 ? '📉' : '➖' }}
                  </span>
                </div>
              </td>
              <td>
                <span 
                  class="profit-ratio" 
                  :class="getProfitRatioClass(position.profit_ratio)"
                >
                  {{ formatPercent(position.profit_ratio) }}
                </span>
              </td>
              <td>{{ formatNumber(position.margin) }}</td>
            </tr>
            <tr v-if="filteredPositions.length === 0">
              <td colspan="8" class="no-data">
                <div class="no-data-content">
                  <i>📭</i>
                  <p>暂无持仓数据</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="filteredPositions.length > 0" class="pagination">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          上一页
        </button>
        <span class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps<{
  data: any
}>()

// 响应式数据
const sortField = ref('symbol')
const sortOrder = ref('asc')
const filterDirection = ref('all')
const filterSymbol = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 格式化数字
const formatNumber = (num: number) => {
  if (num === undefined || num === null) return '--'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatPercent = (num: number) => {
  if (num === undefined || num === null) return '--'
  return `${(num * 100).toFixed(2)}%`
}

// 计算汇总信息
const totalPositions = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return 0
  return props.data.length
})

const totalMarketValue = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return 0
  return props.data.reduce((sum, pos) => sum + (pos.market_value || 0), 0)
})

const totalProfit = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return 0
  return props.data.reduce((sum, pos) => sum + (pos.profit || 0), 0)
})

const totalMargin = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return 0
  return props.data.reduce((sum, pos) => sum + (pos.margin || 0), 0)
})

// 方向文本
const getDirectionText = (direction: string) => {
  const map: Record<string, string> = {
    'LONG': '多头',
    'SHORT': '空头',
    'NET': '净头寸'
  }
  return map[direction] || direction
}

// 盈亏样式
const getProfitClass = (profit: number) => {
  if (profit > 0) return 'profit-positive'
  if (profit < 0) return 'profit-negative'
  return ''
}

const getProfitRatioClass = (ratio: number) => {
  if (ratio > 0.05) return 'ratio-high-profit'
  if (ratio > 0.02) return 'ratio-profit'
  if (ratio < -0.05) return 'ratio-high-loss'
  if (ratio < -0.02) return 'ratio-loss'
  return ''
}

// 价格变化
const getPriceChange = (lastPrice: number, avgPrice: number) => {
  if (!lastPrice || !avgPrice) return '--'
  const change = lastPrice - avgPrice
  const changePercent = (change / avgPrice) * 100
  return `${change > 0 ? '+' : ''}${formatNumber(change)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`
}

const getPriceChangeClass = (lastPrice: number, avgPrice: number) => {
  if (!lastPrice || !avgPrice) return ''
  const change = lastPrice - avgPrice
  return change > 0 ? 'price-up' : change < 0 ? 'price-down' : ''
}

// 行样式
const getRowClass = (position: any) => {
  const classes = []
  if (position.profit > 1000) classes.push('high-profit')
  if (position.profit < -1000) classes.push('high-loss')
  if (position.volume > 100) classes.push('large-volume')
  return classes.join(' ')
}

// 排序功能
const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

// 过滤和排序后的持仓列表
const filteredPositions = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return []
  
  let positions = [...props.data]
  
  // 过滤
  if (filterDirection.value !== 'all') {
    positions = positions.filter(pos => pos.direction === filterDirection.value)
  }
  
  if (filterSymbol.value) {
    const keyword = filterSymbol.value.toLowerCase()
    positions = positions.filter(pos => 
      pos.symbol.toLowerCase().includes(keyword) ||
      (pos.name && pos.name.toLowerCase().includes(keyword))
    )
  }
  
  // 排序
  positions.sort((a, b) => {
    const aValue = a[sortField.value] || 0
    const bValue = b[sortField.value] || 0
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  })
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  return positions.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return 1
  const total = props.data.length
  return Math.ceil(total / pageSize.value)
})

// 刷新功能
const emit = defineEmits(['refresh'])
const refresh = () => {
  emit('refresh')
}

// // 监听过滤条件变化时重置页码
// watch([filterDirection, filterSymbol], () => {
//   currentPage.value = 1
// })
</script>

<style scoped>
.position-info {
  width: 100%;
}

/* 汇总信息 */
.position-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  border-top: 4px solid #3498db;
}

.summary-card:nth-child(2) {
  border-top-color: #2ecc71;
}

.summary-card:nth-child(3) {
  border-top-color: #e74c3c;
}

.summary-card:nth-child(4) {
  border-top-color: #f39c12;
}

.summary-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.summary-sub {
  font-size: 12px;
  color: #95a5a6;
}

/* 表格容器 */
.position-table-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  color: #2c3e50;
}

.table-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.action-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover {
  background: #2980b9;
}

.filter-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-width: 200px;
}

/* 表格样式 */
.table-responsive {
  overflow-x: auto;
}

.position-table {
  width: 100%;
  border-collapse: collapse;
}

.position-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
}

.position-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.position-table tr:hover {
  background: #f8f9fa;
}

.position-table tr.high-profit {
  background: rgba(46, 204, 113, 0.05);
}

.position-table tr.high-loss {
  background: rgba(231, 76, 60, 0.05);
}

.position-table tr.large-volume {
  background: rgba(52, 152, 219, 0.05);
}

/* 可排序列 */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background: #e9ecef;
}

.sort-indicator {
  margin-left: 5px;
  color: #3498db;
}

/* 单元格样式 */
.symbol-cell {
  min-width: 150px;
}

.symbol-info {
  display: flex;
  flex-direction: column;
}

.symbol-code {
  font-weight: bold;
  color: #2c3e50;
}

.symbol-name {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

/* 方向标签 */
.direction-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.direction-badge.long {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.direction-badge.short {
  background: rgba(231, 76, 60, 0.1);
  color: #c0392b;
  border: 1px solid rgba(231, 76, 60, 0.2);
}

/* 数量信息 */
.volume-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-value {
  font-weight: bold;
  color: #2c3e50;
}

.volume-unit {
  font-size: 12px;
  color: #95a5a6;
}

/* 价格信息 */
.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-value {
  font-weight: bold;
  color: #2c3e50;
}

.price-change {
  font-size: 12px;
}

.price-change.price-up {
  color: #2ecc71;
}

.price-change.price-down {
  color: #e74c3c;
}

/* 盈亏信息 */
.profit-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profit-value {
  font-weight: bold;
}

.profit-positive {
  color: #2ecc71;
}

.profit-negative {
  color: #e74c3c;
}

.profit-icon {
  font-size: 14px;
}

/* 盈亏比例 */
.profit-ratio {
  font-weight: bold;
}

.ratio-high-profit {
  color: #27ae60;
  background: rgba(46, 204, 113, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.ratio-profit {
  color: #2ecc71;
}

.ratio-loss {
  color: #e74c3c;
}

.ratio-high-loss {
  color: #c0392b;
  background: rgba(231, 76, 60, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

/* 无数据 */
.no-data {
  text-align: center;
  padding: 40px !important;
}

.no-data-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #95a5a6;
}

.no-data-content i {
  font-size: 40px;
  opacity: 0.5;
}

/* 分页 */
.pagination {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  border-top: 1px solid #eee;
}

.pagination-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.pagination-info {
  color: #6c757d;
  font-size: 14px;
}
</style>