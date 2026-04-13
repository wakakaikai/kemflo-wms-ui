<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="栈板号" prop="palletNo">
              <el-input v-model="queryParams.palletNo" placeholder="请输入栈板号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:pallet:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:pallet:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:pallet:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:pallet:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="palletList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="栈板号" align="center" prop="palletNo" />
        <!--        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="业务类型" align="center" prop="businessType" />-->
        <el-table-column v-if="columns[1].visible" label="生产日期" align="center" prop="productTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.productTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[2].visible" label="托盘净重" align="center" prop="palletNetWeight" />
        <el-table-column v-if="columns[3].visible" label="托盘毛重" align="center" prop="palletGrossWeight" />
        <el-table-column v-if="columns[4].visible" label="装托数量" align="center" prop="palletNumber" />
        <el-table-column v-if="columns[5].visible" label="客户PO" align="center" prop="customerPo" />
        <el-table-column v-if="columns[6].visible" label="物料" align="center" prop="item" />
        <el-table-column v-if="columns[7].visible" label="创建者" align="center" prop="creator" />
        <el-table-column v-if="columns[8].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[9].visible" label="更新者" align="center" prop="updater" />
        <el-table-column v-if="columns[10].visible" label="更新时间" align="center" prop="modifyTime" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:pallet:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:pallet:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改MES栈板对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="palletFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="栈板号" prop="palletNo">
          <el-input v-model="form.palletNo" placeholder="请输入栈板号" />
        </el-form-item>
        <el-form-item label="1:栈板 2:外箱" prop="palletLevel">
          <el-input v-model="form.palletLevel" placeholder="请输入1:栈板 2:外箱" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchId">
          <el-input v-model="form.batchId" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="生产日期" prop="productTime">
          <el-date-picker clearable v-model="form.productTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择生产日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="托盘净重" prop="palletNetWeight">
          <el-input v-model="form.palletNetWeight" placeholder="请输入托盘净重" />
        </el-form-item>
        <el-form-item label="托盘毛重" prop="palletGrossWeight">
          <el-input v-model="form.palletGrossWeight" placeholder="请输入托盘毛重" />
        </el-form-item>
        <el-form-item label="装托数量" prop="palletNumber">
          <el-input v-model="form.palletNumber" placeholder="请输入装托数量" />
        </el-form-item>
        <el-form-item label="客户PO" prop="customerPo">
          <el-input v-model="form.customerPo" placeholder="请输入客户PO" />
        </el-form-item>
        <el-form-item label="物料" prop="item">
          <el-input v-model="form.item" placeholder="请输入物料" />
        </el-form-item>
        <el-form-item label="创建者" prop="creator">
          <el-input v-model="form.creator" placeholder="请输入创建者" />
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

<script setup name="Pallet" lang="ts">
import { listPallet, getPallet, delPallet, addPallet, updatePallet } from '@/api/mes/pallet';
import { PalletVO, PalletQuery, PalletForm } from '@/api/mes/pallet/types';
import { TableColumns } from '@/api/wms/shippingNotice/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const palletList = ref<PalletVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const palletFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PalletForm = {
  id: undefined,
  palletNo: undefined,
  palletLevel: undefined,
  batchId: undefined,
  status: undefined,
  businessType: undefined,
  productTime: undefined,
  palletNetWeight: undefined,
  palletGrossWeight: undefined,
  palletNumber: undefined,
  customerPo: undefined,
  item: undefined,
  creator: undefined
};
const data = reactive<PageData<PalletForm, PalletQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    palletNo: undefined,
    palletLevel: undefined,
    batchId: undefined,
    status: undefined,
    businessType: undefined,
    productTime: undefined,
    palletNetWeight: undefined,
    palletGrossWeight: undefined,
    palletNumber: undefined,
    customerPo: undefined,
    item: undefined,
    creator: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 创建响应式数组对象
const columns = ref<TableColumns[]>([
  { key: 1, label: '栈板号', visible: true },
  { key: 2, label: '生产日期', visible: true },
  { key: 3, label: '托盘净重', visible: true },
  { key: 4, label: '托盘毛重', visible: true },
  { key: 5, label: '装托数量', visible: true },
  { key: 6, label: '客户PO', visible: true },
  { key: 7, label: '物料', visible: true },
  { key: 8, label: '创建者', visible: false },
  { key: 9, label: '创建时间', visible: false },
  { key: 10, label: '更新者', visible: false },
  { key: 11, label: '更新时间', visible: false }
]);

/** 查询MES栈板列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPallet(queryParams.value);
  palletList.value = res.rows;
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
  palletFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PalletVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加MES栈板';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: PalletVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getPallet(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改MES栈板';
};

/** 提交按钮 */
const submitForm = () => {
  palletFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePallet(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addPallet(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: PalletVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除MES栈板编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delPallet(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/pallet/export',
    {
      ...queryParams.value
    },
    `pallet_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
