<template>
  <div class="p-2 item-bom-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px] search-container">
        <el-card shadow="never" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="BOM料号" prop="bomItem" :rules="[{ required: true, message: 'BOM料号不能为空', trigger: 'blur' }]">
              <HistoryInput v-model.trim="queryParams.bomItem" :config="bomItemConfig" placeholder="请输入BOM料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="组件料号" prop="componentItem">
              <HistoryInput v-model.trim="queryParams.componentItem" :config="componentItemConfig" placeholder="请输入组件料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never" class="bom-main-card">
      <template #header>
        <el-row :gutter="12" class="mb8 bom-toolbar-row">
          <!--          <el-col :span="1.5">
                      <el-button :type="isEditMode ? 'warning' : 'primary'" plain :icon="isEditMode ? 'Close' : 'Edit'" @click="toggleEditMode">
                        {{ isEditMode ? '取消编辑模式' : '开启编辑模式' }}
                      </el-button>
                    </el-col>-->
          <el-col :span="1.5">
            <el-button type="success" plain icon="Check" :loading="buttonLoading" @click="saveInlineEdit" v-hasPermi="['mes:itemBomComponent:save']">保存</el-button>
          </el-col>
          <!--          <el-col :span="1.5">
                      <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:itemBomComponent:edit']">修改</el-button>
                    </el-col>-->
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:itemBomComponent:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="CircleCheck" @click="openSnRegexTestDialog">正则测试</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:itemBomComponent:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" class="bom-component-table" :class="{ 'bom-row-sortable': isEditMode }" border :data="displayTableData" table-layout="fixed" style="width: 100%" @selection-change="handleSelectionChange" row-key="id" :row-class-name="tableRowClassName" id="bomItemComponentTable">
        <el-table-column v-if="isEditMode" width="44" align="center" class-name="bom-drag-column">
          <template #header>
            <span class="text-gray-400 text-xs"></span>
          </template>
          <template #default>
            <span class="bom-row-drag-handle" title="拖拽排序" aria-label="拖拽排序">⠿</span>
          </template>
        </el-table-column>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[2].visible" label="顺序号" align="center" prop="sequence" width="88">
          <template #default="scope">
            <el-input v-if="isEditMode" v-model.trim="scope.row.sequence" class="bom-cell-input" placeholder="顺序号" />
            <span v-else>{{ scope.row.sequence }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[0].visible" label="BOM料号" align="center" prop="bomItem" width="120" show-overflow-tooltip />
        <el-table-column v-if="columns[1].visible" label="组件料号" align="center" prop="componentItem" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <el-input v-if="isEditMode" v-model.trim="scope.row.componentItem" class="bom-cell-input" placeholder="组件料号" />
            <span v-else class="bom-ellipsis">{{ scope.row.componentItem }}</span>
          </template>
        </el-table-column>

        <el-table-column v-if="columns[3].visible" label="组件类型" align="center" prop="type" width="108">
          <template #default="scope">
            <el-select v-if="isEditMode" v-model.trim="scope.row.type" class="bom-cell-select" placeholder="类型">
              <el-option v-for="dict in mes_bom_component_type" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
            </el-select>
            <dict-tag v-else :options="mes_bom_component_type" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column label="校验配置" align="center" width="100">
          <template #default="scope">
            <el-button v-if="scope.row.type === 2" link type="primary" @click="openBarcodeRuleDialog(scope.row)"> 配置({{ scope.row.barcodeCheckRuleList?.length || 0 }})</el-button>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[4].visible" label="组件数量" align="center" prop="quantity" width="128">
          <template #default="scope">
            <el-input-number v-if="isEditMode" v-model="scope.row.quantity" class="bom-qty-input" :min="1" :max="100" :step="1" controls-position="right" />
            <span v-else>{{ scope.row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[5].visible" label="组件工序" align="center" prop="operation" width="100" show-overflow-tooltip>
          <template #default="scope">
            <el-input v-if="isEditMode" v-model="scope.row.operation" class="bom-cell-input" placeholder="工序" />
            <span v-else>{{ scope.row.operation }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[6].visible" label="条码规则" align="center" prop="snRegex" min-width="100">
          <template #default="scope">
            <el-input v-model.trim="scope.row.snRegex" class="bom-cell-input" placeholder="条码规则" clearable />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[7].visible" label="备注" align="center" prop="remark" width="88" show-overflow-tooltip>
          <template #default="scope">
            <el-input v-if="isEditMode" v-model="scope.row.remark" class="bom-cell-input" placeholder="备注" />
            <span v-else>{{ scope.row.remark }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[8].visible" label="创建者" align="center" prop="creator" />
        <el-table-column v-if="columns[9].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[10].visible" label="更新者" align="center" prop="updater" />
        <el-table-column v-if="columns[11].visible" label="更新时间" align="center" prop="modifyTime" />
        <el-table-column label="操作" align="center" width="56" class-name="small-padding bom-op-column">
          <template #default="scope">
            <el-tooltip content="删除" placement="top">
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:itemBomComponent:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-add-strip">
        <el-tooltip content="新增行" placement="top">
          <el-button class="table-add-icon-btn" type="primary" circle icon="Plus" @click="handleAddInline" />
        </el-tooltip>
      </div>
    </el-card>

    <!-- 工单号同步区域 -->
    <el-card shadow="never" class="shop-order-sync-card">
      <template #header>
        <div class="shop-order-sync-header">
          <span class="shop-order-sync-title">工单号同步</span>
          <div class="shop-order-sync-toolbar">
            <el-input v-model="shopOrderQueryParams.shopOrder" class="shop-order-search-input" placeholder="请输入工单" clearable @keyup.enter="handleShopOrderQuery" />
            <div class="shop-order-sync-actions">
              <el-button type="primary" icon="Search" @click="handleShopOrderQuery">搜索</el-button>
              <el-button :loading="buttonLoading" type="success" icon="Refresh" @click="syncSelectedOrders" v-hasPermi="['mes:shopOrderBomComponent:save']">同步</el-button>
            </div>
          </div>
        </div>
      </template>

      <el-table ref="workOrderTableRef" v-loading="tableLoading" stripe class="shop-order-table" table-layout="fixed" style="width: 100%" :data="shopOrderList" @selection-change="handleWorkOrderSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工单" align="center" prop="shopOrder" width="140" fixed />
        <el-table-column label="状态" align="center" prop="statusDesc" />
        <el-table-column label="工单类型" align="center" prop="shopOrderTypeDesc" />
        <el-table-column label="计划工作中心" align="center" prop="plannedWorkCenter" width="180" />
        <el-table-column label="计划物料" align="center" prop="plannedItem" width="180" />
        <el-table-column label="描述" align="left" prop="itemDesc" min-width="120" show-overflow-tooltip />
        <el-table-column label="计划工艺路线" align="center" prop="plannedRouter" width="180" />
        <el-table-column label="计划数量" align="center" prop="qtyToBuild" />
      </el-table>

      <pagination v-show="shopOrderTotal > 0" :total="shopOrderTotal" v-model:page="shopOrderQueryParams.pageNum" v-model:limit="shopOrderQueryParams.pageSize" @pagination="handleShopOrderQuery" />
    </el-card>

    <!-- 原有的弹窗保持不变，用于批量修改 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="itemBomComponentFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="BOM料号" prop="bomItem">
          <el-input v-model="form.bomItem" placeholder="请输入BOM料号" />
        </el-form-item>
        <el-form-item label="组件料号" prop="componentItem">
          <el-input v-model="form.componentItem" placeholder="请输入组件料号" />
        </el-form-item>
        <el-form-item label="顺序号" prop="sequence">
          <el-input v-model="form.sequence" placeholder="请输入顺序号" />
        </el-form-item>
        <el-form-item label="组件类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择组件类型">
            <el-option v-for="dict in mes_bom_component_type" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="组件数量" prop="quantity">
          <el-input-number v-model="form.quantity" placeholder="请输入组件数量" size="small" :min="1" :max="100" :step="1" :precision="3" />
        </el-form-item>
        <el-form-item label="组件工序" prop="operation">
          <el-input v-model="form.operation" placeholder="请输入组件工序" />
        </el-form-item>
        <el-form-item label="条码规则" prop="snRegex">
          <el-input v-model="form.snRegex" placeholder="请输入条码规则" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <BarcodeRuleConfigDialog v-model:visible="barcodeRuleDialogVisible" :row="barcodeRuleDialogRow" :barcode-check-type-options="mes_barcode_check_type" />

    <SnRegexTestDialog v-model:visible="snRegexTestVisible" :default-regex="snRegexTestDefaultRegex" :default-content="snRegexTestDefaultContent" />
  </div>
</template>

<script setup name="ItemBomComponent" lang="ts">
import { addBatchItemBomComponent, addItemBomComponent, getItemBomComponent, listItemBomComponent, updateItemBomComponent } from '@/api/mes/itemBomComponent';
import { ItemBomComponentForm, ItemBomComponentQuery, ItemBomComponentVO } from '@/api/mes/itemBomComponent/types';

import { listShopOrder } from '@/api/mes/shopOrder';
import { ShopOrderForm, ShopOrderQuery } from '@/api/mes/shopOrder/types';

import { computed, nextTick, ref } from 'vue';
import { enableRowDrop } from '@/utils/sortable';
import HistoryInput from '@/components/HistoryInput/index.vue';
import BarcodeRuleConfigDialog from './components/BarcodeRuleConfigDialog.vue';
import SnRegexTestDialog from './components/SnRegexTestDialog.vue';
import { HistoryConfig } from '@/types/history';
import { addBatchShopOrderBomComponent } from '@/api/mes/shopOrderBomComponent';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_bom_component_type, mes_barcode_check_type } = toRefs<any>(proxy?.useDict('mes_bom_component_type', 'mes_barcode_check_type'));

const itemBomComponentList = ref<ItemBomComponentVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(false);
const tableLoading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
// 默认编辑模式（同时启用行拖拽排序）
const isEditMode = ref(true);
// 排序完后的id数组
const realSortIdArray = ref<number[]>([]);

// 工单相关
const shopOrderList = ref<any[]>([]);
const shopOrderTotal = ref(0);
const selectedWorkOrders = ref<any[]>([]);
const workOrderTableRef = ref();

const queryFormRef = ref<ElFormInstance>();
const itemBomComponentFormRef = ref<ElFormInstance>();

const snRegexTestVisible = ref(false);
const snRegexTestDefaultRegex = ref('');
const snRegexTestDefaultContent = ref('');

const openSnRegexTestDialog = () => {
  if (ids.value.length === 1) {
    const row = itemBomComponentList.value.find((item) => item.id === ids.value[0]);
    snRegexTestDefaultRegex.value = row?.snRegex || '';
    snRegexTestDefaultContent.value = row?.componentItem || '';
  } else {
    snRegexTestDefaultRegex.value = '';
    snRegexTestDefaultContent.value = '';
  }
  snRegexTestVisible.value = true;
};

const barcodeRuleDialogVisible = ref(false);
const barcodeRuleDialogRow = ref<ItemBomComponentVO>();

const openBarcodeRuleDialog = (row: ItemBomComponentVO) => {
  barcodeRuleDialogRow.value = row;
  barcodeRuleDialogVisible.value = true;
};

// 计算属性：包含编辑行的完整表格数据
const displayTableData = computed(() => {
  return [...itemBomComponentList.value];
});

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ItemBomComponentForm = {
  id: undefined,
  bomItem: undefined,
  componentItem: undefined,
  sequence: undefined,
  type: undefined,
  quantity: undefined,
  operation: undefined,
  snRegex: undefined,
  remark: undefined,
  creator: undefined,
  updater: undefined,
  modifyTime: undefined,
  deleteFlag: undefined,
  belongOrgId: undefined,
  tenantOrgId: undefined
};

const data = reactive<PageData<ItemBomComponentForm, ItemBomComponentQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 1000,
    bomItem: undefined,
    componentItem: undefined,
    sequence: undefined,
    type: undefined,
    quantity: undefined,
    operation: undefined,
    snRegex: undefined,
    creator: undefined,
    updater: undefined,
    modifyTime: undefined,
    deleteFlag: undefined,
    belongOrgId: undefined,
    tenantOrgId: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    bomItem: [{ required: true, message: 'BOM料号不能为空', trigger: 'blur' }],
    componentItem: [{ required: true, message: '组件料号不能为空', trigger: 'blur' }],
    sequence: [{ required: true, message: '顺序号不能为空', trigger: 'blur' }],
    type: [{ required: true, message: '组件类型0：唯一码 1：固定码不能为空', trigger: 'change' }],
    quantity: [{ required: true, message: '组件数量不能为空', trigger: 'blur' }],
    operation: [{ required: true, message: '组件工序不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 工单同步区查询（扩展列表筛选字段） */
type ShopOrderSyncQuery = ShopOrderQuery & {
  plannedItem?: string;
};

interface ItemBomShopOrderState {
  shopOrderForm: ShopOrderForm;
  shopOrderQueryParams: ShopOrderSyncQuery;
}

const initShopOrderFormData: ShopOrderForm = {
  id: undefined,
  handle: undefined,
  shopOrder: undefined,
  sample: false,
  status: undefined,
  statusList: [],
  shopOrderType: undefined,
  shopOrderTypeList: [],
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
  remark: undefined
};

const shopOrderData = reactive<ItemBomShopOrderState>({
  shopOrderForm: { ...initShopOrderFormData },
  shopOrderQueryParams: {
    pageNum: 1,
    pageSize: 20,
    handle: undefined,
    shopOrder: undefined,
    status: undefined,
    statusList: [],
    shopOrderType: undefined,
    shopOrderTypeList: [],
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
  }
});

const { shopOrderQueryParams } = toRefs(shopOrderData);

const columns = ref<FieldOption[]>([
  { key: 1, label: 'BOM料号', visible: true },
  { key: 2, label: '组件料号', visible: true },
  { key: 3, label: '顺序号', visible: true },
  { key: 4, label: '组件类型', visible: true },
  { key: 5, label: '组件数量', visible: true },
  { key: 6, label: '组件工序', visible: true },
  { key: 7, label: '条码规则', visible: true },
  { key: 8, label: '备注', visible: false },
  { key: 9, label: '创建者', visible: false },
  { key: 10, label: '创建时间', visible: false },
  { key: 11, label: '更新者', visible: false },
  { key: 12, label: '更新时间', visible: false }
]);

const bomItemConfig: HistoryConfig = {
  key: 'bomItem',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'itemBomComponent',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const componentItemConfig: HistoryConfig = {
  key: 'componentItem',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'itemBomComponent',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

/** 查询物料BOM组件列表 */
const getList = async () => {
  loading.value = true;
  const res = await listItemBomComponent(queryParams.value);
  itemBomComponentList.value = res.rows.map((row) => ({
    ...row,
    isEditing: isEditMode.value
  }));
  total.value = res.total;
  loading.value = false;
  syncTableRowDrag();
};

/**
 * 拿到传递过来的数组列表
 * @param sortArray 排序好的id数组
 */
const setNewSortArray = (sortArray: number[]) => {
  if (!sortArray?.length) {
    return;
  }
  realSortIdArray.value = sortArray;
  const rowMap = new Map(itemBomComponentList.value.map((row) => [row.id, row]));
  itemBomComponentList.value = sortArray.map((id) => rowMap.get(id)).filter((row): row is ItemBomComponentVO => !!row);
  sortArray.forEach((id, index) => {
    const targetRow = rowMap.get(id);
    if (targetRow) {
      targetRow.sequence = (index + 1) * 10;
    }
  });
};

/** 编辑模式下启用表格行拖拽排序 */
const syncTableRowDrag = () => {
  void nextTick(() => {
    enableRowDrop(setNewSortArray, itemBomComponentList.value, isEditMode.value, 'bomItemComponentTable', '.bom-row-drag-handle');
  });
};

/** 表格行样式类名 */
const tableRowClassName = () => {
  return isEditMode.value ? 'editing-row' : '';
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  itemBomComponentFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      queryParams.value.pageNum = 1;
      shopOrderQueryParams.value.pageNum = 1;
      await getList();
      await handleShopOrderQuery();
    }
  });
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  itemBomComponentList.value = [];
  queryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      handleQuery();
    }
  });
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: ItemBomComponentVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增行到表格 */
const handleAddInline = () => {
  queryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      const newRow: any = {
        id: Date.now(), // 临时ID
        bomItem: queryParams.value.bomItem,
        componentItem: '',
        sequence: displayTableData.value.length * 10 + 10,
        type: 0,
        quantity: 1,
        operation: '',
        snRegex: '',
        remark: '',
        isEditing: true,
        isNew: true // 标识为新行
      };
      itemBomComponentList.value.push(newRow);
      if (isEditMode.value) {
        syncTableRowDrag();
      }
    }
  });
};

/** 编辑表格中的行 */
const handleEditInline = (row: ItemBomComponentVO) => {
  const index = itemBomComponentList.value.findIndex((item) => item.id === row.id);
  if (index > -1) {
    itemBomComponentList.value[index].isEditing = true;
  }
};

/** 取消单行编辑 */
const cancelInlineRow = (row: any) => {
  row.isEditing = false;
};

/** 保存单行编辑 */
const validateForm = () => {
  // 遍历所有BOM组件列表进行验证
  for (let i = 0; i < itemBomComponentList.value.length; i++) {
    const item = itemBomComponentList.value[i];
    console.log(item);
    // 验证必填字段
    if (!item.sequence) {
      proxy.$modal.msgError(`第${i + 1}行：顺序号不能为空`);
      return false;
    }

    if (!item.bomItem) {
      proxy.$modal.msgError(`第${i + 1}行：BOM料号不能为空`);
      return false;
    }

    if (!item.componentItem) {
      proxy.$modal.msgError(`第${i + 1}行：组件料号不能为空`);
      return false;
    }

    if (!item.quantity) {
      proxy.$modal.msgError(`第${i + 1}行：组件数量必须大于0`);
      return false;
    }

    if (!item.operation) {
      proxy.$modal.msgError(`第${i + 1}行：组件工序不能为空`);
      return false;
    }

    if (item.type === 2 && (!item.barcodeCheckRuleList || item.barcodeCheckRuleList.length === 0)) {
      proxy.$modal.msgError(`第${i + 1}行：SN校验类型必须配置至少一个校验项`);
      return false;
    }

    // 验证数字类型字段
    if (isNaN(item.sequence)) {
      proxy.$modal.msgError(`第${i + 1}行：顺序号必须为数字`);
      return false;
    }
  }
  return true;
};

/** 批量保存编辑 */
const saveInlineEdit = async () => {
  if (!queryParams.value.bomItem) return;

  // 校验表单数据
  if (!validateForm()) return;

  try {
    buttonLoading.value = true;
    const submitData = itemBomComponentList.value.map((row) => {
      if (row.isNew) {
        // 新增数据：移除临时属性
        const { id, isEditing, isNew, ...saveData } = row;
        return saveData;
      } else {
        // 编辑数据：只移除编辑状态属性
        const { isEditing, ...saveData } = row;
        return saveData;
      }
    });

    await addBatchItemBomComponent({
      bomItem: queryParams.value.bomItem,
      itemBomComponentBoList: submitData
    });
    proxy?.$modal.msgSuccess('批量保存成功');
    handleQuery(); // 重新加载数据
  } catch (error) {
    proxy?.$modal.msgError('批量保存失败');
  } finally {
    buttonLoading.value = false;
  }
};

/** 取消编辑 */
const toggleEditMode = () => {
  if (isEditMode.value) {
    // 当前是编辑模式，执行取消操作
    itemBomComponentList.value = itemBomComponentList.value.map((row) => ({
      ...row,
      isEditing: false
    }));
    isEditMode.value = false;
  } else {
    // 当前是非编辑模式，进入编辑模式
    if (itemBomComponentList.value.length > 0) {
      // 如果有数据，将所有行设置为编辑模式
      itemBomComponentList.value = itemBomComponentList.value.map((row) => ({
        ...row,
        isEditing: true
      }));
    } else {
      // 如果没有数据，添加一个新行并进入编辑模式
      handleAddInline();
    }
    isEditMode.value = true;
  }
  syncTableRowDrag();
};

/** 修改按钮操作（弹窗模式） */
const handleUpdate = async (row?: ItemBomComponentVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getItemBomComponent(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改物料BOM组件';
};

/** 提交按钮（弹窗模式） */
const submitForm = () => {
  itemBomComponentFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateItemBomComponent(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addItemBomComponent(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ItemBomComponentVO) => {
  if (row?.id) {
    const index = itemBomComponentList.value.findIndex((item) => item.id === row?.id);
    if (index > -1) {
      itemBomComponentList.value.splice(index, 1);
    }
  }
  if (ids.value) {
    ids.value.forEach((id) => {
      const index = itemBomComponentList.value.findIndex((item) => item.id === id);
      if (index > -1) {
        itemBomComponentList.value.splice(index, 1);
      }
    });
  }
  // proxy?.$modal.msgSuccess(Array.isArray(_ids) ? `成功删除 ${_ids.length} 条记录` : '删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/itemBomComponent/export',
    {
      ...queryParams.value
    },
    `itemBomComponent_${new Date().getTime()}.xlsx`
  );
};

// 工单相关方法
/** 刷新工单列表 */
const handleShopOrderQuery = async () => {
  try {
    if (!queryParams.value.bomItem) {
      proxy?.$modal.msgWarning('请先填写BOM料号');
      return;
    }
    tableLoading.value = true;
    shopOrderQueryParams.value.statusList = ['NEW', 'RELEASABLE', 'RELEASED', 'ACTIVE'];
    shopOrderQueryParams.value.shopOrderTypeList = ['PRODUCTION', 'PRODUCTION-ZZ', 'REWORK', 'REWORK-CJ'];
    shopOrderQueryParams.value.plannedItem = queryParams.value.bomItem;
    const res = await listShopOrder(shopOrderQueryParams.value);
    shopOrderList.value = res.rows;
    shopOrderTotal.value = res.total;
  } catch (error) {
    proxy?.$modal.msgError('刷新失败');
  } finally {
    tableLoading.value = false;
  }
};

/** 工单选择变更 */
const handleWorkOrderSelectionChange = (selection: any[]) => {
  selectedWorkOrders.value = selection;
};

/** 同步选中工单 */
const syncSelectedOrders = async () => {
  if (selectedWorkOrders.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要同步的工单');
    return;
  }

  try {
    buttonLoading.value = true;
    console.log('同步工单：', selectedWorkOrders.value);
    await addBatchShopOrderBomComponent({ shopOrderBoList: selectedWorkOrders.value }).finally(() => (buttonLoading.value = false));
    // 清空选择
    workOrderTableRef.value?.clearSelection();
    selectedWorkOrders.value = [];

    proxy?.$modal.msgSuccess('同步完成');
  } catch (error) {
    proxy?.$modal.msgError('同步失败');
  }
};

onMounted(() => {
  itemBomComponentList.value = [];
  handleQuery();
  nextTick(() => {
    queryFormRef.value?.resetFields();
  });
});
</script>

<style lang="scss" scoped>
.item-bom-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bom-main-card :deep(.el-card__body) {
  padding-top: 12px;
  padding-bottom: 8px;
}

.bom-toolbar-row {
  row-gap: 8px;
}

.shop-order-sync-card {
  margin-top: 4px;
}

.shop-order-sync-card :deep(.el-card__body) {
  padding-top: 8px;
}

.shop-order-sync-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
}

.shop-order-sync-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.shop-order-sync-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px 12px;
  flex: 1;
  min-width: 260px;
}

.shop-order-search-input {
  width: min(320px, 100%);
}

.shop-order-sync-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.bom-component-table {
  width: 100%;
}

.bom-row-drag-handle {
  cursor: grab;
  font-size: 18px;
  color: var(--el-text-color-secondary);
  vertical-align: middle;
}

.bom-row-drag-handle:active {
  cursor: grabbing;
}

.bom-row-sortable :deep(.el-table__body tbody tr.sortable-chosen) .bom-row-drag-handle,
.bom-row-sortable :deep(.el-table__body tbody tr.sortable-ghost) .bom-row-drag-handle {
  cursor: grabbing;
}

.bom-component-table :deep(.bom-drag-column .cell) {
  padding-left: 4px;
  padding-right: 4px;
}

.bom-component-table :deep(.el-table__cell) {
  padding: 10px 8px;
  vertical-align: middle;
  font-size: 14px;
}

.bom-component-table :deep(.el-table__header th.el-table__cell .cell) {
  white-space: nowrap;
  word-break: keep-all;
}

.bom-component-table :deep(.cell) {
  line-height: 1.5;
  overflow: hidden;
}

.bom-component-table :deep(.bom-op-column .cell) {
  padding-left: 4px;
  padding-right: 4px;
}

.bom-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bom-cell-input {
  width: 100%;
}

.bom-cell-select {
  width: 100%;
}

.bom-qty-input {
  width: 100%;
  max-width: 118px;
}

.shop-order-table :deep(.el-table__cell) {
  padding: 10px 8px;
}

.editing-row {
  background-color: #f0f9ff;
}

.sortable-ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.sortable-chosen {
  background: #e6f7ff;
}

.sortable-drag {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.move {
  cursor: move;
}

.h-300 {
  height: 300px;
}

.search-container {
  position: relative;
  z-index: 10;
}

/* 解决搜索区使用历史记录功能时被遮挡问题 */
.search-card {
  overflow: visible !important;
}

.search-card :deep(.el-card__body),
:deep(.el-card) {
  overflow: visible !important;
}

.table-add-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0 6px;
  margin-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
  background: linear-gradient(180deg, transparent, rgba(64, 158, 255, 0.04));
  border-radius: 0 0 6px 6px;
}

.table-add-icon-btn {
  width: 38px;
  height: 38px;
  font-size: 18px;
  border: none;
  box-shadow: 0 2px 10px rgba(64, 158, 255, 0.35);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.table-add-icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.45);
}

.table-add-icon-btn:active {
  transform: translateY(0);
}
</style>
