<template>
  <el-dialog v-model="visible" :title="title" width="90%" append-to-body>
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="成本中心" prop="costCenter">
            <HistoryInput v-model="queryParams.costCenter" :config="costCenterCodeConfig" placeholder="请输入成本中心" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="成本中心名称" prop="costCenterName">
            <el-input v-model="queryParams.costCenterName" placeholder="请输入成本中心名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>
      <el-table v-loading="loading" :data="costCenterList" border highlight-current-row @current-change="handleSelectionChange">
        <el-table-column width="55">
          <template #default="scope">
            <el-radio v-model="selectedRow.id" :label="scope.row?.id" class="radio-no-label">
              <span class="el-radio__label"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="成本中心" align="left" prop="costCenter" />
        <el-table-column label="成本中心名称" align="left" prop="costCenterName" show-overflow-tooltip />
        <el-table-column label="备注" align="left" prop="remark" show-overflow-tooltip />
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="CostCenterDialog" lang="ts">
import { listCostCenter } from '@/api/wms/costCenter';
import { CostCenterVO, CostCenterQuery, CostCenterForm } from '@/api/wms/costCenter/types';
import useDialog from '@/hooks/useDialog';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';

const costCenterList = ref<CostCenterVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const initFormData: CostCenterForm = {
  id: undefined,
  costCenter: undefined,
  costCenterName: undefined,
  remark: undefined
};

const data = reactive<PageData<CostCenterForm, CostCenterQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    costCenter: undefined,
    costCenterName: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form } = toRefs(data);
const emit = defineEmits(['costCenterSelectCallBack']);
const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择成本中心'
});

/** 成本中心搜索历史缓存 */
const costCenterCodeConfig: HistoryConfig = {
  key: 'costCenter',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'costCenterDialog',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

/** 查询成本中心列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCostCenter(queryParams.value);
  costCenterList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  selectedRow.value = { ...initFormData };
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 单选选中数据 */
const selectedRow = ref<CostCenterForm>({ ...initFormData });
const handleSelectionChange = (selection: CostCenterVO | undefined) => {
  selectedRow.value = selection || { ...initFormData };
};

/** 提交按钮 */
const submitForm = () => {
  emit('costCenterSelectCallBack', selectedRow.value);
  closeDialog();
};

onMounted(() => {
  getList();
});

defineExpose({
  openDialog,
  closeDialog,
  handleQuery
});
</script>

<style lang="scss" scoped>
.radio-no-label {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -12px;
  .el-radio__label {
    display: none;
  }
}
</style>
