<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="仓库编码" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库名称" prop="warehouseName">
              <el-input v-model="queryParams.warehouseName" placeholder="请输入仓库名称" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:warehouse:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:warehouse:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:warehouse:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="Upload" v-hasPermi="['wms:warehouse:import']" @click="handleImport">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:warehouse:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="warehouseList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="仓库编码" prop="warehouseCode">
          <template #default="scope">
            <router-link
              :to="{
                path: '/warehouse/warehouseManage/storageArea',
                query: {
                  warehouseId: scope.row.id,
                  warehouseCode: scope.row.warehouseCode
                }
              }"
              class="link-type"
            >
              <span>{{ scope.row.warehouseCode }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="仓库名称" prop="warehouseName" />
        <el-table-column label="是否启用" align="center" prop="enableFlag">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.enableFlag" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-warehouseName="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:warehouse:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:warehouse:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改仓库对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="warehouseFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="仓库编码" prop="warehouseCode">
          <el-input v-model="form.warehouseCode" placeholder="请输入仓库编码" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="warehouseName">
          <el-input v-model="form.warehouseName" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="是否启用" prop="enableFlagBoolean">
          <el-switch v-model="form.enableFlagBoolean" />
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

    <!-- 导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="400px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="upload.open = false">取 消</el-button>
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup warehouseName="Warehouse" lang="ts">
import { pageWarehouse, getWarehouse, delWarehouse, addWarehouse, updateWarehouse } from '@/api/wms/warehouse';
import { WarehouseVO, WarehouseQuery, WarehouseForm } from '@/api/wms/warehouse/types';
import { globalHeaders } from '@/utils/request';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_yes_no } = toRefs<any>(proxy?.useDict('sys_yes_no'));

const warehouseList = ref<WarehouseVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const warehouseFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WarehouseForm = {
  id: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  enableFlag: undefined,
  enableFlagBoolean: true,
  remark: undefined
};
const data = reactive<PageData<WarehouseForm, WarehouseQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    warehouseCode: undefined,
    warehouseName: undefined,
    enableFlag: undefined,
    enableFlagBoolean: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
    warehouseName: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }]
  }
});
/*** 出货通知导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: '',
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + '/wms/warehouse/import'
});

const { queryParams, form, rules } = toRefs(data);

/** 查询仓库列表 */
const getList = async () => {
  loading.value = true;
  const res = await pageWarehouse(queryParams.value);
  warehouseList.value = res.rows;
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
  warehouseFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WarehouseVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  form.value.enableFlagBoolean = true;
  dialog.title = '添加仓库';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WarehouseVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWarehouse(_id);
  Object.assign(form.value, res.data);
  form.value.enableFlagBoolean = form.value.enableFlag === 'Y';
  dialog.visible = true;
  dialog.title = '修改仓库';
};

/** 提交按钮 */
const submitForm = () => {
  warehouseFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      form.value.enableFlag = form.value.enableFlagBoolean ? 'Y' : 'N';
      if (form.value.id) {
        await updateWarehouse(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWarehouse(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WarehouseVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除仓库编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWarehouse(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/warehouse/export',
    {
      ...queryParams.value
    },
    `warehouse_${new Date().getTime()}.xlsx`
  );
};
/** 导入按钮操作 */
const handleImport = () => {
  upload.title = '仓库导入';
  upload.open = true;
};

/** 下载模板操作 */
const importTemplate = () => {
  proxy?.download('wms/warehouse/importTemplate', {}, `warehouse_template_${new Date().getTime()}.xlsx`);
};

/** 文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
};

/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + '</div>', '导入结果', {
    dangerouslyUseHTMLString: true
  });
  getList();
};

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}

onMounted(() => {
  getList();
});
</script>
