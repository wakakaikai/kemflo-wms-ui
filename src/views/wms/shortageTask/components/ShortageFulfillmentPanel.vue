<template>
  <div v-loading="loading" class="shortage-fulfillment-panel">
    <el-alert class="fulfillment-hint" type="info" :closable="false" show-icon>
      按需求创建时间先后模拟扣减共享库存池（同物料 + 同库存类型共用一个池）；先创建的需求优先占用库存。
    </el-alert>

    <div class="fulfillment-toolbar">
      <el-button type="primary" :loading="loading" @click="analyzeAll">一键分析全部缺料</el-button>
      <span v-if="result" class="analyzed-meta">
        已分析 {{ result.summary.shortageLineCount }} 条缺料 / {{ result.summary.demandCount }} 个需求单
      </span>
    </div>

    <div v-if="result" class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">需求单数</span>
        <span class="summary-value">{{ result.summary.demandCount }}</span>
      </div>
      <div class="summary-card success">
        <span class="summary-label">完全满足</span>
        <span class="summary-value">{{ result.summary.fullCount }}</span>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">部分满足</span>
        <span class="summary-value">{{ result.summary.partialCount }}</span>
      </div>
      <div class="summary-card danger">
        <span class="summary-label">无法满足</span>
        <span class="summary-value">{{ result.summary.noneCount }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">缺料总量</span>
        <span class="summary-value">{{ formatQty(result.summary.totalShortageQty) }}</span>
      </div>
      <div class="summary-card primary">
        <span class="summary-label">可分配量</span>
        <span class="summary-value">{{ formatQty(result.summary.totalAllocatedQty) }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">仍缺总量</span>
        <span class="summary-value">{{ formatQty(result.summary.totalRemainingQty) }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">库存池</span>
        <span class="summary-value">{{ result.summary.poolMaterialCount }}</span>
      </div>
    </div>

    <el-table v-if="result" :data="result.demands" border stripe row-key="demandNo" default-expand-all>
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-table :data="row.lines" border stripe size="small" class="expand-line-table">
            <el-table-column prop="workOrderNo" label="工单号" width="120" />
            <el-table-column prop="materialCode" label="物料编码" min-width="120" />
            <el-table-column prop="materialName" label="物料描述" min-width="150" show-overflow-tooltip />
            <el-table-column label="库存类型" width="100" align="center">
              <template #default="{ row: line }">
                <el-tag size="small" :type="line.shortageInventoryType === 'SALES_ORDER' ? 'warning' : 'info'">
                  {{ line.shortageInventoryType === 'SALES_ORDER' ? '销售订单' : '非限制' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="池可用(前)" align="right" width="108">
              <template #default="{ row: line }">{{ formatQty(line.poolAvailableBefore) }}</template>
            </el-table-column>
            <el-table-column label="缺料" align="right" width="96">
              <template #default="{ row: line }"><span class="shortage-qty">{{ formatQty(line.shortageQty) }}</span></template>
            </el-table-column>
            <el-table-column label="可分配" align="right" width="96">
              <template #default="{ row: line }"><span class="allocated-qty">{{ formatQty(line.allocatedQty) }}</span></template>
            </el-table-column>
            <el-table-column label="仍缺" align="right" width="96">
              <template #default="{ row: line }"><span class="remaining-qty">{{ formatQty(line.remainingQty) }}</span></template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="64" align="center" />
          </el-table>
        </template>
      </el-table-column>
      <el-table-column label="序号" width="64" align="center">
        <template #default="{ row }">{{ row.sortOrder }}</template>
      </el-table-column>
      <el-table-column label="需求单号" min-width="140">
        <template #default="{ row }">
          <el-link v-if="row.demandNo" type="primary" @click="$emit('demand-detail', row)">{{ row.demandNo }}</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="需求时间" prop="demandCreateTime" min-width="160" show-overflow-tooltip />
      <el-table-column label="领料人" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ formatMaterialUser(row) }}</template>
      </el-table-column>
      <el-table-column label="缺料行" width="80" align="center">
        <template #default="{ row }">{{ row.lineCount }}</template>
      </el-table-column>
      <el-table-column label="缺料量" align="right" width="96">
        <template #default="{ row }">{{ formatQty(row.totalShortageQty) }}</template>
      </el-table-column>
      <el-table-column label="可分配" align="right" width="96">
        <template #default="{ row }">{{ formatQty(row.totalAllocatedQty) }}</template>
      </el-table-column>
      <el-table-column label="仍缺" align="right" width="96">
        <template #default="{ row }">{{ formatQty(row.totalRemainingQty) }}</template>
      </el-table-column>
      <el-table-column label="满足率" width="88" align="center">
        <template #default="{ row }">{{ formatRate(row.fulfillmentRate) }}%</template>
      </el-table-column>
      <el-table-column label="满足状态" width="108" align="center" fixed="right">
        <template #default="{ row }">
          <el-tag :type="shortageFulfillmentStatusTag(row.fulfillmentStatus)" size="small">
            {{ shortageFulfillmentStatusLabel(row.fulfillmentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else-if="!loading" description="点击「一键分析全部缺料」开始分析" />

    <el-collapse v-if="result?.pools.length" v-model="poolCollapseOpen" class="pool-collapse">
      <el-collapse-item title="共享库存池明细" name="pool">
        <el-table :data="result.pools" border stripe size="small" max-height="320">
          <el-table-column prop="materialCode" label="物料编码" min-width="120" />
          <el-table-column prop="materialName" label="物料描述" min-width="150" show-overflow-tooltip />
          <el-table-column label="库存类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.shortageInventoryType === 'SALES_ORDER' ? 'warning' : 'info'">
                {{ row.shortageInventoryType === 'SALES_ORDER' ? '销售订单' : '非限制' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="销售单号" prop="salesOrderNo" min-width="120" show-overflow-tooltip />
          <el-table-column label="项次" prop="salesOrderItem" width="88" show-overflow-tooltip />
          <el-table-column label="池总量" align="right" width="96">
            <template #default="{ row }">{{ formatQty(row.initialQty) }}</template>
          </el-table-column>
          <el-table-column label="已分配" align="right" width="96">
            <template #default="{ row }">{{ formatQty(row.allocatedQty) }}</template>
          </el-table-column>
          <el-table-column label="剩余" align="right" width="96">
            <template #default="{ row }">{{ formatQty(row.remainingQty) }}</template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="64" align="center" />
        </el-table>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  loadShortageFulfillmentSimulation,
  shortageFulfillmentStatusLabel,
  shortageFulfillmentStatusTag,
  type ShortageFulfillmentDemandResult,
  type ShortageFulfillmentSimulationResult
} from '@/api/wms/shortageTask';
import { formatQty } from '@/utils/ruoyi';

defineEmits<{
  'demand-detail': [row: ShortageFulfillmentDemandResult];
}>();

const loading = ref(false);
const result = ref<ShortageFulfillmentSimulationResult | null>(null);
const poolCollapseOpen = ref<string[]>(['pool']);

function formatMaterialUser(row: ShortageFulfillmentDemandResult) {
  const name = String(row.materialUserName || '').trim();
  const code = String(row.materialUserCode || '').trim();
  if (name && code) return `${name} (${code})`;
  return name || code || '-';
}

function formatRate(rate?: number) {
  const n = Number(rate ?? 0);
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(1);
}

async function analyzeAll() {
  loading.value = true;
  try {
    result.value = await loadShortageFulfillmentSimulation();
  } finally {
    loading.value = false;
  }
}

async function reload() {
  await analyzeAll();
}

defineExpose({ reload, analyzeAll });
</script>

<style scoped lang="scss">
.shortage-fulfillment-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fulfillment-hint {
  margin-bottom: 0;
}

.fulfillment-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.analyzed-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);

  &.success .summary-value {
    color: var(--el-color-success);
  }

  &.warning .summary-value {
    color: var(--el-color-warning);
  }

  &.danger .summary-value {
    color: var(--el-color-danger);
  }

  &.primary .summary-value {
    color: var(--el-color-primary);
  }
}

.summary-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.expand-line-table {
  margin: 4px 0 8px;
}

.shortage-qty {
  color: var(--el-color-danger);
  font-weight: 600;
}

.allocated-qty {
  color: var(--el-color-success);
  font-weight: 600;
}

.remaining-qty {
  color: var(--el-color-warning-dark-2);
  font-weight: 600;
}

.pool-collapse {
  margin-top: 4px;
}
</style>
