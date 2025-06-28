<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="检验批次" prop="checkNo">
              <el-input v-model="queryParams.checkNo" placeholder="请输入检验批次" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="条码" prop="sfc">
              <el-input v-model="queryParams.sfc" placeholder="请输入条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入物料描述" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['wms:recCheckDetail:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:recCheckDetail:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:recCheckDetail:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:recCheckDetail:import']" type="info" plain icon="Upload" @click="handleImport">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:recCheckDetail:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="recCheckDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="检验批次" align="center" prop="checkNo" />
        <el-table-column label="条码" align="center" prop="sfc" />
        <el-table-column label="工单号" align="center" prop="shopOrder" />
        <el-table-column label="数量" align="center" prop="qty" />
        <el-table-column label="物料" align="center" prop="item" />
        <el-table-column label="物料描述" align="center" prop="itemDesc" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:recCheckDetail:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:recCheckDetail:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改收货检验单详细对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="recCheckDetailFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="检验批次" prop="checkNo">
          <el-input v-model="form.checkNo" placeholder="请输入检验批次" clearable />
        </el-form-item>
        <el-form-item label="条码" prop="sfc">
          <el-input ref="sfcRef" v-model="form.sfc" placeholder="请输入条码" @keydown.enter.prevent="keyDownTab" />
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
        :before-upload="handleBeforeUpload"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :on-error="handleUploadError"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <div class="el-upload__tip"><el-checkbox v-model="upload.updateSupport" />是否更新已经存在的条码数据</div>
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="upload.open = false">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitFileForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RecCheckDetail" lang="ts">
import { listRecCheckDetail, getRecCheckDetail, delRecCheckDetail, addRecCheckDetail, updateRecCheckDetail } from '@/api/wms/recCheckDetail';
import { RecCheckDetailVO, RecCheckDetailQuery, RecCheckDetailForm } from '@/api/wms/recCheckDetail/types';
import { listRecCheck } from '@/api/wms/recCheck';
const route = useRoute();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import { globalHeaders } from '@/utils/request';
import { ref } from 'vue';
const recCheckDetailList = ref<RecCheckDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const sfcRef = ref();
const queryFormRef = ref<ElFormInstance>();
const recCheckDetailFormRef = ref<ElFormInstance>();
const initFormData: RecCheckDetailForm = {
  id: undefined,
  checkNo: undefined,
  sfc: undefined,
  qty: undefined,
  shopOrder: undefined,
  item: undefined,
  itemDesc: undefined,
  remark: undefined
};
const uploadRef = ref<ElUploadInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
/*** 检验单明细导入参数 */
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
  url: import.meta.env.VITE_APP_BASE_API + '/wms/recCheckDetail/importData'
});
const data = reactive<PageData<RecCheckDetailForm, RecCheckDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    checkNo: undefined,
    sfc: undefined,
    shopOrder: undefined,
    item: undefined,
    itemDesc: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    checkNo: [{ required: true, message: '检验批次不能为空', trigger: 'blur' }],
    sfc: [{ required: true, message: '条码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询收货检验单详细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listRecCheckDetail(queryParams.value);
  recCheckDetailList.value = res.rows;
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
  recCheckDetailFormRef.value?.resetFields();
  form.value.checkNo = route.params.checkNo;
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
const handleSelectionChange = (selection: RecCheckDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  console.log(form.value);
  dialog.visible = true;
  dialog.title = '添加检验单详细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: RecCheckDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getRecCheckDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改检验单详细';
};
const keyEnter = async () => {
  console.log('keyEnter');
  recCheckDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (!form.value.id) {
        await addRecCheckDetail(form.value).finally(() => {
          buttonLoading.value = false;
          sfcRef.value.focus();
          sfcRef.value.select();
        });
      }
      proxy?.$modal.msgSuccess('操作成功');
    }
  });
};

const keyDownTab = async () => {
  console.log('keyTabKey');
  recCheckDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (!form.value.id) {
        await addRecCheckDetail(form.value).finally(() => {
          buttonLoading.value = false;
          sfcRef.value.focus();
          sfcRef.value.select();
        });
      }
      proxy?.$modal.msgSuccess('操作成功');
    }
  });
};

/** 提交按钮 */
const submitForm = () => {
  recCheckDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateRecCheckDetail(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addRecCheckDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: RecCheckDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除收货检验单详细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delRecCheckDetail(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};
/** 导入按钮操作 */
const handleImport = () => {
  upload.title = '检验单明细导入';
  upload.open = true;
};
/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}
/** 下载模板操作 */
const importTemplate = () => {
  proxy?.download('wms/recCheckDetail/importTemplate', {}, `recCheckDetail_template_${new Date().getTime()}.xlsx`);
};
const handleBeforeUpload = () => {
  buttonLoading.value = true;
};
/**文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
};
/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  buttonLoading.value = false;
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;'>" + response.msg + '</div>', '导入结果', {
    dangerouslyUseHTMLString: true,
    customStyle: {
      'max-width': '35%'
    }
  });
  getList();
};
const handleUploadError = () => {
  buttonLoading.value = false;
};
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/recCheckDetail/export',
    {
      ...queryParams.value
    },
    `recCheckDetail_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  if (route.params && (route.params.checkNo as string)) {
    queryParams.value.checkNo = route.params.checkNo;
    form.value.checkNo = route.params.checkNo;
  }
  getList();
});
</script>
