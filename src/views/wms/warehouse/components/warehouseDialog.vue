<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body @opened="handleDialogOpen">
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="mt-[18px]">
          <el-row>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="仓库编码" prop="warehouseCode">
                <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="仓库名称" prop="warehouseName">
                <el-input v-model="queryParams.warehouseName" placeholder="请输入仓库名称" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>

      <el-table ref="tableRef" v-loading="loading" :data="warehouseList" style="width: 100%" border highlight-current-row @current-change="handleSelectionChange">
        <!-- 单选列（通过高亮行实现） -->
        <el-table-column width="55">
          <template #default="scope">
            <el-radio v-model="selectedRow.id" :label="scope.row?.id" class="radio-no-label">
              <span class="el-radio__label"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column label="仓库名称" align="center" prop="warehouseName" />
        <el-table-column label="是否启用" align="center" prop="enableFlag">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.enableFlag" />
          </template>
        </el-table-column>
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

<script setup name="WarehouseDialog" lang="ts">
import useDialog from '@/hooks/useDialog';
import { pageWarehouse } from '@/api/wms/warehouse';
import { WarehouseQuery, WarehouseForm, WarehouseVO } from '@/api/wms/warehouse/types';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_yes_no } = toRefs<any>(proxy?.useDict('sys_yes_no'));

const warehouseList = ref<WarehouseVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const tableRef = ref(null);

const queryFormRef = ref<ElFormInstance>();

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择库区'
});

const emit = defineEmits(['warehouseSelectCallBack']);
const initFormData: WarehouseForm = {
  id: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  enableFlag: undefined,
  enableFlagBoolean: true,
  remark: undefined
};
const data = reactive<PageData<WarehouseForm, WarehouseQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    warehouseCode: undefined,
    warehouseName: undefined,
    enableFlag: undefined,
    enableFlagBoolean: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
    warehouseName: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }]
  }
});
const { queryParams, form } = toRefs(data);

/** 查询库区信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await pageWarehouse(queryParams.value);
  warehouseList.value = res.rows;
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
  queryFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  selectedRow.value = initFormData;
  selectedRow.value.id = '';
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const selectedRow = ref<StorageAreaForm>(initFormData);
const handleSelectionChange = (val: any) => {
  selectedRow.value = val || {};
};

/** 提交按钮 */
const submitForm = () => {
  emit('warehouseSelectCallBack', selectedRow.value);
  closeDialog();
};

const handleDialogOpen = () => {
  reset();
  getList();
};

onMounted(() => {});

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
