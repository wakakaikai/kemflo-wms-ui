<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="物料编码/设备编号" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码/设备编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品物料名称/设备名称" prop="itemName">
              <el-input v-model="queryParams.itemName" placeholder="请输入产品物料名称/设备名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="批次号" prop="batchCode">
              <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数量-非限制" prop="availableQuantity">
              <el-input v-model="queryParams.availableQuantity" placeholder="请输入数量-非限制" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数量-质检" prop="inspectionQuantity">
              <el-input v-model="queryParams.inspectionQuantity" placeholder="请输入数量-质检" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数量-冻结" prop="blockedQuantity">
              <el-input v-model="queryParams.blockedQuantity" placeholder="请输入数量-冻结" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数量-报废" prop="scrappedQuantity">
              <el-input v-model="queryParams.scrappedQuantity" placeholder="请输入数量-报废" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="单位" prop="unit">
              <el-input v-model="queryParams.unit" placeholder="请输入单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP" prop="inventoryType">
              <el-select v-model="queryParams.inventoryType" placeholder="请选择库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP" clearable >
                <el-option v-for="dict in wms_inventory_type" :key="dict.value" :label="dict.label" :value="dict.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="库存状态" prop="inventoryStatus">
              <el-select v-model="queryParams.inventoryStatus" placeholder="请选择库存状态" clearable >
                <el-option v-for="dict in wms_inventory_status" :key="dict.value" :label="dict.label" :value="dict.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="入库状态" prop="stockInStatus">
              <el-select v-model="queryParams.stockInStatus" placeholder="请选择入库状态" clearable >
                <el-option v-for="dict in wms_stock_in_status" :key="dict.value" :label="dict.label" :value="dict.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="仓库编码" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库名称" prop="warehouseName">
              <el-input v-model="queryParams.warehouseName" placeholder="请输入仓库名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库区编码" prop="areaCode">
              <el-input v-model="queryParams.areaCode" placeholder="请输入库区编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库区名称" prop="areaName">
              <el-input v-model="queryParams.areaName" placeholder="请输入库区名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位编码" prop="locationCode">
              <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位名称" prop="locationName">
              <el-input v-model="queryParams.locationName" placeholder="请输入库位名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="业务伙伴" prop="businessCode">
              <el-input v-model="queryParams.businessCode" placeholder="请输入业务伙伴" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="业务伙伴名称" prop="businessName">
              <el-input v-model="queryParams.businessName" placeholder="请输入业务伙伴名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="接收日期" prop="receiptDate">
              <el-date-picker clearable
                v-model="queryParams.receiptDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择接收日期"
              />
            </el-form-item>
            <el-form-item label="SAP凭证年度" prop="sapMaterialDocYear">
              <el-input v-model="queryParams.sapMaterialDocYear" placeholder="请输入SAP凭证年度" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="SAP物料凭证号" prop="sapMaterialOrderNo">
              <el-input v-model="queryParams.sapMaterialOrderNo" placeholder="请输入SAP物料凭证号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="SAP物料文件项次" prop="sapMaterialItem">
              <el-input v-model="queryParams.sapMaterialItem" placeholder="请输入SAP物料文件项次" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:inventoryDetail:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:inventoryDetail:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:inventoryDetail:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:inventoryDetail:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="inventoryDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="材料类型: 1-物料, 2-设备" align="center" prop="itemType" />
        <el-table-column label="物料编码/设备编号" align="center" prop="itemCode" />
        <el-table-column label="产品物料名称/设备名称" align="center" prop="itemName" />
        <el-table-column label="批次号" align="center" prop="batchCode" />
        <el-table-column label="数量-非限制" align="center" prop="availableQuantity" />
        <el-table-column label="数量-质检" align="center" prop="inspectionQuantity" />
        <el-table-column label="数量-冻结" align="center" prop="blockedQuantity" />
        <el-table-column label="数量-报废" align="center" prop="scrappedQuantity" />
        <el-table-column label="单位" align="center" prop="unit" />
        <el-table-column label="库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP" align="center" prop="inventoryType">
          <template #default="scope">
            <dict-tag :options="wms_inventory_type" :value="scope.row.inventoryType"/>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" align="center" prop="inventoryStatus">
          <template #default="scope">
            <dict-tag :options="wms_inventory_status" :value="scope.row.inventoryStatus"/>
          </template>
        </el-table-column>
        <el-table-column label="入库状态" align="center" prop="stockInStatus">
          <template #default="scope">
            <dict-tag :options="wms_stock_in_status" :value="scope.row.stockInStatus"/>
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column label="仓库名称" align="center" prop="warehouseName" />
        <el-table-column label="库区编码" align="center" prop="areaCode" />
        <el-table-column label="库区名称" align="center" prop="areaName" />
        <el-table-column label="库位编码" align="center" prop="locationCode" />
        <el-table-column label="库位名称" align="center" prop="locationName" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="业务伙伴" align="center" prop="businessCode" />
        <el-table-column label="业务伙伴名称" align="center" prop="businessName" />
        <el-table-column label="接收日期" align="center" prop="receiptDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.receiptDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="SAP凭证年度" align="center" prop="sapMaterialDocYear" />
        <el-table-column label="SAP物料凭证号" align="center" prop="sapMaterialOrderNo" />
        <el-table-column label="SAP物料文件项次" align="center" prop="sapMaterialItem" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:inventoryDetail:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:inventoryDetail:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改库存明细记录对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="inventoryDetailFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="物料编码/设备编号" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入物料编码/设备编号" />
        </el-form-item>
        <el-form-item label="产品物料名称/设备名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入产品物料名称/设备名称" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="数量-非限制" prop="availableQuantity">
          <el-input v-model="form.availableQuantity" placeholder="请输入数量-非限制" />
        </el-form-item>
        <el-form-item label="数量-质检" prop="inspectionQuantity">
          <el-input v-model="form.inspectionQuantity" placeholder="请输入数量-质检" />
        </el-form-item>
        <el-form-item label="数量-冻结" prop="blockedQuantity">
          <el-input v-model="form.blockedQuantity" placeholder="请输入数量-冻结" />
        </el-form-item>
        <el-form-item label="数量-报废" prop="scrappedQuantity">
          <el-input v-model="form.scrappedQuantity" placeholder="请输入数量-报废" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP" prop="inventoryType">
          <el-select v-model="form.inventoryType" placeholder="请选择库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP">
            <el-option
                v-for="dict in wms_inventory_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="库存状态" prop="inventoryStatus">
          <el-select v-model="form.inventoryStatus" placeholder="请选择库存状态">
            <el-option
                v-for="dict in wms_inventory_status"
                :key="dict.value"
                :label="dict.label"
                :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="入库状态" prop="stockInStatus">
          <el-select v-model="form.stockInStatus" placeholder="请选择入库状态">
            <el-option
                v-for="dict in wms_stock_in_status"
                :key="dict.value"
                :label="dict.label"
                :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="仓库编码" prop="warehouseCode">
          <el-input v-model="form.warehouseCode" placeholder="请输入仓库编码" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="warehouseName">
          <el-input v-model="form.warehouseName" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="库区编码" prop="areaCode">
          <el-input v-model="form.areaCode" placeholder="请输入库区编码" />
        </el-form-item>
        <el-form-item label="库区名称" prop="areaName">
          <el-input v-model="form.areaName" placeholder="请输入库区名称" />
        </el-form-item>
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" />
        </el-form-item>
        <el-form-item label="库位名称" prop="locationName">
          <el-input v-model="form.locationName" placeholder="请输入库位名称" />
        </el-form-item>
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="业务伙伴" prop="businessCode">
          <el-input v-model="form.businessCode" placeholder="请输入业务伙伴" />
        </el-form-item>
        <el-form-item label="业务伙伴名称" prop="businessName">
          <el-input v-model="form.businessName" placeholder="请输入业务伙伴名称" />
        </el-form-item>
        <el-form-item label="接收日期" prop="receiptDate">
          <el-date-picker clearable
            v-model="form.receiptDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择接收日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="SAP凭证年度" prop="sapMaterialDocYear">
          <el-input v-model="form.sapMaterialDocYear" placeholder="请输入SAP凭证年度" />
        </el-form-item>
        <el-form-item label="SAP物料凭证号" prop="sapMaterialOrderNo">
          <el-input v-model="form.sapMaterialOrderNo" placeholder="请输入SAP物料凭证号" />
        </el-form-item>
        <el-form-item label="SAP物料文件项次" prop="sapMaterialItem">
          <el-input v-model="form.sapMaterialItem" placeholder="请输入SAP物料文件项次" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="InventoryDetail" lang="ts">
import { listInventoryDetail, getInventoryDetail, delInventoryDetail, addInventoryDetail, updateInventoryDetail } from '@/api/wms/inventoryDetail';
import { InventoryDetailVO, InventoryDetailQuery, InventoryDetailForm } from '@/api/wms/inventoryDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_status, wms_stock_in_status, wms_inventory_type } = toRefs<any>(proxy?.useDict('wms_inventory_status', 'wms_stock_in_status', 'wms_inventory_type'));

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

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
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
  scrappedQuantity: undefined,
  unit: undefined,
  inventoryType: undefined,
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
  remark: undefined,
}
const data = reactive<PageData<InventoryDetailForm, InventoryDetailQuery>>({
  form: {...initFormData},
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
    scrappedQuantity: undefined,
    unit: undefined,
    inventoryType: undefined,
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
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    itemType: [
      { required: true, message: "材料类型: 1-物料, 2-设备不能为空", trigger: "change" }
    ],
    itemCode: [
      { required: true, message: "物料编码/设备编号不能为空", trigger: "blur" }
    ],
    itemName: [
      { required: true, message: "产品物料名称/设备名称不能为空", trigger: "blur" }
    ],
    batchCode: [
      { required: true, message: "批次号不能为空", trigger: "blur" }
    ],
    availableQuantity: [
      { required: true, message: "数量-非限制不能为空", trigger: "blur" }
    ],
    inspectionQuantity: [
      { required: true, message: "数量-质检不能为空", trigger: "blur" }
    ],
    blockedQuantity: [
      { required: true, message: "数量-冻结不能为空", trigger: "blur" }
    ],
    scrappedQuantity: [
      { required: true, message: "数量-报废不能为空", trigger: "blur" }
    ],
    unit: [
      { required: true, message: "单位不能为空", trigger: "blur" }
    ],
    inventoryType: [
      { required: true, message: "库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP不能为空", trigger: "change" }
    ],
    inventoryStatus: [
      { required: true, message: "库存状态不能为空", trigger: "change" }
    ],
    stockInStatus: [
      { required: true, message: "入库状态不能为空", trigger: "change" }
    ],
    warehouseCode: [
      { required: true, message: "仓库编码不能为空", trigger: "blur" }
    ],
    warehouseName: [
      { required: true, message: "仓库名称不能为空", trigger: "blur" }
    ],
    areaCode: [
      { required: true, message: "库区编码不能为空", trigger: "blur" }
    ],
    areaName: [
      { required: true, message: "库区名称不能为空", trigger: "blur" }
    ],
    locationCode: [
      { required: true, message: "库位编码不能为空", trigger: "blur" }
    ],
    locationName: [
      { required: true, message: "库位名称不能为空", trigger: "blur" }
    ],
    palletCode: [
      { required: true, message: "栈板编号不能为空", trigger: "blur" }
    ],
    businessCode: [
      { required: true, message: "业务伙伴不能为空", trigger: "blur" }
    ],
    businessName: [
      { required: true, message: "业务伙伴名称不能为空", trigger: "blur" }
    ],
    receiptDate: [
      { required: true, message: "接收日期不能为空", trigger: "blur" }
    ],
    sapMaterialDocYear: [
      { required: true, message: "SAP凭证年度不能为空", trigger: "blur" }
    ],
    sapMaterialOrderNo: [
      { required: true, message: "SAP物料凭证号不能为空", trigger: "blur" }
    ],
    sapMaterialItem: [
      { required: true, message: "SAP物料文件项次不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询库存明细记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInventoryDetail(queryParams.value);
  inventoryDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  inventoryDetailFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: InventoryDetailVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加库存明细记录";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: InventoryDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getInventoryDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改库存明细记录";
}

/** 提交按钮 */
const submitForm = () => {
  inventoryDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateInventoryDetail(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addInventoryDetail(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: InventoryDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除库存明细记录编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delInventoryDetail(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/inventoryDetail/export', {
    ...queryParams.value
  }, `inventoryDetail_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
