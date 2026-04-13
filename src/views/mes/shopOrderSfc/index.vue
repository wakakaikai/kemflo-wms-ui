<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :rules="rules" :inline="true">
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="条码" prop="sfcStr">
              <el-input v-model="queryParams.sfcStr" placeholder="请输入条码" clearable @keyup.enter="handleQuery" readonly>
                <template #append>
                  <el-button icon="CopyDocument" @click="openBatchInputDialog" title="批量录入条码" />
                </template>
              </el-input>
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:shopOrderSfc:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:shopOrderSfc:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:shopOrderSfc:remove']">删除</el-button>
          </el-col>-->
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderSfc:export']">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button color="#34d399" class="text-white flex-1" :disabled="multiple" icon="Printer" @click="handleAddPrintCount" v-hasPermi="['mes:shopOrderSfcReprintAuthorizeHistory:add']"
              >打印授权</el-button
            >
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderSfcList" @selection-change="handleSelectionChange" row-key="id" border stripe fixed-header fit>
        <el-table-column type="selection" width="55" align="center" :reserve-selection="true" />
        <el-table-column label="工单号" align="center" prop="shopOrder" />
        <el-table-column label="条码" align="center" prop="sfc" />
        <el-table-column label="条码数量" align="center" prop="qty" />
        <el-table-column label="标签可打印次数" align="center" prop="normalPrintQuantity" />
        <el-table-column label="即扫即打次数" align="center" prop="promptlyPrintQuantity" />
        <el-table-column label="创建者" align="center" prop="creator" />
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="更新者" align="center" prop="updater" />
        <el-table-column label="更新时间" align="center" prop="modifyTime" />
        <!--        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:shopOrderSfc:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:shopOrderSfc:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>-->
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单下达的条码对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="shopOrderSfcFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工单行号" prop="shopOrderBo">
          <el-input v-model="form.shopOrderBo" placeholder="请输入工单行号" />
        </el-form-item>
        <el-form-item label="条码行号" prop="sfcBo">
          <el-input v-model="form.sfcBo" placeholder="请输入条码行号" />
        </el-form-item>
        <el-form-item label="条码数量" prop="qty">
          <el-input v-model="form.qty" placeholder="请输入条码数量" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchId">
          <el-input v-model="form.batchId" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量输入对话框 -->
    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入条码" placeholder="请输入条码，支持多行粘贴" @confirm="handleBatchInputConfirm" />

    <!-- 添加打印次数对话框 -->
    <AddPrintCountDialog ref="addPrintCountDialogRef" :selectedShopOrderSfcList="selectedShopOrderSfcList" @confirm="confirmAddPrintCount" />
  </div>
</template>

<script setup name="ShopOrderSfc" lang="ts">
import { listShopOrderSfc, getShopOrderSfc, delShopOrderSfc, addShopOrderSfc, updateShopOrderSfc, pageShopOrderSfc } from '@/api/mes/shopOrderSfc';
import { ShopOrderSfcVO, ShopOrderSfcQuery, ShopOrderSfcForm } from '@/api/mes/shopOrderSfc/types';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import AddPrintCountDialog from './components/addPrintCountDialog.vue';
const addPrintCountDialogRef = ref<InstanceType<typeof AddPrintCountDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();

const shopOrderSfcList = ref<ShopOrderSfcVO[]>([]);
const selectedShopOrderSfcList = ref<ShopOrderSfcVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderSfcFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ShopOrderSfcForm = {
  id: undefined,
  shopOrderBo: undefined,
  shopOrder: undefined,
  sfcBo: undefined,
  qty: undefined,
  batchId: undefined,
  remark: undefined,
  createUserId: undefined,
  creator: undefined,
  modifyUserId: undefined,
  updater: undefined,
  modifyTime: undefined,
  deleteFlag: undefined,
  auditDataVersion: undefined,
  secBuId: undefined,
  secUserId: undefined,
  secOuId: undefined,
  belongOrgId: undefined,
  tenantOrgId: undefined
};
const data = reactive<PageData<ShopOrderSfcForm, ShopOrderSfcQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    shopOrderBo: undefined,
    shopOrder: '',
    sfcBo: undefined,
    qty: undefined,
    batchId: undefined,
    createUserId: undefined,
    creator: undefined,
    modifyUserId: undefined,
    updater: undefined,
    modifyTime: undefined,
    deleteFlag: undefined,
    auditDataVersion: undefined,
    secBuId: undefined,
    secUserId: undefined,
    secOuId: undefined,
    belongOrgId: undefined,
    tenantOrgId: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    shopOrder: [{ required: true, message: '工单行号不能为空', trigger: 'blur' }],
    sfcBo: [{ required: true, message: '条码行号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单下达的条码列表 */
const getList = () => {
  queryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true;
        const res = await pageShopOrderSfc(queryParams.value);
        shopOrderSfcList.value = res.rows;
        total.value = res.total;
      } catch (error) {
        console.log(error);
      } finally {
        loading.value = false;
      }
    }
  });
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  shopOrderSfcFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.sfcList = [];
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: ShopOrderSfcVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
  selectedShopOrderSfcList.value = selection;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单下达的条码';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShopOrderSfcVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShopOrderSfc(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单下达的条码';
};

/** 提交按钮 */
const submitForm = () => {
  shopOrderSfcFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShopOrderSfc(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShopOrderSfc(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShopOrderSfcVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单下达的条码编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShopOrderSfc(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/shopOrderSfc/export',
    {
      ...queryParams.value
    },
    `shopOrderSfc_${new Date().getTime()}.xlsx`
  );
};
// 打开批量录入条码弹框
const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
  batchInputDialogRef.value?.resetInput();
};
// 弹框确定的回调
const handleBatchInputConfirm = (values: string[]) => {
  // 将批量输入的值合并到查询参数中
  queryParams.value.sfcStr = values.join(',');
  queryParams.value.sfcList = values;
  handleQuery(); // 执行查询
};

// 增加打印次数
const handleAddPrintCount = () => {
  if (!selectedShopOrderSfcList.value) {
    proxy.$message.error('请选择一条要增加打印次数的数据');
    return;
  }
  addPrintCountDialogRef.value.openDialog();
};
// 确定的回调
const confirmAddPrintCount = (data: any) => {};
onMounted(() => {
  nextTick(() => {
    queryFormRef.value?.resetFields();
  });
});
</script>

<style lang="scss" scoped>
.text-white {
  color: white !important;
}
</style>
