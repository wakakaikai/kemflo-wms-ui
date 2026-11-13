<template>
  <el-dialog
    v-model="dialogVisible"
    title="SN一致性校验配置"
    width="760px"
    append-to-body
    destroy-on-close
    class="barcode-rule-dialog"
    @opened="onDialogOpened"
    @closed="destroyBarcodeRuleDrag"
  >
    <div class="barcode-rule-dialog-body">
      <el-alert
        title="各标签扫码值必须与当前产品条码完全一致；扫描顺序按序号从小到大执行，可拖拽左侧手柄调整顺序。"
        type="info"
        :closable="false"
      />
      <el-table
        id="barcodeRuleTable"
        :data="barcodeRuleList"
        border
        class="barcode-rule-table barcode-rule-row-sortable"
        row-key="dragKey"
      >
        <el-table-column width="44" align="center" class-name="barcode-drag-column">
          <template #default>
            <span class="barcode-row-drag-handle" title="拖拽排序" aria-label="拖拽排序">⠿</span>
          </template>
        </el-table-column>
        <el-table-column label="顺序" min-width="108" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.sequence"
              :min="10"
              :step="10"
              controls-position="right"
              class="barcode-rule-seq-input"
            />
          </template>
        </el-table-column>
        <el-table-column label="标签类型" min-width="200">
          <template #default="scope">
            <el-select
              v-model="scope.row.checkType"
              placeholder="请选择标签类型"
              clearable
              class="barcode-rule-select"
              @change="handleRuleTypeChange(scope.row)"
            >
              <el-option
                v-for="option in barcodeCheckTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="必扫" width="88" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.requiredFlag" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="启用" width="88" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.enabledFlag" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" align="center">
          <template #default="scope">
            <el-button link type="danger" icon="Delete" @click="removeBarcodeRule(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>
      <div class="table-add-strip table-add-strip--dialog">
        <el-tooltip content="新增校验项" placement="top">
          <el-button class="table-add-icon-btn" type="primary" circle icon="Plus" @click="addBarcodeRule" />
        </el-tooltip>
      </div>
    </div>
    <template #footer>
      <div class="barcode-rule-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBarcodeRules">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { BarcodeCheckRule, ItemBomComponentVO } from '@/api/mes/itemBomComponent/types';
import Sortable from 'sortablejs';
import { computed, nextTick, ref, watch } from 'vue';

type BarcodeCheckTypeOption = { value: string; label: string };
type BarcodeCheckRuleRow = BarcodeCheckRule & { dragKey: string };

const props = defineProps<{
  visible: boolean;
  row?: ItemBomComponentVO;
  barcodeCheckTypeOptions: BarcodeCheckTypeOption[];
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const barcodeRuleList = ref<BarcodeCheckRuleRow[]>([]);
let barcodeRuleSortable: Sortable | null = null;

const createBarcodeRuleDragKey = () => `br-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const syncBarcodeRuleSequence = () => {
  barcodeRuleList.value.forEach((rule, index) => {
    rule.sequence = (index + 1) * 10;
  });
};

const destroyBarcodeRuleDrag = () => {
  barcodeRuleSortable?.destroy();
  barcodeRuleSortable = null;
};

const initBarcodeRuleDrag = () => {
  destroyBarcodeRuleDrag();
  const tbody = document.querySelector('#barcodeRuleTable .el-table__body-wrapper tbody');
  if (!tbody) {
    return;
  }
  barcodeRuleSortable = Sortable.create(tbody as HTMLElement, {
    animation: 150,
    handle: '.barcode-row-drag-handle',
    ghostClass: 'sortable-ghost',
    chosenClass: 'drop-chosenClass',
    dragClass: 'drop-dragClass',
    onEnd(evt) {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        return;
      }
      const list = [...barcodeRuleList.value];
      const [moved] = list.splice(oldIndex, 1);
      list.splice(newIndex, 0, moved);
      barcodeRuleList.value = list;
      syncBarcodeRuleSequence();
    }
  });
};

const onDialogOpened = () => {
  void nextTick(() => initBarcodeRuleDrag());
};

const loadRulesFromRow = () => {
  const rules = (props.row?.barcodeCheckRuleList || []).slice().sort((a, b) => a.sequence - b.sequence);
  const legacySequence = rules.some((rule) => rule.sequence < 10 || rule.sequence % 10 !== 0);
  barcodeRuleList.value = rules.map((rule, index) => {
    const option = props.barcodeCheckTypeOptions?.find((item) => item.value === rule.checkType);
    return {
      ...rule,
      checkName: option?.label || rule.checkName,
      sequence: legacySequence ? (index + 1) * 10 : rule.sequence,
      dragKey: createBarcodeRuleDragKey()
    };
  });
};

const removeBarcodeRule = (index: number) => {
  barcodeRuleList.value.splice(index, 1);
  syncBarcodeRuleSequence();
  void nextTick(() => initBarcodeRuleDrag());
};

const addBarcodeRule = () => {
  const nextSequence = barcodeRuleList.value.length
    ? Math.max(...barcodeRuleList.value.map((rule) => Number(rule.sequence) || 0)) + 10
    : 10;
  const firstOption = props.barcodeCheckTypeOptions?.[0];
  barcodeRuleList.value.push({
    checkType: firstOption?.value || '',
    checkName: firstOption?.label || '',
    sequence: nextSequence,
    requiredFlag: 1,
    enabledFlag: 1,
    dragKey: createBarcodeRuleDragKey()
  });
  void nextTick(() => initBarcodeRuleDrag());
};

const handleRuleTypeChange = (rule: BarcodeCheckRule) => {
  const option = props.barcodeCheckTypeOptions?.find((item) => item.value === rule.checkType);
  rule.checkName = option?.label || '';
};

const confirmBarcodeRules = () => {
  if (!barcodeRuleList.value.length) {
    proxy?.$modal.msgError('请至少配置一个SN校验项');
    return;
  }
  if (barcodeRuleList.value.some((rule) => !rule.checkType || !rule.checkName || !rule.sequence)) {
    proxy?.$modal.msgError('标签类型、标签名称和顺序不能为空');
    return;
  }
  if (barcodeRuleList.value.some((rule) => rule.sequence < 10 || rule.sequence % 10 !== 0)) {
    proxy?.$modal.msgError('顺序必须按10递增，例如10、20、30');
    return;
  }
  const duplicate = new Set(barcodeRuleList.value.map((rule) => `${rule.checkType}#${rule.sequence}`));
  if (duplicate.size !== barcodeRuleList.value.length) {
    proxy?.$modal.msgError('标签类型和顺序不能重复');
    return;
  }
  if (props.row) {
    props.row.barcodeCheckRuleList = barcodeRuleList.value
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map(({ dragKey: _dragKey, ...rule }) => rule);
  }
  dialogVisible.value = false;
};

watch(
  () => props.visible,
  (visible) => {
    if (visible && props.row) {
      loadRulesFromRow();
    }
  }
);
</script>

<style scoped lang="scss">
.barcode-rule-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.barcode-rule-table {
  width: 100%;
}

.barcode-rule-seq-input {
  width: 100%;
}

.barcode-rule-select {
  width: 100%;
}

.barcode-rule-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  gap: 8px;
}

.barcode-row-drag-handle {
  cursor: grab;
  font-size: 18px;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.barcode-row-drag-handle:active {
  cursor: grabbing;
}

.barcode-rule-table :deep(.barcode-drag-column .cell) {
  padding-left: 4px;
  padding-right: 4px;
}

.table-add-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0 6px;
  margin-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
  background: linear-gradient(180deg, transparent, rgba(64, 158, 255, 0.04));
  border-radius: 0 0 6px 6px;
  padding-bottom: 2px;
}

.table-add-icon-btn {
  width: 38px;
  height: 38px;
  font-size: 18px;
  border: none;
  box-shadow: 0 2px 10px rgba(64, 158, 255, 0.35);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.table-add-icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.45);
}

.table-add-icon-btn:active {
  transform: translateY(0);
}

.barcode-rule-row-sortable :deep(.el-table__body tbody tr.sortable-chosen) .barcode-row-drag-handle,
.barcode-rule-row-sortable :deep(.el-table__body tbody tr.sortable-ghost) .barcode-row-drag-handle {
  cursor: grabbing;
}

:deep(.barcode-rule-dialog .el-dialog__footer) {
  padding-top: 12px;
}
</style>
