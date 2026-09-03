<script setup lang="ts">
import { Cell } from '@antv/x6';
import { getDicts } from '@/api/system/dict/data';

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
    default: () => {}
  }
});

const form = ref<NodeForm>({});
const stepTypeOptions = ref<any[]>([]);

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

watch(() => props.routingNode, loadNode);

onMounted(async () => {
  loadNode();
  const res = await getDicts('ROUTER_OPERATION_TYPE');
  stepTypeOptions.value = res.data || [];
});

const handleSave = () => {
  const data = {
    ...props.routingNode.getData(),
    routingNode: form.value
  };
  props.routingNode.updateData(data);
};
</script>

<template>
  <div class="routing-node-property">
    <div class="routing-node-title">{{ form.description }}</div>
    <el-form :model="form" label-width="96px" size="small">
      <el-form-item label="顺序" prop="sequence">
        <el-input-number v-model="form.sequence" :min="1" controls-position="right" @change="handleSave" />
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
        <el-select v-model="form.stepType" clearable @change="handleSave">
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
  width: 100%;
  height: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  overflow-y: auto;
  box-sizing: border-box;
}

.routing-node-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow-wrap: anywhere;
}
</style>
