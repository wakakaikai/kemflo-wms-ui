<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="工单号" prop="shopOrder">
              <HistoryInput v-model.trim="queryParams.shopOrder" :config="shopOrderConfig" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="BOM料号" prop="bomItem">
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

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:shopOrderBomComponent:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:shopOrderBomComponent:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:shopOrderBomComponent:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderBomComponent:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderBomComponentList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="工单号" align="center" prop="shopOrder" />
        <el-table-column v-if="columns[1].visible" label="BOM料号" align="center" prop="bomItem" />
        <el-table-column v-if="columns[2].visible" label="组件料号" align="center" prop="componentItem" />
        <el-table-column v-if="columns[3].visible" label="顺序号" align="center" prop="sequence" />
        <el-table-column v-if="columns[4].visible" label="组件类型" align="center" prop="type">
          <template #default="scope">
            <dict-tag :options="mes_bom_component_type" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[5].visible" label="组件数量" align="center" prop="quantity" />
        <el-table-column v-if="columns[6].visible" label="组件工序" align="center" prop="operation" />
        <el-table-column v-if="columns[7].visible" label="条码规则" align="center" prop="snRegex" />
        <el-table-column v-if="columns[8].visible" label="备注" align="center" prop="remark" />
        <el-table-column v-if="columns[9].visible" label="创建者" align="center" prop="creator" />
        <el-table-column v-if="columns[10].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[11].visible" label="更新者" align="center" prop="updater" />
        <el-table-column v-if="columns[12].visible" label="更新时间" align="center" prop="modifyTime" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:shopOrderBomComponent:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:shopOrderBomComponent:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单BOM组件对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="shopOrderBomComponentFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="工单号" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单号" />
        </el-form-item>
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
  </div>
</template>

<script setup name="ShopOrderBomComponent" lang="ts">
import { listShopOrderBomComponent, getShopOrderBomComponent, delShopOrderBomComponent, addShopOrderBomComponent, updateShopOrderBomComponent } from '@/api/mes/shopOrderBomComponent';
import { ShopOrderBomComponentVO, ShopOrderBomComponentQuery, ShopOrderBomComponentForm } from '@/api/mes/shopOrderBomComponent/types';
import { ref } from 'vue';
import { TableColumns } from '@/api/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_bom_component_type } = toRefs<any>(proxy?.useDict('mes_bom_component_type'));

const shopOrderBomComponentList = ref<ShopOrderBomComponentVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderBomComponentFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ShopOrderBomComponentForm = {
  id: undefined,
  shopOrder: undefined,
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
const data = reactive<PageData<ShopOrderBomComponentForm, ShopOrderBomComponentQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    shopOrder: undefined,
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
    shopOrder: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    bomItem: [{ required: true, message: 'BOM料号不能为空', trigger: 'blur' }],
    componentItem: [{ required: true, message: '组件料号不能为空', trigger: 'blur' }],
    sequence: [{ required: true, message: '顺序号不能为空', trigger: 'blur' }],
    type: [{ required: true, message: '组件类型0：唯一码 1：固定码不能为空', trigger: 'change' }],
    quantity: [{ required: true, message: '组件数量不能为空', trigger: 'blur' }],
    operation: [{ required: true, message: '组件工序不能为空', trigger: 'blur' }]
    // snRegex: [{ required: true, message: '条码规则不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const columns = ref<TableColumns[]>([
  { key: 1, label: '工单号', visible: true },
  { key: 2, label: 'BOM料号', visible: true },
  { key: 3, label: '组件料号', visible: true },
  { key: 4, label: '顺序号', visible: true },
  { key: 5, label: '组件类型', visible: true },
  { key: 6, label: '组件数量', visible: true },
  { key: 7, label: '组件工序', visible: true },
  { key: 8, label: '条码规则', visible: false },
  { key: 9, label: '备注', visible: false },
  { key: 10, label: '创建者', visible: false },
  { key: 11, label: '创建时间', visible: false },
  { key: 12, label: '更新者', visible: false },
  { key: 13, label: '更新时间', visible: false }
]);

const shopOrderConfig: HistoryConfig = {
  key: 'shopOrder',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'shopOrderBomComponent',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const bomItemConfig: HistoryConfig = {
  key: 'bomItem',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'shopOrderBomComponent',
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
  page: 'shopOrderBomComponent',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

/** 查询工单BOM组件列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShopOrderBomComponent(queryParams.value);
  shopOrderBomComponentList.value = res.rows;
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
  shopOrderBomComponentFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShopOrderBomComponentVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单BOM组件';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShopOrderBomComponentVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShopOrderBomComponent(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单BOM组件';
};

/** 提交按钮 */
const submitForm = () => {
  shopOrderBomComponentFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShopOrderBomComponent(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShopOrderBomComponent(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShopOrderBomComponentVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单BOM组件编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShopOrderBomComponent(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/shopOrderBomComponent/export',
    {
      ...queryParams.value
    },
    `shopOrderBomComponent_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
<style lang="scss" scoped>
/* 解决搜索区使用历史记录功能时被遮挡问题 */
.search-card {
  overflow: visible !important;
}

:deep(.el-card) {
  overflow: visible !important;
}
</style>
