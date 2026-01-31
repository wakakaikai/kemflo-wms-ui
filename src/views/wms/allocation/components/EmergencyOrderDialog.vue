<!-- views/allocation/components/EmergencyOrderDialog.vue -->
<template>
  <el-dialog v-model="visible" title="紧急插单" width="800px" @close="handleClose">
    <div class="emergency-order-dialog">
      <!-- 紧急工单信息 -->
      <el-form ref="emergencyFormRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="紧急工单号" prop="workOrderNo">
          <el-input v-model="formData.workOrderNo" placeholder="请输入紧急工单号" @blur="loadWorkOrderInfo">
            <template #append>
              <el-button @click="showOrderSelection">
                <el-icon><Search /></el-icon>选择
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="产品信息" prop="itemDesc">
          <el-input v-model="formData.itemDesc" placeholder="自动加载" readonly />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划数量" prop="plannedQty">
              <el-input-number v-model="formData.plannedQty" :min="1" :step="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="formData.unit" placeholder="自动加载" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="紧急等级" prop="emergencyLevel">
          <el-radio-group v-model="formData.emergencyLevel">
            <el-radio :label="1">
              <el-tag type="info">一般紧急</el-tag>
            </el-radio>
            <el-radio :label="2">
              <el-tag type="warning">非常紧急</el-tag>
            </el-radio>
            <el-radio :label="3">
              <el-tag type="danger">特急</el-tag>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="紧急原因" prop="emergencyReason">
          <el-input v-model="formData.emergencyReason" type="textarea" :rows="3" placeholder="请输入紧急原因" maxlength="500" show-word-limit />
        </el-form-item>

        <el-form-item label="期望完成时间" prop="expectedFinishTime">
          <el-date-picker v-model="formData.expectedFinishTime" type="datetime" placeholder="选择期望完成时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>

        <!-- 策略选择 -->
        <el-form-item label="分配策略" prop="strategyType">
          <el-select v-model="formData.strategyType" placeholder="请选择分配策略" style="width: 100%">
            <el-option v-for="strategy in emergencyStrategies" :key="strategy.value" :label="strategy.label" :value="strategy.value" />
          </el-select>
        </el-form-item>

        <!-- 影响分析 -->
        <el-form-item label="影响分析">
          <div v-if="impactAnalysis" class="impact-analysis">
            <div class="impact-item">
              <span class="impact-label">影响工单数：</span>
              <span class="impact-value">{{ impactAnalysis.affectedOrders }}个</span>
            </div>
            <div class="impact-item">
              <span class="impact-label">预计延迟时间：</span>
              <span class="impact-value">{{ impactAnalysis.estimatedDelay }}小时</span>
            </div>
            <div class="impact-item">
              <span class="impact-label">影响等级：</span>
              <el-tag :type="getImpactLevelTag(impactAnalysis.impactLevel)">
                {{ impactAnalysis.impactLevel }}
              </el-tag>
            </div>
          </div>
          <div v-else class="no-impact">暂无影响分析数据</div>
        </el-form-item>

        <!-- 特殊要求 -->
        <el-form-item label="特殊要求">
          <el-checkbox-group v-model="formData.specialRequirements">
            <el-checkbox label="优先拣货">优先拣货</el-checkbox>
            <el-checkbox label="专车配送">专车配送</el-checkbox>
            <el-checkbox label="单独发料">单独发料</el-checkbox>
            <el-checkbox label="主管跟进">主管跟进</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 审批信息 -->
        <el-form-item label="审批人" prop="approver">
          <el-input v-model="formData.approver" placeholder="请输入审批人" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注信息" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="analyzeImpact" :loading="analyzing">
          <el-icon><Search /></el-icon>影响分析
        </el-button>
        <el-button type="success" @click="handleSubmit" :loading="submitting" :disabled="!impactAnalysis">
          <el-icon><Check /></el-icon>提交插单
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 工单选择对话框 -->
  <emergency-order-selection v-model="showOrderSelectDialog" @select="handleOrderSelect" />
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Search, Check } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import WorkOrderApi from '@/api/wms/allocation/index';
import AllocationApi from '@/api/wms/allocation/index';
// import EmergencyOrderSelection from './EmergencyOrderSelection.vue';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = ref(false);
const emergencyFormRef = ref<FormInstance>();
const showOrderSelectDialog = ref(false);
const analyzing = ref(false);
const submitting = ref(false);

// 紧急策略选项
const emergencyStrategies = [
  { value: 'EMERGENCY_PRIORITY', label: '优先级抢占' },
  { value: 'EMERGENCY_RESERVE', label: '预留库存' },
  { value: 'EMERGENCY_EXPEDITE', label: '加急处理' }
];

// 表单数据
const formData = reactive({
  workOrderNo: '',
  item: '',
  itemDesc: '',
  plannedQty: 1,
  unit: '',
  emergencyLevel: 2,
  emergencyReason: '',
  expectedFinishTime: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  strategyType: 'EMERGENCY_PRIORITY',
  specialRequirements: ['优先拣货'],
  approver: '',
  remark: ''
});

// 表单验证规则
const formRules: FormRules = {
  workOrderNo: [{ required: true, message: '请输入工单号', trigger: 'blur' }],
  emergencyLevel: [{ required: true, message: '请选择紧急等级', trigger: 'change' }],
  emergencyReason: [
    { required: true, message: '请输入紧急原因', trigger: 'blur' },
    { min: 5, message: '紧急原因至少5个字符', trigger: 'blur' }
  ],
  expectedFinishTime: [{ required: true, message: '请选择期望完成时间', trigger: 'change' }],
  strategyType: [{ required: true, message: '请选择分配策略', trigger: 'change' }],
  approver: [{ required: true, message: '请输入审批人', trigger: 'blur' }]
};

// 影响分析数据
const impactAnalysis = ref<any>(null);

// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      // 重置表单
      if (emergencyFormRef.value) {
        emergencyFormRef.value.resetFields();
      }
      Object.assign(formData, {
        workOrderNo: '',
        item: '',
        itemDesc: '',
        plannedQty: 1,
        unit: '',
        emergencyLevel: 2,
        emergencyReason: '',
        expectedFinishTime: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        strategyType: 'EMERGENCY_PRIORITY',
        specialRequirements: ['优先拣货'],
        approver: '',
        remark: ''
      });
      impactAnalysis.value = null;
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 显示工单选择对话框
const showOrderSelection = () => {
  showOrderSelectDialog.value = true;
};

// 处理工单选择
const handleOrderSelect = (workOrder: any) => {
  formData.workOrderNo = workOrder.workOrderNo;
  formData.item = workOrder.item;
  formData.itemDesc = workOrder.itemDesc;
  formData.plannedQty = workOrder.plannedQty;
  formData.unit = workOrder.unit;
  showOrderSelectDialog.value = false;
};

// 加载工单信息
const loadWorkOrderInfo = async () => {
  if (!formData.workOrderNo) return;

  try {
    const response = await WorkOrderApi.getWorkOrderByNo(formData.workOrderNo);
    if (response.code === 200 && response.data) {
      const order = response.data;
      formData.item = order.item;
      formData.itemDesc = order.itemDesc;
      formData.plannedQty = order.plannedQty;
      formData.unit = order.unit;
    } else {
      ElMessage.warning('未找到该工单信息');
    }
  } catch (error) {
    ElMessage.error('加载工单信息失败');
    console.error(error);
  }
};

// 获取影响等级标签类型
const getImpactLevelTag = (level: string) => {
  const typeMap: Record<string, string> = {
    '低': 'success',
    '中': 'warning',
    '高': 'danger'
  };
  return typeMap[level] || 'info';
};

// 影响分析
const analyzeImpact = async () => {
  if (!formData.workOrderNo) {
    ElMessage.warning('请先输入工单号');
    return;
  }

  try {
    analyzing.value = true;
    const response = await AllocationApi.analyzeEmergencyImpact({
      workOrderNo: formData.workOrderNo,
      emergencyLevel: formData.emergencyLevel
    });

    if (response.code === 200) {
      impactAnalysis.value = response.data;
      ElMessage.success('影响分析完成');
    }
  } catch (error) {
    ElMessage.error('影响分析失败');
    console.error(error);
  } finally {
    analyzing.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!emergencyFormRef.value) return;

  try {
    await emergencyFormRef.value.validate();

    if (!impactAnalysis.value) {
      ElMessage.warning('请先进行影响分析');
      return;
    }

    submitting.value = true;

    // 构建紧急插单请求
    const emergencyRequest = {
      workOrderNo: formData.workOrderNo,
      emergencyLevel: formData.emergencyLevel,
      emergencyReason: formData.emergencyReason,
      strategyType: formData.strategyType,
      specialRequirements: formData.specialRequirements,
      approver: formData.approver,
      remark: formData.remark,
      impactAnalysis: impactAnalysis.value
    };

    // 提交紧急插单
    const response = await AllocationApi.handleEmergency(emergencyRequest);

    if (response.code === 200) {
      ElMessage.success('紧急插单提交成功');
      emit('confirm', response.data);
      handleClose();
    }
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.emergency-order-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.impact-analysis {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.impact-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.impact-item:last-child {
  margin-bottom: 0;
}

.impact-label {
  font-weight: bold;
  min-width: 100px;
  color: #606266;
}

.impact-value {
  color: #303133;
  font-weight: bold;
}

.no-impact {
  color: #909399;
  font-style: italic;
  padding: 12px;
  text-align: center;
  background: #f5f7fa;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
