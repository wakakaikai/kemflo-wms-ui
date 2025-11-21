<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="采购单" prop="poNumber">
              <el-input v-model="queryParams.poNumber" placeholder="请输入采购单" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料号" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="请输入物料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-radio-group v-model="inboundMode">
              <el-radio-button label="fixed">固定库位</el-radio-button>
              <el-radio-button label="multiple">多库位</el-radio-button>
            </el-radio-group>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <!-- 固定库位模式下的统一目标库位输入 -->
      <div v-if="inboundMode === 'fixed'" style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
        <el-form :model="fixedInboundForm" ref="fixedTransferFormRef" label-width="100px" :inline="true">
          <el-form-item label="目标库位" prop="locationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
            <el-input v-model="fixedInboundForm.locationCode" placeholder="请输入目标库位编码" clearable @keydown.tab.prevent="locationCodeKeyDownTab" @keydown.enter.prevent="locationCodeKeyDownTab">
              <template #append>
                <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="resultMessage" class="m-y-2">
        <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
          <template #icon>
            <Bell />
          </template>
        </el-alert>
      </div>

      <el-table ref="purchaseTableRef" v-loading="loading" :data="purchaseOrderDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="采购单" align="left" prop="poNumber" min-width="120" />
        <el-table-column v-if="columns[1].visible" label="项次" align="left" prop="itemNumber" min-width="65" />
        <el-table-column v-if="columns[2].visible" label="排程" align="left" prop="scheduleNumber" min-width="60" />
        <el-table-column v-if="columns[3].visible" label="交货日期" align="center" prop="deliveryDate" min-width="100" />
        <el-table-column v-if="columns[4].visible" label="料号" align="left" prop="materialCode" min-width="130" />
        <el-table-column v-if="columns[5].visible" label="旧料号" align="left" prop="oldMaterialCode" />
        <el-table-column v-if="columns[6].visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
        <el-table-column v-if="columns[7].visible" label="订单数量" align="left" prop="orderQuantity" min-width="100" />
        <el-table-column v-if="columns[8].visible" label="已收数量" align="left" prop="receivedQuantity" min-width="100" />
        <el-table-column v-if="columns[9].visible" label="未清数量" align="left" prop="openQuantity" min-width="100" />
        <el-table-column v-if="columns[10].visible" label="订单单位" align="center" prop="orderUnit" />
        <el-table-column v-if="columns[11].visible" label="需质检" align="center" prop="inspectionFlag" />
        <!-- 可编辑的收货数量 -->
        <el-table-column label="收货数量" align="center" width="150">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.receivePoQuantity"
              :min="0"
              :max="parseFloat(scope.row.openQuantity || 0)"
              size="small"
              controls-position="right"
              :precision="3"
              @change="handleReceivePoQuantityChange(scope.row)"
            />
          </template>
        </el-table-column>

        <!-- 多库位模式下显示独立的目标库位设置 -->
        <el-table-column label="目标库位" width="220" v-if="inboundMode === 'multiple'">
          <template #default="scope">
            <el-input v-model="scope.row.locationCode" placeholder="请输入目标库位编码" clearable @keydown.enter.prevent>
              <template #append>
                <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
              </template>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[12].visible" label="库存数量" align="center" prop="inventoryQuantity">
          <template #default="scope">
            {{ scope.row.inventoryQuantity }}
          </template>
        </el-table-column>
        <el-table-column v-if="columns[13].visible" label="库存单位" align="center" prop="inventoryUnit" />
        <el-table-column v-if="columns[14].visible" label="换算比例" align="center" prop="conversionRatio" />
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

      <div style="margin-top: 20px; text-align: center">
        <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="purchaseOrderDetailList.length === 0">采购收货</el-button>
      </div>
    </el-card>

    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  </div>
</template>

<script setup name="PurchaseInbound" lang="ts">
import { addPurchaseInbound, listPurchaseOrderDetail } from '@/api/wms/purchaseOrderDetail';

import { PurchaseOrderDetailVO, PurchaseOrderDetailQuery, PurchaseOrderDetailForm } from '@/api/wms/purchaseOrderDetail/types';
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import { nextTick, ref } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const purchaseOrderDetailList = ref<PurchaseOrderDetailVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);

// 入库模式：fixed-固定库位，multiple-多库位
const inboundMode = ref<'fixed' | 'multiple'>('fixed');

// 固定库位模式下的表单数据
const fixedInboundForm = ref({
  locationCode: ''
});

const queryFormRef = ref<ElFormInstance>();
const purchaseTableRef = ref<ElTableInstance>();

const initFormData: PurchaseOrderDetailForm = {
  id: undefined,
  poNumber: undefined,
  itemNumber: undefined,
  materialCode: undefined,
  materialDesc: undefined,
  shortText: undefined,
  orderQuantity: undefined,
  orderUnit: undefined,
  returnFlag: undefined,
  openQuantity: undefined,
  itemDeleteFlag: undefined,
  completedFlag: undefined,
  remark: undefined
};

const data = reactive<PageData<PurchaseOrderDetailForm, PurchaseOrderDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    poNumber: undefined,
    itemNumber: undefined,
    materialCode: undefined,
    materialDesc: undefined,
    shortText: undefined,
    orderQuantity: undefined,
    orderUnit: undefined,
    returnFlag: undefined,
    openQuantity: undefined,
    itemDeleteFlag: undefined,
    completedFlag: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    poNumber: [{ required: true, message: '采购单不能为空', trigger: 'blur' }],
    materialCode: [{ required: true, message: '物料号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `采购单`, visible: true, children: [] },
  { key: 1, label: `项次`, visible: true, children: [] },
  { key: 2, label: `排程`, visible: true, children: [] },
  { key: 3, label: `交货日期`, visible: true, children: [] },
  { key: 4, label: `料号`, visible: true, children: [] },
  { key: 5, label: `旧料号`, visible: false, children: [] },
  { key: 6, label: `物料描述`, visible: true, children: [] },
  { key: 7, label: `订单数量`, visible: true, children: [] },
  { key: 8, label: `已收数量`, visible: true, children: [] },
  { key: 9, label: `未清数量`, visible: true, children: [] },
  { key: 10, label: `订单单位`, visible: true, children: [] },
  { key: 11, label: `需质检`, visible: true, children: [] },
  { key: 12, label: `库存数量`, visible: true, children: [] },
  { key: 13, label: `库存单位`, visible: true, children: [] },
  { key: 14, label: `换算比例`, visible: true, children: [] }
]);

/** 查询采购订单明细列表 */
const getList = async () => {
  resultMessage.value = '';
  loading.value = true;
  const res = await listPurchaseOrderDetail(queryParams.value);
  // 初始化收货数量为未清数量
  purchaseOrderDetailList.value = res.rows.map((item) => ({
    ...item,
    receivePoQuantity: Number(item.openQuantity) || 0,
    storageLocation: '',
    conversionRatio: Number(item.conversionRatio) || 1, // 确保有换算比例，默认为1
    inventoryQuantity: (Number(item.openQuantity) || 0) * (Number(item.conversionRatio) || 1) // 初始库存数量 = 收货数量 * 换算比例
  }));
  total.value = res.total;
  loading.value = false;
};

const locationCodeKeyDownTab = async () => {
  if (fixedInboundForm.value.locationCode) {
    fixedInboundForm.value.locationCode = fixedInboundForm.value.locationCode.trim();
    const res = await listStorageLocation({
      pageNum: 1,
      pageSize: 10,
      locationCode: fixedInboundForm.value.locationCode
    });
    resultMessage.value = '';
    if ((res.rows || []).length == 0) {
      resultMessage.value = `库位${fixedInboundForm.value.locationCode}不存在`;
      resultStatus.value = false;
    }
  }
};

// 添加一个方法用于计算库存数量
const calculateInventoryQuantity = (row) => {
  const receiveQty = Number(row.receivePoQuantity) || 0;
  const conversionRatio = Number(row.conversionRatio) || 1;
  row.inventoryQuantity = receiveQty * conversionRatio;
};

// 监听收货数量变化的处理方法
const handleReceivePoQuantityChange = (row) => {
  calculateInventoryQuantity(row);
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
const handleSelectionChange = (selection: PurchaseOrderDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  resultMessage.value = '';
  if (inboundMode.value === 'fixed') {
    // 固定库位模式，设置统一的目标库位
    fixedInboundForm.value.locationCode = record.locationCode;
  } else {
    // 多库位模式，设置对应行的目标库位
    if (currenIndex.value >= 0 && currenIndex.value < purchaseOrderDetailList.value.length) {
      const currentItem = purchaseOrderDetailList.value[currenIndex.value];
      currentItem.locationCode = record.locationCode;
    }
  }
};

/** 显示库位选择对话框 */
const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value.openDialog();
  storageLocationDialogRef.value.handleQuery();
  currenIndex.value = index;
};

/** 提交移转 */
const submitForm = async () => {
  const validPurchaseInboundList = purchaseOrderDetailList.value.filter((item) => item.receivePoQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validPurchaseInboundList.length === 0) {
    resultMessage.value = '收货数量不能都为0';
    resultStatus.value = false;
    return;
  }

  if (inboundMode.value === 'fixed') {
    // 固定库位模式验证
    if (!fixedInboundForm.value.locationCode) {
      resultMessage.value = '请输入目标库位编码';
      resultStatus.value = false;
      return;
    }

    // 为所有记录设置统一的目标库位
    validPurchaseInboundList.forEach((item) => {
      item.locationCode = fixedInboundForm.value.locationCode || '';
    });
  } else {
    // 多库位模式验证
    const invalidItems = validPurchaseInboundList.filter((item) => !item.locationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请填写所有移转记录的目标库位';
      resultStatus.value = false;
      return;
    }
  }

  // 验证移转数量是否超过当前数量
  const overQuantityItems = validPurchaseInboundList.filter((item) => item.receivePoQuantity > item.openQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '移转数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    // 构造移转请求参数
    const purchaseInboundRequests = validPurchaseInboundList.map((item) => ({
      ...item,
      receivePoQuantity: item.receivePoQuantity,
      receivePoUnit: item.orderUnit,
      receiveQuantity: item.inventoryQuantity,
      receiveUnit: item.inventoryUnit
    }));
    const res: any = await addPurchaseInbound({
      purchaseOrderInboundBoList: purchaseInboundRequests
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = `采购入库成功${validPurchaseInboundList.length}条记录`;
    resultStatus.value = true;
    purchaseOrderDetailList.value = [];
    // 清空固定库位表单
    if (inboundMode.value === 'fixed') {
      fixedInboundForm.value.locationCode = '';
    }
    handleQuery();
  } catch (error) {
    loading.value = false;
    resultMessage.value = error.message || '移转失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.fixed-location-input {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>
