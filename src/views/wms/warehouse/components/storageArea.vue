<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="库区编码" prop="areaCode">
              <el-input v-model="queryParams.areaCode" placeholder="请输入库区编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库区名称" prop="areaName">
              <el-input v-model="queryParams.areaName" placeholder="请输入库区名称" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:storageArea:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:storageArea:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:storageArea:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:storageArea:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="storageAreaList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="库区编码" prop="areaCode">
          <template #default="scope">
            <router-link
              :to="{
                path: '/warehouse/warehouseManage/storageLocation',
                query: {
                  areaId: scope.row.id,
                  areaCode: scope.row.areaCode
                }
              }"
              class="link-type"
            >
              <span>{{ scope.row.areaCode }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="库区名称" prop="areaName" />
        <el-table-column label="是否启用" align="center" prop="enableFlag">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.enableFlag" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:storageArea:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:storageArea:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改库区对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="storageAreaFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="库区编码" prop="areaCode">
          <el-input v-model="form.areaCode" placeholder="请输入库区编码" />
        </el-form-item>
        <el-form-item label="库区名称" prop="areaName">
          <el-input v-model="form.areaName" placeholder="请输入库区名称" />
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
  </div>
</template>

<script setup name="StorageArea" lang="ts">
import { listStorageArea, getStorageArea, delStorageArea, addStorageArea, updateStorageArea } from '@/api/wms/storageArea';
import { StorageAreaVO, StorageAreaQuery, StorageAreaForm } from '@/api/wms/storageArea/types';
const route = useRoute();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_yes_no } = toRefs<any>(proxy?.useDict('sys_yes_no'));

const storageAreaList = ref<StorageAreaVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const storageAreaFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: StorageAreaForm = {
  id: undefined,
  areaCode: undefined,
  areaName: undefined,
  warehouseId: undefined,
  area: undefined,
  enableFlag: undefined,
  enableFlagBoolean: true,
  remark: undefined
};
const data = reactive<PageData<StorageAreaForm, StorageAreaQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    areaCode: undefined,
    areaName: undefined,
    warehouseId: undefined,
    area: undefined,
    enableFlag: undefined,
    enableFlagBoolean: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    areaCode: [{ required: true, message: '库区编码不能为空', trigger: 'blur' }],
    areaName: [{ required: true, message: '库区名称不能为空', trigger: 'blur' }],
    warehouseId: [{ required: true, message: '仓库ID不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询库区列表 */
const getList = async () => {
  loading.value = true;
  const res = await listStorageArea(queryParams.value);
  storageAreaList.value = res.rows;
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
  storageAreaFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: StorageAreaVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加库区';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: StorageAreaVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getStorageArea(_id);
  Object.assign(form.value, res.data);
  form.value.enableFlagBoolean = form.value.enableFlag === 'Y';
  dialog.visible = true;
  dialog.title = '修改库区';
};

/** 提交按钮 */
const submitForm = () => {
  storageAreaFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      form.value.enableFlag = form.value.enableFlagBoolean ? 'Y' : 'N';
      console.log(form.value);
      if (form.value.id) {
        await updateStorageArea(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addStorageArea(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: StorageAreaVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除库区编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delStorageArea(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/storageArea/export',
    {
      ...queryParams.value
    },
    `storageArea_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  if (route.query && (route.query.warehouseId as string)) {
    let warehouseId: string | number;

    if (Array.isArray(route.query.warehouseId)) {
      // 如果是数组，取第一个元素
      warehouseId = route.query.warehouseId[0];
    } else {
      // 如果是字符串，直接使用
      warehouseId = route.query.warehouseId;
    }

    queryParams.value.warehouseId = warehouseId;
    form.value.warehouseId = warehouseId;
    initFormData.warehouseId = warehouseId;
  }
  getList();
});
</script>
