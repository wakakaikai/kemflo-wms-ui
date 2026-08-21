<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px] search-container">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="移动类型" prop="moveType">
              <HistoryInput v-model="queryParams.moveType" :config="moveTypeConfig" placeholder="请输入移动类型" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="移动原因" prop="moveReasonCode">
              <HistoryInput v-model="queryParams.moveReasonCode" :config="moveReasonCodeConfig" placeholder="请输入移动原因" @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:moveTypeReason:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:moveTypeReason:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:moveTypeReason:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:moveTypeReason:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="moveTypeReasonList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
<!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="移动类型" align="center" prop="moveType" />
        <el-table-column label="移动原因" align="center" prop="moveReasonCode" />
        <el-table-column label="移动原因描述" align="center" prop="moveReasonDesc" />
<!--        <el-table-column label="状态" align="center" prop="status" />-->
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:moveTypeReason:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:moveTypeReason:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改移动原因对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="moveTypeReasonFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="移动原因" prop="moveReasonCode">
          <el-input v-model="form.moveReasonCode" placeholder="请输入移动原因" />
        </el-form-item>
        <el-form-item label="移动原因描述" prop="moveReasonDesc">
          <el-input v-model="form.moveReasonDesc" placeholder="请输入移动原因描述" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
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

<script setup name="MoveTypeReason" lang="ts">
import { listMoveTypeReason, getMoveTypeReason, delMoveTypeReason, addMoveTypeReason, updateMoveTypeReason } from '@/api/wms/moveTypeReason';
import { MoveTypeReasonVO, MoveTypeReasonQuery, MoveTypeReasonForm } from '@/api/wms/moveTypeReason/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import type { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const moveTypeReasonList = ref<MoveTypeReasonVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const moveTypeReasonFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: MoveTypeReasonForm = {
  id: undefined,
  moveType: undefined,
  moveReasonCode: undefined,
  moveReasonDesc: undefined,
  status: undefined,
  remark: undefined
}
const data = reactive<PageData<MoveTypeReasonForm, MoveTypeReasonQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    moveType: undefined,
    moveReasonCode: undefined,
    moveReasonDesc: undefined,
    status: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    moveReasonCode: [
      { required: true, message: "移动原因不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

const moveTypeConfig: HistoryConfig = {
  key: 'moveType',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'moveTypeReason',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const moveReasonCodeConfig: HistoryConfig = {
  key: 'moveReasonCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'moveTypeReason',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

/** 查询移动原因列表 */
const getList = async () => {
  loading.value = true;
  const res = await listMoveTypeReason(queryParams.value);
  moveTypeReasonList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  moveTypeReasonFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: MoveTypeReasonVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加移动原因";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: MoveTypeReasonVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getMoveTypeReason(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改移动原因";
}

/** 提交按钮 */
const submitForm = () => {
  moveTypeReasonFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateMoveTypeReason(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addMoveTypeReason(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: MoveTypeReasonVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除移动原因编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delMoveTypeReason(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/moveTypeReason/export', {
    ...queryParams.value
  }, `moveTypeReason_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.search-container {
  position: relative;
  z-index: 10;
}

/* 历史下拉不被搜索卡片裁剪 */
.search-card,
.search-card :deep(.el-card__body) {
  overflow: visible !important;
}
</style>
