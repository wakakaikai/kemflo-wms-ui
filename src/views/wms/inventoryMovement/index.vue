<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="移动类型" prop="moveType">
              <el-select v-model="queryParams.moveType" placeholder="请选择移动类型" filterable clearable style="width: 100%">
                <el-option v-for="dict in wms_inventory_move_type" :key="dict.value" :label="dict.value + ' - ' + dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="库存方向" prop="inventoryDirection">
              <el-select v-model="queryParams.inventoryDirection" placeholder="请选择库存方向" filterable clearable style="width: 100%">
                <el-option v-for="dict in wms_inventory_direction" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="物料编码" prop="itemCode">
              <HistoryInput v-model="queryParams.itemCode" :config="itemCodeConfig" placeholder="请输入物料编码" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库编码" prop="warehouseCode">
              <HistoryInput v-model="queryParams.warehouseCode" :config="warehouseCodeConfig" placeholder="请输入仓库编码" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
              <HistoryInput v-model="queryParams.sapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入SAP物料凭证号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="移动时间" prop="dateTimeRange">
              <el-date-picker v-model="queryParams.dateTimeRange" type="datetimerange" :shortcuts="shortcuts" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]" />
            </el-form-item>
            <div v-show="showAdvancedSearch">
              <el-form-item label="批次号" prop="batchCode">
                <HistoryInput v-model="queryParams.batchCode" :config="batchCodeConfig" placeholder="请输入批次号" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="单据编号" prop="sourceDocCode">
                <HistoryInput v-model="queryParams.sourceDocCode" :config="sourceDocCodeConfig" placeholder="请输入单据编号" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="库位编码" prop="locationCode">
                <HistoryInput v-model="queryParams.locationCode" :config="locationCodeConfig" placeholder="请输入库位编码" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="栈板编号" prop="palletCode">
                <HistoryInput v-model="queryParams.palletCode" :config="palletCodeConfig" placeholder="请输入栈板编号" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
                <el-select v-model="queryParams.specialInventoryFlag" placeholder="请选择特殊库存标识" filterable clearable style="width: 100%">
                  <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="凭证年度" prop="sapMaterialDocYear">
                <HistoryInput v-model="queryParams.sapMaterialDocYear" :config="sapMaterialDocYearConfig" placeholder="请输入SAP凭证年度" @keyup.enter="handleQuery" />
              </el-form-item>
            </div>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
              <el-button link type="primary" @click="toggleAdvancedSearch">
                {{ showAdvancedSearch ? '收起' : '高级搜索' }}
                <el-icon class="el-icon--right">
                  <ArrowDown v-if="!showAdvancedSearch" />
                  <ArrowUp v-else />
                </el-icon>
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:inventoryMovement:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:inventoryMovement:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:inventoryMovement:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:inventoryMovement:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="inventoryMovementList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="移动记录ID" align="center" prop="id" v-if="true" />-->
        <el-table-column v-if="columns[0].visible" label="移动类型" align="center" prop="moveType">
<!--          <template #default="scope">-->
<!--            <dict-tag :options="wms_inventory_move_type" :value="scope.row.moveType" />-->
<!--          </template>-->
        </el-table-column>
        <el-table-column v-if="columns[1].visible" label="移动时间" align="center" prop="moveDate" width="180" />
        <el-table-column v-if="columns[2].visible" label="追踪ID" align="center" prop="traceId" />
        <el-table-column v-if="columns[3].visible" label="物料编码" align="center" prop="itemCode" />
        <el-table-column v-if="columns[4].visible" label="物料名称" align="center" prop="itemName" :show-overflow-tooltip="true" />
        <el-table-column v-if="columns[5].visible" label="批次号" align="center" prop="batchCode" />
        <el-table-column v-if="columns[6].visible" label="库存方向" align="center" prop="inventoryDirection">
          <template #default="scope">
            <dict-tag :options="wms_inventory_direction" :value="scope.row.inventoryDirection" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[7].visible" label="数量" align="center" prop="quantity">
          <template #default="{ row }">{{ formatQty(row.quantity) }}</template>
        </el-table-column>
        <el-table-column v-if="columns[8].visible" label="基本单位" align="center" prop="unit" />
        <el-table-column v-if="columns[9].visible" label="单据类型" align="center" prop="sourceDocType" />
        <el-table-column v-if="columns[10].visible" label="单据编号" align="center" prop="sourceDocCode" />
        <el-table-column v-if="columns[11].visible" label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column v-if="columns[12].visible" label="库区编码" align="center" prop="areaCode" />
        <el-table-column v-if="columns[13].visible" label="库位编码" align="center" prop="locationCode" />
        <el-table-column v-if="columns[14].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[15].visible" label="业务伙伴" align="center" prop="businessCode" />
        <el-table-column v-if="columns[16].visible" label="伙伴名称" align="center" prop="businessName" />
        <el-table-column v-if="columns[17].visible" label="凭证年度" align="center" prop="sapMaterialDocYear" />
        <el-table-column v-if="columns[18].visible" label="物料凭证号" align="center" prop="sapMaterialOrderNo" />
        <el-table-column v-if="columns[19].visible" label="凭证项次" align="center" prop="sapMaterialItem" />
        <el-table-column v-if="columns[20].visible" label="检验批号" align="center" prop="sapInspectionNo" />
        <el-table-column v-if="columns[21].visible" label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column v-if="columns[22].visible" label="创建者" align="center" prop="createByName" />
        <el-table-column v-if="columns[23].visible" label="更新时间" align="center" prop="updateTime" width="180" />
        <el-table-column v-if="columns[24].visible" label="更新者" align="center" prop="updateByName" />
        <el-table-column v-if="columns[25].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:inventoryMovement:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:inventoryMovement:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改库存移动记录对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="inventoryMovementFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="物料编码" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="库存方向" prop="inventoryDirection">
          <el-select v-model="form.inventoryDirection" placeholder="请选择库存方向" filterable clearable style="width: 100%">
            <el-option v-for="dict in wms_inventory_direction" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联的移动ID" prop="relatedMoveId">
          <el-input v-model="form.relatedMoveId" placeholder="请输入关联的移动ID" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input v-model="form.quantity" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="基本单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入基本单位" />
        </el-form-item>
        <el-form-item label="单据编号" prop="sourceDocCode">
          <el-input v-model="form.sourceDocCode" placeholder="请输入单据编号" />
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
        <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
          <el-input v-model="form.specialInventoryFlag" placeholder="请输入特殊库存标识" />
        </el-form-item>
        <el-form-item label="移动时间" prop="moveDate">
          <el-date-picker clearable v-model="form.moveDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择移动时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="业务伙伴" prop="businessCode">
          <el-input v-model="form.businessCode" placeholder="请输入业务伙伴" />
        </el-form-item>
        <el-form-item label="伙伴名称" prop="businessName">
          <el-input v-model="form.businessName" placeholder="请输入伙伴名称" />
        </el-form-item>
        <el-form-item label="凭证年度" prop="sapMaterialDocYear">
          <el-input v-model="form.sapMaterialDocYear" placeholder="请输入SAP凭证年度" />
        </el-form-item>
        <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
          <el-input v-model="form.sapMaterialOrderNo" placeholder="请输入SAP物料凭证号" />
        </el-form-item>
        <el-form-item label="凭证项次" prop="sapMaterialItem">
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

<script setup name="InventoryMovement" lang="ts">
import { listInventoryMovement, getInventoryMovement, delInventoryMovement, addInventoryMovement, updateInventoryMovement } from '@/api/wms/inventoryMovement';
import { InventoryMovementVO, InventoryMovementQuery, InventoryMovementForm } from '@/api/wms/inventoryMovement/types';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { ref } from 'vue';
import { formatQty } from '@/utils/ruoyi';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag, wms_inventory_type, wms_inventory_direction, wms_inventory_move_type } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag', 'wms_inventory_type', 'wms_inventory_direction', 'wms_inventory_move_type'));
const inventoryMovementList = ref<InventoryMovementVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const showAdvancedSearch = ref(false);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const inventoryMovementFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: InventoryMovementForm = {
  id: undefined,
  moveType: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  inventoryDirection: undefined,
  relatedMoveId: undefined,
  quantity: undefined,
  unit: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  areaCode: undefined,
  areaName: undefined,
  locationCode: undefined,
  locationName: undefined,
  palletCode: undefined,
  packingCode: undefined,
  specialInventoryFlag: undefined,
  moveDate: undefined,
  businessCode: undefined,
  businessName: undefined,
  sapMaterialDocYear: undefined,
  sapMaterialOrderNo: undefined,
  sapMaterialItem: undefined,
  remark: undefined
};
const data = reactive<PageData<InventoryMovementForm, InventoryMovementQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    moveType: undefined,
    itemCode: undefined,
    itemName: undefined,
    batchCode: undefined,
    inventoryDirection: undefined,
    relatedMoveId: undefined,
    quantity: undefined,
    unit: undefined,
    sourceDocType: undefined,
    sourceDocCode: undefined,
    warehouseCode: undefined,
    warehouseName: undefined,
    areaCode: undefined,
    areaName: undefined,
    locationCode: undefined,
    locationName: undefined,
    palletCode: undefined,
    packingCode: undefined,
    specialInventoryFlag: undefined,
    dateTimeRange: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

// 快捷时间选择
const shortcuts = [
  { text: '今天', value: () => [new Date(new Date().toDateString()), new Date(new Date().toDateString() + ' 23:59:59')] },
  {
    text: '昨天',
    value: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return [start, end];
    }
  },
  {
    text: '最近3天',
    value: () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      return [start, end];
    }
  },
  {
    text: '最近7天',
    value: () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return [start, end];
    }
  },
  {
    text: '最近30天',
    value: () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      return [start, end];
    }
  }
];

// 搜索历史记录配置
const itemCodeConfig: HistoryConfig = {
  key: 'itemCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const warehouseCodeConfig: HistoryConfig = {
  key: 'warehouseCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sapMaterialOrderNoConfig: HistoryConfig = {
  key: 'sapMaterialOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const batchCodeConfig: HistoryConfig = {
  key: 'batchCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sourceDocCodeConfig: HistoryConfig = {
  key: 'sourceDocCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const locationCodeConfig: HistoryConfig = {
  key: 'locationCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const palletCodeConfig: HistoryConfig = {
  key: 'palletCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sapMaterialDocYearConfig: HistoryConfig = {
  key: 'sapMaterialDocYear',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryMovement',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const columns = ref<FieldOption[]>([
  { key: 0, label: `移动类型`, visible: true, children: [] },
  { key: 1, label: `移动时间`, visible: true, children: [] },
  { key: 2, label: `追踪ID`, visible: false, children: [] },
  { key: 3, label: `物料编码`, visible: true, children: [] },
  { key: 4, label: `物料名称`, visible: true, children: [] },
  { key: 5, label: `批次号`, visible: true, children: [] },
  { key: 6, label: `库存方向`, visible: true, children: [] },
  { key: 7, label: `数量`, visible: true, children: [] },
  { key: 8, label: `基本单位`, visible: false, children: [] },
  { key: 9, label: `单据类型`, visible: false, children: [] },
  { key: 10, label: `单据编号`, visible: true, children: [] },
  { key: 11, label: `仓库编码`, visible: false, children: [] },
  { key: 12, label: `库区编码`, visible: false, children: [] },
  { key: 13, label: `库位编码`, visible: true, children: [] },
  { key: 14, label: `栈板编号`, visible: true, children: [] },
  { key: 15, label: `业务伙伴`, visible: false, children: [] },
  { key: 16, label: `伙伴名称`, visible: false, children: [] },
  { key: 17, label: `凭证年度`, visible: false, children: [] },
  { key: 18, label: `物料凭证号`, visible: true, children: [] },
  { key: 19, label: `凭证项次`, visible: false, children: [] },
  { key: 20, label: `检验批号`, visible: false, children: [] },
  { key: 21, label: `创建时间`, visible: false, children: [] },
  { key: 22, label: `创建者`, visible: false, children: [] },
  { key: 23, label: `更新时间`, visible: false, children: [] },
  { key: 24, label: `更新者`, visible: false, children: [] },
  { key: 25, label: `备注`, visible: false, children: [] }
]);

/** 查询库存移动记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInventoryMovement(queryParams.value);
  inventoryMovementList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 移动时间范围变更 */
const handleDateTimeRangeChange = (val: [string, string] | null) => {
  if (val) {
    queryParams.value.params.moveStartTime = val[0];
    queryParams.value.params.moveEndTime = val[1];
  } else {
    queryParams.value.params.moveStartTime = undefined;
    queryParams.value.params.moveEndTime = undefined;
  }
  handleQuery();
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  inventoryMovementFormRef.value?.resetFields();
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

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: InventoryMovementVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加库存移动记录';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: InventoryMovementVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getInventoryMovement(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改库存移动记录';
};

/** 提交按钮 */
const submitForm = () => {
  inventoryMovementFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateInventoryMovement(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addInventoryMovement(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: InventoryMovementVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除库存移动记录编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delInventoryMovement(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/inventoryMovement/export',
    {
      ...queryParams.value
    },
    `inventoryMovement_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
