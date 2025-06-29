<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料清单" prop="bom">
              <el-input v-model="queryParams.bom" placeholder="请输入物料清单" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="资源描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入资源描述" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:bom:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:bom:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:bom:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:bom:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="bomList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="记录唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="数据行索引" align="center" prop="handle" />
        <el-table-column label="物料清单" align="center" prop="bom" />
        <el-table-column label="物料清单类型" align="center" prop="bomType" />
        <el-table-column label="资源描述" align="center" prop="description" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="版本" align="center" prop="revision" />
        <el-table-column label="当前版本" align="center" prop="currentRevision" />
        <el-table-column label="有效期自" align="center" prop="validFrom" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.validFrom, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期至" align="center" prop="validTo" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.validTo, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="是否被使用" align="center" prop="hasBeenUsed" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:bom:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:bom:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改物料清单对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="bomFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="数据行索引" prop="handle">
          <el-input v-model="form.handle" placeholder="请输入数据行索引" />
        </el-form-item>
        <el-form-item label="物料清单" prop="bom">
          <el-input v-model="form.bom" placeholder="请输入物料清单" />
        </el-form-item>
        <el-form-item label="资源描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入资源描述" />
        </el-form-item>
        <el-form-item label="版本" prop="revision">
          <el-input v-model="form.revision" placeholder="请输入版本" />
        </el-form-item>
        <el-form-item label="当前版本" prop="currentRevision">
          <el-input v-model="form.currentRevision" placeholder="请输入当前版本" />
        </el-form-item>
        <el-form-item label="有效期自" prop="validFrom">
          <el-date-picker clearable v-model="form.validFrom" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择有效期自"> </el-date-picker>
        </el-form-item>
        <el-form-item label="有效期至" prop="validTo">
          <el-date-picker clearable v-model="form.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择有效期至"> </el-date-picker>
        </el-form-item>
        <el-form-item label="是否被使用" prop="hasBeenUsed">
          <el-input v-model="form.hasBeenUsed" placeholder="请输入是否被使用" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="记录创建者ID" prop="createUserId">
          <el-input v-model="form.createUserId" placeholder="请输入记录创建者ID" />
        </el-form-item>
        <el-form-item label="记录创建者" prop="creator">
          <el-input v-model="form.creator" placeholder="请输入记录创建者" />
        </el-form-item>
        <el-form-item label="记录最后更新者ID" prop="modifyUserId">
          <el-input v-model="form.modifyUserId" placeholder="请输入记录最后更新者ID" />
        </el-form-item>
        <el-form-item label="记录最后更新者" prop="updater">
          <el-input v-model="form.updater" placeholder="请输入记录最后更新者" />
        </el-form-item>
        <el-form-item label="记录最后更新时间" prop="modifyTime">
          <el-date-picker clearable v-model="form.modifyTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择记录最后更新时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="删除标记" prop="deleteFlag">
          <el-input v-model="form.deleteFlag" placeholder="请输入删除标记" />
        </el-form-item>
        <el-form-item label="锁版本" prop="auditDataVersion">
          <el-input v-model="form.auditDataVersion" placeholder="请输入锁版本" />
        </el-form-item>
        <el-form-item label="数据归属组织id" prop="secBuId">
          <el-input v-model="form.secBuId" placeholder="请输入数据归属组织id" />
        </el-form-item>
        <el-form-item label="数据归属雇员id" prop="secUserId">
          <el-input v-model="form.secUserId" placeholder="请输入数据归属雇员id" />
        </el-form-item>
        <el-form-item label="数据归属公司id" prop="secOuId">
          <el-input v-model="form.secOuId" placeholder="请输入数据归属公司id" />
        </el-form-item>
        <el-form-item label="所属组织ID" prop="belongOrgId">
          <el-input v-model="form.belongOrgId" placeholder="请输入所属组织ID" />
        </el-form-item>
        <el-form-item label="租户组织ID" prop="tenantOrgId">
          <el-input v-model="form.tenantOrgId" placeholder="请输入租户组织ID" />
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

<script setup name="Bom" lang="ts">
import { listBom, getBom, delBom, addBom, updateBom } from '@/api/mes/bom';
import { BomVO, BomQuery, BomForm } from '@/api/mes/bom/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const bomList = ref<BomVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const bomFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: BomForm = {
  id: undefined,
  handle: undefined,
  bom: undefined,
  bomType: undefined,
  description: undefined,
  status: undefined,
  revision: undefined,
  currentRevision: undefined,
  validFrom: undefined,
  validTo: undefined,
  hasBeenUsed: undefined,
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
const data = reactive<PageData<BomForm, BomQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    bom: undefined,
    bomType: undefined,
    description: undefined,
    status: undefined,
    revision: undefined,
    currentRevision: undefined,
    validFrom: undefined,
    validTo: undefined,
    hasBeenUsed: undefined,
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
    handle: [{ required: true, message: '数据行索引不能为空', trigger: 'blur' }],
    bom: [{ required: true, message: '物料清单不能为空', trigger: 'blur' }],
    bomType: [{ required: true, message: '物料清单类型不能为空', trigger: 'change' }],
    description: [{ required: true, message: '资源描述不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
    revision: [{ required: true, message: '版本不能为空', trigger: 'blur' }],
    currentRevision: [{ required: true, message: '当前版本不能为空', trigger: 'blur' }],
    validFrom: [{ required: true, message: '有效期自不能为空', trigger: 'blur' }],
    validTo: [{ required: true, message: '有效期至不能为空', trigger: 'blur' }],
    hasBeenUsed: [{ required: true, message: '是否被使用不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }],
    createUserId: [{ required: true, message: '记录创建者ID不能为空', trigger: 'blur' }],
    creator: [{ required: true, message: '记录创建者不能为空', trigger: 'blur' }],
    modifyUserId: [{ required: true, message: '记录最后更新者ID不能为空', trigger: 'blur' }],
    updater: [{ required: true, message: '记录最后更新者不能为空', trigger: 'blur' }],
    modifyTime: [{ required: true, message: '记录最后更新时间不能为空', trigger: 'blur' }],
    deleteFlag: [{ required: true, message: '删除标记不能为空', trigger: 'blur' }],
    auditDataVersion: [{ required: true, message: '锁版本不能为空', trigger: 'blur' }],
    secBuId: [{ required: true, message: '数据归属组织id不能为空', trigger: 'blur' }],
    secUserId: [{ required: true, message: '数据归属雇员id不能为空', trigger: 'blur' }],
    secOuId: [{ required: true, message: '数据归属公司id不能为空', trigger: 'blur' }],
    belongOrgId: [{ required: true, message: '所属组织ID不能为空', trigger: 'blur' }],
    tenantOrgId: [{ required: true, message: '租户组织ID不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询物料清单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listBom(queryParams.value);
  bomList.value = res.rows;
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
  bomFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: BomVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加物料清单';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: BomVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getBom(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改物料清单';
};

/** 提交按钮 */
const submitForm = () => {
  bomFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateBom(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addBom(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: BomVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除物料清单编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delBom(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/bom/export',
    {
      ...queryParams.value
    },
    `bom_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
