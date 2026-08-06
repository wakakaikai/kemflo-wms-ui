<template>
  <div class="tcp-result-panel">
    <div v-if="payload" class="tcp-result-main">
      <div class="tcp-result-left">
        <div class="barcode-row">
          <span class="barcode-label">条码</span>
          <el-input :model-value="payload.barcode || '—'" readonly class="barcode-input" />
        </div>

        <div class="detail-with-status">
          <el-table :data="payload.details" border stripe size="small" class="detail-table" max-height="280" empty-text="无测试明细">
            <el-table-column label="参数" prop="testItem" min-width="90" show-overflow-tooltip />
            <el-table-column label="值" prop="testValue" min-width="120" show-overflow-tooltip />
            <el-table-column label="结果" prop="testStatus" width="90" align="center">
              <template #default="scope">
                <span class="detail-status" :class="isPassStatus(scope.row.testStatus) ? 'is-pass' : 'is-ng'">
                  {{ scope.row.testStatus || '—' }}
                </span>
              </template>
            </el-table-column>
          </el-table>

          <div class="status-badge" :class="overallPass ? 'is-pass' : 'is-ng'">
            {{ payload.testStatus || (overallPass ? 'PASS' : 'NG') }}
          </div>
        </div>

        <div class="meta-row">
          <span v-if="payload.datetimeCreated">时间 {{ payload.datetimeCreated }}</span>
          <span v-if="payload.workcenterCode">工位 {{ payload.workcenterCode }}</span>
          <span v-if="payload.groupCode">组别 {{ payload.groupCode }}</span>
          <span v-if="pointName">点位 {{ pointName }}</span>
        </div>

        <div class="raw-console">
          <div class="raw-console__title">
            <span>原始报文</span>
            <el-tag size="small" :type="overallPass ? 'success' : 'danger'" effect="dark">
              {{ overallPass ? '0 - 请求成功' : '采集完成' }}
            </el-tag>
          </div>
          <pre class="raw-console__body">{{ payload.rawText }}</pre>
        </div>
      </div>
    </div>

    <div v-else class="tcp-result-fallback">
      <div class="fallback-title">{{ pointName || '采集值' }}</div>
      <pre class="raw-console__body plain">{{ formatCollectValue(value) || '—' }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCollectValue, isPassStatus, parseSafetyTestPayload } from '@/views/iot/utils/parseTcpCollectValue';

const props = defineProps<{
  value: unknown;
  pointName?: string;
}>();

const payload = computed(() => parseSafetyTestPayload(props.value));
const overallPass = computed(() => isPassStatus(payload.value?.testStatus));
</script>

<style scoped lang="scss">
.tcp-result-panel {
  width: 100%;
}

.tcp-result-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.barcode-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.barcode-label {
  flex: none;
  width: 40px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.barcode-input {
  flex: 1;
}

.detail-with-status {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 12px;
  align-items: stretch;
}

.detail-table {
  width: 100%;
}

.detail-status {
  font-weight: 700;
  letter-spacing: 0.5px;

  &.is-pass {
    color: #16a34a;
  }

  &.is-ng {
    color: #dc2626;
  }
}

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border-radius: 8px;
  font-size: 42px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #fff;
  user-select: none;

  &.is-pass {
    background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  }

  &.is-ng {
    background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  }
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.raw-console {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #1f2937;
  background: #0b1220;
}

.raw-console__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #cbd5e1;
  background: #111827;
  border-bottom: 1px solid #1f2937;
}

.raw-console__body {
  margin: 0;
  padding: 12px;
  max-height: 240px;
  overflow: auto;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.55;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;

  &.plain {
    border-radius: 8px;
    border: 1px solid #1f2937;
    background: #0b1220;
    max-height: 360px;
  }
}

.fallback-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

@media (max-width: 900px) {
  .detail-with-status {
    grid-template-columns: 1fr;
  }

  .status-badge {
    min-height: 72px;
    font-size: 32px;
  }
}
</style>
