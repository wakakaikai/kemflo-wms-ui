<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料编码" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <!--            <el-form-item label="物料名称" prop="itemName">
              <el-input v-model="queryParams.itemName" placeholder="请输入物料名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>-->
            <el-form-item label="批次号" prop="batchCode">
              <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库编码" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库区编码" prop="areaCode">
              <el-input v-model="queryParams.areaCode" placeholder="请输入库区编码" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:inventoryDetail:add']"> 新增 </el-button>
          </el-col>
          <!--          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:inventoryDetail:edit']">修改 </el-button>
          </el-col>-->
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:inventoryDetail:remove']">删除 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:inventoryDetail:import']" type="info" plain icon="Upload" @click="handleImport">导入 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:inventoryDetail:export']">导出 </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="inventoryDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="物料编码" align="left" prop="itemCode" fixed="left" min-width="150" />
        <el-table-column v-if="columns[1].visible" label="物料名称" align="left" prop="itemName" fixed="left" max-width="200" show-overflow-tooltip />
        <el-table-column v-if="columns[2].visible" label="批次号" align="center" prop="batchCode" fixed="left" min-width="110" />
        <el-table-column v-if="columns[3].visible" label="非限制数量" align="center" prop="availableQuantity" fixed="left" min-width="90" />
        <el-table-column v-if="columns[4].visible" label="质检数量" align="center" prop="inspectionQuantity" fixed="left" />
        <el-table-column v-if="columns[5].visible" label="冻结数量" align="center" prop="blockedQuantity" fixed="left" />
        <el-table-column v-if="columns[6].visible" label="在途数量" align="center" prop="transitQuantity" fixed="left" />
        <el-table-column v-if="columns[7].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[8].visible" label="业务伙伴" align="center" prop="businessCode" />
        <el-table-column v-if="columns[9].visible" label="伙伴名称" align="center" prop="businessName" show-overflow-tooltip />
        <el-table-column v-if="columns[10].visible" label="单位" align="center" prop="unit" />
        <el-table-column v-if="columns[11].visible" label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column v-if="columns[12].visible" label="库区编码" align="center" prop="areaCode" />
        <el-table-column v-if="columns[13].visible" label="库位编码" align="center" prop="locationCode" />
        <el-table-column v-if="columns[14].visible" label="检验批号" align="center" prop="inspectionNo" />
        <el-table-column v-if="columns[15].visible" label="创建者" align="center" prop="createByName" />
        <el-table-column v-if="columns[16].visible" label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column v-if="columns[17].visible" label="更新者" align="center" prop="updateByName" />
        <el-table-column v-if="columns[18].visible" label="更新时间" align="center" prop="updateTime" width="180" />
        <el-table-column v-if="columns[19].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="150">
          <template #default="scope">
            <!--            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:inventoryDetail:edit']">修改 </el-button>
            </el-tooltip>-->
            <el-tooltip content="WMS盘亏" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleSubtract(scope.row)" v-hasPermi="['wms:inventoryDetail:subtract']"> WMS盘亏 </el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:inventoryDetail:remove']">删除 </el-button>
            </el-tooltip>
            <!--            <el-tooltip content="移库" placement="top">
              <el-button link type="primary" icon="Position" @click="handleTransfer(scope.row)" v-hasPermi="['wms:inventoryDetail:transfer']">移库</el-button>
            </el-tooltip>-->
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加或修改库存明细记录对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="inventoryDetailFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="物料编码" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入物料编码" clearable>
            <template #append>
              <el-button icon="Search" @click="showItemDialog()"></el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="库存类型" prop="inventoryType">
          <el-select v-model="form.inventoryType" placeholder="请选择库存类型" style="width: 100%">
            <el-option label="非限制库存" value="N"></el-option>
            <el-option label="质检库存" value="X"></el-option>
            <el-option label="冻结库存" value="S"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="form.quantity" placeholder="请输入数量" :precision="3" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" clearable>
            <template #append>
              <el-button icon="Search" @click="showStorageLocationDialog()"></el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
          <el-select v-model="form.specialInventoryFlag" placeholder="请选择特殊库存标识" filterable clearable>
            <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="批次码" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次码" />
        </el-form-item>
        <el-form-item label="业务伙伴" prop="businessCode">
          <el-input v-model="form.businessCode" placeholder="请输入业务伙伴" />
        </el-form-item>
        <el-form-item label="伙伴名称" prop="businessName">
          <el-input v-model="form.businessName" placeholder="请输入业务伙伴名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 盘亏存明细记录对话框 -->
    <el-dialog :title="subtractInventoryDialog.title" v-model="subtractInventoryDialog.visible" width="800px" append-to-body>
      <el-form ref="inventoryDetailFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="物料编码">
          <el-input v-model="form.itemCode" readonly />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="form.itemName" readonly />
        </el-form-item>
        <el-form-item label="批次码">
          <el-input v-model="form.batchCode" placeholder="请输入批次码" readonly />
        </el-form-item>
        <el-form-item label="库位编码">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" readonly />
        </el-form-item>
        <el-form-item label="库存数量">
          <el-row :gutter="20">
            <el-col :sm="24" :md="8" :lg="8">
              <el-card class="box-card" shadow="never">
                <div class="card-content">
                  <div class="card-label card-value-available">非限制</div>
                  <div class="card-value">{{ form.availableQuantity || 0 }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :sm="24" :md="8" :lg="8">
              <el-card class="box-card" shadow="never">
                <div class="card-content">
                  <div class="card-label card-value-inspection">质检</div>
                  <div class="card-value">{{ form.inspectionQuantity || 0 }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :sm="24" :md="8" :lg="8">
              <el-card class="box-card" shadow="never">
                <div class="card-content">
                  <div class="card-label card-value-blocked">冻结</div>
                  <div class="card-value">{{ form.blockedQuantity || 0 }}</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="库存类型" prop="inventoryType">
          <el-select v-model="form.inventoryType" placeholder="请选择库存类型" style="width: 100%">
            <el-option label="非限制库存" value="N"></el-option>
            <el-option label="质检库存" value="X"></el-option>
            <el-option label="冻结库存" value="S"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="盘亏数量" prop="quantity">
          <el-input-number v-model="form.quantity" placeholder="请输入盘亏数量" :precision="3" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="subtractInventoryDialog.visible = false">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitSubtractForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="400px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板 </el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="upload.open = false">取 消</el-button>
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
    <ItemDialog ref="itemDialogRef" @item-select-call-back="itemSelectCallBack" />
  </div>
</template>

<script setup name="InventoryDetail" lang="ts">
import { addInventoryDetail, delInventoryDetail, getInventoryDetail, listInventoryDetail, subtractInventoryDetail, updateInventoryDetail } from '@/api/wms/inventoryDetail';
import { InventoryDetailForm, InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import { ref } from 'vue';
import { globalHeaders } from '@/utils/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag, wms_inventory_type } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag', 'wms_inventory_type'));

const inventoryDetailList = ref<InventoryDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const inventoryDetailFormRef = ref<ElFormInstance>();
const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `物料编码`, visible: true, children: [] },
  { key: 1, label: `物料名称`, visible: true, children: [] },
  { key: 2, label: `批次号`, visible: true, children: [] },
  { key: 3, label: `非限制数量`, visible: true, children: [] },
  { key: 4, label: `质检数量`, visible: true, children: [] },
  { key: 5, label: `冻结数量`, visible: true, children: [] },
  { key: 6, label: `在途数量`, visible: false, children: [] },
  { key: 7, label: `特殊库存`, visible: true, children: [] },
  { key: 8, label: `业务伙伴`, visible: false, children: [] },
  { key: 9, label: `伙伴名称`, visible: false, children: [] },
  { key: 10, label: `单位`, visible: true, children: [] },
  { key: 11, label: `仓库编码`, visible: false, children: [] },
  { key: 12, label: `库区编码`, visible: false, children: [] },
  { key: 13, label: `库位编码`, visible: true, children: [] },
  { key: 14, label: `检验批号`, visible: false, children: [] },
  { key: 15, label: `创建时间`, visible: false, children: [] },
  { key: 16, label: `创建者`, visible: false, children: [] },
  { key: 17, label: `更新时间`, visible: false, children: [] },
  { key: 18, label: `更新者`, visible: false, children: [] },
  { key: 19, label: `备注`, visible: false, children: [] }
]);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const subtractInventoryDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

// 单个移库对话框状态
const transferDialog = reactive({
  visible: false
});

const initFormData: InventoryDetailForm = {
  id: undefined,
  itemType: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  availableQuantity: undefined,
  inspectionQuantity: undefined,
  blockedQuantity: undefined,
  unit: 'PCS',
  inventoryType: 'N',
  inventoryStatus: undefined,
  stockInStatus: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  areaCode: undefined,
  areaName: undefined,
  locationCode: undefined,
  locationName: undefined,
  palletCode: undefined,
  businessCode: undefined,
  businessName: undefined,
  receiptDate: undefined,
  sapMaterialDocYear: undefined,
  sapMaterialOrderNo: undefined,
  sapMaterialItem: undefined,
  remark: undefined
};
const data = reactive<PageData<InventoryDetailForm, InventoryDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemType: undefined,
    itemCode: undefined,
    itemName: undefined,
    batchCode: undefined,
    availableQuantity: undefined,
    inspectionQuantity: undefined,
    blockedQuantity: undefined,
    unit: undefined,
    inventoryType: undefined,
    warehouseCode: undefined,
    warehouseName: undefined,
    areaCode: undefined,
    areaName: undefined,
    locationCode: undefined,
    locationName: undefined,
    palletCode: undefined,
    businessCode: undefined,
    businessName: undefined,
    receiptDate: undefined,
    sapMaterialDocYear: undefined,
    sapMaterialOrderNo: undefined,
    sapMaterialItem: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    itemCode: [{ required: true, message: '物料编码/设备编号不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称/设备名称不能为空', trigger: 'blur' }],
    locationCode: [{ required: true, message: '请输入库位编码', trigger: 'blur' }],
    inventoryType: [{ required: true, message: '请选择库存类型', trigger: 'blur' }],
    quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
  }
});
/*** 导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: '',
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + '/wms/inventoryDetail/importData'
});
const { queryParams, form, rules } = toRefs(data);

const uploadRef = ref<ElUploadInstance>();

/** 查询库存明细记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInventoryDetail(queryParams.value);
  inventoryDetailList.value = res.rows;
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
  inventoryDetailFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: InventoryDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加库存记录';
};

/** 盘亏按钮操作 */
const handleSubtract = async (row?: InventoryDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getInventoryDetail(_id);
  Object.assign(form.value, res.data);
  subtractInventoryDialog.visible = true;
  subtractInventoryDialog.title = '盘亏WMS库存记录';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: InventoryDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getInventoryDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改库存明细记录';
};

/** 提交按钮 */
const submitForm = () => {
  switch (form.value.inventoryType) {
    case 'N':
      form.value.availableQuantity = form.value.quantity || null;
      break;
    case 'X':
      form.value.inspectionQuantity = form.value.quantity || null;
      break;
    case 'S':
      form.value.blockedQuantity = form.value.quantity || null;
      break;
    default:
  }
  inventoryDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      form.value.itemType = 1;
      if (form.value.id) {
        await updateInventoryDetail(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addInventoryDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 盘亏提交按钮 */
const submitSubtractForm = () => {
  // 验证盘亏数量不能超过库存数量
  let currentQuantity = 0;
  switch (form.value.inventoryType) {
    case 'N':
      currentQuantity = form.value.availableQuantity || 0;
      break;
    case 'X':
      currentQuantity = form.value.inspectionQuantity || 0;
      break;
    case 'S':
      currentQuantity = form.value.blockedQuantity || 0;
      break;
    default:
  }

  if (form.value.quantity > currentQuantity) {
    proxy?.$modal.msgError(`盘亏数量不能超过当前库存数量${currentQuantity}`);
    return;
  }

  switch (form.value.inventoryType) {
    case 'N':
      form.value.availableQuantity = form.value.quantity || null;
      break;
    case 'X':
      form.value.inspectionQuantity = form.value.quantity || null;
      break;
    case 'S':
      form.value.blockedQuantity = form.value.quantity || null;
      break;
    default:
  }
  inventoryDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await subtractInventoryDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      subtractInventoryDialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: InventoryDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除库存明细记录编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delInventoryDetail(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/inventoryDetail/export',
    {
      ...queryParams.value
    },
    `inventoryDetail_${new Date().getTime()}.xlsx`
  );
};
/** 显示物料选择对话框 */
const showItemDialog = () => {
  itemDialogRef.value.openDialog();
  itemDialogRef.value.handleQuery();
  // currenIndex.value = index;
};

const itemSelectCallBack = (record: any) => {
  form.value.itemCode = record.item;
  form.value.itemName = record.itemDesc;
  form.value.unit = record.unit;
};

/** 显示库位选择对话框 */
const showStorageLocationDialog = () => {
  storageLocationDialogRef.value.openDialog();
  storageLocationDialogRef.value.handleQuery();
};

/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  form.value.warehouseCode = record.warehouseCode;
  form.value.areaCode = record.areaCode;
  form.value.locationCode = record.locationCode;
};

/** 导入按钮操作 */
const handleImport = () => {
  upload.title = '导入';
  upload.open = true;
};
/** 下载模板操作 */
const importTemplate = () => {
  proxy?.download('wms/inventoryDetail/importTemplate', {}, `inventoryDetail_template_${new Date().getTime()}.xlsx`);
};
/**文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
};
/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + '</div>', '导入结果', {
    dangerouslyUseHTMLString: true
  });
  getList();
};

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}

onMounted(() => {
  getList();
});
</script>
<style lang="scss" scoped>
.box-card {
  height: 100%;
  width: 100%;
}
.card-content {
  text-align: center;
  padding: 10px;
  min-width: 120px;
}

.card-label {
  font-size: 18px;
  color: #909399;
  margin-bottom: 5px;
}

.card-value {
  font-size: 16px;
  font-weight: bold;
}

.card-value-available {
  color: #67c23a; /* 绿色 - 非限制库存 */
}

.card-value-inspection {
  color: #e6a23c; /* 橙色 - 质检库存 */
}

.card-value-blocked {
  color: #f56c6c; /* 红色 - 冻结库存 */
}
</style>
