<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="条码" prop="sfc">
              <el-input v-model="queryParams.sfc" placeholder="请输入条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="打印类型" prop="type">
              <el-select v-model="queryParams.type" placeholder="请选择打印类型" clearable>
                <el-option v-for="dict in mes_shop_order_sfc_print_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
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
          <!--          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:shopOrderSfcReprintAuthorizeHistory:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:shopOrderSfcReprintAuthorizeHistory:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:shopOrderSfcReprintAuthorizeHistory:remove']">删除</el-button>
          </el-col>-->
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderSfcReprintAuthorizeHistory:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderSfcReprintAuthorizeHistoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="追踪ID" align="center" prop="traceId" />-->
        <el-table-column v-if="columns[0].visible" label="工单号" align="center" prop="shopOrder" />
        <el-table-column v-if="columns[1].visible" label="条码" align="center" prop="sfc" />
        <el-table-column v-if="columns[2].visible" label="打印类型" align="center" prop="type">
          <template #default="scope">
            <dict-tag :options="mes_shop_order_sfc_print_type" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[3].visible" label="授权时间" align="center" prop="dateTime" />
        <el-table-column v-if="columns[4].visible" label="补打次数" align="center" prop="reprintQuantity" />
        <el-table-column v-if="columns[5].visible" label="创建者" align="center" prop="creator" />
        <el-table-column v-if="columns[6].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[7].visible" label="更新者" align="center" prop="updater" />
        <el-table-column v-if="columns[8].visible" label="更新时间" align="center" prop="modifyTime" />
        <el-table-column v-if="columns[9].visible" label="备注" align="center" prop="remark" width="180" show-overflow-tooltip />
        <!--        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:shopOrderSfcReprintAuthorizeHistory:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:shopOrderSfcReprintAuthorizeHistory:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>-->
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单条码补打授权历史对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="shopOrderSfcReprintAuthorizeHistoryFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="工单号" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="条码" prop="sfc">
          <el-input v-model="form.sfc" placeholder="请输入条码" />
        </el-form-item>
        <el-form-item label="授权时间" prop="dateTime">
          <el-date-picker clearable v-model="form.dateTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择授权时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="授权补打次数" prop="reprintQuantity">
          <el-input v-model="form.reprintQuantity" placeholder="请输入授权补打次数" />
        </el-form-item>
        <el-form-item label="创建者" prop="creator">
          <el-input v-model="form.creator" placeholder="请输入创建者" />
        </el-form-item>
        <el-form-item label="更新者" prop="updater">
          <el-input v-model="form.updater" placeholder="请输入更新者" />
        </el-form-item>
        <el-form-item label="更新时间" prop="modifyTime">
          <el-date-picker clearable v-model="form.modifyTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择更新时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="租户组织ID" prop="tenantOrgId">
          <el-input v-model="form.tenantOrgId" placeholder="请输入租户组织ID" />
        </el-form-item>
        <el-form-item label="组织ID" prop="belongOrgId">
          <el-input v-model="form.belongOrgId" placeholder="请输入组织ID" />
        </el-form-item>
        <el-form-item label="删除标识" prop="deleteFlag">
          <el-input v-model="form.deleteFlag" placeholder="请输入删除标识" />
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

<script setup name="ShopOrderSfcReprintAuthorizeHistory" lang="ts">
import {
  listShopOrderSfcReprintAuthorizeHistory,
  getShopOrderSfcReprintAuthorizeHistory,
  delShopOrderSfcReprintAuthorizeHistory,
  addShopOrderSfcReprintAuthorizeHistory,
  updateShopOrderSfcReprintAuthorizeHistory
} from '@/api/mes/shopOrderSfcReprintAuthorizeHistory';
import { ShopOrderSfcReprintAuthorizeHistoryVO, ShopOrderSfcReprintAuthorizeHistoryQuery, ShopOrderSfcReprintAuthorizeHistoryForm } from '@/api/mes/shopOrderSfcReprintAuthorizeHistory/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_shop_order_sfc_print_type } = toRefs<any>(proxy?.useDict('mes_shop_order_sfc_print_type'));

const shopOrderSfcReprintAuthorizeHistoryList = ref<ShopOrderSfcReprintAuthorizeHistoryVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderSfcReprintAuthorizeHistoryFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ShopOrderSfcReprintAuthorizeHistoryForm = {
  id: undefined,
  traceId: undefined,
  type: undefined,
  shopOrder: undefined,
  sfc: undefined,
  dateTime: undefined,
  reprintQuantity: undefined,
  creator: undefined,
  updater: undefined,
  modifyTime: undefined,
  tenantOrgId: undefined,
  belongOrgId: undefined,
  deleteFlag: undefined,
  remark: undefined
};
const data = reactive<PageData<ShopOrderSfcReprintAuthorizeHistoryForm, ShopOrderSfcReprintAuthorizeHistoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    traceId: undefined,
    type: undefined,
    shopOrder: undefined,
    sfc: undefined,
    dateTime: undefined,
    reprintQuantity: undefined,
    creator: undefined,
    updater: undefined,
    modifyTime: undefined,
    tenantOrgId: undefined,
    belongOrgId: undefined,
    deleteFlag: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    shopOrder: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    sfc: [{ required: true, message: '条码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const columns = ref<FieldOption[]>([
  { key: 0, label: `工单号`, visible: true, children: [] },
  { key: 1, label: `条码`, visible: true, children: [] },
  { key: 2, label: `打印类型`, visible: true, children: [] },
  { key: 3, label: `授权时间`, visible: true, children: [] },
  { key: 4, label: `补打次数`, visible: true, children: [] },
  { key: 5, label: `创建时间`, visible: false, children: [] },
  { key: 6, label: `创建者`, visible: false, children: [] },
  { key: 7, label: `更新时间`, visible: false, children: [] },
  { key: 8, label: `更新者`, visible: false, children: [] },
  { key: 9, label: `备注`, visible: true, children: [] }
]);

/** 查询工单条码补打授权历史列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShopOrderSfcReprintAuthorizeHistory(queryParams.value);
  shopOrderSfcReprintAuthorizeHistoryList.value = res.rows;
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
  shopOrderSfcReprintAuthorizeHistoryFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShopOrderSfcReprintAuthorizeHistoryVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单条码补打授权历史';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShopOrderSfcReprintAuthorizeHistoryVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShopOrderSfcReprintAuthorizeHistory(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单条码补打授权历史';
};

/** 提交按钮 */
const submitForm = () => {
  shopOrderSfcReprintAuthorizeHistoryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShopOrderSfcReprintAuthorizeHistory(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShopOrderSfcReprintAuthorizeHistory(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShopOrderSfcReprintAuthorizeHistoryVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单条码补打授权历史编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShopOrderSfcReprintAuthorizeHistory(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/shopOrderSfcReprintAuthorizeHistory/export',
    {
      ...queryParams.value
    },
    `shopOrderSfcReprintAuthorizeHistory_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
