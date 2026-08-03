<template>
  <el-dialog v-model="visible" :title="title" width="90%" append-to-body>
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="供应商代码" prop="supplierCode">
            <HistoryInput v-model="queryParams.supplierCode" :config="supplierCodeConfig" placeholder="请输入供应商代码" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="供应商名称" prop="supplierName">
            <el-input v-model="queryParams.supplierName" placeholder="请输入供应商名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>
      <el-table v-loading="loading" :data="supplierList" border highlight-current-row @current-change="handleSelectionChange">
        <el-table-column width="55">
          <template #default="scope">
            <el-radio v-model="selectedRow.id" :label="scope.row?.id" class="radio-no-label">
              <span class="el-radio__label"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="供应商代码" align="left" prop="supplierCode" />
        <el-table-column label="供应商名称" align="left" prop="supplierName" show-overflow-tooltip />
<!--        <el-table-column label="联系人" align="center" prop="contactPerson" />-->
<!--        <el-table-column label="电话" align="center" prop="phone" />-->
        <el-table-column label="地址" align="left" prop="address" show-overflow-tooltip />
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

<script setup name="Supplier" lang="ts">
import { listSupplier } from '@/api/wms/supplier';
import { SupplierVO, SupplierQuery, SupplierForm } from '@/api/wms/supplier/types';
import useDialog from '@/hooks/useDialog';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const supplierList = ref<SupplierVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: SupplierForm = {
  id: undefined,
  supplierCode: undefined,
  supplierName: undefined,
  contactPerson: undefined,
  phone: undefined,
  address: undefined,
  remark: undefined
};
const data = reactive<PageData<SupplierForm, SupplierQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    supplierCode: undefined,
    supplierName: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);
const emit = defineEmits(['supplierSelectCallBack']);
const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择供应商'
});

/** 供应商代码搜索历史缓存 */
const supplierCodeConfig: HistoryConfig = {
  key: 'supplierCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'supplierDialog',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

/** 查询供应商列表 */
const getList = async () => {
  loading.value = true;
  const res = await listSupplier(queryParams.value);
  supplierList.value = res.rows;
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
const selectedRow = ref<SupplierForm>(initFormData);
const handleSelectionChange = (selection: any) => {
  selectedRow.value = selection || {};
};

/** 提交按钮 */
const submitForm = () => {
  emit('supplierSelectCallBack', selectedRow.value);
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
