<template>
  <div class="contract-table-container">
    <h3>合约数据列表</h3>
    <table class="contract-table">
      <thead>
        <tr>
          <th>合约代码</th>
          <th>合约名称</th>
          <th>交易所</th>
          <th>网关</th>
          <th>产品类型</th>
          <th>合约乘数</th>
          <th>最小变动</th>
          <th>成交量范围</th>
          <th>止损支持</th>
          <th>净持仓</th>
          <th>历史数据</th>
          <th>VT符号</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contract in contracts" :key="contract.vt_symbol">
          <td>{{ contract.symbol }}</td>
          <td>{{ contract.name }}</td>
          <td>{{ contract.exchange }}</td>
          <td>{{ contract.gateway_name }}</td>
          <td>{{ contract.product }}</td>
          <td>{{ contract.size }}</td>
          <td>{{ contract.pricetick }}</td>
          <td>{{ contract.min_volume }} - {{ contract.max_volume }}</td>
          <td>
            <span :class="['status-badge', contract.stop_supported ? 'supported' : 'not-supported']">
              {{ contract.stop_supported ? '支持' : '不支持' }}
            </span>
          </td>
          <td>
            <span :class="['status-badge', contract.net_position ? 'supported' : 'not-supported']">
              {{ contract.net_position ? '是' : '否' }}
            </span>
          </td>
          <td>
            <span :class="['status-badge', contract.history_data ? 'supported' : 'not-supported']">
              {{ contract.history_data ? '有' : '无' }}
            </span>
          </td>
          <td>{{ contract.vt_symbol }}</td>
        </tr>
        <tr v-if="!contracts || contracts.length === 0">
          <td colspan="12" class="no-data">暂无合约数据</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  contracts: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.contract-table-container {
  padding: 20px;
}

h3 {
  margin-bottom: 15px;
  color: #333;
}

.contract-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.contract-table th {
  background-color: #f5f5f5;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.contract-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
}

.contract-table tbody tr:hover {
  background-color: #f9f9f9;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.supported {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.not-supported {
  background-color: #ffebee;
  color: #c62828;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 40px !important;
}
</style>