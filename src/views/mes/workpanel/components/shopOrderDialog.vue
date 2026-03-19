<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="1200px" append-to-body @opened="handleOpenDialog">
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

      <el-table v-loading="loading" :data="shopOrderList" style="width: 100%" height="350" border stripe fixed-header fit highlight-current-row @row-click="handleRowClick">
        <!-- 单选列（通过高亮行实现） -->
        <el-table-column width="55">
          <template #default="checkedDataScope">
            <el-radio v-model="selectedRowData.id" :label="checkedDataScope.row.id" class="ml-[10px]">
              <span class="el-radio__label" style="margin-right: 0"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="工单" align="center" prop="shopOrder" />
        <el-table-column label="计划物料" align="center" prop="plannedItem" />
        <el-table-column label="产品描述" align="center" prop="itemDesc" show-overflow-tooltip />
        <!--        <el-table-column label="工单类型" align="center" prop="shopOrderTypeDesc" />-->
        <el-table-column label="计划工作中心" align="center" prop="plannedWorkCenter" width="120" />
        <el-table-column label="计划开始时间" align="center" prop="plannedStartDate" />
        <el-table-column label="计划完成时间" align="center" prop="plannedCompDate" />
        <el-table-column label="计划数量" align="center" prop="qtyToBuild" />
        <el-table-column label="已下达数量" align="center" prop="qtyReleased" />
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
import { listShopOrder } from '@/api/mes/shopOrder';
import { ShopOrderVO, ShopOrderQuery, ShopOrderForm, SfcPreviewVO } from '@/api/mes/shopOrder/types';
import useDialog from '@/hooks/useDialog';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shopOrderList = ref<ShopOrderVO[]>([]);
const loading = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const operationFormRef = ref<ElFormInstance>();
const props = defineProps<{
  podConfig: Record<string, any>;
}>();
const initFormData: ShopOrderForm = {
  id: undefined,
  handle: undefined,
  shopOrder: undefined,
  status: undefined,
  statusList: undefined,
  shopOrderType: undefined,
  shopOrderTypeList: undefined,
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
  dataModifyUser: undefined,
  resource: undefined
};
const data = reactive<PageData<ShopOrderForm, ShopOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    shopOrder: undefined,
    status: undefined,
    statusList: undefined,
    shopOrderType: undefined,
    shopOrderTypeList: undefined,
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
    resource: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择工单号'
});

/** 查询工序列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listShopOrder(queryParams.value);
    shopOrderList.value = res.rows;
    total.value = res.total;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
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
const handleOpenDialog = () => {
  resetQuery();
  queryParams.value.resource = props?.podConfig.resource;
  queryParams.value.statusList = props?.podConfig.statusList;
  queryParams.value.shopOrderTypeList = props?.podConfig.shopOrderTypeList;
  handleQuery();
};
onMounted(async () => {});

defineExpose({
  openDialog,
  closeDialog
});
</script>

<style scoped>
.radio-no-label :deep(.el-radio__label) {
  display: none;
}
</style>
