<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="mt-[18px]">
          <el-row>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="栈板编号" prop="palletCode">
                <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="栈板描述" prop="description">
                <el-input v-model="queryParams.description" placeholder="请输入栈板描述" clearable @keyup.enter="handleQuery" />
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

      <el-table ref="tableRef" v-loading="loading" :data="palletList" style="width: 100%" border highlight-current-row @current-change="handleSelectionChange">
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="栈板描述" align="center" prop="description" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_pallet_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column label="备注" align="center" prop="remark" />
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

<script setup name="PalletDialog" lang="ts">
import useDialog from '@/hooks/useDialog';
import { listPallet } from '@/api/wms/pallet';
import { PalletVO, PalletQuery, PalletForm } from '@/api/wms/pallet/types';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_pallet_status } = toRefs<any>(proxy?.useDict('wms_pallet_status'));

const palletList = ref<PalletVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const tableRef = ref(null);

const queryFormRef = ref<ElFormInstance>();
const palletFormRef = ref<ElFormInstance>();

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择栈板'
});

const emit = defineEmits(['palletSelectCallBack']);
const initFormData: PalletForm = {
  id: undefined,
  palletCode: undefined,
  description: undefined,
  status: 0,
  warehouseCode: undefined,
  remark: undefined
};
const data = reactive<PageData<PalletForm, PalletQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    palletCode: undefined,
    description: undefined,
    status: undefined,
    warehouseCode: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form } = toRefs(data);

/** 查询栈板信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPallet(queryParams.value);
  palletList.value = res.rows;
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
  palletFormRef.value?.resetFields();
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

/** 多选框选中数据 */
const selectedRow = ref(null);
const handleSelectionChange = (val: any) => {
  selectedRow.value = val;
};

/** 提交按钮 */
const submitForm = () => {
  emit('palletSelectCallBack', selectedRow.value);
  closeDialog();
};

onMounted(() => {
  getList();
});

defineExpose({
  openDialog,
  closeDialog
});
</script>
