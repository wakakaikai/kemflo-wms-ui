<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" :rules="rules" label-width="auto">
        <el-row :gutter="24">
          <el-col :lg="10" :md="10" :sm="24" :offset="5">
            <el-form-item label="工单号码" prop="workOrderNo">
              <el-input ref="workOrderInputRef" v-model="queryParams.shopOrder" placeholder="请输入工单号码">
                <template #append>
                  <el-button icon="Search" @click="openShopOrderDialog" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :lg="10" :md="10" :sm="24" :offset="5">
            <el-form-item label="待下达数量" prop="releaseQty">
              <el-input-number v-model="queryParams.releaseQty" placeholder="请输入待下达数量" clearable @keyup.enter="handleQuery" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :lg="10" :md="10" :sm="24">
            <el-form-item label="状态" prop="plannedItemBo">
              <span>{{ queryParams.statusDesc }}</span>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="计划工艺路线" prop="plannedRouter">
              <div class="big-content">{{ queryParams.plannedRouter }}/{{ queryParams.plannedRouterVersion }}</div>
            </el-form-item>
          </el-col>
          <el-col :lg="10" :md="10" :sm="24">
            <el-form-item label="计划数量" prop="qtyToBuild">
              <span>{{ queryParams.qtyToBuild ? parseFloat(queryParams.qtyToBuild) : '' }}</span>
            </el-form-item>
          </el-col>
          <el-col :lg="14" :md="14" :sm="24">
            <el-form-item label="可下达数量" prop="qtyCanBeRelease">
              <div class="big-content" :class="[queryParams.canReleaseQty == 0 ? 'special-tip-color' : 'normal-color']">
                {{ queryParams.canReleaseQty ? parseFloat(queryParams.canReleaseQty) : '' }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :lg="10" :md="10" :sm="24">
            <el-form-item label="计划物料" prop="plannedItem">
              <span>{{ queryParams.plannedItem }}</span>
            </el-form-item>
          </el-col>
          <el-col :lg="14" :md="14" :sm="24">
            <el-form-item label="物料描述" prop="itemDesc">
              <span>{{ queryParams.itemDesc }}</span>
            </el-form-item>
          </el-col>
          <el-col :lg="10" :md="10" :sm="24">
            <el-form-item label="计划开始" prop="plannedStartDate">
              <span>{{ queryParams.plannedStartDate }}</span>
            </el-form-item>
          </el-col>
          <el-col :lg="14" :md="14" :sm="24">
            <el-form-item label="计划结束" prop="plannedCompDate">
              <span>{{ queryParams.plannedCompDate }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>

    <ShopOrderDialog ref="shopOrderDialogRef" @shop-order-call-back="shopOrderCallBack" />
    <ShopOrderSfcPreviewDialog ref="shopOrderSfcPreviewDialogRef" @sfc-preview-call-back="sfcPreviewCallBack" />
  </div>
</template>

<script setup lang="ts">
import { listShopOrder, releaseShopOrderSfc } from '@/api/mes/shopOrder';
import { ShopOrderVO, ShopOrderQuery, ShopOrderForm, SfcPreviewVO } from '@/api/mes/shopOrder/types';
import useDialog from '@/hooks/useDialog';

import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import ShopOrderSfcPreviewDialog from '@/views/mes/workpanel/components/shopOrderSfcPreviewDialog.vue';

const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
const shopOrderSfcPreviewDialogRef = ref<InstanceType<typeof ShopOrderSfcPreviewDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shopOrderList = ref<ShopOrderVO[]>([]);
const loading = ref(true);
const sfcPreviewConfirm = ref(false);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const operationFormRef = ref<ElFormInstance>();
const podConfig = ref<{ [key: string]: any }>({});
const initFormData: ShopOrderForm = {
  id: undefined,
  handle: undefined,
  shopOrder: undefined,
  status: undefined,
  statusDesc: undefined,
  shopOrderType: undefined,
  priority: undefined,
  plannedWorkCenterBo: undefined,
  plannedItemBo: undefined,
  plannedBomBo: undefined,
  plannedRouterBo: undefined,
  itemBo: undefined,
  bomBo: undefined,
  routerBo: undefined,
  releaseQty: undefined,
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
  remark: undefined
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
    params: {}
  },
  rules: {
    releaseQty: [{ required: true, message: '待下达数量不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择工单号'
});

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
      if (sfcPreviewConfirm.value) {
        proxy.$emit('shopOrderCallBack', selectedRowData.value);
        const parmas: SfcPreviewVO = {
          shopOrder: queryParams.value.shopOrder,
          releaseQty: queryParams.value.releaseQty
        };
        const res: any = releaseShopOrderSfc(parmas).finally(() => (loading.value = false));
        if (res.data?.sfcVoList) {
          queryParams.value = { ...queryParams.value, ...res?.data?.sfcVoList[0] };
        }
        closeDialog();
        sfcPreviewConfirm.value = false;
      } else {
        openShopOrderSfcPreviewDialog();
      }
    }
  });
};

// 工单对话框
const openShopOrderDialog = () => {
  shopOrderDialogRef.value.openDialog();
};

const shopOrderCallBack = (data: any) => {
  podConfig.value.shopOrder = data.shopOrder;
  podConfig.value.shopOrderDesc = data.itemDesc;
  queryParams.value = data;
};

// 工单条码预览
const openShopOrderSfcPreviewDialog = () => {
  shopOrderSfcPreviewDialogRef.value.openDialog();
  shopOrderSfcPreviewDialogRef.value.initSfcPreviewDialog(queryParams.value.shopOrder);
};

const sfcPreviewCallBack = (confirmFlag: boolean) => {
  sfcPreviewConfirm.value = confirmFlag;
};

onMounted(async () => {
  handleQuery();
});

defineExpose({
  openDialog,
  closeDialog
});
</script>

<style scoped>
.radio-no-label :deep(.el-radio__label) {
  display: none;
}
.radio-no-label :deep(.el-radio) {
  margin-left: 10px;
}

.special-tip-color {
  color: #d9363e;
  font-weight: 700;
}
.normal-color {
  color: green;
  font-weight: 700;
}
</style>
