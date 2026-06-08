<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="请输入物料编码" clearable @keydown.tab.prevent="handleQuery" @keydown.enter.prevent="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:materialUnitConversion:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:materialUnitConversion:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:materialUnitConversion:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:materialUnitConversion:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="materialUnitConversionList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="物料编码" align="center" prop="materialCode" />
        <el-table-column label="基本计量单位" align="center" prop="baseUnit" />
        <el-table-column label="可选计量单位" align="center" prop="altUnit" />
        <el-table-column label="换算分子" align="center" prop="numerator" />
        <el-table-column label="换算分母" align="center" prop="denominator" />
        <el-table-column label="换算率" align="center" prop="conversionRate" />
        <el-table-column label="长度" align="center" prop="length" />
        <el-table-column label="宽度" align="center" prop="width" />
        <el-table-column label="高度" align="center" prop="height" />
        <el-table-column label="尺寸单位" align="center" prop="dimUnit" />
        <el-table-column label="体积" align="center" prop="volume" />
        <el-table-column label="体积单位" align="center" prop="volUnit" />
        <el-table-column label="毛重" align="center" prop="grossWeight" />
        <el-table-column label="净重" align="center" prop="netWeight" />
        <el-table-column label="重量单位" align="center" prop="weightUnit" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:materialUnitConversion:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:materialUnitConversion:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改物料计量单位转换对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="materialUnitConversionFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="物料编码" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="基本计量单位" prop="baseUnit">
          <el-input v-model="form.baseUnit" placeholder="请输入基本计量单位" />
        </el-form-item>
        <el-form-item label="可选计量单位" prop="altUnit">
          <el-input v-model="form.altUnit" placeholder="请输入可选计量单位" />
        </el-form-item>
        <el-form-item label="换算分子" prop="numerator">
          <el-input v-model="form.numerator" placeholder="请输入换算分子" />
        </el-form-item>
        <el-form-item label="换算分母" prop="denominator">
          <el-input v-model="form.denominator" placeholder="请输入换算分母" />
        </el-form-item>
        <el-form-item label="换算率" prop="conversionRate">
          <el-input v-model="form.conversionRate" placeholder="请输入换算率" />
        </el-form-item>
        <el-form-item label="长度" prop="length">
          <el-input v-model="form.length" placeholder="请输入长度" />
        </el-form-item>
        <el-form-item label="宽度" prop="width">
          <el-input v-model="form.width" placeholder="请输入宽度" />
        </el-form-item>
        <el-form-item label="高度" prop="height">
          <el-input v-model="form.height" placeholder="请输入高度" />
        </el-form-item>
        <el-form-item label="尺寸单位" prop="dimUnit">
          <el-input v-model="form.dimUnit" placeholder="请输入尺寸单位" />
        </el-form-item>
        <el-form-item label="体积" prop="volume">
          <el-input v-model="form.volume" placeholder="请输入体积" />
        </el-form-item>
        <el-form-item label="体积单位" prop="volUnit">
          <el-input v-model="form.volUnit" placeholder="请输入体积单位" />
        </el-form-item>
        <el-form-item label="毛重" prop="grossWeight">
          <el-input v-model="form.grossWeight" placeholder="请输入毛重" />
        </el-form-item>
        <el-form-item label="净重" prop="netWeight">
          <el-input v-model="form.netWeight" placeholder="请输入净重" />
        </el-form-item>
        <el-form-item label="重量单位" prop="weightUnit">
          <el-input v-model="form.weightUnit" placeholder="请输入重量单位" />
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

<script setup name="MaterialUnitConversion" lang="ts">
import { listMaterialUnitConversion, getMaterialUnitConversion, delMaterialUnitConversion, addMaterialUnitConversion, updateMaterialUnitConversion } from '@/api/wms/materialUnitConversion';
import { MaterialUnitConversionVO, MaterialUnitConversionQuery, MaterialUnitConversionForm } from '@/api/wms/materialUnitConversion/types';
import {watch} from 'vue';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const materialUnitConversionList = ref<MaterialUnitConversionVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const materialUnitConversionFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: MaterialUnitConversionForm = {
  id: undefined,
  materialCode: undefined,
  baseUnit: undefined,
  altUnit: undefined,
  numerator: undefined,
  denominator: undefined,
  conversionRate: undefined,
  length: undefined,
  width: undefined,
  height: undefined,
  dimUnit: undefined,
  volume: undefined,
  volUnit: undefined,
  grossWeight: undefined,
  netWeight: undefined,
  weightUnit: undefined
};
const data = reactive<PageData<MaterialUnitConversionForm, MaterialUnitConversionQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    materialCode: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    materialCode: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

interface Props {
  itemCode?: string;
}

const props = withDefaults(defineProps<Props>(), {
  itemCode: ''
});

/** 查询物料计量单位转换列表 */
const getList = async () => {
  loading.value = true;
  const res = await listMaterialUnitConversion(queryParams.value);
  materialUnitConversionList.value = res.rows;
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
  materialUnitConversionFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  // 如果有传入的 itemCode，重置时保留该值
  if (props.itemCode) {
    queryParams.value.materialCode = props.itemCode;
  }
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: MaterialUnitConversionVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加物料计量单位转换';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: MaterialUnitConversionVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getMaterialUnitConversion(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改物料计量单位转换';
};

/** 提交按钮 */
const submitForm = () => {
  materialUnitConversionFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateMaterialUnitConversion(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addMaterialUnitConversion(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: MaterialUnitConversionVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除物料计量单位转换编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delMaterialUnitConversion(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/materialUnitConversion/export',
    {
      ...queryParams.value
    },
    `materialUnitConversion_${new Date().getTime()}.xlsx`
  );
};

// 监听 itemCode 变化，自动查询
watch(
  () => props.itemCode,
  (newVal) => {
    if (newVal) {
      queryParams.value.materialCode = newVal;
      queryParams.value.pageNum = 1;
      getList();
    }
  },
  { immediate: true }
);

onMounted(() => {
  // 如果没有传入 itemCode，则执行默认查询
  if (!props.itemCode) {
    getList();
  }
});
</script>
