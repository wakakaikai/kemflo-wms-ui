<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="库位编码" prop="locationCode">
              <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位名称" prop="locationName">
              <el-input v-model="queryParams.locationName" placeholder="请输入库位名称" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:storageLocation:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:storageLocation:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:storageLocation:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:storageLocation:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="storageLocationList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="库位编码" align="center" prop="locationCode" />
        <el-table-column label="库位名称" align="center" prop="locationName" />
        <el-table-column label="库区ID" align="center" prop="areaId" />
        <el-table-column label="面积" align="center" prop="area" />
        <el-table-column label="库位位置X" align="center" prop="positionX" />
        <el-table-column label="库位位置Y" align="center" prop="positionY" />
        <el-table-column label="库位位置Z" align="center" prop="positionZ" />
        <el-table-column label="是否启用" align="center" prop="enableFlag">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.enableFlag" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:storageLocation:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:storageLocation:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改库位对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="storageLocationFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" />
        </el-form-item>
        <el-form-item label="库位名称" prop="locationName">
          <el-input v-model="form.locationName" placeholder="请输入库位名称" />
        </el-form-item>
        <el-form-item label="库区ID" prop="areaId">
          <el-input v-model="form.areaId" placeholder="请输入库区ID" />
        </el-form-item>
        <el-form-item label="面积" prop="area">
          <el-input v-model="form.area" placeholder="请输入面积" />
        </el-form-item>
        <el-form-item label="库位位置X" prop="positionX">
          <el-input v-model="form.positionX" placeholder="请输入库位位置X" />
        </el-form-item>
        <el-form-item label="库位位置Y" prop="positionY">
          <el-input v-model="form.positionY" placeholder="请输入库位位置Y" />
        </el-form-item>
        <el-form-item label="库位位置Z" prop="positionZ">
          <el-input v-model="form.positionZ" placeholder="请输入库位位置Z" />
        </el-form-item>
        <el-form-item label="是否启用" prop="enableFlag">
          <el-input v-model="form.enableFlag" placeholder="请输入是否启用" />
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

<script setup name="StorageLocation" lang="ts">
import { listStorageLocation, getStorageLocation, delStorageLocation, addStorageLocation, updateStorageLocation } from '@/api/wms/storageLocation';
import { StorageLocationVO, StorageLocationQuery, StorageLocationForm } from '@/api/wms/storageLocation/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_yes_no } = toRefs<any>(proxy?.useDict('sys_yes_no'));

const storageLocationList = ref<StorageLocationVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const storageLocationFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: StorageLocationForm = {
  id: undefined,
  locationCode: undefined,
  locationName: undefined,
  areaId: undefined,
  area: undefined,
  positionX: undefined,
  positionY: undefined,
  positionZ: undefined,
  enableFlag: undefined,
  remark: undefined
}
const data = reactive<PageData<StorageLocationForm, StorageLocationQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    locationCode: undefined,
    locationName: undefined,
    areaId: undefined,
    area: undefined,
    positionX: undefined,
    positionY: undefined,
    positionZ: undefined,
    enableFlag: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    locationCode: [
      { required: true, message: "库位编码不能为空", trigger: "blur" }
    ],
    locationName: [
      { required: true, message: "库位名称不能为空", trigger: "blur" }
    ],
    areaId: [
      { required: true, message: "库区ID不能为空", trigger: "blur" }
    ],
    area: [
      { required: true, message: "面积不能为空", trigger: "blur" }
    ],
    positionX: [
      { required: true, message: "库位位置X不能为空", trigger: "blur" }
    ],
    positionY: [
      { required: true, message: "库位位置Y不能为空", trigger: "blur" }
    ],
    positionZ: [
      { required: true, message: "库位位置Z不能为空", trigger: "blur" }
    ],
    enableFlag: [
      { required: true, message: "是否启用不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询库位列表 */
const getList = async () => {
  loading.value = true;
  const res = await listStorageLocation(queryParams.value);
  storageLocationList.value = res.rows;
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
  storageLocationFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: StorageLocationVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加库位";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: StorageLocationVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getStorageLocation(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改库位";
}

/** 提交按钮 */
const submitForm = () => {
  storageLocationFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateStorageLocation(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addStorageLocation(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: StorageLocationVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除库位编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delStorageLocation(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/storageLocation/export', {
    ...queryParams.value
  }, `storageLocation_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
