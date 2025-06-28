<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="栈板描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入栈板描述" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['wms:pallet:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:pallet:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:pallet:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:pallet:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="palletList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="栈板描述" align="center" prop="description" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_pallet_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:pallet:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:pallet:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改栈板信息对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="palletFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="栈板描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入栈板描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option v-for="dict in wms_pallet_status" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
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

<script setup name="Pallet" lang="ts">
import { listPallet, getPallet, delPallet, addPallet, updatePallet } from '@/api/wms/pallet';
import { PalletVO, PalletQuery, PalletForm } from '@/api/wms/pallet/types';
import { listWorkOrder, getWorkOrder, delWorkOrder, addWorkOrder, updateWorkOrder } from '@/api/wms/workOrder';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_pallet_status } = toRefs<any>(proxy?.useDict('wms_pallet_status'));

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
  palletCode: undefined,
  description: undefined,
  status: 0,
  warehouseCode: undefined,
  remark: undefined
};
const data = reactive<PageData<PalletForm, PalletQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    palletCode: undefined,
    description: undefined,
    status: undefined,
    warehouseCode: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }],
    description: [{ required: true, message: '栈板描述不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询栈板信息列表 */
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
  dialog.title = '添加栈板信息';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: PalletVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getPallet(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改栈板信息';
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
  await proxy?.$modal.confirm('是否确认删除栈板信息编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delPallet(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/pallet/export',
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
