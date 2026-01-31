<!-- views/allocation/components/ExecuteConfirmDialog.vue -->
<template>
  <el-dialog v-model="visible" title="执行分配方案" width="600px" @close="handleClose">
    <div class="execute-confirm-dialog">
      <!-- 方案信息 -->
      <div class="plan-info">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="方案名称">
            <span class="plan-name">{{ plan?.planName }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="策略类型">
            <el-tag :type="getStrategyTagType(plan?.strategyType || '')">
              {{ plan?.strategyTypeDesc }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工单数量"> {{ plan?.workOrderCount }}个 </el-descriptions-item>
          <el-descriptions-item label="拣货点数"> {{ plan?.pickLocationCount }}个 </el-descriptions-item>
          <el-descriptions-item label="总行走距离"> {{ plan?.totalDistance?.toFixed(1) }}米 </el-descriptions-item>
          <el-descriptions-item label="平均齐套率"> {{ (plan?.avgKitRate || 0 * 100).toFixed(1) }}% </el-descriptions-item>
          <el-descriptions-item label="综合评分" :span="2">
            <span class="total-score">{{ plan?.totalScore?.toFixed(1) }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 执行信息 -->
      <div class="execution-info">
        <el-form ref="executeFormRef" :model="executeForm" :rules="executeRules" label-width="100px">
          <el-form-item label="执行人" prop="operator">
            <el-input v-model="executeForm.operator" placeholder="请输入执行人姓名" clearable />
          </el-form-item>

          <el-form-item label="执行时间" prop="executeTime">
            <el-date-picker v-model="executeForm.executeTime" type="datetime" placeholder="选择执行时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" :disabled-date="disabledDate" />
          </el-form-item>

          <el-form-item label="拣货员" prop="picker">
            <el-select v-model="executeForm.picker" placeholder="请选择拣货员" filterable style="width: 100%">
              <el-option v-for="picker in pickerList" :key="picker.id" :label="picker.name" :value="picker.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="集料区" prop="stagingArea">
            <el-select v-model="executeForm.stagingArea" placeholder="请选择集料区" style="width: 100%">
              <el-option v-for="area in stagingAreas" :key="area.code" :label="area.name" :value="area.code" />
            </el-select>
          </el-form-item>

          <el-form-item label="执行模式" prop="executeMode">
            <el-radio-group v-model="executeForm.executeMode">
              <el-radio label="AUTO">自动执行</el-radio>
              <el-radio label="MANUAL">手动执行</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="executeForm.executeMode === 'MANUAL'" label="分拣方式" prop="sortingMethod">
            <el-select v-model="executeForm.sortingMethod" placeholder="请选择分拣方式" style="width: 100%">
              <el-option label="按工单分拣" value="BY_ORDER" />
              <el-option label="按物料分拣" value="BY_MATERIAL" />
              <el-option label="按库区分拣" value="BY_AREA" />
            </el-select>
          </el-form-item>

          <el-form-item label="确认选项">
            <el-checkbox-group v-model="executeForm.confirmOptions">
              <el-checkbox label="CHECK_INVENTORY">确认库存锁定</el-checkbox>
              <el-checkbox label="GENERATE_PICK_TASK">生成拣货任务</el-checkbox>
              <el-checkbox label="NOTIFY_PICKER">通知拣货员</el-checkbox>
              <el-checkbox label="LOCK_ORDER_STATUS">锁定工单状态</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="执行备注" prop="remark">
            <el-input v-model="executeForm.remark" type="textarea" :rows="3" placeholder="请输入执行备注" maxlength="200" show-word-limit />
          </el-form-item>
        </el-form>
      </div>

      <!-- 执行前检查 -->
      <div class="pre-check">
        <el-alert v-if="preCheckResult" :title="preCheckResult.passed ? '检查通过' : '检查失败'" :type="preCheckResult.passed ? 'success' : 'error'" show-icon :closable="false">
          <div v-if="preCheckResult.messages">
            <div v-for="(msg, index) in preCheckResult.messages" :key="index">
              {{ msg }}
            </div>
          </div>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="warning" @click="performPreCheck" :loading="checking">
          <el-icon><Search /></el-icon>执行前检查
        </el-button>
        <el-button type="primary" @click="handleExecute" :loading="executing" :disabled="!preCheckResult || !preCheckResult.passed">
          <el-icon><Check /></el-icon>确认执行
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Search, Check } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { AllocationPlanVO } from '@/api/wms/allocation/types';
import AllocationApi from '@/api/wms/allocation/index';

interface Props {
  modelValue: boolean;
  plan: AllocationPlanVO | null;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = ref(false);
const executeFormRef = ref<FormInstance>();
const checking = ref(false);
const executing = ref(false);

// 拣货员列表
const pickerList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' }
]);

// 集料区列表
const stagingAreas = ref([
  { code: 'STAGING_01', name: '主集料区' },
  { code: 'STAGING_02', name: '辅集料区' },
  { code: 'STAGING_03', name: '紧急集料区' }
]);

// 执行表单
const executeForm = reactive({
  operator: '',
  executeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  picker: 1,
  stagingArea: 'STAGING_01',
  executeMode: 'AUTO',
  sortingMethod: 'BY_ORDER',
  confirmOptions: ['CHECK_INVENTORY', 'GENERATE_PICK_TASK', 'NOTIFY_PICKER'],
  remark: ''
});

// 表单验证规则
const executeRules: FormRules = {
  operator: [{ required: true, message: '请输入执行人姓名', trigger: 'blur' }],
  executeTime: [{ required: true, message: '请选择执行时间', trigger: 'change' }],
  picker: [{ required: true, message: '请选择拣货员', trigger: 'change' }],
  stagingArea: [{ required: true, message: '请选择集料区', trigger: 'change' }],
  sortingMethod: [{ required: true, message: '请选择分拣方式', trigger: 'change' }]
};

// 执行前检查结果
const preCheckResult = ref<any>(null);

// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      // 重置表单
      if (executeFormRef.value) {
        executeFormRef.value.resetFields();
      }
      Object.assign(executeForm, {
        operator: '',
        executeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        picker: 1,
        stagingArea: 'STAGING_01',
        executeMode: 'AUTO',
        sortingMethod: 'BY_ORDER',
        confirmOptions: ['CHECK_INVENTORY', 'GENERATE_PICK_TASK', 'NOTIFY_PICKER'],
        remark: ''
      });
      preCheckResult.value = null;
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 获取策略标签类型
const getStrategyTagType = (strategy: string) => {
  const typeMap: Record<string, string> = {
    'FIFO_STRICT': 'warning',
    'HIGH_KIT': 'success',
    'EFFICIENCY': 'info',
    'BALANCED': 'primary',
    'EMERGENCY': 'danger'
  };
  return typeMap[strategy] || 'info';
};

// 禁用日期（不能选择过去的时间）
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000;
};

// 执行前检查
const performPreCheck = async () => {
  if (!props.plan) {
    ElMessage.warning('请选择分配方案');
    return;
  }

  try {
    checking.value = true;

    const checkParams = {
      planId: props.plan.id,
      executeTime: executeForm.executeTime,
      pickerId: executeForm.picker,
      stagingArea: executeForm.stagingArea
    };

    const response = await AllocationApi.preCheckExecution(checkParams);

    if (response.code === 200) {
      preCheckResult.value = response.data;
      if (preCheckResult.value.passed) {
        ElMessage.success('执行前检查通过');
      } else {
        ElMessage.warning('执行前检查未通过，请查看详情');
      }
    }
  } catch (error) {
    ElMessage.error('执行前检查失败');
    console.error(error);
  } finally {
    checking.value = false;
  }
};

// 执行方案
const handleExecute = async () => {
  if (!executeFormRef.value || !props.plan) return;

  try {
    await executeFormRef.value.validate();

    if (!preCheckResult.value || !preCheckResult.value.passed) {
      ElMessage.warning('请先进行执行前检查并确保检查通过');
      return;
    }

    executing.value = true;

    // 构建执行请求
    const executeRequest = {
      planId: props.plan.id,
      operator: executeForm.operator,
      executeTime: executeForm.executeTime,
      pickerId: executeForm.picker,
      stagingArea: executeForm.stagingArea,
      executeMode: executeForm.executeMode,
      sortingMethod: executeForm.sortingMethod,
      confirmOptions: executeForm.confirmOptions,
      remark: executeForm.remark
    };

    // 执行分配方案
    const response = await AllocationApi.executeAllocation(props.plan.id, executeForm.operator);

    if (response.code === 200) {
      ElMessage.success('分配方案执行成功');
      emit('confirm', executeRequest);
      handleClose();
    }
  } catch (error) {
    console.error('执行失败:', error);
  } finally {
    executing.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.execute-confirm-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plan-info {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.plan-name {
  font-weight: bold;
  color: #303133;
  font-size: 16px;
}

.total-score {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.execution-info {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.pre-check {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
  background: #fafafa;
}

:deep(.el-descriptions__content) {
  background: white;
}
</style>
