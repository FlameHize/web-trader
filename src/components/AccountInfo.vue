<template>
  <div class="account-info">
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">交易网关</div>
        <div class="info-value">{{ data.gateway_name }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">账户ID</div>
        <div class="info-value">{{ data.accountid }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">余额</div>
        <div class="info-value highlight">{{ formatNumber(data.balance) }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">可用资金</div>
        <div class="info-value">{{ formatNumber(data.available) }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">冻结资金</div>
        <div class="info-value">{{ formatNumber(data.frozen) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  data: any
}>()

const formatNumber = (num: number) => {
  if (num === undefined || num === null) return '--'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.account-info {
  width: 100%;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.info-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.info-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.highlight {
  color: #2ecc71;
  font-size: 22px;
}

.profit-positive {
  color: #2ecc71;
}

.profit-negative {
  color: #e74c3c;
}

.risk-high {
  color: #e74c3c;
}

.risk-medium {
  color: #f39c12;
}

.risk-low {
  color: #2ecc71;
}
</style>