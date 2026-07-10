<template>
  <div class="scroll-table-container" :class="{ 'is-bigscreen': bigscreen }">
    <div class="table-header-fixed">
      <div class="header-row">
        <div v-for="column in columns" :key="column.key" class="header-cell" :class="column.className" :style="headerColumnStyle(column)" :title="column.label">
          <span class="header-text">{{ column.label }}</span>
        </div>
      </div>
    </div>

    <div class="scroll-wrapper">
      <div class="scroll-container">
        <div v-if="!rows.length" class="empty-tip">{{ emptyText }}</div>

        <Vue3SeamlessScroll v-if="showScroll && rows.length > 0" ref="seamlessScrollRef" :list="rows" :visibleCount="displayLimit" :step="stepVal" :hover="true" :wheel="true">
          <template v-slot="{ data }">
            <div class="seamless-item" :key="data.rowKey">
              <div class="item-row" :class="rowClass(data)">
                <div v-for="column in columns" :key="column.key" class="item-cell" :class="[column.className, column.key === 'lineStatus' ? 'status-cell' : '']" :style="cellColumnStyle(column)" :title="column.key === 'lineStatus' ? undefined : renderCell(column, data)">
                  <span v-if="column.key === 'lineStatus'" class="status-tag" :style="statusStyle(data)">
                    {{ renderCell(column, data) }}
                  </span>
                  <span v-else class="cell-content">{{ renderCell(column, data) }}</span>
                </div>
              </div>
            </div>
          </template>
        </Vue3SeamlessScroll>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch, type PropType } from 'vue';
import { Vue3SeamlessScroll } from 'vue3-seamless-scroll';
import { lineStatusBadgeColor } from '@/api/scada/shortageTask';
import type { ShortageTaskLineVO } from '@/api/scada/shortageTask';

export type BoardRow = ShortageTaskLineVO & { rowKey: string };
export type ScrollColumn = {
  key: string;
  label: string;
  className?: string;
  flex?: number;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  render?: (row: BoardRow | Record<string, unknown>) => string;
};

const props = defineProps({
  rows: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
  columns: { type: Array as PropType<ScrollColumn[]>, required: true },
  displayLimit: { type: Number, default: 15 },
  scrollSpeed: { type: Number, default: 1 },
  enableScroll: { type: Boolean, default: true },
  emptyText: { type: String, default: '暂无数据' },
  bigscreen: { type: Boolean, default: false },
  stockMode: { type: Boolean, default: false }
});

const showScroll = ref(true);
const stepVal = ref(props.scrollSpeed);
const seamlessScrollRef = ref<InstanceType<typeof Vue3SeamlessScroll>>();

function syncScrollState() {
  if (!seamlessScrollRef.value) {
    return;
  }
  if (props.enableScroll) {
    seamlessScrollRef.value.continue();
  } else {
    seamlessScrollRef.value.stop();
  }
}

function refreshScroll() {
  stepVal.value = props.scrollSpeed;
  showScroll.value = false;
  nextTick(() => {
    showScroll.value = true;
    nextTick(() => {
      syncScrollState();
    });
  });
}

watch(
  () => [props.rows.length, props.displayLimit, props.scrollSpeed, props.enableScroll],
  () => {
    refreshScroll();
  }
);

watch(
  () => props.scrollSpeed,
  (value) => {
    stepVal.value = value;
  },
  { immediate: true }
);

function alignToJustify(align: 'left' | 'center' | 'right') {
  if (align === 'left') return 'flex-start';
  if (align === 'right') return 'flex-end';
  return 'center';
}

function headerColumnStyle(column: ScrollColumn) {
  const align = column.headerAlign || 'center';
  return {
    flex: column.flex ?? 1,
    minWidth: column.minWidth,
    textAlign: align,
    justifyContent: alignToJustify(align)
  };
}

function cellColumnStyle(column: ScrollColumn) {
  const align = column.align || 'center';
  return {
    flex: column.flex ?? 1,
    minWidth: column.minWidth,
    textAlign: align,
    justifyContent: alignToJustify(align)
  };
}

function renderCell(column: ScrollColumn, row: Record<string, unknown>) {
  return column.render ? column.render(row) : '-';
}

function rowClass(row: Record<string, unknown>) {
  const status = String(row.lineStatus || '').toUpperCase();
  if (props.stockMode) return 'row-stock';
  if (status === 'PENDING') return 'row-pending';
  if (status === 'FOLLOWING') return 'row-following';
  return '';
}

function statusStyle(row: Record<string, unknown>) {
  const color = lineStatusBadgeColor(String(row.lineStatus || ''));
  return { color, borderColor: color };
}

defineExpose({
  refreshScroll,
  syncScrollState
});
</script>

<style scoped lang="scss">
.scroll-table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 10px 10px;
}

.table-header-fixed {
  flex-shrink: 0;
}

.header-row,
.item-row {
  display: flex;
  width: 100%;
}

.header-row {
  height: 44px;
  align-items: center;
  font-size: 15px;
  color: #49bcf7;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-cell,
.item-cell {
  display: flex;
  align-items: center;
  padding: 0 6px;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.header-text,
.cell-content {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.scroll-container {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.empty-tip {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(200, 220, 255, 0.38);
  font-size: 15px;
}

.seamless-item {
  height: 42px;
}

.item-row {
  align-items: center;
  height: 100%;
  min-height: 42px;
}

.item-cell {
  height: 100%;
  font-size: 14px;
  color: #f0f7ff;
}

.item-cell > * {
  max-width: 100%;
}

.qty-cell {
  color: #ffb4b4;
  font-weight: 600;
}

.stock-qty {
  color: #80e0c0;
  font-weight: 600;
}

.status-tag {
  display: inline-block;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 99px;
  border: 1px solid currentColor;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-bigscreen .table-header-fixed {
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 4px;
}

.is-bigscreen .header-row {
  color: #b8ecff;
}

.is-bigscreen .header-text {
  color: #b8ecff;
}

.is-bigscreen .cell-content {
  color: #f0f7ff;
  font-weight: 500;
}

.is-bigscreen .empty-tip {
  color: rgba(220, 235, 255, 0.72);
}

.is-bigscreen .seamless-item {
  height: 50px;
  padding-bottom: 8px;
  box-sizing: border-box;
}

.is-bigscreen .item-row {
  border: 1px solid rgba(25, 186, 139, 0.2);
  background: rgba(255, 255, 255, 0.03);
  padding: 0 2px;
  min-height: 42px;
  height: 42px;
}

.is-bigscreen .qty-cell {
  color: #ff9e9e;
}

.is-bigscreen .stock-qty {
  color: #8ef0c8;
}

.is-bigscreen .status-tag {
  font-weight: 600;
}

.is-bigscreen .row-pending {
  border-color: rgba(255, 107, 107, 0.26);
  background: rgba(255, 107, 107, 0.05);
}

.is-bigscreen .row-following {
  border-color: rgba(255, 212, 59, 0.26);
  background: rgba(255, 212, 59, 0.05);
}

.is-bigscreen .row-stock {
  border-color: rgba(116, 192, 252, 0.26);
  background: rgba(116, 192, 252, 0.05);
}
</style>
