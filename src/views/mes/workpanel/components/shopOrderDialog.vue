<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="工单" prop="shopOrder">
          <el-input v-model="queryParams.shopOrder" placeholder="请输入工单" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="计划物料" prop="plannedItem">
          <el-input v-model="queryParams.plannedItem" placeholder="请输入计划物料" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :loading="loading" :data="shopOrderList" style="width: 100%" border highlight-current-row @row-click="handleRowClick">
        <!-- 单选列（通过高亮行实现） -->
        <el-table-column width="55">
          <template #default="checkedDataScope">
            <el-radio v-model="selectedRowData.id" :label="checkedDataScope.row.id" class="ml-[10px]">
              <span class="el-radio__label" style="margin-right: 0"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="工单" align="center" prop="shopOrder" width="140" />
        <el-table-column label="计划物料" align="center" prop="plannedItem" width="180" />
        <el-table-column label="产品描述" align="center" prop="itemDesc" />
        <!--        <el-table-column label="工单类型" align="center" prop="shopOrderTypeDesc" />-->
        <!--        <el-table-column label="计划工作中心" align="center" prop="plannedWorkCenter" width="120" />-->
        <el-table-column label="计划开始时间" align="center" prop="plannedStartDate" width="120">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedStartDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划完成时间" align="center" prop="plannedCompDate" width="120">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedCompDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划生产数量" align="center" prop="qtyToBuild" />
        <el-table-column label="完成数量" align="center" prop="qtyDone" />
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  listShopOrder,
  getShopOrder,
  delShopOrder,
  addShopOrder,
  updateShopOrder,
  releaseShopOrderSfc
} from '@/api/mes/shopOrder';
import { ShopOrderVO, ShopOrderQuery, ShopOrderForm, SfcPreviewVO } from '@/api/mes/shopOrder/types';
import useDialog from '@/hooks/useDialog';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shopOrderList = ref<ShopOrderVO[]>([]);
const loading = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const operationFormRef = ref<ElFormInstance>();

const initFormData: ShopOrderForm = {
  id: undefined,
  handle: undefined,
  shopOrder: undefined,
  status: undefined,
  shopOrderType: undefined,
  priority: undefined,
  plannedWorkCenterBo: undefined,
  plannedItemBo: undefined,
  plannedBomBo: undefined,
  plannedRouterBo: undefined,
  itemBo: undefined,
  bomBo: undefined,
  routerBo: undefined,
  qtyToBuild: undefined,
  qtyReleased: undefined,
  plannedStartDate: undefined,
  plannedCompDate: undefined,
  releasedDate: undefined,
  qtyDone: undefined,
  qtyScrapped: undefined,
  actualStartDate: undefined,
  actualCompDate: undefined,
  customer: undefined,
  customerOrder: undefined,
  overDeliveryTolerance: undefined,
  considerScrap: undefined,
  remark: undefined,
  dataModifyTime: undefined,
  dataModifyUser: undefined
};
const data = reactive<PageData<ShopOrderForm, ShopOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    shopOrder: undefined,
    status: undefined,
    shopOrderType: undefined,
    priority: undefined,
    plannedWorkCenterBo: undefined,
    plannedItemBo: undefined,
    plannedBomBo: undefined,
    plannedRouterBo: undefined,
    itemBo: undefined,
    bomBo: undefined,
    routerBo: undefined,
    qtyToBuild: undefined,
    qtyReleased: undefined,
    plannedStartDate: undefined,
    plannedCompDate: undefined,
    releasedDate: undefined,
    qtyDone: undefined,
    qtyScrapped: undefined,
    actualStartDate: undefined,
    actualCompDate: undefined,
    customer: undefined,
    customerOrder: undefined,
    overDeliveryTolerance: undefined,
    considerScrap: undefined,
    createUserId: undefined,
    creator: undefined,
    modifyUserId: undefined,
    updater: undefined,
    modifyTime: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择工单号'
});
const initShopOrderDialog = async (podConfig: any) => {
  queryParams.value.resource = podConfig.resource;
  handleQuery();
};
/** 查询工序列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShopOrder(queryParams.value);
  shopOrderList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 选中数据 */
const selectedRowData = ref({ id: '' });
const handleRowClick = (val: any) => {
  selectedRowData.value = val;
  form.value = selectedRowData.value;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  operationFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  selectedRowData.value.id = '';
  handleQuery();
};

/** 提交表单 */
const submitForm = () => {
  queryFormRef.value.validate((valid) => {
    if (valid) {
      proxy.$emit('shopOrderCallBack', selectedRowData.value);
      closeDialog();
    }
  });
};

onMounted(async () => {

});

defineExpose({
  openDialog,
  closeDialog,
  initShopOrderDialog
});
</script>

<style scoped>
.radio-no-label :deep(.el-radio__label) {
  display: none;
}
</style>
