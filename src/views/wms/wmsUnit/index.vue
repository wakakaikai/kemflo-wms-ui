<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="内部单位" prop="innerName">
              <el-input v-model="queryParams.innerName" placeholder="请输入内部单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="商业单位" prop="commercialName">
              <el-input v-model="queryParams.commercialName" placeholder="请输入商业单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="技术单位" prop="technicalName">
              <el-input v-model="queryParams.technicalName" placeholder="请输入技术单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计量单位短名称" prop="unitShortName">
              <el-input v-model="queryParams.unitShortName" placeholder="请输入计量单位短名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计量单位长名称" prop="unitLongName">
              <el-input v-model="queryParams.unitLongName" placeholder="请输入计量单位长名称" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:wmsUnit:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:wmsUnit:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:wmsUnit:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:wmsUnit:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="wmsUnitList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="内部单位" align="center" prop="innerName" />
        <el-table-column label="商业单位" align="center" prop="commercialName" />
        <el-table-column label="技术单位" align="center" prop="technicalName" />
        <el-table-column label="计量单位短名称" align="center" prop="unitShortName" />
        <el-table-column label="计量单位长名称" align="center" prop="unitLongName" />
        <!--        <el-table-column label="备注" align="center" prop="remark" />-->
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:wmsUnit:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:wmsUnit:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改计量单位对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="wmsUnitFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="内部单位" prop="innerName">
          <el-input v-model="form.innerName" placeholder="请输入内部单位" />
        </el-form-item>
        <el-form-item label="商业单位" prop="commercialName">
          <el-input v-model="form.commercialName" placeholder="请输入商业单位" />
        </el-form-item>
        <el-form-item label="技术单位" prop="technicalName">
          <el-input v-model="form.technicalName" placeholder="请输入技术单位" />
        </el-form-item>
        <el-form-item label="计量单位短名称" prop="unitShortName">
          <el-input v-model="form.unitShortName" placeholder="请输入计量单位短名称" />
        </el-form-item>
        <el-form-item label="计量单位长名称" prop="unitLongName">
          <el-input v-model="form.unitLongName" placeholder="请输入计量单位长名称" />
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
  </div>
</template>

<script setup name="WmsUnit" lang="ts">
import { listWmsUnit, getWmsUnit, delWmsUnit, addWmsUnit, updateWmsUnit } from '@/api/wms/wmsUnit';
import { WmsUnitVO, WmsUnitQuery, WmsUnitForm } from '@/api/wms/wmsUnit/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const wmsUnitList = ref<WmsUnitVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const wmsUnitFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WmsUnitForm = {
  id: undefined,
  innerName: undefined,
  commercialName: undefined,
  technicalName: undefined,
  unitShortName: undefined,
  unitLongName: undefined,
  remark: undefined
};
const data = reactive<PageData<WmsUnitForm, WmsUnitQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    innerName: undefined,
    commercialName: undefined,
    technicalName: undefined,
    unitShortName: undefined,
    unitLongName: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    innerName: [{ required: true, message: '内部单位不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询计量单位列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWmsUnit(queryParams.value);
  wmsUnitList.value = res.rows;
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
  wmsUnitFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WmsUnitVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加计量单位';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WmsUnitVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWmsUnit(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改计量单位';
};

/** 提交按钮 */
const submitForm = () => {
  wmsUnitFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWmsUnit(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWmsUnit(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WmsUnitVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除计量单位编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWmsUnit(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/wmsUnit/export',
    {
      ...queryParams.value
    },
    `wmsUnit_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
