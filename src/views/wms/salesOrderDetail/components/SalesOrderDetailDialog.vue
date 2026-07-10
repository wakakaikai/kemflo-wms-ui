<template>
  <el-dialog v-model="visible" :title="title" width="72%" append-to-body @opened="handleDialogOpen">
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="mt-[18px]">
          <el-row>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="销售订单号" prop="salesOrderNo">
                <el-input v-model="queryParams.salesOrderNo" placeholder="请输入销售订单号" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="订单项次" prop="salesItemNo">
                <el-input v-model="queryParams.salesItemNo" placeholder="请输入销售订单项次" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="物料号" prop="materialCode">
                <el-input v-model="queryParams.materialCode" placeholder="请输入物料号" clearable @keyup.enter="handleQuery" />
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

      <el-table ref="tableRef" v-loading="loading" :data="salesOrderDetailList" style="width: 100%" border highlight-current-row @current-change="handleSelectionChange">
        <el-table-column width="55">
          <template #default="scope">
            <el-radio v-model="selectedRowId" :label="scope.row?.id" class="radio-no-label">
              <span class="el-radio__label"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="销售订单号" align="center" prop="salesOrderNo" min-width="120" show-overflow-tooltip />
        <el-table-column label="销售订单项次" align="center" prop="salesItemNo" min-width="110" />
        <el-table-column label="物料号" align="center" prop="materialCode" min-width="120" show-overflow-tooltip />
        <el-table-column label="物料描述" align="center" prop="materialDesc" min-width="160" show-overflow-tooltip />
        <el-table-column label="订单数量" align="center" prop="orderQuantity" min-width="100" />
        <el-table-column label="订单单位" align="center" prop="orderUnit" min-width="90" />
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

<script setup name="SalesOrderDetailDialog" lang="ts">
import useDialog from '@/hooks/useDialog';
import { listSalesOrderDetail } from '@/api/wms/salesOrderDetail';
import { SalesOrderDetailQuery, SalesOrderDetailVO } from '@/api/wms/salesOrderDetail/types';

const salesOrderDetailList = ref<SalesOrderDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const total = ref(0);
const tableRef = ref(null);
const selectedRow = ref<SalesOrderDetailVO | null>(null);
const selectedRowId = ref<string | number>('');

const queryFormRef = ref<ElFormInstance>();

const { title, visible, openDialog: openBaseDialog, closeDialog } = useDialog({
  title: '选择销售订单明细'
});

const emit = defineEmits(['salesOrderDetailSelectCallBack']);

const queryParams = ref<SalesOrderDetailQuery>({
  pageNum: 1,
  pageSize: 10,
  salesOrderNo: undefined,
  salesItemNo: undefined,
  materialCode: undefined,
  params: {}
});

const getList = async () => {
  loading.value = true;
  const res = await listSalesOrderDetail(queryParams.value);
  salesOrderDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const resetSelection = () => {
  selectedRow.value = null;
  selectedRowId.value = '';
};

const cancel = () => {
  closeDialog();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  resetSelection();
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.materialCode = undefined;
  handleQuery();
};

const handleSelectionChange = (row: SalesOrderDetailVO | null) => {
  selectedRow.value = row;
  selectedRowId.value = row?.id ?? '';
};

const submitForm = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请选择销售订单明细');
    return;
  }
  emit('salesOrderDetailSelectCallBack', selectedRow.value);
  closeDialog();
};

const handleDialogOpen = () => {
  resetSelection();
  getList();
};

interface OpenDialogOptions {
  salesOrderNo?: string;
  salesItemNo?: string;
  materialCode?: string;
}

const openDialog = (options?: OpenDialogOptions) => {
  queryParams.value.pageNum = 1;
  queryParams.value.salesOrderNo = options?.salesOrderNo;
  queryParams.value.salesItemNo = options?.salesItemNo;
  queryParams.value.materialCode = options?.materialCode;
  resetSelection();
  openBaseDialog();
};

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
