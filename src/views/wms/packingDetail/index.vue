<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="打包编号" prop="packingCode">
              <el-input v-model="queryParams.packingCode" placeholder="请输入打包编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="料号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料凭证号" prop="martialOrderNo">
              <el-input v-model="queryParams.martialOrderNo" placeholder="请输入物料凭证号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料文件项次" prop="martialItem">
              <el-input v-model="queryParams.martialItem" placeholder="请输入物料文件项次" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['wms:packingDetail:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:packingDetail:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:packingDetail:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:packingDetail:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="packingDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="打包编号" align="center" prop="packingCode" width="150" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="料号" align="center" prop="item" />
        <el-table-column label="数量" align="center" prop="packingQty" />
        <el-table-column label="物料凭证号" align="center" prop="martialOrderNo" />
        <el-table-column label="物料文件项次" align="center" prop="martialItem" />
<!--        <el-table-column label="备注" align="center" prop="remark" />-->
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:packingDetail:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:packingDetail:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改打包明细对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="packingDetailFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="打包编号" prop="packingCode">
          <el-input v-model="form.packingCode" placeholder="请输入打包编号" />
        </el-form-item>
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="料号" prop="item">
          <el-input v-model="form.item" placeholder="请输入料号" />
        </el-form-item>
        <el-form-item label="打包数量" prop="packingQty">
          <el-input v-model="form.packingQty" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="物料凭证号" prop="martialOrderNo">
          <el-input v-model="form.martialOrderNo" placeholder="请输入物料凭证号" />
        </el-form-item>
        <el-form-item label="物料文件项次" prop="martialItem">
          <el-input v-model="form.martialItem" placeholder="请输入物料文件项次" />
        </el-form-item>
<!--        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>-->
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

<script setup name="PackingDetail" lang="ts">
import { listPackingDetail, getPackingDetail, delPackingDetail, addPackingDetail, updatePackingDetail } from '@/api/wms/packingDetail';
import { PackingDetailVO, PackingDetailQuery, PackingDetailForm } from '@/api/wms/packingDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const packingDetailList = ref<PackingDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const packingDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PackingDetailForm = {
  id: undefined,
  packingCode: undefined,
  palletCode: undefined,
  workOrderNo: undefined,
  item: undefined,
  packingQty: undefined,
  martialOrderNo: undefined,
  martialItem: undefined,
  remark: undefined
};
const data = reactive<PageData<PackingDetailForm, PackingDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    packingCode: undefined,
    palletCode: undefined,
    workOrderNo: undefined,
    item: undefined,
    packingQty: undefined,
    martialOrderNo: undefined,
    martialItem: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    packingCode: [{ required: true, message: '打包编号不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }],
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    item: [{ required: true, message: '料号不能为空', trigger: 'blur' }],
    packingQty: [{ required: true, message: '打包数量不能为空', trigger: 'blur' }],
    // martialOrderNo: [{ required: true, message: '物料凭证号不能为空', trigger: 'blur' }],
    // martialItem: [{ required: true, message: '物料文件项次不能为空', trigger: 'blur' }],
    // remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询打包明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPackingDetail(queryParams.value);
  packingDetailList.value = res.rows;
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
  packingDetailFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PackingDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加打包明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: PackingDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getPackingDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改打包明细';
};

/** 提交按钮 */
const submitForm = () => {
  packingDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePackingDetail(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addPackingDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: PackingDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除打包明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delPackingDetail(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/packingDetail/export',
    {
      ...queryParams.value
    },
    `packingDetail_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
