<template>
  <el-dialog v-model="visible" :title="title" width="90%" append-to-body>
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="客户代码" prop="customerCode">
            <HistoryInput v-model="queryParams.customerCode" :config="customerCodeConfig" placeholder="请输入客户代码" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="客户名称" prop="customerName">
            <el-input v-model="queryParams.customerName" placeholder="请输入客户名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>
      <el-table v-loading="loading" :data="customerList" border highlight-current-row @current-change="handleSelectionChange">
        <el-table-column width="55">
          <template #default="scope">
            <el-radio v-model="selectedRow.id" :label="scope.row?.id" class="radio-no-label">
              <span class="el-radio__label"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="客户代码" align="left" prop="customerCode" />
        <el-table-column label="客户名称" align="left" prop="customerName" show-overflow-tooltip />
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

<script setup name="Customer" lang="ts">
import { listCustomer } from '@/api/wms/customer';
import { CustomerVO, CustomerQuery, CustomerForm } from '@/api/wms/customer/types';
import useDialog from '@/hooks/useDialog';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const customerList = ref<CustomerVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CustomerForm = {
  id: undefined,
  customerCode: undefined,
  customerName: undefined,
  contactPerson: undefined,
  phone: undefined,
  address: undefined,
  remark: undefined
};
const data = reactive<PageData<CustomerForm, CustomerQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    customerCode: undefined,
    customerName: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);
const emit = defineEmits(['customerSelectCallBack']);
const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择客户'
});

/** 客户代码搜索历史缓存 */
const customerCodeConfig: HistoryConfig = {
  key: 'customerCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'customerDialog',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

/** 查询客户列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCustomer(queryParams.value);
  customerList.value = res.rows;
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
const selectedRow = ref<CustomerForm>(initFormData);
const handleSelectionChange = (selection: any) => {
  selectedRow.value = selection || {};
};

/** 提交按钮 */
const submitForm = () => {
  emit('customerSelectCallBack', selectedRow.value);
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
