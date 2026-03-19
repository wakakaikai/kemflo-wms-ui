<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="预约编号" prop="reservationCode">
              <el-input v-model="queryParams.reservationCode" placeholder="请输入预约编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="预约状态" prop="reservationStatus">
              <el-select v-model="queryParams.reservationStatus" placeholder="请选择预约状态" clearable>
                <el-option v-for="dict in wms_reservation_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="物料编码" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位编码" prop="locationCode">
              <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:palletInventoryReservationHistory:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:palletInventoryReservationHistory:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:palletInventoryReservationHistory:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:palletInventoryReservationHistory:export']">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Check" @click="handleConfirmReceipt" :disabled="multiple" v-hasPermi="['wms:palletInventoryReservationHistory:confirm']">确认收货</el-button>
          </el-col>

          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="palletInventoryReservationHistoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="预约编号" align="center" prop="reservationCode" />
        <el-table-column v-if="columns[1].visible" label="预约时间" align="center" prop="reservationDate" />

        <el-table-column v-if="columns[2].visible" label="预约状态" align="center" prop="reservationStatus">
          <template #default="scope">
            <dict-tag :options="wms_reservation_status" :value="scope.row.reservationStatus" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[3].visible" label="预约数量" align="center" prop="reservationQuantity" />
        <el-table-column v-if="columns[4].visible" label="发货时间" align="center" prop="shippedDate" />
        <el-table-column v-if="columns[5].visible" label="发货数量" align="center" prop="shippedDate" />
        <el-table-column v-if="columns[6].visible" label="栈板编号" align="center" prop="palletCode" />
        <el-table-column v-if="columns[7].visible" label="打包编号" align="center" prop="packingCode" />
        <el-table-column v-if="columns[8].visible" label="物料标识卡SN" align="center" prop="materialSn" />
        <el-table-column v-if="columns[9].visible" label="物料编码" align="center" prop="itemCode" />
        <el-table-column v-if="columns[10].visible" label="物料名称" align="center" prop="itemName" show-overflow-tooltip />
        <el-table-column v-if="columns[11].visible" label="批次号" align="center" prop="batchCode" />
        <el-table-column v-if="columns[12].visible" label="特殊库存标识" align="center" prop="specialInventoryFlag">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[13].visible" label="单位" align="center" prop="unit" />
        <el-table-column v-if="columns[14].visible" label="预约人" align="center" prop="reservedName" />
        <el-table-column v-if="columns[15].visible" label="单据类型" align="center" prop="sourceDocType" />
        <el-table-column v-if="columns[16].visible" label="单据编号" align="center" prop="sourceDocCode" />
        <el-table-column v-if="columns[17].visible" label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column v-if="columns[18].visible" label="库区编码" align="center" prop="areaCode" />
        <el-table-column v-if="columns[19].visible" label="库位编码" align="center" prop="locationCode" />
        <el-table-column v-if="columns[20].visible" label="目标仓库编码" align="center" prop="targetWarehouseCode" />
        <el-table-column v-if="columns[21].visible" label="目标库区编码" align="center" prop="targetAreaCode" />
        <el-table-column v-if="columns[22].visible" label="目标库位编码" align="center" prop="targetLocationCode" />
        <el-table-column v-if="columns[23].visible" label="业务伙伴" align="center" prop="businessCode" />
        <el-table-column v-if="columns[24].visible" label="业务伙伴名称" align="center" prop="businessName" />
        <el-table-column v-if="columns[25].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:palletInventoryReservationHistory:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:palletInventoryReservationHistory:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改栈板库存预约记录对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="700px" append-to-body>
      <el-form ref="palletInventoryReservationHistoryFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="预约编号" prop="reservationCode">
          <el-input v-model="form.reservationCode" placeholder="请输入预约编号" />
        </el-form-item>
        <!--        <el-form-item label="预约时间" prop="reservationDate">
          <el-date-picker clearable v-model="form.reservationDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择预约时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="已发货时间" prop="shippedDate">
          <el-date-picker clearable v-model="form.shippedDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择已发货时间"> </el-date-picker>
        </el-form-item>-->
        <el-form-item label="预约状态" prop="reservationStatus">
          <el-select v-model="form.reservationStatus" placeholder="请选择预约状态">
            <el-option v-for="dict in wms_reservation_status" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="预约数量" prop="reservationQuantity">
          <el-input v-model="form.reservationQuantity" placeholder="请输入预约数量" />
        </el-form-item>
        <!--        <el-form-item label="实际数量" prop="actualQuantity">
          <el-input v-model="form.actualQuantity" placeholder="请输入实际数量" />
        </el-form-item>
        <el-form-item label="栈板库存记录ID" prop="palletInventoryId">
          <el-input v-model="form.palletInventoryId" placeholder="请输入栈板库存记录ID" />
        </el-form-item>
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="打包编号" prop="packingCode">
          <el-input v-model="form.packingCode" placeholder="请输入打包编号" />
        </el-form-item>
        <el-form-item label="物料标识卡SN" prop="materialSn">
          <el-input v-model="form.materialSn" placeholder="请输入物料标识卡SN" />
        </el-form-item>
        <el-form-item label="物料编码" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
          <el-select v-model="form.specialInventoryFlag" placeholder="请选择特殊库存标识">
            <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="预约人" prop="reservedBy">
          <el-input v-model="form.reservedBy" placeholder="请输入预约人" />
        </el-form-item>
        <el-form-item label="单据编号" prop="sourceDocCode">
          <el-input v-model="form.sourceDocCode" placeholder="请输入单据编号" />
        </el-form-item>
        <el-form-item label="仓库编码" prop="warehouseCode">
          <el-input v-model="form.warehouseCode" placeholder="请输入仓库编码" />
        </el-form-item>
        <el-form-item label="库区编码" prop="areaCode">
          <el-input v-model="form.areaCode" placeholder="请输入库区编码" />
        </el-form-item>
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" />
        </el-form-item>-->
        <!--        <el-form-item label="目标仓库编码" prop="targetWarehouseCode">
          <el-input v-model="form.targetWarehouseCode" placeholder="请输入目标仓库编码" />
        </el-form-item>
        <el-form-item label="目标库区编码" prop="targetAreaCode">
          <el-input v-model="form.targetAreaCode" placeholder="请输入目标库区编码" />
        </el-form-item>-->
        <el-form-item label="目标库位编码" prop="targetLocationCode">
          <el-input
            v-model.trim="form.targetLocationCode"
            placeholder="请输入目标库位编码"
            clearable
            @keydown.tab.prevent="locationCodeKeyDownTab(form.targetLocationCode)"
            @keydown.enter.prevent="locationCodeKeyDownTab(form.targetLocationCode)"
          >
            <template #append>
              <el-button icon="Search" @click="showStorageLocationDialog()"></el-button>
            </template>
          </el-input>
        </el-form-item>
        <!--        <el-form-item label="业务伙伴" prop="businessCode">
          <el-input v-model="form.businessCode" placeholder="请输入业务伙伴" />
        </el-form-item>
        <el-form-item label="业务伙伴名称" prop="businessName">
          <el-input v-model="form.businessName" placeholder="请输入业务伙伴名称" />
        </el-form-item>-->
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  </div>
</template>

<script setup name="PalletInventoryReservationHistory" lang="ts">
import {
  listPalletInventoryReservationHistory,
  getPalletInventoryReservationHistory,
  delPalletInventoryReservationHistory,
  addPalletInventoryReservationHistory,
  updatePalletInventoryReservationHistory,
  confirmReceiptPalletInventoryReservationHistory
} from '@/api/wms/palletInventoryReservationHistory';
import { PalletInventoryReservationHistoryVO, PalletInventoryReservationHistoryQuery, PalletInventoryReservationHistoryForm } from '@/api/wms/palletInventoryReservationHistory/types';
import { listStorageLocation } from '@/api/wms/storageLocation';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import { ref } from 'vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_reservation_status, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_reservation_status', 'wms_inventory_special_flag'));

const palletInventoryReservationHistoryList = ref<PalletInventoryReservationHistoryVO[]>([]);
const selectedPalletInventoryReservationHistoryList = ref<PalletInventoryReservationHistoryVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const palletInventoryReservationHistoryFormRef = ref<ElFormInstance>();

const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PalletInventoryReservationHistoryForm = {
  id: undefined,
  reservationCode: undefined,
  reservationDate: undefined,
  reservationStatus: undefined,
  shippedDate: undefined,
  shippedStatus: undefined,
  shippedResultStatus: undefined,
  shippedResultMsg: undefined,
  reservationQuantity: undefined,
  actualQuantity: undefined,
  palletInventoryId: undefined,
  palletCode: undefined,
  packingCode: undefined,
  materialSn: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  specialInventoryFlag: undefined,
  unit: undefined,
  reservedBy: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  warehouseCode: undefined,
  areaCode: undefined,
  locationCode: undefined,
  targetWarehouseCode: undefined,
  targetAreaCode: undefined,
  targetLocationCode: undefined,
  businessCode: undefined,
  businessName: undefined,
  remark: undefined
};
const data = reactive<PageData<PalletInventoryReservationHistoryForm, PalletInventoryReservationHistoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    reservationCode: undefined,
    reservationDate: undefined,
    reservationStatus: undefined,
    shippedDate: undefined,
    shippedStatus: undefined,
    shippedResultStatus: undefined,
    shippedResultMsg: undefined,
    reservationQuantity: undefined,
    actualQuantity: undefined,
    palletInventoryId: undefined,
    palletCode: undefined,
    packingCode: undefined,
    materialSn: undefined,
    itemCode: undefined,
    itemName: undefined,
    batchCode: undefined,
    specialInventoryFlag: undefined,
    unit: undefined,
    reservedBy: undefined,
    sourceDocType: undefined,
    sourceDocCode: undefined,
    warehouseCode: undefined,
    areaCode: undefined,
    locationCode: undefined,
    targetWarehouseCode: undefined,
    targetAreaCode: undefined,
    targetLocationCode: undefined,
    businessCode: undefined,
    businessName: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID 不能为空', trigger: 'blur' }],
    // reservationCode: [{ required: true, message: '预约编号不能为空', trigger: 'blur' }],
    // reservationDate: [{ required: true, message: '预约时间不能为空', trigger: 'blur' }],
    reservationStatus: [{ required: true, message: '预约状态不能为空', trigger: 'change' }],
    // shippedDate: [{ required: true, message: '已发货时间不能为空', trigger: 'blur' }],
    reservationQuantity: [{ required: true, message: '预约数量不能为空', trigger: 'blur' }],
    // actualQuantity: [{ required: true, message: '发货数量不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }],
    packingCode: [{ required: true, message: '打包编号不能为空', trigger: 'blur' }],
    materialSn: [{ required: true, message: '物料标识卡 SN 不能为空', trigger: 'blur' }],
    itemCode: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称不能为空', trigger: 'blur' }],
    batchCode: [{ required: true, message: '批次号不能为空', trigger: 'blur' }],
    specialInventoryFlag: [{ required: true, message: '特殊库存标识不能为空', trigger: 'blur' }],
    unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }],
    reservedBy: [{ required: true, message: '预约人不能为空', trigger: 'blur' }],
    sourceDocType: [{ required: true, message: '单据类型不能为空', trigger: 'change' }],
    sourceDocCode: [{ required: true, message: '单据编号不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
    areaCode: [{ required: true, message: '库区编码不能为空', trigger: 'blur' }],
    locationCode: [{ required: true, message: '库位编码不能为空', trigger: 'blur' }],
    targetWarehouseCode: [{ required: true, message: '目标仓库编码不能为空', trigger: 'blur' }],
    targetAreaCode: [{ required: true, message: '目标库区编码不能为空', trigger: 'blur' }],
    targetLocationCode: [{ required: true, message: '目标库位编码不能为空', trigger: 'blur' }],
    businessCode: [{ required: true, message: '业务伙伴不能为空', trigger: 'blur' }],
    businessName: [{ required: true, message: '业务伙伴名称不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `预约编号`, visible: true, children: [] },
  { key: 1, label: `预约时间`, visible: true, children: [] },
  { key: 2, label: `预约状态`, visible: true, children: [] },
  { key: 4, label: `预约数量`, visible: true, children: [] },
  { key: 3, label: `发货时间`, visible: true, children: [] },
  { key: 5, label: `发货数量`, visible: true, children: [] },
  { key: 6, label: `栈板编号`, visible: true, children: [] },
  { key: 7, label: `打包编号`, visible: false, children: [] },
  { key: 8, label: `物料标识卡SN`, visible: false, children: [] },
  { key: 9, label: `物料编码`, visible: true, children: [] },
  { key: 10, label: `物料名称`, visible: true, children: [] },
  { key: 11, label: `批次号`, visible: true, children: [] },
  { key: 12, label: `特殊库存标识`, visible: false, children: [] },
  { key: 13, label: `单位`, visible: true, children: [] },
  { key: 14, label: `预约人`, visible: true, children: [] },
  { key: 15, label: `单据类型`, visible: false, children: [] },
  { key: 16, label: `单据编号`, visible: false, children: [] },
  { key: 17, label: `仓库编码`, visible: false, children: [] },
  { key: 18, label: `库区编码`, visible: false, children: [] },
  { key: 19, label: `库位编码`, visible: true, children: [] },
  { key: 20, label: `目标仓库编码`, visible: false, children: [] },
  { key: 21, label: `目标库区编码`, visible: false, children: [] },
  { key: 22, label: `目标库位编码`, visible: true, children: [] },
  { key: 23, label: `业务伙伴`, visible: false, children: [] },
  { key: 24, label: `业务伙伴名称`, visible: false, children: [] },
  { key: 25, label: `备注`, visible: false, children: [] }
]);

/** 查询栈板库存预约记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPalletInventoryReservationHistory(queryParams.value);
  palletInventoryReservationHistoryList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  palletInventoryReservationHistoryFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PalletInventoryReservationHistoryVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
  selectedPalletInventoryReservationHistoryList.value = selection;
};

/** 新增按钮操作 */
const handleAdd = () => {
  // reset();
  // dialog.visible = true;
  // dialog.title = '添加栈板库存预约记录';
  proxy.$router.push({
    path: `/inventory/palletInventoryReservation`
  });
};

/** 修改按钮操作 */
const handleUpdate = async (row?: PalletInventoryReservationHistoryVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getPalletInventoryReservationHistory(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改栈板库存预约记录';
};

/** 提交按钮 */
const submitForm = () => {
  palletInventoryReservationHistoryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePalletInventoryReservationHistory(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addPalletInventoryReservationHistory(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: PalletInventoryReservationHistoryVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除栈板库存预约记录编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delPalletInventoryReservationHistory(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/palletInventoryReservationHistory/export',
    {
      ...queryParams.value
    },
    `palletInventoryReservationHistory_${new Date().getTime()}.xlsx`
  );
};

/** 确认收货按钮操作 */
const handleConfirmReceipt = async (row?: PalletInventoryReservationHistoryVO) => {
  const _ids = row?.id || ids.value;
  // 获取选中的预约号

  const reservationCodes = selectedPalletInventoryReservationHistoryList.value.map((item) => item.reservationCode).join(',');
  const confirmText = reservationCodes ? `是否确认选中的预约记录已收货？预约编号：${reservationCodes}` : `是否确认选中的 ${ids.value.length} 条记录已收货？`;

  await proxy?.$modal.confirm(confirmText).finally(() => (loading.value = false));

  // TODO: 调用确认收货的 API
  const res = await confirmReceiptPalletInventoryReservationHistory({
    palletInventoryReservationIdList: _ids
  });

  proxy?.$modal.msgSuccess(res.msg || '确认收货成功');
  await getList();
};

/** 显示库位选择对话框 */
const showStorageLocationDialog = () => {
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
};

const locationCodeKeyDownTab = async (locationCode: any) => {
  if (locationCode) {
    const res = await listStorageLocation({
      pageNum: 1,
      pageSize: 10,
      locationCode: locationCode
    });
    if ((res.rows || []).length == 0) {
      proxy?.$modal.msgError(`库位${locationCode}已存在`);
    }
  }
};
/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  form.value.targetLocationCode = record.locationCode;
};
onMounted(() => {
  getList();
});
</script>
