<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <div v-show="showAdvancedSearch">
              <el-form-item label="旧料号" prop="oldItem">
                <el-input v-model="queryParams.oldItem" placeholder="请输入旧料号" clearable @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="物料组" prop="itemGroup">
                <el-input v-model="queryParams.itemGroup" placeholder="请输入物料组" clearable @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="质检标识" prop="inspectionFlag">
                <DictRadio v-model="queryParams.inspectionFlag" :radio-data="sys_yes_no" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
              </el-form-item>
              <el-form-item label="质检检查" prop="checkEnable">
                <DictRadio v-model="queryParams.checkEnable" :radio-data="wms_boolean_type" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
              </el-form-item>
              <el-form-item label="栈板检查" prop="palletCheckFlag">
                <DictRadio v-model="queryParams.palletCheckFlag" :radio-data="wms_boolean_type" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
              </el-form-item>
              <el-form-item label="尺寸分类" prop="sizeCategory">
                <DictRadio v-model="queryParams.sizeCategory" :radio-data="wms_item_size_category" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
              </el-form-item>
              <el-form-item label="出货数量检查" prop="outboundQuantityCheck">
                <DictRadio v-model="queryParams.outboundQuantityCheck" :radio-data="wms_boolean_type" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
              </el-form-item>
              <el-form-item label="客户参考检查" prop="customerRefCheck">
                <DictRadio v-model="queryParams.customerRefCheck" :radio-data="wms_boolean_type" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
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
            <el-button v-hasPermi="['wms:item:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:item:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:item:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:item:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table :key="tableKey" v-loading="loading" :data="itemList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="物料" align="center" prop="item">
          <template #default="scope">
            <router-link :to="'/warehouse/item/itemDetail/' + scope.row.item" class="link-type">
              <span>{{ scope.row.item }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[1].visible" label="描述" align="center" prop="itemDesc" min-width="200" show-overflow-tooltip />
        <el-table-column v-if="columns[2].visible" label="旧料号" align="center" prop="oldItem" />
        <el-table-column v-if="columns[3].visible" label="物料组" align="center" prop="itemGroup" />
        <el-table-column v-if="columns[4].visible" label="物料类型" align="center" prop="itemType">
          <template #default="scope">
            <dict-tag :options="wms_item_type" :value="scope.row.itemType" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[5].visible" label="采购类型" align="center" prop="purchaseType">
          <template #default="scope">
            <dict-tag :options="wms_purchase_type" :value="scope.row.purchaseType" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[6].visible" label="特殊采购" align="center" prop="specialPurchase">
          <template #default="scope">
            <dict-tag :options="wms_special_purchase" :value="scope.row.specialPurchase" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[7].visible" label="计量单位" align="center" prop="unit" />
        <el-table-column v-if="columns[8].visible" label="尺寸分类" align="center" prop="sizeCategory">
          <template #default="scope">
            <dict-tag :options="wms_item_size_category" :value="scope.row.sizeCategory" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[9].visible" label="条码正则" align="center" prop="sfcRegular" />
        <el-table-column v-if="columns[10].visible" label="质检标识" align="center" prop="inspectionFlag">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.inspectionFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[11].visible" label="质检检查" align="center" prop="checkEnable">
          <template #default="scope">
            <dict-tag :options="wms_boolean_type" :value="scope.row.checkEnable" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[12].visible" label="栈板检查" align="center" prop="palletCheckFlag">
          <template #default="scope">
            <dict-tag :options="wms_boolean_type" :value="scope.row.palletCheckFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[13].visible" label="出货数量校验" align="center" prop="outboundQuantityCheck">
          <template #default="scope">
            <dict-tag :options="wms_boolean_type" :value="scope.row.outboundQuantityCheck" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[14].visible" label="客户参考检查" align="center" prop="customerRefCheck">
          <template #default="scope">
            <dict-tag :options="wms_boolean_type" :value="scope.row.customerRefCheck" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[15].visible" label="反冲标识" align="center" prop="backFlush" />
        <el-table-column v-if="columns[16].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:item:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:item:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改物料对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="itemFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="物料" prop="item">
          <el-input v-model="form.item" placeholder="请输入物料" />
        </el-form-item>
        <el-form-item label="描述" prop="itemDesc">
          <el-input v-model="form.itemDesc" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="旧料号" prop="oldItem">
          <el-input v-model="form.oldItem" placeholder="请输入旧料号" />
        </el-form-item>
        <el-form-item label="物料组" prop="itemGroup">
          <el-input v-model="form.itemGroup" placeholder="请输入物料组" />
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入计量单位" />
        </el-form-item>
        <el-form-item label="尺寸分类" prop="sizeCategory">
          <el-select v-model="form.sizeCategory" placeholder="请选择尺寸分类" clearable>
            <el-option v-for="dict in wms_item_size_category" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="条码正则" prop="sfcRegular">
          <el-input v-model="form.sfcRegular" placeholder="请输入条码正则" />
        </el-form-item>
        <el-form-item label="质检检查" prop="checkEnable">
          <el-radio-group v-model="form.checkEnable">
            <el-radio v-for="dict in wms_boolean_type" :key="dict.value" :value="dict.value == 'true'">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="栈板检查" prop="palletCheckFlag">
          <el-radio-group v-model="form.palletCheckFlag">
            <el-radio v-for="dict in wms_boolean_type" :key="dict.value" :value="dict.value == 'true'">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出货数量校验" prop="outboundQuantityCheck">
          <el-radio-group v-model="form.outboundQuantityCheck">
            <el-radio v-for="dict in wms_boolean_type" :key="dict.value" :value="dict.value == 'true'">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="客户参考检查" prop="customerRefCheck">
          <el-radio-group v-model="form.customerRefCheck">
            <el-radio v-for="dict in wms_boolean_type" :key="dict.value" :value="dict.value == 'true'">{{ dict.label }}</el-radio>
          </el-radio-group>
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
  </div>
</template>

<script setup name="Item" lang="ts">
import { listItem, getItem, delItem, addItem, updateItem } from '@/api/wms/item';
import { ItemVO, ItemQuery, ItemForm } from '@/api/wms/item/types';
import { TableColumns } from '@/api/types';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_purchase_type, wms_item_type, wms_special_purchase, sys_yes_no, wms_boolean_type, wms_item_size_category } = toRefs<any>(proxy?.useDict('wms_purchase_type', 'wms_item_type', 'wms_special_purchase', 'sys_yes_no', 'wms_boolean_type', 'wms_item_size_category'));

const itemList = ref<ItemVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const showAdvancedSearch = ref(false);
const tableKey = ref(1);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const itemFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

// 创建响应式数组对象
const columns = ref<TableColumns[]>([
  { key: 1, label: '物料', visible: true },
  { key: 2, label: '描述', visible: true },
  { key: 3, label: '旧料号', visible: false },
  { key: 4, label: '物料组', visible: true },
  { key: 5, label: '物料类型', visible: true },
  { key: 6, label: '采购类型', visible: true },
  { key: 7, label: '特殊采购', visible: false },
  { key: 8, label: '计量单位', visible: true },
  { key: 9, label: '尺寸分类', visible: true },
  { key: 10, label: '条码正则', visible: true },
  { key: 11, label: '质检标识', visible: true },
  { key: 12, label: '质检检查', visible: true },
  { key: 13, label: '栈板检查', visible: true },
  { key: 14, label: '出货数量校验', visible: true },
  { key: 15, label: '客户参考检查', visible: true },
  { key: 16, label: '反冲标识', visible: true },
  { key: 17, label: '备注', visible: true }
]);

watch(
  columns,
  () => {
    tableKey.value = tableKey.value + 1;
  },
  { immediate: true }
);

const initFormData: ItemForm = {
  id: undefined,
  item: undefined,
  itemDesc: undefined,
  oldItem: undefined,
  itemGroup: undefined,
  unit: undefined,
  sizeCategory: undefined,
  inspectionFlag: undefined,
  checkEnable: undefined,
  palletCheckFlag: undefined,
  outboundQuantityCheck: undefined,
  customerRefCheck: undefined,
  remark: undefined
};
const data = reactive<PageData<ItemForm, ItemQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    item: undefined,
    itemDesc: undefined,
    oldItem: undefined,
    itemGroup: undefined,
    unit: undefined,
    sizeCategory: null,
    inspectionFlag: null,
    checkEnable: null,
    palletCheckFlag: null,
    outboundQuantityCheck: null,
    customerRefCheck: null,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    item: [{ required: true, message: '物料不能为空', trigger: 'blur' }],
    itemDesc: [{ required: true, message: '描述不能为空', trigger: 'blur' }],
    itemGroup: [{ required: true, message: '物料组不能为空', trigger: 'blur' }],
    checkEnable: [{ required: true, message: '质检检查不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};


/** 查询物料列表 */
const getList = async () => {
  loading.value = true;
  const res = await listItem(queryParams.value);
  itemList.value = res.rows;
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
  itemFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ItemVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加物料';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ItemVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getItem(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改物料';
};

/** 提交按钮 */
const submitForm = () => {
  itemFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateItem(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addItem(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ItemVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除物料编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delItem(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/item/export',
    {
      ...queryParams.value
    },
    `item_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
