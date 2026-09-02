<template>
  <main class="ro-film-page" v-loading="loading">
    <header class="screen-header">
      <h2>数据记录画面</h2>
      <span>{{ clockText }}</span>
    </header>

    <div class="table-shell">
      <table class="record-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>日期</th>
            <th>置入序</th>
            <th>产品型号</th>
            <th>料号</th>
            <th>开始值Kpa</th>
            <th>最终值Kpa</th>
            <th>压差值Kpa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRecords" :key="row.id">
            <td>{{ row.time || '--' }}</td>
            <td>{{ row.date || '--' }}</td>
            <td>{{ row.seq || '--' }}</td>
            <td>{{ row.productModel || '--' }}</td>
            <td>{{ row.partNo || '--' }}</td>
            <td class="num">{{ row.startKpa || '--' }}</td>
            <td class="num">{{ row.endKpa || '--' }}</td>
            <td class="num highlight">{{ row.diffKpa || '--' }}</td>
          </tr>
          <tr v-if="!tableRecords.length">
            <td colspan="8" class="empty-row">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { DeviceVO } from '@/api/iot/device/types';
import { useRoFilmDisplay } from '../composables/useRoFilmDisplay';

const props = defineProps<{
  deviceId: string;
  device: DeviceVO | null;
}>();

const deviceIdRef = toRef(props, 'deviceId');
const deviceRef = computed(() => props.device);

const { loading, clockText, tableRecords, refreshData } = useRoFilmDisplay(deviceIdRef, deviceRef);

defineExpose({
  refresh: refreshData
});
</script>

<style scoped lang="scss">
.ro-film-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
}

.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 0 4px;

  h2 {
    margin: 0;
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }

  span {
    color: #9db0c9;
    font-size: 18px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.table-shell {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid rgba(134, 157, 190, 0.22);
  border-radius: 12px;
  background: rgba(10, 20, 35, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 20px 56px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(16px);
}

.record-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: 14px 10px;
    border-bottom: 1px solid rgba(134, 157, 190, 0.14);
    text-align: center;
    font-size: 16px;
    line-height: 1.35;
    word-break: break-all;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
    background: linear-gradient(180deg, #dbeafe, #bfdbfe);
    box-shadow: 0 1px 0 rgba(134, 157, 190, 0.2);
  }

  tbody tr {
    transition: background-color 0.15s ease;
  }

  tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.025);
  }

  tbody tr:hover {
    background: rgba(50, 214, 255, 0.08);
  }

  tbody td {
    color: #e7edf7;
  }

  .num {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }

  .highlight {
    color: #7ee787;
  }

  .empty-row {
    padding: 72px 16px;
    color: #8da0ba;
    font-size: 16px;
  }
}

:deep(.el-loading-mask) {
  background-color: rgba(5, 9, 17, 0.58);
  backdrop-filter: blur(3px);
}

:deep(.el-loading-spinner .path) {
  stroke: #32d6ff;
}

@media (max-width: 960px) {
  .screen-header {
    flex-direction: column;
    align-items: flex-start;

    h2 {
      font-size: 22px;
    }

    span {
      font-size: 15px;
    }
  }

  .record-table {
    th,
    td {
      padding: 10px 6px;
      font-size: 13px;
    }
  }
}
</style>
