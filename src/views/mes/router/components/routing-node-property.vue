<script setup lang="ts">
import { Cell } from '@antv/x6';

interface NodeForm {
  sequence?: number;
  startStep?: boolean | string;
  endStep?: boolean | string;
  isReportingStep?: boolean | string;
  reportingStep?: string;
  reportingCenterRef?: string;
  stepType?: string;
  operation?: string;
  description?: string;
}

const props = defineProps({
  routingNode: {
    type: Cell,
    default: undefined
  }
});

const form = ref<NodeForm>({});
const stepTypeOptions = inject<Ref<any[]>>('stepTypeOptions', ref([]));

const normalizeBoolean = (value: unknown) => value === true || value === 'true';

const loadNode = () => {
  const routingNode = props.routingNode?.getData?.().routingNode;
  if (!routingNode) {
    form.value = {};
    return;
  }
  form.value = {
    sequence: routingNode.sequence || routingNode.number * 10,
    ...routingNode,
    startStep: normalizeBoolean(routingNode.startStep),
    endStep: normalizeBoolean(routingNode.endStep),
    isReportingStep: normalizeBoolean(routingNode.isReportingStep)
  };
};

watch(() => props.routingNode, loadNode, { immediate: true });

const handleSave = () => {
  if (!props.routingNode) {
    return;
  }
  const data = {
    ...props.routingNode.getData(),
    routingNode: form.value
  };
  props.routingNode.updateData(data);
};
</script>

<template>
  <div class="routing-node-property">
    <div class="routing-node-property__header">
      <span class="routing-node-title">{{ form.description || '工序属性' }}</span>
    </div>
    <div v-if="!routingNode" class="routing-node-property__empty">
      <el-empty description="请选择画布中的工序节点" :image-size="72" />
    </div>
    <el-form v-else :model="form" label-width="72px" size="default" class="routing-node-property__form">
      <el-form-item label="顺序" prop="sequence">
        <el-input-number v-model="form.sequence" :min="1" controls-position="right" class="w-full" @change="handleSave" />
      </el-form-item>
      <el-form-item label="开始工序" prop="startStep">
        <el-switch v-model="form.startStep" @change="handleSave" />
      </el-form-item>
      <el-form-item label="结束工序" prop="endStep">
        <el-switch v-model="form.endStep" @change="handleSave" />
      </el-form-item>
      <el-form-item label="报工工序" prop="isReportingStep">
        <el-switch v-model="form.isReportingStep" @change="handleSave" />
      </el-form-item>
      <el-form-item label="类型" prop="stepType">
        <el-select v-model="form.stepType" clearable class="w-full" @change="handleSave">
          <el-option v-for="item in stepTypeOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
        </el-select>
      </el-form-item>
      <el-form-item label="ERP工序" prop="reportingStep">
        <el-input v-model="form.reportingStep" @change="handleSave" />
      </el-form-item>
      <el-form-item label="ERP工作中心" prop="reportingCenterRef">
        <el-input v-model="form.reportingCenterRef" @change="handleSave" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.routing-node-property {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.routing-node-property__header {
  flex: 0 0 auto;
  padding: 10px 8px;
  border-bottom: 1px solid #e8e8e8;
}

.routing-node-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow-wrap: anywhere;
}

.routing-node-property__empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
}

.routing-node-property__form {
  flex: 1;
  min-height: 0;
  padding: 10px 8px 8px;
  overflow-y: auto;
}

.routing-node-property__form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.routing-node-property__form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.routing-node-property__form :deep(.el-input-number),
.routing-node-property__form :deep(.el-select),
.routing-node-property__form :deep(.el-input) {
  width: 100%;
}
</style>
