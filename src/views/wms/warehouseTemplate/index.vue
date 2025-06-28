<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入模板名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库ID" prop="warehouseId">
              <el-input v-model="queryParams.warehouseId" placeholder="请输入仓库ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="模板内容" prop="templateJson">
              <el-input v-model="queryParams.templateJson" placeholder="请输入模板内容" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['wms:warehouseTemplate:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:warehouseTemplate:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:warehouseTemplate:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:warehouseTemplate:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>
      <WarehouseViewer :structure="structure" />
      <el-table v-loading="loading" :data="warehouseTemplateList" @selection-change="handleSelectionChange" v-if="0> 1">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="true" label="唯一ID" align="center" prop="id" />
        <el-table-column label="模板名称" align="center" prop="name" />
        <el-table-column label="仓库ID" align="center" prop="warehouseId" />
        <el-table-column label="模板内容" align="center" prop="templateJson" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:warehouseTemplate:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:warehouseTemplate:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改仓库模板对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="warehouseTemplateFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="仓库ID" prop="warehouseId">
          <el-input v-model="form.warehouseId" placeholder="请输入仓库ID" />
        </el-form-item>
        <el-form-item label="模板内容" prop="templateJson">
          <el-input v-model="form.templateJson" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="WarehouseTemplate" lang="ts">
import { listWarehouseTemplate, getWarehouseTemplate, delWarehouseTemplate, addWarehouseTemplate, updateWarehouseTemplate } from '@/api/wms/warehouseTemplate';
import { WarehouseTemplateVO, WarehouseTemplateQuery, WarehouseTemplateForm } from '@/api/wms/warehouseTemplate/types';
import { ref } from 'vue';
import WarehouseViewer from '@/components/WarehouseViewer/index.vue';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const templates = ref<any[]>([]);
const structure = ref<any[]>([]);
const warehouseTemplateList = ref<WarehouseTemplateVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const warehouseTemplateFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WarehouseTemplateForm = {
  id: undefined,
  name: undefined,
  warehouseId: undefined,
  templateJson: undefined,
  remark: undefined
};
const data = reactive<PageData<WarehouseTemplateForm, WarehouseTemplateQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    warehouseId: undefined,
    templateJson: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
    warehouseId: [{ required: true, message: '仓库ID不能为空', trigger: 'blur' }],
    templateJson: [{ required: true, message: '模板内容不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询仓库模板列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWarehouseTemplate(queryParams.value);
  warehouseTemplateList.value = res.rows;
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
  warehouseTemplateFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WarehouseTemplateVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加仓库模板';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WarehouseTemplateVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWarehouseTemplate(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改仓库模板';
};

/** 提交按钮 */
const submitForm = () => {
  warehouseTemplateFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWarehouseTemplate(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWarehouseTemplate(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WarehouseTemplateVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除仓库模板编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWarehouseTemplate(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/warehouseTemplate/export',
    {
      ...queryParams.value
    },
    `warehouseTemplate_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  const mockStructure = [
    { id: 1, parentId: 0, name: '仓库1', level: 1, x: 0, y: 0, z: 0 },
    { id: 2, parentId: 1, name: '库区A', level: 2, x: 2, y: 0, z: 0 },
    { id: 3, parentId: 2, name: '货架1', level: 3, x: 2, y: 2, z: 0 },
    { id: 4, parentId: 3, name: '库位1-1', level: 4, x: 2, y: 2, z: 1 }
  ];
  // await saveTemplate({
  //   name: '模板1',
  //   warehouseId: 1,
  //   templateJson: JSON.stringify(mockStructure)
  // });
  templates.value = mockStructure;
  getList();
});
</script>
